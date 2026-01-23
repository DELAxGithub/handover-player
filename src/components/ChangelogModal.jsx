import React from 'react';
import { X, Sparkles, GitCommit } from 'lucide-react';

const UPDATES = [
    {
        version: "v1.2.0",
        date: "2026-01-19",
        title: "ダッシュボード & 履歴",
        items: [
            "🏠 **ダッシュボード**: 最近のプロジェクトが自動保存されるようになりました。",
            "📑 **履歴機能**: トップ画面からすぐに作業を再開できます。",
            "🧭 **ナビゲーション**: ホームや新規作成へのアクセスが改善されました。"
        ]
    },
    {
        version: "v1.1.0",
        date: "2026-01-19",
        title: "プロ向け書き出し機能",
        items: [
            "🎬 **Premiere Pro XML**: コメントをシーケンスマーカーとして書き出せます。",
            "🎨 **DaVinci Resolve CSV**: タイムラインに直接読み込めます。",
            "⚡ **フレームレート対応**: 23.976fps, 29.97fps(DF) などに対応しました。"
        ]
    },
    {
        version: "v1.0.0",
        date: "2026-01-14",
        title: "初回リリース",
        items: [
            "📦 **Dropbox直リンク**: 再アップロードなしで動画を再生できます。",
            "💬 **フレーム精度コメント**: TCに同期したスレッド形式の議論が可能です。",
            "🎹 **JKLショートカット**: プロ仕様の再生コントロールを搭載。"
        ]
    }
];

const ChangelogModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#0f172a] w-full max-w-lg rounded-xl border border-slate-700 shadow-2xl ring-1 ring-white/10 flex flex-col max-h-[80vh] relative isolate">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-md">
                            <Sparkles size={18} />
                        </div>
                        <h2 className="text-zinc-100 font-bold">更新情報</h2>
                    </div>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-0">
                    {UPDATES.map((update, i) => (
                        <div key={i} className="p-6 border-b border-zinc-800 last:border-none">
                            <div className="flex items-baseline justify-between mb-2">
                                <h3 className="text-zinc-200 font-bold text-sm tracking-wide">
                                    <span className="text-indigo-400 mr-2">{update.version}</span>
                                    {update.title}
                                </h3>
                                <span className="text-zinc-500 text-xs font-mono">{update.date}</span>
                            </div>
                            <ul className="space-y-2">
                                {update.items.map((item, j) => (
                                    <li key={j} className="text-zinc-400 text-sm leading-relaxed pl-4 relative">
                                        <span className="absolute left-0 top-2 w-1 h-1 rounded-full bg-zinc-600"></span>
                                        <span dangerouslySetInnerHTML={{
                                            __html: item.replace(/\*\*(.*?)\*\*/g, '<strong class="text-zinc-300 font-medium">$1</strong>')
                                        }} />
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="p-4 bg-zinc-950/50 border-t border-zinc-800 text-center">
                    <p className="text-zinc-600 text-xs">
                        Handover Player © 2026 DELAX Studio
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ChangelogModal;
