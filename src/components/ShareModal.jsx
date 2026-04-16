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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <Card className="w-full max-w-md bg-card border-border shadow-2xl overflow-hidden animate-scale-up">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border bg-muted/20">
                    <CardTitle className="text-lg font-bold text-foreground">Share Settings</CardTitle>
                    <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <X size={20} />
                    </Button>
                </div>

                <CardContent className="p-6 flex flex-col gap-8">

                    {/* 1. Link Section */}
                    <div className="flex flex-col gap-3">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex justify-between items-center">
                            {folderId ? 'Episode Link' : 'Share Link'}
                            <Badge variant={passcodeEnabled ? "success" : "secondary"} className="text-[10px] h-5">
                                {passcodeEnabled ? "Secure" : "Public"}
                            </Badge>
                        </label>
                        <div className="flex gap-2">
                            <Input
                                readOnly
                                value={fullUrl}
                                className="flex-1 bg-muted/30 border-input font-mono text-xs"
                            />
                            <Button
                                onClick={() => handleCopy('episode')}
                                variant={copied === 'episode' ? "success" : "default"}
                                className="w-24 font-bold transition-all"
                            >
                                {copied === 'episode' ? <Check size={16} className="mr-2" /> : <Copy size={16} className="mr-2" />}
                                {copied === 'episode' ? "Copied" : "Copy"}
                            </Button>
                        </div>

                        {/* Folder Link (when in folder context) */}
                        {folderUrl && (
                            <>
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mt-2">
                                    <FolderOpen size={12} className="text-amber-500" />
                                    Folder link (all episodes)
                                </label>
                                <div className="flex gap-2">
                                    <Input
                                        readOnly
                                        value={folderUrl}
                                        className="flex-1 bg-muted/30 border-input font-mono text-xs"
                                    />
                                    <Button
                                        onClick={() => handleCopy('folder')}
                                        variant={copied === 'folder' ? "success" : "default"}
                                        className="w-24 font-bold transition-all"
                                    >
                                        {copied === 'folder' ? <Check size={16} className="mr-2" /> : <Copy size={16} className="mr-2" />}
                                        {copied === 'folder' ? "Copied" : "Copy"}
                                    </Button>
                                </div>
                            </>
                        )}

                        <p className="text-[10px] text-muted-foreground flex items-center gap-1.5 px-1">
                            {passcodeEnabled ? (
                                <>
                                    <Lock size={12} className="text-primary" />
                                    Only people with the passcode can view
                                </>
                            ) : (
                                <>
                                    <ShieldAlert size={12} className="text-yellow-500" />
                                    Anyone with the link can view (Basic)
                                </>
                            )}
                        </p>
                    </div>

                    <div className="h-px bg-border w-full" />

                    {/* 2. Security (Passcode) */}
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-muted rounded-md text-muted-foreground">
                                    <Lock size={18} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-foreground">Passcode Protection</h3>
                                    <p className="text-xs text-muted-foreground">Access restriction (paid)</p>
                                </div>
                            </div>
                            <Switch
                                checked={passcodeEnabled}
                                onCheckedChange={handlePasscodeToggle}
                            />
                        </div>

                        {!passcodeEnabled && (
                            <div className="ml-12">
                                <Badge variant="outline" className="text-[10px] text-primary border-primary/20 bg-primary/5">
                                    Add-on: $3 / project
                                </Badge>
                            </div>
                        )}
                    </div>

                    {/* 3. Expiration */}
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-muted rounded-md text-muted-foreground">
                                    <Calendar size={18} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-foreground">Expiration</h3>
                                    <p className="text-xs text-muted-foreground">
                                        Valid until {expirationDate.toLocaleDateString('en-US')}
                                    </p>
                                </div>
                            </div>
                            <Badge
                                variant={isExpiringToday ? "destructive" : isExpiringSoon ? "secondary" : "secondary"}
                                className="font-mono text-xs"
                            >
                                {Math.max(0, daysUntilExpiration)} days left
                            </Badge>
                        </div>

                        {/* Expiration Warning */}
                        {isExpiringSoon && !isExpiringToday && (
                            <Alert variant="warning" title="Expiring soon">
                                This project expires {daysUntilExpiration === 1 ? 'tomorrow' : `in ${daysUntilExpiration} days`}
                            </Alert>
                        )}
                        {isExpiringToday && (
                            <Alert variant="error" title="Expires today">
                                This project expires today
                            </Alert>
                        )}

                        {/* Expiration Preset Selector */}
                        <div className="ml-12">
                            <Select
                                label="Select duration"
                                value={expirationDays}
                                onChange={setExpirationDays}
                                options={expirationOptions}
                                placeholder="Select duration"
                            />
                        </div>

                        {/* Extension Options */}
                        <div className="ml-12 flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleExtendExpiration(7)}
                                className="text-xs h-8 bg-muted/20 hover:bg-muted text-muted-foreground hover:text-foreground border-dashed"
                            >
                                +7 days ($2)
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleExtendExpiration(30)}
                                className="text-xs h-8 bg-muted/20 hover:bg-muted text-muted-foreground hover:text-foreground border-dashed"
                            >
                                +30 days ($5)
                            </Button>
                        </div>
                    </div>

                </CardContent>
            </Card>
        </div>
    );
};

export default ShareModal;
