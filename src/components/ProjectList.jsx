import React, { useState, useEffect } from 'react';
import { Clock, ExternalLink, Trash2, FileVideo } from 'lucide-react';
import { getHistory, removeFromHistory } from '../utils/history';

const formatDATE = (ts) => {
    return new Date(ts).toLocaleDateString('ja-JP', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
};

const ProjectList = () => {
    const [projects, setProjects] = useState([]);

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

    if (projects.length === 0) return null;

    return (
        <div className="w-full max-w-2xl mx-auto mt-10 p-6">
            <div className="flex items-center gap-2 mb-4 text-zinc-400">
                <Clock size={16} />
                <h2 className="text-sm font-bold uppercase tracking-wider">最近のプロジェクト</h2>
            </div>

            <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden shadow-xl">
                {projects.map((p) => (
                    <a
                        key={p.id}
                        href={`/?p=${p.id}&url=${encodeURIComponent(p.url)}`}
                        className="block group border-b border-zinc-800 last:border-none hover:bg-zinc-800/50 transition-colors"
                    >
                        <div className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-4 min-w-0">
                                <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-500 group-hover:bg-indigo-900/20 group-hover:text-indigo-400 transition-colors">
                                    <FileVideo size={20} />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-zinc-200 font-bold text-sm truncate pr-4 group-hover:text-white transition-colors">
                                        {p.title || "Untitled Project"}
                                    </h3>
                                    <p className="text-zinc-500 text-xs truncate max-w-[300px] font-mono">
                                        {p.id.slice(0, 8)}...
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-6 flex-shrink-0">
                                <span className="text-xs text-zinc-600 font-mono">
                                    {formatDATE(p.lastAccess)}
                                </span>

                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        className="p-2 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white transition-colors"
                                        title="Open"
                                    >
                                        <ExternalLink size={16} />
                                    </button>
                                    <button
                                        onClick={(e) => handleDelete(e, p.id)}
                                        className="p-2 hover:bg-red-900/20 rounded text-zinc-600 hover:text-red-400 transition-colors"
                                        title="Remove from history"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </a>
                ))}
            </div>
        </div>
    );
};

export default ProjectList;
