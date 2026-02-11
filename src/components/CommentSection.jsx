import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Play, Send, User, Radio, MessageSquare, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useToast } from './Toast';
import { CommentListSkeleton } from './Skeleton';
import Button from './ui/Button';
import Badge from './ui/Badge';
import { getAvatarColor, getInitials } from '../utils/userColor';

function cn(...inputs) {
    return twMerge(clsx(inputs));
}
// Format seconds to MM:SS
const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
};

const getRelativeTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
};

// Render text with URLs converted to clickable links
const renderLinkedText = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    return parts.map((part, i) =>
        urlRegex.test(part) ? (
            <a key={i} href={part} target="_blank" rel="noopener noreferrer"
               className="text-primary underline underline-offset-2 hover:text-primary/80 break-all">
                {part}
            </a>
        ) : part
    );
};

const CommentSection = ({ projectId, currentTime, onSeek, externalComments, isLoading, commentInputRef, onRefreshComments, onDeleteComment, compact }) => {
    const toast = useToast();

    // If externalComments is provided, use it. Otherwise default to empty list (fallback)
    const [localComments, setLocalComments] = useState([]);
    const rawComments = externalComments || localComments;
    // Deduplicate by ID as safety net
    const comments = rawComments.filter((c, i, arr) => arr.findIndex(x => x.id === c.id) === i);
    if (rawComments.length !== comments.length) {
        console.warn('[CommentSection] DEDUP:', rawComments.length, '->', comments.length);
    }

    const [newComment, setNewComment] = useState('');
    const [userName, setUserName] = useState(() => localStorage.getItem('handover_username') || '');
    const [loading, setLoading] = useState(false);
    const [fetchError, setFetchError] = useState(null);

    // Only run internal fetch if no external comments provided (Legacy fallback)
    useEffect(() => {
        if (!projectId || externalComments) return;

        const fetchComments = async () => {
            setFetchError(null);
            const { data, error } = await supabase
                .from('comments')
                .select('*')
                .eq('project_uuid', projectId)
                .order('ptime', { ascending: true });

            if (error) setFetchError(error.message);
            else if (data) setLocalComments(data);
        };

        fetchComments();
    }, [projectId, externalComments]);

    useEffect(() => {
        if (userName) localStorage.setItem('handover_username', userName);
    }, [userName]);

    const [isComposing, setIsComposing] = useState(false);
    const submittingRef = React.useRef(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const commentText = newComment.trim();
        if (!commentText || !projectId || submittingRef.current) return;
        submittingRef.current = true;
        console.log('[handleSubmit] INSERTING:', commentText);

        setNewComment('');
        setLoading(true);

        const { error } = await supabase.from('comments').insert([{
            project_uuid: projectId,
            ptime: currentTime,
            user_name: userName || 'Anonymous',
            text: commentText
        }]);

        if (error) {
            toast.error('投稿に失敗しました: ' + error.message);
            setNewComment(commentText); // restore on error
        } else {
            // Refetch to get authoritative data (avoids Realtime dedup issues)
            if (onRefreshComments) await onRefreshComments();
        }
        setLoading(false);
        submittingRef.current = false;
    };

    const listRef = React.useRef(null);
    const activeItemRef = React.useRef(null);

    // Auto-scroll to active comment
    useEffect(() => {
        if (activeItemRef.current) {
            activeItemRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
    }, [currentTime, comments.length]); // Depend on comments.length to trigger scroll when new comment is added

    return (
        <div className="flex flex-col h-full bg-card border-l border-border min-h-0 overflow-hidden">
            {/* 1. Header (Fixed) — hidden in compact/mobile mode */}
            {!compact && (
              <div className="p-4 border-b border-border flex justify-between items-center flex-shrink-0 bg-background/50">
                  <h2 className="text-foreground font-bold text-base">Comments</h2>
                  <Badge variant="secondary" className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-mono">
                      {comments.length}
                  </Badge>
              </div>
            )}

            {/* 2. Scrollable List — h-0 + flex-grow forces scroll instead of expand */}
            <div className="overflow-y-auto p-0 space-y-0 scroll-smooth" style={{ flexGrow: 1, height: 0, minHeight: 0 }} ref={listRef}>
                {fetchError && (
                    <div className="text-destructive-foreground text-xs p-3 m-2 bg-destructive/10 rounded border border-destructive/20 mb-2">
                        エラー: {fetchError}
                    </div>
                )}

                {isLoading ? (
                    <div className="p-4">
                        <CommentListSkeleton count={4} />
                    </div>
                ) : comments.length === 0 && !fetchError ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                        <MessageSquare size={32} strokeWidth={1.5} className="opacity-20" />
                        <p className="text-xs">No comments yet</p>
                    </div>
                ) : (
                    comments.map((comment) => {
                        const isActive = Math.abs(currentTime - comment.ptime) < 2;
                        return (
                            <div
                                key={comment.id}
                                ref={isActive ? activeItemRef : null}
                                className={cn(
                                    "group relative flex items-start gap-4 p-4 border-b border-border/50 transition-all duration-200 hover:bg-muted/30",
                                    isActive ? "bg-primary/5 border-primary/20" : ""
                                )}
                            >
                                {/* Active Indicator Bar */}
                                {isActive && (
                                    <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary animate-pulse" />
                                )}

                                {/* Avatar */}
                                <div className={cn(
                                    "shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm",
                                    getAvatarColor(comment.user_name)
                                )}>
                                    {getInitials(comment.user_name)}
                                </div>

                                {/* Content Body */}
                                <div className="flex-1 min-w-0 flex flex-col gap-1.5">

                                    {/* Header: Name & Timecode Badge */}
                                    <div className="flex items-center justify-between w-full">
                                        <span className={cn(
                                            "font-bold text-sm truncate pr-2",
                                            isActive ? "text-primary" : "text-foreground"
                                        )}>
                                            {comment.user_name || 'Anonymous'}
                                        </span>

                                        <button
                                            onClick={() => onSeek(comment.ptime)}
                                            className="shrink-0 group/time"
                                        >
                                            <Badge
                                                variant="default"
                                                className="bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs px-2 py-0.5 rounded transition-colors"
                                            >
                                                {formatTime(comment.ptime)}
                                            </Badge>
                                        </button>
                                    </div>

                                    {/* Comment Text */}
                                    <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap break-words" style={{ overflowWrap: 'anywhere' }}>
                                        {renderLinkedText(comment.text)}
                                    </p>

                                    {/* Footer: Date + Delete */}
                                    <div className="flex items-center justify-between pt-1">
                                        <p className="text-[11px] text-muted-foreground font-medium">
                                            {getRelativeTime(comment.created_at)}
                                        </p>
                                        {onDeleteComment && (userName || 'Anonymous') === (comment.user_name || 'Anonymous') && (
                                            <button
                                                onClick={() => {
                                                    if (window.confirm('このコメントを削除しますか？')) {
                                                        onDeleteComment(comment.id);
                                                    }
                                                }}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive p-1 rounded"
                                                title="削除"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* 3. Composer (Fixed Bottom) */}
            <div className={`${compact ? 'p-2' : 'p-4'} bg-muted/10 border-t border-border flex-shrink-0 z-10`}>
                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 px-1">
                        <User size={14} className="text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="名前を入力"
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                            className="bg-transparent border-none text-base text-foreground focus:text-primary focus:ring-0 p-0 placeholder-muted-foreground w-full focus:outline-none"
                        />
                    </div>

                    <div className="relative group shadow-sm rounded-xl transition-shadow hover:shadow-md bg-card border border-input focus-within:border-primary/50 focus-within:bg-card focus-within:ring-1 focus-within:ring-primary/20">
                        <textarea
                            ref={commentInputRef}
                            placeholder="コメントを入力... (Shift+Enter で送信)"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onCompositionStart={() => setIsComposing(true)}
                            onCompositionEnd={() => setIsComposing(false)}
                            className="w-full bg-transparent text-foreground rounded-xl p-3 text-base min-h-[50px] max-h-[150px] outline-none resize-none placeholder-muted-foreground transition-all font-sans"
                            rows={2}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !isComposing) {
                                    if (e.shiftKey || e.metaKey || e.ctrlKey) {
                                        e.preventDefault();
                                        handleSubmit(e);
                                    }
                                }
                            }}
                        />
                    </div>

                    {/* Submit Row */}
                    <div className="flex justify-end pt-1">
                        <Button
                            type="submit"
                            disabled={loading || !newComment.trim()}
                            className="h-8 text-xs font-bold gap-2 shadow-sm"
                        >
                            <span>送信</span>
                            <Send size={12} />
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CommentSection;
