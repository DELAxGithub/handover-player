import React, { useState, useEffect } from 'react';
import { Clock, Trash2, ArrowRight, Video, MonitorPlay, Plus, FolderOpen, FolderPlus } from 'lucide-react';
import { getHistory, removeFromHistory } from '../utils/history';
import { createFolder } from '../utils/folder';
import Button from './ui/Button';
import Input from './ui/Input';
import Badge from './ui/Badge';

const formatDATE = (ts) => {
    const d = new Date(ts);
    const now = new Date();
    const diff = now - d;

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

const ProjectRow = ({ project, onDelete }) => (
    <a
        href={`/?p=${project.id}&url=${encodeURIComponent(project.url)}`}
        className="group relative flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-card border border-border/50 hover:border-primary/50 hover:bg-muted/30 rounded-xl transition-all duration-200"
    >
        <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20 group-hover:scale-105 transition-transform">
            <MonitorPlay size={20} className="sm:w-6 sm:h-6" />
        </div>
        <div className="flex-1 min-w-0 flex flex-col gap-0.5 sm:gap-1">
            <h3 className="text-foreground font-bold text-sm sm:text-base truncate leading-snug group-hover:text-primary transition-colors pr-2">
                {project.title || "無題のプロジェクト"}
            </h3>
            <span className="text-muted-foreground text-[10px] font-mono opacity-50 truncate hidden sm:block">
                ID: {project.id}
            </span>
        </div>
        <div className="flex items-center gap-3 sm:gap-6 shrink-0">
            <span className="flex items-center gap-1.5 text-[10px] sm:text-xs text-muted-foreground font-medium bg-muted/50 px-2 py-1 rounded whitespace-nowrap">
                <Clock size={10} className="sm:w-3 sm:h-3" />
                {formatDATE(project.lastAccess)}
            </span>
            <div className="flex items-center sm:opacity-0 sm:group-hover:opacity-100 transition-opacity -mr-1 sm:-mr-2">
                <button
                    onClick={(e) => onDelete(e, project.id)}
                    className="p-1.5 sm:p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                    title="履歴から削除"
                >
                    <Trash2 size={14} className="sm:w-4 sm:h-4" />
                </button>
            </div>
        </div>
    </a>
);

const FolderRow = ({ folder, onDelete }) => (
    <a
        href={`/?f=${folder.id}`}
        className="group relative flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-card border border-border/50 hover:border-amber-500/50 hover:bg-muted/30 rounded-xl transition-all duration-200"
    >
        <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20 group-hover:scale-105 transition-transform">
            <FolderOpen size={20} className="sm:w-6 sm:h-6" />
        </div>
        <div className="flex-1 min-w-0 flex flex-col gap-0.5 sm:gap-1">
            <h3 className="text-foreground font-bold text-sm sm:text-base truncate leading-snug group-hover:text-amber-500 transition-colors pr-2">
                {folder.title || "無題のフォルダ"}
            </h3>
            {folder.episodeCount != null && (
                <span className="text-muted-foreground text-[10px]">
                    {folder.episodeCount} エピソード
                </span>
            )}
        </div>
        <div className="flex items-center gap-3 sm:gap-6 shrink-0">
            <span className="flex items-center gap-1.5 text-[10px] sm:text-xs text-muted-foreground font-medium bg-muted/50 px-2 py-1 rounded whitespace-nowrap">
                <Clock size={10} className="sm:w-3 sm:h-3" />
                {formatDATE(folder.lastAccess)}
            </span>
            <div className="flex items-center sm:opacity-0 sm:group-hover:opacity-100 transition-opacity -mr-1 sm:-mr-2">
                <button
                    onClick={(e) => onDelete(e, folder.id)}
                    className="p-1.5 sm:p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                    title="履歴から削除"
                >
                    <Trash2 size={14} className="sm:w-4 sm:h-4" />
                </button>
            </div>
        </div>
    </a>
);

const ProjectList = () => {
    const [items, setItems] = useState([]);
    const [inputUrl, setInputUrl] = useState('');
    const [folderName, setFolderName] = useState('');
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);

    useEffect(() => {
        setItems(getHistory());
    }, []);

    const handleDelete = (e, id) => {
        e.preventDefault();
        e.stopPropagation();
        if (confirm('履歴から削除しますか？')) {
            const updated = removeFromHistory(id);
            setItems(updated);
        }
    };

    const handleQuickStart = (e) => {
        e.preventDefault();
        if (!inputUrl) return;
        window.location.href = `/?url=${encodeURIComponent(inputUrl)}`;
    };

    const handleCreateFolder = async (e) => {
        e.preventDefault();
        const name = folderName.trim();
        if (!name || isCreatingFolder) return;
        setIsCreatingFolder(true);

        const { id, error } = await createFolder(name);
        if (error) {
            setIsCreatingFolder(false);
            return;
        }
        window.location.href = `/?f=${id}`;
    };

    const folders = items.filter(i => i.type === 'folder');
    const projects = items.filter(i => !i.type || i.type === 'project');

    return (
        <div className="w-full h-full overflow-y-auto bg-background custom-scrollbar">
            <div className="max-w-3xl mx-auto px-4 py-8 sm:px-6 sm:py-12 flex flex-col gap-8 sm:gap-10">

                {/* Quick Start: URL */}
                <div className="flex flex-col gap-4 animate-fade-in-up">
                    <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight text-center sm:text-left break-keep">
                        新規プロジェクトを開始
                    </h2>

                    <form onSubmit={handleQuickStart} className="w-full relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 opacity-20 group-hover:opacity-40 blur transition duration-500 rounded-xl"></div>
                        <div className="relative flex items-center bg-card rounded-xl overflow-hidden shadow-xl ring-1 ring-border group-hover:ring-primary/50 transition-all">
                            <div className="pl-3 sm:pl-4 text-muted-foreground shrink-0">
                                <Video size={18} className="sm:w-5 sm:h-5" />
                            </div>
                            <Input
                                type="text"
                                value={inputUrl}
                                onChange={(e) => setInputUrl(e.target.value)}
                                placeholder="動画のURLを貼り付け..."
                                className="flex-1 bg-transparent border-none text-foreground px-3 sm:px-4 py-3 sm:py-5 focus:ring-0 placeholder:text-muted-foreground text-sm sm:text-base w-full h-12 sm:h-16 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 min-w-0"
                            />
                            <Button
                                type="submit"
                                disabled={!inputUrl}
                                className="mr-1.5 sm:mr-3 h-9 sm:h-10 px-3 sm:px-6 rounded-lg font-bold bg-primary hover:bg-primary/90 shadow-md whitespace-nowrap"
                                size="sm"
                            >
                                <span className="hidden sm:inline">Start</span>
                                <ArrowRight size={16} className="sm:ml-2" />
                            </Button>
                        </div>
                    </form>
                </div>

                {/* Create Folder */}
                <div className="flex flex-col gap-3 animate-fade-in-up delay-50">
                    <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <FolderPlus size={16} className="text-amber-500" />
                        フォルダを作成（複数エピソードをまとめる）
                    </h2>
                    <form onSubmit={handleCreateFolder} className="flex gap-2">
                        <Input
                            type="text"
                            value={folderName}
                            onChange={(e) => setFolderName(e.target.value)}
                            placeholder="番組名やプロジェクト名..."
                            className="flex-1 h-11 text-sm"
                        />
                        <Button
                            type="submit"
                            disabled={!folderName.trim() || isCreatingFolder}
                            className="h-11 px-4 font-bold gap-2 shrink-0"
                        >
                            <Plus size={16} />
                            <span className="hidden sm:inline">作成</span>
                        </Button>
                    </form>
                </div>

                {/* Folders */}
                {folders.length > 0 && (
                    <div className="flex flex-col gap-4 animate-fade-in-up delay-100">
                        <div className="flex items-center justify-between pb-2 border-b border-border/40">
                            <div className="flex items-center gap-2">
                                <FolderOpen size={16} className="text-amber-500" />
                                <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">フォルダ</h2>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3">
                            {folders.map((f) => (
                                <FolderRow key={f.id} folder={f} onDelete={handleDelete} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Recent Projects */}
                {projects.length > 0 && (
                    <div className="flex flex-col gap-4 animate-fade-in-up delay-100">
                        <div className="flex items-center justify-between pb-2 border-b border-border/40">
                            <div className="flex items-center gap-2">
                                <Clock size={16} className="text-primary" />
                                <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">最近のプロジェクト</h2>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3">
                            {projects.map((p) => (
                                <ProjectRow key={p.id} project={p} onDelete={handleDelete} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {items.length === 0 && (
                    <div className="text-center mt-8 p-10 border border-dashed border-border rounded-2xl bg-muted/5 opacity-60">
                        <MonitorPlay className="mx-auto text-muted-foreground mb-4" size={48} />
                        <p className="text-muted-foreground font-medium">履歴はありません</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">動画のURLを入力するか、フォルダを作成してレビューを開始しましょう</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProjectList;
