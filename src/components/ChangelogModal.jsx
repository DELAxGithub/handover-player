import React from 'react';
import { X } from 'lucide-react';

const UPDATES = [
    {
        version: "v3.1",
        title: "Design Overhaul",
        date: "Apr 2026",
        items: [
            "New professional UI with compressed controls",
            "Diamond-shaped timeline markers with hover tooltips",
            "Redesigned comment sidebar with gradient active state",
        ]
    },
    {
        version: "v3.0",
        title: "Folders & Episodes",
        date: "Mar 2026",
        items: [
            "Group episodes into folders for series review",
            "Real-time presence avatars",
            "Export to Premiere Pro XML and DaVinci Resolve CSV",
        ]
    },
    {
        version: "v2.0",
        title: "Pro Export",
        date: "Jan 2026",
        items: [
            "Premiere Pro XML timeline markers",
            "DaVinci Resolve CSV import",
            "Frame rate support (23.976, 29.97 DF, etc.)",
        ]
    },
];

const ChangelogModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            onClick={onClose}
        >
            <div
                className="flex flex-col overflow-hidden"
                style={{ width: '480px', maxWidth: '90vw', maxHeight: '80vh', backgroundColor: 'var(--background)', borderRadius: '16px', boxShadow: '0 8px 40px rgba(0,0,0,0.12)' }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between flex-shrink-0" style={{ padding: '24px 28px 0' }}>
                    <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--foreground)' }}>What's new</span>
                    <button onClick={onClose} style={{ fontSize: '20px', color: '#aaa', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1 }}>
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto" style={{ padding: '20px 28px 28px' }}>
                    <div className="flex flex-col" style={{ gap: '24px' }}>
                        {UPDATES.map((update, i) => (
                            <div key={i} className="flex flex-col" style={{ gap: '8px' }}>
                                <div className="flex items-baseline" style={{ gap: '10px' }}>
                                    <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--foreground)' }}>
                                        {update.version} — {update.title}
                                    </h4>
                                    <span style={{ fontSize: '11px', color: '#aaa' }}>{update.date}</span>
                                </div>
                                <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {update.items.map((item, j) => (
                                        <li key={j} style={{ fontSize: '13px', color: '#666', lineHeight: 1.5, paddingLeft: '16px', position: 'relative' }}>
                                            <span style={{ position: 'absolute', left: 0, top: '8px', width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#aaa' }} />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChangelogModal;
