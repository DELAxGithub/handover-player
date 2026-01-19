import React, { useState } from 'react';
import { Download, Check, FileJson, X } from 'lucide-react';
import { exportPremiereXML, exportResolveCSV, downloadFile } from '../utils/exporters';

const FPS_OPTIONS = [
    { label: '23.976', value: 23.976 },
    { label: '24', value: 24 },
    { label: '25', value: 25 },
    { label: '29.97 (DF)', value: 29.97, isDf: true },
    { label: '29.97 (NDF)', value: 29.97, isDf: false },
    { label: '30', value: 30 },
    { label: '59.94 (DF)', value: 59.94, isDf: true },
    { label: '60', value: 60 },
];

const ExportMenu = ({ comments, filename }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedFps, setSelectedFps] = useState(FPS_OPTIONS[3]); // Default 29.97 DF

    // Map comments to Marker format expected by exporters
    // Comment structure from Supabase: { id, ptime, body, user_name, ... }
    // Marker structure: { id, tInSec, text, label, author, color }
    const getMarkers = () => {
        return comments.map(c => ({
            id: c.id,
            tInSec: parseFloat(c.ptime),
            text: c.body || "",
            label: c.user_name || "Comment", // Use username as label or "Comment"
            author: c.user_name,
            color: "red" // Default color. Could be mapped if we had color in DB.
        }));
    };

    const handleExport = (format) => {
        const markers = getMarkers();
        const ctx = {
            fps: selectedFps.value,
            dropFrame: selectedFps.isDf,
            sequenceName: filename || "Sequence"
        };

        try {
            if (format === 'premiere') {
                const xml = exportPremiereXML(markers, ctx);
                downloadFile(xml, `${filename || 'markers'}_premiere.xml`, 'application/xml');
            } else if (format === 'resolve') {
                const csv = exportResolveCSV(markers, ctx);
                downloadFile(csv, `${filename || 'markers'}_resolve.csv`, 'text/csv');
            } else if (format === 'generic') {
                // Reuse Resolve CSV but maybe rename
                const csv = exportResolveCSV(markers, ctx);
                downloadFile(csv, `${filename || 'markers'}_generic.csv`, 'text/csv');
            }
            setIsOpen(false);
        } catch (e) {
            alert("Export failed: " + e.message);
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-[#333] hover:bg-[#444] text-gray-200 text-xs font-bold rounded border border-[#555] transition-colors"
                title="Export Markers"
            >
                <Download size={14} />
                <span>Export</span>
            </button>

            {isOpen && (
                <>
                    {/* Backdrop to close */}
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>

                    {/* Dropdown Content */}
                    <div className="absolute right-0 top-full mt-2 w-64 bg-[#1f1f1f] border border-[#444] rounded-lg shadow-xl z-50 p-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-bold text-white">Export Markers</h3>
                            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white"><X size={14} /></button>
                        </div>

                        {/* FPS Selector */}
                        <div className="mb-4">
                            <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Frame Rate</label>
                            <select
                                value={JSON.stringify(selectedFps)}
                                onChange={(e) => setSelectedFps(JSON.parse(e.target.value))}
                                className="w-full bg-[#111] border border-[#333] text-gray-200 text-xs rounded p-2 outline-none focus:border-blue-500"
                            >
                                {FPS_OPTIONS.map((opt, i) => (
                                    <option key={i} value={JSON.stringify(opt)}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Export Buttons */}
                        <div className="space-y-2">
                            <button
                                onClick={() => handleExport('premiere')}
                                className="w-full flex items-center justify-between px-3 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-purple-400 text-xs font-bold rounded border border-[#333] transition-colors text-left"
                            >
                                <span>Premiere Pro (.xml)</span>
                                <Download size={12} />
                            </button>
                            <button
                                onClick={() => handleExport('resolve')}
                                className="w-full flex items-center justify-between px-3 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-yellow-400 text-xs font-bold rounded border border-[#333] transition-colors text-left"
                            >
                                <span>DaVinci Resolve (.csv)</span>
                                <Download size={12} />
                            </button>
                            <button
                                onClick={() => handleExport('generic')}
                                className="w-full flex items-center justify-between px-3 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-gray-300 text-xs font-bold rounded border border-[#333] transition-colors text-left"
                            >
                                <span>Generic CSV</span>
                                <Download size={12} />
                            </button>
                        </div>

                        <div className="mt-3 text-[10px] text-gray-500 leading-tight">
                            * Premiere: Import XML & copy markers.<br />
                            * Resolve: Timeline &gt; Import &gt; Markers.
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default ExportMenu;
