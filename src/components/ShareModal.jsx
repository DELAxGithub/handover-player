import React, { useState, useMemo } from 'react';
import { X, Copy, Check, Lock, ShieldAlert, Calendar, AlertTriangle, FolderOpen } from 'lucide-react';
import { useToast } from './Toast';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import Badge from './ui/Badge';
import { Switch } from './ui/Switch';
import Select from './ui/Select';
import { Alert } from './ui/Alert';

const ShareModal = ({ isOpen, onClose, url, projectId, projectMeta, folderId }) => {
    const toast = useToast();
    const [copied, setCopied] = useState('');  // '' | 'episode' | 'folder'

    // Mock State for UI Demo - Phase 2 Features
    const [passcodeEnabled, setPasscodeEnabled] = useState(false);
    const [expirationDays, setExpirationDays] = useState(7); // default 7 days
    const expirationDate = useMemo(() => {
        const base = projectMeta?.created_at ? new Date(projectMeta.created_at) : new Date();
        return new Date(base.getTime() + expirationDays * 24 * 60 * 60 * 1000);
    }, [expirationDays, projectMeta?.created_at]);

    // Expiration options
    const expirationOptions = [
        { value: 3, label: '3 days' },
        { value: 7, label: '7 days (default)' },
        { value: 14, label: '14 days' },
        { value: 30, label: '30 days' },
        { value: 60, label: '60 days' },
        { value: 100, label: '100 days' },
    ];

    // Calculate days until expiration
    const daysUntilExpiration = Math.ceil((expirationDate - new Date()) / (1000 * 60 * 60 * 24));
    const isExpiringSoon = daysUntilExpiration <= 2;
    const isExpiringToday = daysUntilExpiration <= 0;

    if (!isOpen) return null;

    const fullUrl = folderId && projectId
        ? `${window.location.origin}/?f=${folderId}&p=${projectId}&url=${encodeURIComponent(url)}`
        : `${window.location.origin}/?p=${projectId}&url=${encodeURIComponent(url)}`;

    const folderUrl = folderId ? `${window.location.origin}/?f=${folderId}` : null;

    const handleCopy = (type = 'episode') => {
        const link = type === 'folder' ? folderUrl : fullUrl;
        navigator.clipboard.writeText(link).then(() => {
            setCopied(type);
            toast.success(type === 'folder' ? 'Folder link copied' : 'Share link copied');
            setTimeout(() => setCopied(''), 2000);
        });
    };

    const handlePasscodeToggle = (checked) => {
        if (checked) {
            // Future: Trigger Payment Modal
            toast('Passcode protection is a paid add-on ($3)');
            // For demo purposes, we don't toggle it yet
        } else {
            setPasscodeEnabled(false);
        }
    };

    const handleExtendExpiration = (days) => {
        // Future: Trigger Payment Modal
        toast(`Extension (+${days} days) is a paid add-on`);
    };

    // Toggle styles (mockup)
    const toggleStyle = (on) => ({
        width: '44px', height: '24px', borderRadius: '12px', position: 'relative',
        backgroundColor: on ? 'var(--primary)' : 'var(--border)', cursor: 'pointer',
        border: 'none', flexShrink: 0,
    });
    const toggleDotStyle = (on) => ({
        position: 'absolute', top: '2px', width: '20px', height: '20px',
        borderRadius: '50%', backgroundColor: 'white',
        boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
        ...(on ? { right: '2px' } : { left: '2px' }),
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
            <div
                className="flex flex-col overflow-hidden"
                style={{ width: '480px', maxWidth: '90vw', backgroundColor: 'var(--background)', borderRadius: '16px', boxShadow: '0 8px 40px rgba(0,0,0,0.12)' }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header — mockup */}
                <div className="flex items-center justify-between" style={{ padding: '24px 28px 0' }}>
                    <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--foreground)' }}>Share this review</span>
                    <button onClick={onClose} style={{ color: '#aaa', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1 }}>
                        <X size={18} />
                    </button>
                </div>

                {/* Body — mockup layout */}
                <div className="flex flex-col" style={{ padding: '20px 28px 28px', gap: '20px' }}>

                    {/* 1. Review link */}
                    <div className="flex flex-col" style={{ gap: '6px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#aaa', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Review link</span>
                        <div className="flex" style={{ gap: '8px' }}>
                            <div
                                className="flex-1 flex items-center overflow-hidden"
                                style={{ height: '44px', borderRadius: '8px', backgroundColor: 'var(--card)', border: '1px solid var(--border)', padding: '0 12px', fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: '#666', whiteSpace: 'nowrap' }}
                            >
                                {fullUrl.replace(window.location.origin, '').substring(0, 40)}...
                            </div>
                            <button
                                onClick={() => handleCopy('episode')}
                                style={{ width: '44px', height: '44px', borderRadius: '8px', backgroundColor: 'var(--foreground)', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                            >
                                {copied === 'episode' ? <Check size={16} /> : <Copy size={16} />}
                            </button>
                        </div>
                    </div>

                    {/* Folder link (conditional) */}
                    {folderUrl && (
                        <div className="flex flex-col" style={{ gap: '6px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 600, color: '#aaa', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Folder link (all episodes)</span>
                            <div className="flex" style={{ gap: '8px' }}>
                                <div
                                    className="flex-1 flex items-center overflow-hidden"
                                    style={{ height: '44px', borderRadius: '8px', backgroundColor: 'var(--card)', border: '1px solid var(--border)', padding: '0 12px', fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: '#666', whiteSpace: 'nowrap' }}
                                >
                                    {folderUrl.replace(window.location.origin, '')}
                                </div>
                                <button
                                    onClick={() => handleCopy('folder')}
                                    style={{ width: '44px', height: '44px', borderRadius: '8px', backgroundColor: 'var(--foreground)', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                                >
                                    {copied === 'folder' ? <Check size={16} /> : <Copy size={16} />}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Permission line */}
                    <div className="flex items-center" style={{ gap: '8px' }}>
                        <span style={{ fontSize: '13px', color: '#666' }}>Anyone with the link can</span>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)', borderBottom: '1.5px dashed #aaa', cursor: 'pointer' }}>View & Comment ▾</span>
                    </div>

                    <p style={{ fontSize: '11px', color: '#aaa', lineHeight: 1.5 }}>
                        No sign-up required. Recipients can view the video and leave timecoded comments.
                    </p>

                    {/* Divider */}
                    <div style={{ height: '1px', backgroundColor: 'var(--border)' }} />

                    {/* Passcode protection — mockup toggle */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)' }}>Passcode protection</h4>
                            <p style={{ fontSize: '11px', color: '#aaa', marginTop: '2px' }}>Require a 6-digit code to view</p>
                        </div>
                        <button style={toggleStyle(passcodeEnabled)} onClick={() => handlePasscodeToggle(!passcodeEnabled)}>
                            <div style={toggleDotStyle(passcodeEnabled)} />
                        </button>
                    </div>

                    {/* Auto-expire — mockup toggle */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)' }}>Auto-expire</h4>
                            <p style={{ fontSize: '11px', color: '#aaa', marginTop: '2px' }}>Link expires after {expirationDays} days</p>
                        </div>
                        <button style={toggleStyle(true)} onClick={() => {}}>
                            <div style={toggleDotStyle(true)} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShareModal;
