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
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / 60000)}分前`;
  if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / 3600000)}時間前`;
  return d.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
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
      setError('フォルダが見つかりません');
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
      toast.error('エピソード追加に失敗しました');
    } else {
      toast.success('エピソードを追加しました');
      setNewUrl('');
      await fetchData();
    }
    setIsAdding(false);
  };

  const handleDeleteEpisode = async (e, episodeId) => {
    e.stopPropagation();
    if (!confirm('このエピソードを削除しますか？コメントも全て削除されます。')) return;
    const { error } = await deleteEpisode(episodeId);
    if (error) {
      toast.error('削除に失敗しました');
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
      toast.error('タイトル更新に失敗しました');
      setTitleDraft(folder.title);
    } else {
      setFolder(f => ({ ...f, title: newTitle }));
    }
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/?f=${folderId}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      toast.success('フォルダリンクをコピーしました');
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
        <Button onClick={onBack} variant="outline">トップに戻る</Button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border bg-card px-4 py-4 sm:px-6 sm:py-5">
        <div className="max-w-3xl mx-auto flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 -ml-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
              title="トップに戻る"
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
              {episodes.length} エピソード
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
                placeholder="Dropbox URLを貼ってエピソードを追加..."
                className="pl-10 h-11 text-sm"
              />
            </div>
            <Button
              type="submit"
              disabled={!newUrl.trim() || isAdding}
              className="h-11 px-4 font-bold gap-2 shrink-0"
            >
              {isAdding ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              <span className="hidden sm:inline">追加</span>
            </Button>
          </form>

          {/* Episode List */}
          {episodes.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-border rounded-xl bg-muted/5">
              <Video className="mx-auto text-muted-foreground mb-3" size={40} />
              <p className="text-muted-foreground font-medium">エピソードがありません</p>
              <p className="text-xs text-muted-foreground/60 mt-1">上のフォームからDropbox URLを追加してください</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {episodes.map((ep, index) => (
                <button
                  key={ep.id}
                  onClick={() => onSelectEpisode(ep.id, ep.source_url)}
                  className="group relative flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-card border border-border/50 hover:border-primary/50 hover:bg-muted/30 rounded-xl transition-all duration-200 text-left w-full"
                >
                  {/* Episode Number */}
                  <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20 group-hover:scale-105 transition-transform font-bold text-sm sm:text-base">
                    #{index + 1}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                    <h3 className="text-foreground font-bold text-sm sm:text-base truncate leading-snug group-hover:text-primary transition-colors">
                      {ep.title || 'Untitled'}
                    </h3>
                    <span className="text-muted-foreground text-[10px] sm:text-xs">
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
                      title="削除"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Share Link */}
          <div className="pt-2 border-t border-border/50">
            <Button
              onClick={handleCopyLink}
              variant="outline"
              className="w-full gap-2 font-bold h-11"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'コピーしました' : 'フォルダリンクをコピー'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FolderView;
