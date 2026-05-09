import React, { useState, useRef, useEffect } from 'react';
import { Download, ChevronDown, Check, FileJson, Clapperboard, FileText } from 'lucide-react';
import { exportPremiereXML, exportResolveCSV, downloadFile } from '../utils/exporters';
import { Card } from './ui/Card';
import Button from './ui/Button';
import Badge from './ui/Badge';

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
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                title="Export"
                style={{ width: '36px', height: '36px', borderRadius: '8px', border: 'none', background: isOpen ? 'var(--card)' : 'none', color: '#666', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
                <Download size={18} />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 top-full mt-2 z-50" style={{ width: '280px', backgroundColor: 'var(--background)', borderRadius: '12px', boxShadow: '0 8px 40px rgba(0,0,0,0.12)', overflow: 'hidden' }}>
                    <div style={{ padding: '8px 0' }}>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: '#aaa', letterSpacing: '0.5px', textTransform: 'uppercase', padding: '8px 16px 12px' }}>
                            Export comments
                        </div>

                        <button onClick={() => handleExport('premiere')} className="w-full" style={{ display: 'flex', gap: '12px', padding: '10px 16px', alignItems: 'center', cursor: 'pointer', border: 'none', background: 'none', textAlign: 'left' }}>
                            <span style={{ color: '#666', fontSize: '16px', width: '20px', textAlign: 'center' }}><Clapperboard size={16} /></span>
                            <div>
                                <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--foreground)' }}>Premiere Pro XML</div>
                                <div style={{ fontSize: '11px', color: '#aaa', marginTop: '1px' }}>Timeline markers</div>
                            </div>
                        </button>

                        <div style={{ height: '1px', backgroundColor: 'var(--border)', margin: '4px 0' }} />

                        <button onClick={() => handleExport('resolve')} className="w-full" style={{ display: 'flex', gap: '12px', padding: '10px 16px', alignItems: 'center', cursor: 'pointer', border: 'none', background: 'none', textAlign: 'left' }}>
                            <span style={{ color: '#666', fontSize: '16px', width: '20px', textAlign: 'center' }}><FileText size={16} /></span>
                            <div>
                                <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--foreground)' }}>DaVinci Resolve CSV</div>
                                <div style={{ fontSize: '11px', color: '#aaa', marginTop: '1px' }}>EDL-compatible</div>
                            </div>
                        </button>

                        <div style={{ height: '1px', backgroundColor: 'var(--border)', margin: '4px 0' }} />

                        <button onClick={() => handleExport('generic')} className="w-full" style={{ display: 'flex', gap: '12px', padding: '10px 16px', alignItems: 'center', cursor: 'pointer', border: 'none', background: 'none', textAlign: 'left' }}>
                            <span style={{ color: '#666', fontSize: '16px', width: '20px', textAlign: 'center' }}><FileJson size={16} /></span>
                            <div>
                                <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--foreground)' }}>Generic CSV</div>
                                <div style={{ fontSize: '11px', color: '#aaa', marginTop: '1px' }}>Any workflow</div>
                            </div>
                        </button>

                        <div style={{ height: '1px', backgroundColor: 'var(--border)', margin: '4px 0' }} />

                        {/* FPS selector — mockup style */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 600, color: '#aaa' }}>Frame rate</span>
                            <select
                                value={JSON.stringify(selectedFps)}
                                onChange={(e) => setSelectedFps(JSON.parse(e.target.value))}
                                style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: 'var(--foreground)', border: '1px solid var(--border)', borderRadius: '6px', padding: '4px 10px', background: 'none', outline: 'none' }}
                            >
                                {FPS_OPTIONS.map((opt, i) => (
                                    <option key={i} value={JSON.stringify(opt)}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExportMenu;
