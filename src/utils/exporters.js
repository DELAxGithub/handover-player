import { secToTimecode } from "./timecode";

/**
 * @typedef {Object} Marker
 * @property {string} id
 * @property {number} tInSec
 * @property {number} [durationSec]
 * @property {string} text
 * @property {string} [author]
 * @property {string} [color]
 * @property {string} [label]
 */

/**
 * @typedef {Object} ExportContext
 * @property {number} fps
 * @property {boolean} [dropFrame]
 * @property {string} sequenceName
 */

/**
 * Generate CSV for DaVinci Resolve
 * @param {Marker[]} markers 
 * @param {ExportContext} ctx 
 * @returns {string} CSV content
 */
export function exportResolveCSV(markers, ctx) {
    const header = "Timecode In,Name,Comment,Color,Timecode Out";
    const rows = markers.map(m => {
        const tcIn = secToTimecode(m.tInSec, ctx.fps, ctx.dropFrame);
        const dur = m.durationSec ?? (1 / ctx.fps);
        const tcOut = secToTimecode(m.tInSec + dur, ctx.fps, ctx.dropFrame);
        const name = (m.label ?? m.author ?? "Marker").replace(/"/g, '""');
        const comment = (m.text ?? "").replace(/"/g, '""');
        // Resolve uses specific colors, but often just defaults. We leave it blank or map if needed.
        // User snippet passed m.color directly.
        const color = m.color ?? "";
        return `"${tcIn}","${name}","${comment}","${color}","${tcOut}"`;
    });
    return [header, ...rows].join("\n");
}

/**
 * Generate XMEML (XML) for Premiere Pro
 * @param {Marker[]} markers 
 * @param {ExportContext} ctx 
 * @returns {string} XML content
 */
export function exportPremiereXML(markers, ctx) {
    const ntsc = (ctx.dropFrame ? "TRUE" : (ctx.fps % 1 !== 0 ? "TRUE" : "FALSE"));
    const tb = Math.round(ctx.fps); // Timebase (e.g. 24, 30, 60)

    // Helper to escape XML special chars
    const escapeXML = (str) => {
        return (str ?? "").replace(/[<&>]/g, s => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[s]));
    };

    const mks = markers.map(m => {
        const name = escapeXML(m.label ?? m.author ?? "Marker");
        const comment = escapeXML(m.text);
        const inTc = secToTimecode(m.tInSec, ctx.fps, ctx.dropFrame);

        // Duration default to 1 frame if undefined
        const dur = m.durationSec ?? (1 / ctx.fps);
        const outTc = secToTimecode(m.tInSec + dur, ctx.fps, ctx.dropFrame);

        // Premiere Colors: Red, Yellow, Green, Cyan, Blue, Magenta, Black, White
        // We assume m.color matches these or defaults to Red
        const color = (m.color && ["red", "yellow", "green", "cyan", "blue", "magenta", "black", "white"].includes(m.color.toLowerCase()))
            ? m.color.toUpperCase() // Premiere XML uses uppercase usually? Or user snippet said lowercase is fine.
            // User snippet used lowercase in `m.color ?? "red"`. Let's stick to lowercase as per snippet.
            : "Red"; // Default

        return `
      <marker>
        <name>${name}</name>
        <comment>${comment}</comment>
        <in>${inTc}</in>
        <out>${outTc}</out>
        <color>${color.toLowerCase()}</color>
      </marker>`;
    }).join("");

    return `<?xml version="1.0" encoding="UTF-8"?>
<xmeml version="5">
  <sequence>
    <name>${escapeXML(ctx.sequenceName)}</name>
    <rate>
      <timebase>${tb}</timebase>
      <ntsc>${ntsc}</ntsc>
    </rate>
    <markers>${mks}
    </markers>
  </sequence>
</xmeml>`;
}

/**
 * Browser download helper
 * @param {string} textContent 
 * @param {string} filename 
 * @param {string} mimeType 
 */
export function downloadFile(textContent, filename, mimeType) {
    const blob = new Blob([textContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a); // Append for safe click in some browsers
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
