import React, { useState, useRef, useEffect } from 'react';
import { Download, ChevronDown, Check, FileJson, Clapperboard, FileText } from 'lucide-react';
import { exportPremiereXML, exportResolveCSV, downloadFile } from '../utils/exporters';

const FPS_OPTIONS = [
    { label: '23.976 fps', value: 23.976 },
    { label: '24 fps', value: 24 },
    { label: '25 fps', value: 25 },
    { label: '29.97 DF', value: 29.97, isDf: true },
    { label: '29.97 NDF', value: 29.97, isDf: false },
    { label: '30 fps', value: 30 },
    { label: '59.94 DF', value: 59.94, isDf: true },
    { label: '60 fps', value: 60 },
];

const ExportMenu = ({ comments, filename }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedFps, setSelectedFps] = useState(FPS_OPTIONS[3]); // Default 29.97 DF
    const menuRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const getMarkers = () => {
        return comments.map(c => ({
            id: c.id,
            tInSec: parseFloat(c.ptime),
            text: c.text || c.body || "", // Support both just in case
            // Use username or "Comment" as label
            label: c.user_name || "Comment",
            author: c.user_name,
            // Default color red for now
            color: "red"
        }));
    };

    const handleExport = (format) => {
        const markers = getMarkers();
        // Fallback for filename if missing
        const safeFilename = filename || "Sequence";
        const ctx = {
            fps: selectedFps.value,
            dropFrame: selectedFps.isDf,
            sequenceName: safeFilename
        };

        try {
            if (format === 'premiere') {
                const xml = exportPremiereXML(markers, ctx);
                downloadFile(xml, `${safeFilename}_premiere.xml`, 'application/xml');
            } else if (format === 'resolve') {
                const csv = exportResolveCSV(markers, ctx);
                downloadFile(csv, `${safeFilename}_resolve.csv`, 'text/csv');
            } else if (format === 'generic') {
                const csv = exportResolveCSV(markers, ctx);
                downloadFile(csv, `${safeFilename}_generic.csv`, 'text/csv');
            }
            setIsOpen(false);
        } catch (e) {
            alert("Export failed: " + e.message);
        }
    };

    return (
        <div className="relative" ref={menuRef}>
            {/* Trigger Button: Cohesive Zinc Style */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors border
                    ${isOpen
                        ? 'bg-zinc-800 text-zinc-100 border-zinc-600'
                        : 'bg-zinc-900 text-zinc-300 border-zinc-700 hover:bg-zinc-800 hover:text-white'
                    }`}
                title="Marker Export"
            >
                <Download size={14} />
                <span>Export</span>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-zinc-900 border border-zinc-700 rounded-lg shadow-[0_10px_40px_-5px_rgba(0,0,0,0.5)] z-50 overflow-hidden ring-1 ring-white/5">

                    {/* Section: FPS Selector */}
                    <div className="px-1 py-1 border-b border-zinc-800">
                        <div className="px-3 py-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                            Timeline Settings
                        </div>
                        <select
                            value={JSON.stringify(selectedFps)}
                            onChange={(e) => setSelectedFps(JSON.parse(e.target.value))}
                            className="w-full bg-zinc-800/50 text-zinc-200 text-xs rounded-md px-2 py-1.5 border-none outline-none focus:ring-1 focus:ring-indigo-500/50 hover:bg-zinc-800 cursor-pointer appearance-none"
                            style={{ backgroundImage: 'none' }} // Custom arrow styling if needed, keeping native for robustness
                        >
                            {FPS_OPTIONS.map((opt, i) => (
                                <option key={i} value={JSON.stringify(opt)}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Section: Export Actions */}
                    <div className="p-1 space-y-0.5">
                        <div className="px-3 py-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                            Format
                        </div>

                        <button
                            onClick={() => handleExport('premiere')}
                            className="w-full flex items-center gap-3 px-3 py-2 text-left text-zinc-300 hover:bg-zinc-800 hover:text-white rounded-md transition-colors group"
                        >
                            <div className="bg-purple-900/30 text-purple-400 p-1.5 rounded group-hover:bg-purple-900/50 transition-colors">
                                <Clapperboard size={14} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-bold">Premiere Pro</span>
                                <span className="text-[10px] text-zinc-500">.xml (Sequence Markers)</span>
                            </div>
                        </button>

                        <button
                            onClick={() => handleExport('resolve')}
                            className="w-full flex items-center gap-3 px-3 py-2 text-left text-zinc-300 hover:bg-zinc-800 hover:text-white rounded-md transition-colors group"
                        >
                            <div className="bg-yellow-900/30 text-yellow-400 p-1.5 rounded group-hover:bg-yellow-900/50 transition-colors">
                                <FileText size={14} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-bold">DaVinci Resolve</span>
                                <span className="text-[10px] text-zinc-500">.csv (Timeline Markers)</span>
                            </div>
                        </button>

                        <button
                            onClick={() => handleExport('generic')}
                            className="w-full flex items-center gap-3 px-3 py-2 text-left text-zinc-300 hover:bg-zinc-800 hover:text-white rounded-md transition-colors group"
                        >
                            <div className="bg-zinc-800 text-zinc-400 p-1.5 rounded group-hover:bg-zinc-700 transition-colors">
                                <FileJson size={14} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-bold">CSV (Generic)</span>
                                <span className="text-[10px] text-zinc-500">Simple list</span>
                            </div>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExportMenu;
