import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Plus, Play, Trash2, Copy, Check, FolderOpen, Video, Pencil, Loader2 } from 'lucide-react';
import { getFolder, getFolderEpisodes, createEpisode, deleteEpisode, updateFolderTitle } from '../utils/folder';
import { useToast } from './Toast';
import Button from './ui/Button';
import Input from './ui/Input';
import Badge from './ui/Badge';

const getRelativeDate = (isoString) => {
  if (!isoString) return '';
  const d = new Date(isoString);
  const now = new Date();
  const diff = now - d;
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const FolderView = ({ folderId, onSelectEpisode, onBack }) => {
  const toast = useToast();
  const [folder, setFolder] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newUrl, setNewUrl] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [copied, setCopied] = useState(false);
  const titleInputRef = useRef(null);

  const fetchData = async () => {
    const [folderRes, episodesRes] = await Promise.all([
      getFolder(folderId),
      getFolderEpisodes(folderId),
    ]);

    if (folderRes.error) {
      setError('Folder not found');
      setIsLoading(false);
      return;
    }

    setFolder(folderRes.data);
    setTitleDraft(folderRes.data.title);
    setEpisodes(episodesRes.data || []);
    setIsLoading(false);
  };

  useEffect(() => {
    if (folderId) fetchData();
  }, [folderId]);

  useEffect(() => {
    if (editingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [editingTitle]);

  const handleAddEpisode = async (e) => {
    e.preventDefault();
    const url = newUrl.trim();
    if (!url || isAdding) return;
    setIsAdding(true);

    const { id, error } = await createEpisode(folderId, url);
    if (error) {
      toast.error('Failed to add episode');
    } else {
      toast.success('Episode added');
      setNewUrl('');
      await fetchData();
    }
    setIsAdding(false);
  };

  const handleDeleteEpisode = async (e, episodeId) => {
    e.stopPropagation();
    if (!confirm('Delete this episode? All comments will also be deleted.')) return;
    const { error } = await deleteEpisode(episodeId);
    if (error) {
      toast.error('Failed to delete');
    } else {
      setEpisodes(eps => eps.filter(ep => ep.id !== episodeId));
    }
  };

  const handleTitleSave = async () => {
    setEditingTitle(false);
    const newTitle = titleDraft.trim();
    if (!newTitle || newTitle === folder.title) return;
    const { error } = await updateFolderTitle(folderId, newTitle);
    if (error) {
      toast.error('Failed to update title');
      setTitleDraft(folder.title);
    } else {
      setFolder(f => ({ ...f, title: newTitle }));
    }
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/?f=${folderId}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      toast.success('Folder link copied');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background gap-4">
        <p className="text-destructive font-bold">{error}</p>
        <Button onClick={onBack} variant="outline">Back to Home</Button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--background)' }}>
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-4 sm:px-6 sm:py-5" style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--card)' }}>
        <div className="max-w-3xl mx-auto flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 -ml-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
              title="Back to Home"
            >
              <ArrowLeft size={20} />
            </button>

            <div className="flex-1 min-w-0 flex items-center gap-2">
              <FolderOpen size={20} className="text-primary shrink-0" />
              {editingTitle ? (
                <input
                  ref={titleInputRef}
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onBlur={handleTitleSave}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleTitleSave(); if (e.key === 'Escape') { setEditingTitle(false); setTitleDraft(folder.title); } }}
                  className="flex-1 bg-transparent text-xl font-bold text-foreground border-b-2 border-primary outline-none py-0.5"
                />
              ) : (
                <h1
                  className="text-xl font-bold text-foreground truncate cursor-pointer hover:text-primary transition-colors group flex items-center gap-2"
                  onClick={() => setEditingTitle(true)}
                >
                  {folder.title}
                  <Pencil size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </h1>
              )}
            </div>

            <Badge variant="secondary" className="font-mono text-xs shrink-0">
              {episodes.length} episodes
            </Badge>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6 sm:px-6 flex flex-col gap-6">

          {/* Add Episode */}
          <form onSubmit={handleAddEpisode} className="flex gap-2">
            <div className="flex-1 relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Video size={16} />
              </div>
              <Input
                type="text"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="Paste a Dropbox URL to add an episode..."
                className="pl-10 h-11 text-sm"
              />
            </div>
            <Button
              type="submit"
              disabled={!newUrl.trim() || isAdding}
              className="h-11 px-4 font-bold gap-2 shrink-0"
            >
              {isAdding ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              <span className="hidden sm:inline">Add</span>
            </Button>
          </form>

          {/* Episode List */}
          {episodes.length === 0 ? (
            <div className="text-center py-12 rounded-xl" style={{ border: '1px dashed var(--border)' }}>
              <Video className="mx-auto text-muted-foreground mb-3" size={40} />
              <p className="text-muted-foreground font-medium">No episodes yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Add a Dropbox URL using the form above</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {episodes.map((ep, index) => (
                <button
                  key={ep.id}
                  onClick={() => onSelectEpisode(ep.id, ep.source_url)}
                  className="group relative flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl transition-all duration-200 text-left w-full"
                  style={{ border: '1px solid var(--border)', backgroundColor: 'var(--background)' }}
                >
                  {/* Episode Number */}
                  <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-primary/20 group-hover:scale-105 transition-transform font-bold text-sm sm:text-base">
                    #{index + 1}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                    <h3 className="text-foreground font-bold text-sm sm:text-base truncate leading-snug group-hover:text-primary transition-colors">
                      {ep.title || 'Untitled'}
                    </h3>
                    <span className="text-muted-foreground text-xs">
                      {getRelativeDate(ep.created_at)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="p-2 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play size={16} fill="currentColor" />
                    </div>
                    <button
                      onClick={(e) => handleDeleteEpisode(e, ep.id)}
                      className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors sm:opacity-0 sm:group-hover:opacity-100"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Share Link */}
          <div className="pt-2" style={{ borderTop: '1px solid var(--border)' }}>
            <Button
              onClick={handleCopyLink}
              variant="outline"
              className="w-full gap-2 font-bold h-11"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'Copied!' : 'Copy folder link'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FolderView;
