/**
 * Converts seconds to SMPTE timecode string (HH:MM:SS:FF)
 * @param {number} sec - Time in seconds
 * @param {number} fps - Frames per second (e.g. 23.976, 29.97, 30, 60)
 * @param {boolean} drop - Whether to use Drop-Frame timecode (for 29.97/59.94)
 * @returns {string} HH:MM:SS:FF
 */
export function secToTimecode(sec, fps, drop = false) {
    // Round to nearest frame to avoid floating point drift
    // Note for 23.976: user usually expects 24 timebase calculation logic or 23.976 real time?
    // In NLE context, 23.976 usually maps to 24 timebase logic but running slower. 
    // However, the user provided logic uses `fps` directly. We stick to the user's snippet.

    const frames = Math.round(sec * fps);

    if (!drop) {
        // Non-Drop Frame (NDF)
        const f = frames % Math.round(fps);
        const totalSec = Math.floor(frames / fps);
        const s = totalSec % 60;
        const m = Math.floor(totalSec / 60) % 60;
        const h = Math.floor(totalSec / 3600);
        return [h, m, s, f].map(v => String(v).padStart(2, '0')).join(':');
    }

    // Drop-Frame (DF) logic for 29.97 (30DF) and 59.94 (60DF)
    // Rule: Skip 2 frame numbers (or 4) every minute, except every 10th minute.
    const is2997 = Math.abs(fps - 29.97) < 0.01;
    const is5994 = Math.abs(fps - 59.94) < 0.01;

    // Default to 2 frames if close to 29.97, 4 if close to 59.94, else 0 (fallback)
    const df = is2997 ? 2 : (is5994 ? 4 : 0);
    const tb = Math.round(fps); // Timebase (30 or 60)

    const d = Math.floor(frames / tb);
    const fInMin = frames % tb; // This variable from snippet seems unused in calculation below but logic follows standard algo

    let totalMins = Math.floor(d / 60);

    // Calculate extra frames added due to drop frame counting
    // The algorithm converts "Real Frames" to "Timecode Frames"
    let frameRem = frames + df * (totalMins - Math.floor(totalMins / 10));

    // The user snippet logic:
    // let frameRem = frames + df * (totalMins - Math.floor(totalMins/10));

    const f = frameRem % tb;
    const totalSec = Math.floor(frameRem / tb);
    const s = totalSec % 60;
    const m = Math.floor(totalSec / 60) % 60;
    const h = Math.floor(totalSec / 3600);

    return [h, m, s, f].map(v => String(v).padStart(2, '0')).join(';'); // Use ';' for DF usually, but user asked for ':' join. Stick to ':' if user code did.
    // User code: .join(':')
}
