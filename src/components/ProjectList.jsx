import React, { useState, useEffect } from 'react';
import { Clock, Trash2, FileVideo, ArrowRight, Play, Plus, Film } from 'lucide-react';
import { getHistory, removeFromHistory } from '../utils/history';
import { Card } from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import Badge from './ui/Badge';

const formatDATE = (ts) => {
    const d = new Date(ts);
    const now = new Date();
    const diff = now - d;

    // If less than 24h, show relative time
    if (diff < 24 * 60 * 60 * 1000) {
        if (diff < 60 * 60 * 1000) {
            const mins = Math.floor(diff / (60 * 1000));
            return `${mins}分前`;
        }
        const hours = Math.floor(diff / (60 * 60 * 1000));
        return `${hours}時間前`;
    }
    return d.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
};

const ProjectCard = ({ project, onDelete }) => (
    <a
        href={`/?p=${project.id}&url=${encodeURIComponent(project.url)}`}
        className="group relative flex flex-col h-full transition-all duration-300 hover:-translate-y-1"
    >
        <Card className="h-full overflow-hidden border-border bg-card hover:border-primary/50 hover:shadow-2xl hover:shadow-indigo-900/10 transition-all rounded-xl">
            {/* Placeholder Thumbnail Area */}
            <div className="h-32 bg-muted w-full relative overflow-hidden flex items-center justify-center group-hover:bg-accent transition-colors">
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-60" />

                {/* Icon */}
                <div className="w-12 h-12 rounded-full bg-card flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-all z-10 shadow-lg border border-border group-hover:border-primary/30">
                    <FileVideo size={24} />
                </div>

                {/* Hover Play Overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
                    <Badge variant="default" className="gap-2 px-4 py-2 text-xs font-bold shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform">
                        <Play size={12} fill="currentColor" />
                        プロジェクトを開く
                    </Badge>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 flex flex-col gap-2 flex-1">
                <div className="flex justify-between items-start">
                    <h3 className="text-foreground font-bold text-sm truncate leading-tight group-hover:text-primary transition-colors" title={project.title}>
                        {project.title || "無題のプロジェクト"}
                    </h3>
                </div>

                <p className="text-muted-foreground text-[10px] font-mono truncate opacity-60">
                    {project.id}
                </p>

                <div className="mt-auto pt-4 flex items-center justify-between border-t border-border">
                    <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium">
                        <Clock size={10} />
                        {formatDATE(project.lastAccess)}
                    </span>

                    <button
                        onClick={(e) => onDelete(e, project.id)}
                        className="p-1.5 -mr-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                        title="Remove from history"
                    >
                        <Trash2 size={12} />
                    </button>
                </div>
            </div>
        </Card>
    </a>
);

const ProjectList = () => {
    const [projects, setProjects] = useState([]);
    const [inputUrl, setInputUrl] = useState('');

    useEffect(() => {
        setProjects(getHistory());
    }, []);

    const handleDelete = (e, id) => {
        e.preventDefault();
        e.stopPropagation();
        if (confirm('履歴から削除しますか？')) {
            const updated = removeFromHistory(id);
            setProjects(updated);
        }
    };

    const handleQuickStart = (e) => {
        e.preventDefault();
        if (!inputUrl) return;
        window.location.href = `/?url=${encodeURIComponent(inputUrl)}`;
    };

    return (
        <div className="w-full h-full overflow-y-auto bg-background custom-scrollbar">
            <div className="max-w-5xl mx-auto px-6 py-12 md:py-20 flex flex-col gap-12">

                {/* Hero / Welcome Section */}
                <div className="flex flex-col items-center text-center gap-6 animate-fade-in-up">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary border border-border text-muted-foreground text-xs font-mono mb-2">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                        v0.2.0 Soft Launch
                    </div>

                    <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tight">
                        Handover <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-400">Player</span>
                    </h1>
                    <p className="text-muted-foreground max-w-lg text-sm md:text-base leading-relaxed">
                        Dropboxなどの動画リンクを貼り付けるだけで、<br className="hidden md:block" />即座にフレーム単位のレビューを開始できます。
                    </p>

                    {/* Quick Start Input */}
                    <form onSubmit={handleQuickStart} className="w-full max-w-xl relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-orange-600 opacity-30 group-hover:opacity-50 blur transition duration-500 rounded-xl"></div>
                        <div className="relative flex items-center bg-card rounded-xl overflow-hidden shadow-2xl ring-1 ring-border group-hover:ring-primary/50 transition-all">
                            <div className="pl-4 text-muted-foreground">
                                <Film size={20} />
                            </div>
                            <Input
                                type="text"
                                value={inputUrl}
                                onChange={(e) => setInputUrl(e.target.value)}
                                placeholder="Dropboxの動画リンクをここに貼り付け..."
                                className="flex-1 bg-transparent border-none text-foreground px-4 py-4 focus:ring-0 placeholder:text-muted-foreground text-sm md:text-base w-full h-14 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0"
                            />
                            <Button
                                type="submit"
                                disabled={!inputUrl}
                                className="mr-2 h-10 rounded-lg font-bold"
                            >
                                Start
                                <ArrowRight size={14} className="ml-2" />
                            </Button>
                        </div>
                    </form>
                </div>

                {/* Dashboard Grid */}
                {projects.length > 0 && (
                    <div className="flex flex-col gap-6 animate-fade-in-up delay-100">
                        <div className="flex items-center justify-between border-b border-border pb-4">
                            <div className="flex items-center gap-2">
                                <Clock size={18} className="text-primary" />
                                <h2 className="text-lg font-bold text-foreground">Recent Projects</h2>
                            </div>
                            <Badge variant="secondary" className="font-mono">
                                Local History
                            </Badge>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {projects.map((p) => (
                                <ProjectCard key={p.id} project={p} onDelete={handleDelete} />
                            ))}

                            {/* "New" Card Placeholder to encourage action */}
                            <div
                                onClick={() => document.querySelector('input[type="text"]').focus()}
                                className="group flex flex-col items-center justify-center gap-3 bg-muted/20 border border-border border-dashed hover:border-primary/50 hover:bg-muted/50 rounded-xl min-h-[200px] cursor-pointer transition-all"
                            >
                                <div className="w-12 h-12 rounded-full bg-card flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-all border border-border group-hover:border-primary/50">
                                    <Plus size={24} />
                                </div>
                                <span className="text-xs font-bold text-muted-foreground group-hover:text-primary">新規プロジェクト</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer / Empty State Hint */}
                {projects.length === 0 && (
                    <div className="text-center mt-10 opacity-50">
                        <div className="inline-block p-4 rounded-full bg-muted border border-border mb-4">
                            <div className="flex gap-2">
                                <span className="w-2 h-2 rounded-full bg-zinc-700"></span>
                                <span className="w-2 h-2 rounded-full bg-zinc-700"></span>
                                <span className="w-2 h-2 rounded-full bg-zinc-700"></span>
                            </div>
                        </div>
                        <p className="text-muted-foreground text-xs">このデバイスには最近の履歴がありません。</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProjectList;
