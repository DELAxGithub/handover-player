import React, { useState, useEffect } from 'react';
import { ArrowRight, Video, MonitorPlay, Plus, FolderOpen, FolderPlus } from 'lucide-react';
import { getHistory, removeFromHistory } from '../utils/history';
import { createFolder } from '../utils/folder';

const formatDATE = (ts) => {
    const d = new Date(ts);
    const now = new Date();
    const diff = now - d;
    if (diff < 24 * 60 * 60 * 1000) {
        if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))}m ago`;
        return `${Math.floor(diff / (60 * 60 * 1000))}h ago`;
    }
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

/* Mockup: project-row — 16px padding, 14px gap, 10px radius, 1px border */
const ProjectRow = ({ project, onDelete }) => (
    <a
        href={`/?p=${project.id}&url=${encodeURIComponent(project.url)}`}
        className="group"
        style={{ display: 'flex', alignItems: 'center', padding: '16px', gap: '14px', borderRadius: '10px', border: '1px solid var(--border)', textDecoration: 'none', color: 'inherit' }}
    >
        <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#f0f0ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontSize: '18px', flexShrink: 0 }}>
            <MonitorPlay size={18} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {project.title || "Untitled Project"}
            </div>
            <div style={{ fontSize: '11px', color: '#aaa', marginTop: '2px' }}>
                Last opened {formatDATE(project.lastAccess)}
            </div>
        </div>
        <button
            onClick={(e) => onDelete(e, project.id)}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ width: '32px', height: '32px', borderRadius: '6px', border: 'none', background: 'none', color: '#aaa', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', letterSpacing: '2px' }}
            title="Remove from history"
        >···</button>
    </a>
);

const FolderRow = ({ folder, onDelete }) => (
    <a
        href={`/?f=${folder.id}`}
        className="group"
        style={{ display: 'flex', alignItems: 'center', padding: '16px', gap: '14px', borderRadius: '10px', border: '1px solid var(--border)', textDecoration: 'none', color: 'inherit' }}
    >
        <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', fontSize: '18px', flexShrink: 0 }}>
            <FolderOpen size={18} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {folder.title || "Untitled Folder"}
            </div>
            <div style={{ fontSize: '11px', color: '#aaa', marginTop: '2px' }}>
                {folder.episodeCount != null ? `${folder.episodeCount} ${folder.episodeCount === 1 ? 'episode' : 'episodes'} · ` : ''}Last opened {formatDATE(folder.lastAccess)}
            </div>
        </div>
        <button
            onClick={(e) => onDelete(e, folder.id)}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ width: '32px', height: '32px', borderRadius: '6px', border: 'none', background: 'none', color: '#aaa', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', letterSpacing: '2px' }}
            title="Remove from history"
        >···</button>
    </a>
);

const ProjectList = () => {
    const [items, setItems] = useState([]);
    const [inputUrl, setInputUrl] = useState('');
    const [folderName, setFolderName] = useState('');
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);

    useEffect(() => { setItems(getHistory()); }, []);

    const handleDelete = (e, id) => {
        e.preventDefault();
        e.stopPropagation();
        if (confirm('Remove from history?')) setItems(removeFromHistory(id));
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
        if (error) { setIsCreatingFolder(false); return; }
        window.location.href = `/?f=${id}`;
    };

    const folders = items.filter(i => i.type === 'folder');
    const projects = items.filter(i => !i.type || i.type === 'project');

    return (
        <div className="w-full h-full overflow-y-auto" style={{ backgroundColor: 'var(--background)' }}>
            {/* Mockup: landing — centered 600px, padding 80px top */}
            <div style={{ maxWidth: '600px', margin: '0 auto', padding: '80px 24px 40px', display: 'flex', flexDirection: 'column', gap: '40px', alignItems: 'center' }}>

                {/* Hero */}
                <div style={{ textAlign: 'center' }}>
                    <h2 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--foreground)', letterSpacing: '-0.5px', marginBottom: '8px' }}>Start a review</h2>
                    <p style={{ fontSize: '13px', color: '#aaa' }}>Paste a Dropbox video link to begin</p>
                </div>

                {/* URL Input — mockup: 56px, radius 12px, border 1.5px */}
                <form onSubmit={handleQuickStart} style={{ width: '100%' }}>
                    <div style={{ display: 'flex', width: '100%', height: '56px', borderRadius: '12px', border: '1.5px solid var(--border)', alignItems: 'center', padding: '0 6px 0 20px', gap: '12px', backgroundColor: 'var(--background)' }}>
                        <span style={{ color: '#aaa', fontSize: '18px', flexShrink: 0 }}>
                            <Video size={18} />
                        </span>
                        <input
                            type="text"
                            value={inputUrl}
                            onChange={(e) => setInputUrl(e.target.value)}
                            placeholder="https://dropbox.com/scl/fi/..."
                            style={{ flex: 1, border: 'none', outline: 'none', fontSize: '14px', fontFamily: 'inherit', color: 'var(--foreground)', background: 'none' }}
                        />
                        <button
                            type="submit"
                            disabled={!inputUrl}
                            style={{ width: '80px', height: '42px', borderRadius: '8px', backgroundColor: 'var(--foreground)', color: 'white', border: 'none', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: inputUrl ? 1 : 0.4 }}
                        >
                            <ArrowRight size={18} />
                        </button>
                    </div>
                </form>

                {/* Divider */}
                <div style={{ width: '48px', height: '1px', backgroundColor: 'var(--border)' }} />

                {/* Create Folder — mockup */}
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#aaa', letterSpacing: '1px', textTransform: 'uppercase' }}>Create Folder</span>
                    <form onSubmit={handleCreateFolder} style={{ display: 'flex', gap: '8px' }}>
                        <input
                            type="text"
                            value={folderName}
                            onChange={(e) => setFolderName(e.target.value)}
                            placeholder="Project or show name..."
                            style={{ flex: 1, height: '44px', borderRadius: '8px', border: '1.5px solid var(--border)', padding: '0 14px', fontSize: '13px', fontFamily: 'inherit', color: 'var(--foreground)', outline: 'none' }}
                        />
                        <button
                            type="submit"
                            disabled={!folderName.trim() || isCreatingFolder}
                            style={{ height: '44px', padding: '0 20px', borderRadius: '8px', backgroundColor: 'var(--foreground)', color: 'white', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', opacity: folderName.trim() ? 1 : 0.4 }}
                        >
                            + Create
                        </button>
                    </form>
                </div>

                {/* Folders */}
                {folders.length > 0 && (
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 600, color: '#aaa', letterSpacing: '1px', textTransform: 'uppercase' }}>Folders</span>
                            <span style={{ fontSize: '11px', color: '#aaa' }}>{folders.length} folders</span>
                        </div>
                        {folders.map((f) => (
                            <FolderRow key={f.id} folder={f} onDelete={handleDelete} />
                        ))}
                    </div>
                )}

                {/* Recent Projects */}
                {projects.length > 0 && (
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 600, color: '#aaa', letterSpacing: '1px', textTransform: 'uppercase' }}>Recent Projects</span>
                            <span style={{ fontSize: '11px', color: '#aaa' }}>{projects.length} projects</span>
                        </div>
                        {projects.map((p) => (
                            <ProjectRow key={p.id} project={p} onDelete={handleDelete} />
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {items.length === 0 && (
                    <div style={{ textAlign: 'center', marginTop: '32px', padding: '40px', borderRadius: '16px' }}>
                        <div style={{ width: '56px', height: '56px', margin: '0 auto 16px', borderRadius: '16px', backgroundColor: '#f0f0ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <MonitorPlay size={28} style={{ color: 'var(--primary)', opacity: 0.4 }} />
                        </div>
                        <p style={{ color: '#666', fontWeight: 500 }}>No history yet</p>
                        <p style={{ fontSize: '12px', color: '#aaa', marginTop: '4px' }}>Paste a video URL or create a folder to start reviewing</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProjectList;
