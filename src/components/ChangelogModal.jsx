import React from 'react';
import { X, Sparkles, GitCommit } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from './ui/Card';
import Button from './ui/Button';
import Badge from './ui/Badge';

const UPDATES = [
    {
        version: "v2.0.0",
        date: "2026-01-26",
        title: "デザインシステム刷新",
        items: [
            "🎨 **Design System v2**: ダークモードを基調とした新しいUIデザインを適用しました。",
            "🧩 **UIコンポーネント**: ボタンやカードなどのデザインを統一し、操作性を向上させました。",
            "⚡ **パフォーマンス改善**: 描画パフォーマンスを最適化し、よりスムーズな操作感を実現しました。"
        ]
    },
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <Card className="w-full max-w-lg bg-card border-border shadow-2xl ring-1 ring-white/5 flex flex-col max-h-[80vh] relative isolate animate-scale-up">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border bg-muted/20 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 text-primary rounded-md flex-shrink-0">
                            <Sparkles size={20} />
                        </div>
                        <CardTitle className="text-xl font-bold text-foreground">更新情報</CardTitle>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="h-9 w-9 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted">
                        <X size={20} />
                    </Button>
                </div>

                {/* Content */}
                <CardContent className="flex-1 overflow-y-auto p-0">
                    {UPDATES.map((update, i) => (
                        <div key={i} className="p-6 border-b border-border last:border-none hover:bg-muted/5 transition-colors">
                            <div className="flex items-baseline justify-between mb-3">
                                <h3 className="text-foreground font-bold text-sm tracking-wide flex items-center gap-2">
                                    <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5 font-mono">
                                        {update.version}
                                    </Badge>
                                    {update.title}
                                </h3>
                                <span className="text-muted-foreground text-xs font-mono">{update.date}</span>
                            </div>
                            <ul className="space-y-2">
                                {update.items.map((item, j) => (
                                    <li key={j} className="text-muted-foreground text-sm leading-relaxed pl-4 relative">
                                        <span className="absolute left-0 top-2 w-1 h-1 rounded-full bg-border"></span>
                                        <span dangerouslySetInnerHTML={{
                                            __html: item.replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground font-medium">$1</strong>')
                                        }} />
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </CardContent>

                {/* Footer */}
                <div className="p-4 bg-muted/30 border-t border-border text-center">
                    <p className="text-muted-foreground text-xs font-mono">
                        Handover Player
                    </p>
                </div>
            </Card>
        </div>
    );
};

export default ChangelogModal;
