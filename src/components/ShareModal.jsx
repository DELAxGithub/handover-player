import React, { useState } from 'react';
import { X, Copy, Check, Lock, ShieldAlert } from 'lucide-react';
import { useToast } from './Toast';

const ShareModal = ({ isOpen, onClose, url, projectId, projectMeta }) => {
    const toast = useToast();
    const [copied, setCopied] = useState(false);

    // Mock State for UI Demo
    const [passcodeEnabled, setPasscodeEnabled] = useState(false); // Default OFF for Lite

    if (!isOpen) return null;

    const fullUrl = `${window.location.origin}/?p=${projectId}&url=${encodeURIComponent(url)}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(fullUrl).then(() => {
            setCopied(true);
            toast.success('共有リンクをコピーしました');
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const handlePasscodeToggle = () => {
        if (!passcodeEnabled) {
            // Future: Trigger Payment / Setup Flow
            toast('パスコード機能は準備中です (近日公開予定)');
            // setPasscodeEnabled(true); // Don't enable yet to avoid confusion
        } else {
            setPasscodeEnabled(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-zinc-900 w-full max-w-md rounded-xl border border-zinc-700 shadow-2xl flex flex-col overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-950">
                    <h2 className="text-zinc-100 font-bold text-lg">共有設定</h2>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 flex flex-col gap-6">

                    {/* 1. Link Section */}
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">共有リンク (有効期限: 7日)</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                readOnly
                                value={fullUrl}
                                className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono truncate"
                            />
                            <button
                                onClick={handleCopy}
                                className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${copied
                                        ? "bg-green-600 text-white"
                                        : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/20"
                                    }`}
                            >
                                {copied ? <Check size={16} /> : <Copy size={16} />}
                                {copied ? "Copied" : "Copy"}
                            </button>
                        </div>
                        <p className="text-[10px] text-zinc-500 flex items-center gap-1">
                            <ShieldAlert size={10} />
                            URLを知っている人は誰でも閲覧できます (Basic)
                        </p>
                    </div>

                    <div className="h-px bg-zinc-800" />

                    {/* 2. Security Add-on Section */}
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-zinc-800 rounded text-zinc-400">
                                    <Lock size={16} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-zinc-200">パスコード保護</h3>
                                    <p className="text-xs text-zinc-500">アクセスを制限します</p>
                                </div>
                            </div>

                            {/* Toggle Button */}
                            <button
                                onClick={handlePasscodeToggle}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-zinc-900 ${passcodeEnabled ? 'bg-indigo-600' : 'bg-zinc-700'
                                    }`}
                            >
                                <span
                                    className={`${passcodeEnabled ? 'translate-x-6' : 'translate-x-1'
                                        } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                                />
                            </button>
                        </div>

                        {/* Upsell Message */}
                        {!passcodeEnabled && (
                            <div className="mt-1 ml-9">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                    Add-on: $3 / project
                                </span>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ShareModal;
