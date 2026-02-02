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
            <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(!isOpen)}
                className={`gap-2 h-9 border-border bg-muted/20 hover:bg-muted text-muted-foreground hover:text-foreground font-semibold px-3
                    ${isOpen ? 'bg-muted text-foreground' : ''}`}
                title="Marker Export"
            >
                <Download size={15} />
                <span className="text-sm">書き出し</span>
            </Button>

            {/* Dropdown Menu */}
            {isOpen && (
                <Card className="absolute right-0 top-full mt-2 w-72 bg-card border-border shadow-2xl z-50 overflow-hidden ring-1 ring-white/5 p-0">

                    {/* Section: FPS Selector */}
                    <div className="px-1 py-1 border-b border-border bg-muted/20">
                        <div className="px-3 py-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                            フレームレート設定
                        </div>
                        <select
                            value={JSON.stringify(selectedFps)}
                            onChange={(e) => setSelectedFps(JSON.parse(e.target.value))}
                            className="w-full bg-card text-foreground text-sm rounded-md px-3 py-2 border border-border outline-none focus:ring-1 focus:ring-primary hover:bg-muted/50 cursor-pointer appearance-none"
                            style={{ backgroundImage: 'none' }}
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
                        <div className="px-3 py-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                            出力形式
                        </div>

                        <button
                            onClick={() => handleExport('premiere')}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-muted-foreground hover:bg-muted hover:text-foreground rounded-md transition-colors group"
                        >
                            <div className="bg-purple-900/30 text-purple-400 p-2 rounded group-hover:bg-purple-900/50 transition-colors">
                                <Clapperboard size={16} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-bold">Premiere Pro</span>
                                <span className="text-xs text-muted-foreground/70">.xml (シーケンスマーカー)</span>
                            </div>
                        </button>

                        <button
                            onClick={() => handleExport('resolve')}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-muted-foreground hover:bg-muted hover:text-foreground rounded-md transition-colors group"
                        >
                            <div className="bg-yellow-900/30 text-yellow-400 p-2 rounded group-hover:bg-yellow-900/50 transition-colors">
                                <FileText size={16} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-bold">DaVinci Resolve</span>
                                <span className="text-xs text-muted-foreground/70">.csv (タイムラインマーカー)</span>
                            </div>
                        </button>

                        <button
                            onClick={() => handleExport('generic')}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-muted-foreground hover:bg-muted hover:text-foreground rounded-md transition-colors group"
                        >
                            <div className="bg-muted text-muted-foreground p-2 rounded group-hover:bg-muted-foreground/20 transition-colors">
                                <FileJson size={16} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-bold">CSV (汎用)</span>
                                <span className="text-xs text-muted-foreground/70">シンプルなリスト</span>
                            </div>
                        </button>
                    </div>
                </Card>
            )}
        </div>
    );
};

export default ExportMenu;
