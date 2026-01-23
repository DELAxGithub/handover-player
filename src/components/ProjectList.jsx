import React, { useState, useEffect } from 'react';
import { Clock, ExternalLink, Trash2, FileVideo, ArrowRight, Play, Plus, Film } from 'lucide-react';
import { getHistory, removeFromHistory } from '../utils/history';

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
        className="group relative flex flex-col bg-zinc-900/50 border border-zinc-800 hover:border-indigo-500/50 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-900/10 hover:-translate-y-1"
    >
        {/* Placeholder Thumbnail Area - In future we can grab a frame from the video */}
        <div className="h-32 bg-zinc-900 w-full relative overflow-hidden flex items-center justify-center group-hover:bg-zinc-800 transition-colors">
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent opacity-60" />

            {/* Icon */}
            <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-600 group-hover:text-indigo-400 group-hover:scale-110 transition-all z-10 shadow-lg border border-zinc-700/50 group-hover:border-indigo-500/30">
                <FileVideo size={24} />
            </div>

            {/* Hover Play Overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
                <div className="flex items-center gap-2 px-4 py-2 bg-indigo-600 rounded-full text-white text-xs font-bold shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform">
                    <Play size={12} fill="currentColor" />
                    プロジェクトを開く
                </div>
            </div>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col gap-2 flex-1">
            <div className="flex justify-between items-start">
                <h3 className="text-zinc-200 font-bold text-sm truncate leading-tight group-hover:text-indigo-300 transition-colors" title={project.title}>
                    {project.title || "無題のプロジェクト"}
                </h3>
            </div>

            <p className="text-zinc-500 text-[10px] font-mono truncate opacity-60">
                {project.id}
            </p>

            <div className="mt-auto pt-4 flex items-center justify-between border-t border-zinc-800/50">
                <span className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-medium">
                    <Clock size={10} />
                    {formatDATE(project.lastAccess)}
                </span>

                <button
                    onClick={(e) => onDelete(e, project.id)}
                    className="p-1.5 -mr-2 text-zinc-600 hover:text-red-400 hover:bg-red-900/10 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                    title="Remove from history"
                >
                    <Trash2 size={12} />
                </button>
            </div>
        </div>
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
        <div className="w-full h-full overflow-y-auto bg-black custom-scrollbar">
            <div className="max-w-5xl mx-auto px-6 py-12 md:py-20 flex flex-col gap-12">

                {/* Hero / Welcome Section */}
                <div className="flex flex-col items-center text-center gap-6 animate-fade-in-up">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/80 border border-zinc-800 text-zinc-400 text-xs font-mono mb-2">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                        </span>
                        v0.2.0 Soft Launch
                    </div>

                    <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
                        Handover <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">Player</span>
                    </h1>
                    <p className="text-zinc-400 max-w-lg text-sm md:text-base leading-relaxed">
                        Dropboxなどの動画リンクを貼り付けるだけで、<br className="hidden md:block" />即座にフレーム単位のレビューを開始できます。
                    </p>

                    {/* Quick Start Input */}
                    <form onSubmit={handleQuickStart} className="w-full max-w-xl relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 opacity-30 group-hover:opacity-50 blur transition duration-500 rounded-xl"></div>
                        <div className="relative flex items-center bg-zinc-950 rounded-xl overflow-hidden shadow-2xl ring-1 ring-zinc-800 group-hover:ring-zinc-700">
                            <div className="pl-4 text-zinc-500">
                                <Film size={20} />
                            </div>
                            <input
                                type="text"
                                value={inputUrl}
                                onChange={(e) => setInputUrl(e.target.value)}
                                placeholder="Dropboxの動画リンクをここに貼り付け..."
                                className="flex-1 bg-transparent border-none text-white px-4 py-4 focus:ring-0 placeholder:text-zinc-600 text-sm md:text-base w-full"
                            />
                            <button
                                type="submit"
                                disabled={!inputUrl}
                                className="mr-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-bold transition-all flex items-center gap-2"
                            >
                                Start
                                <ArrowRight size={14} />
                            </button>
                        </div>
                    </form>
                </div>

                {/* Dashboard Grid */}
                {projects.length > 0 && (
                    <div className="flex flex-col gap-6 animate-fade-in-up delay-100">
                        <div className="flex items-center justify-between border-b border-zinc-800/50 pb-4">
                            <div className="flex items-center gap-2">
                                <Clock size={18} className="text-indigo-500" />
                                <h2 className="text-lg font-bold text-zinc-200">Recent Projects</h2>
                            </div>
                            <span className="text-xs text-zinc-600 font-mono bg-zinc-900 px-2 py-1 rounded">
                                Local History
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {projects.map((p) => (
                                <ProjectCard key={p.id} project={p} onDelete={handleDelete} />
                            ))}

                            {/* "New" Card Placeholder to encourage action */}
                            <div
                                onClick={() => document.querySelector('input[type="text"]').focus()}
                                className="group flex flex-col items-center justify-center gap-3 bg-zinc-900/20 border border-zinc-800/50 border-dashed hover:border-zinc-700 hover:bg-zinc-900/50 rounded-xl min-h-[200px] cursor-pointer transition-all"
                            >
                                <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-600 group-hover:text-zinc-300 group-hover:scale-110 transition-all border border-zinc-800 group-hover:border-zinc-600">
                                    <Plus size={24} />
                                </div>
                                <span className="text-xs font-bold text-zinc-500 group-hover:text-zinc-400">新規プロジェクト</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer / Empty State Hint */}
                {projects.length === 0 && (
                    <div className="text-center mt-10 opacity-50">
                        <div className="inline-block p-4 rounded-full bg-zinc-900/50 border border-zinc-800/50 mb-4">
                            <div className="flex gap-2">
                                <span className="w-2 h-2 rounded-full bg-zinc-700"></span>
                                <span className="w-2 h-2 rounded-full bg-zinc-700"></span>
                                <span className="w-2 h-2 rounded-full bg-zinc-700"></span>
                            </div>
                        </div>
                        <p className="text-zinc-600 text-xs">このデバイスには最近の履歴がありません。</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProjectList;
