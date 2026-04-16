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
            toast.error('Failed to post: ' + error.message);
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
        <div className="flex flex-col h-full bg-[#0c0c0e] min-h-0 overflow-hidden">
            {/* Scrollable List — no header (count shown in top bar toggle badge) */}
            <div className="overflow-y-auto p-0 space-y-0 scroll-smooth scrollbar-thin" style={{ flexGrow: 1, height: 0, minHeight: 0 }} ref={listRef}>
                {fetchError && (
                    <div className="text-destructive-foreground text-xs p-3 m-2 bg-destructive/10 rounded border border-destructive/20 mb-2">
                        Error: {fetchError}
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
                                    "group relative flex items-start gap-2.5 px-4 py-3 border-b border-border-subtle transition-all duration-200 hover:bg-white/[0.03]",
                                    isActive ? "bg-gradient-to-r from-primary/[0.08] to-transparent" : ""
                                )}
                            >
                                {/* Active Indicator Bar — static, no pulse */}
                                {isActive && (
                                    <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-primary" />
                                )}

                                {/* Avatar — compact */}
                                <div className={cn(
                                    "shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold",
                                    getAvatarColor(comment.user_name)
                                )}>
                                    {getInitials(comment.user_name)}
                                </div>

                                {/* Content Body */}
                                <div className="flex-1 min-w-0 flex flex-col gap-1">

                                    {/* Header: Name + Timecode inline + relative time */}
                                    <div className="flex items-center gap-2 w-full min-w-0">
                                        <span className={cn(
                                            "font-semibold text-[13px] truncate",
                                            isActive ? "text-primary" : "text-foreground"
                                        )}>
                                            {comment.user_name || 'Anonymous'}
                                        </span>

                                        <button
                                            onClick={() => onSeek(comment.ptime)}
                                            className="shrink-0"
                                        >
                                            <span className="bg-primary/10 hover:bg-primary/20 text-primary font-mono text-[10px] px-1.5 py-0.5 rounded transition-colors">
                                                {formatTime(comment.ptime)}
                                            </span>
                                        </button>

                                        <span className="text-[11px] text-muted-foreground ml-auto shrink-0">
                                            {getRelativeTime(comment.created_at)}
                                        </span>

                                        {onDeleteComment && (userName || 'Anonymous') === (comment.user_name || 'Anonymous') && (
                                            <button
                                                onClick={() => {
                                                    if (window.confirm('Delete this comment?')) {
                                                        onDeleteComment(comment.id);
                                                    }
                                                }}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive p-0.5 rounded shrink-0"
                                                title="Delete"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        )}
                                    </div>

                                    {/* Comment Text */}
                                    <p className="text-[13px] text-foreground/80 leading-relaxed whitespace-pre-wrap break-words" style={{ overflowWrap: 'anywhere' }}>
                                        {renderLinkedText(comment.text)}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* 3. Composer (Fixed Bottom) */}
            <div className={`${compact ? 'p-2' : 'px-4 py-3'} bg-[#0c0c0e] border-t border-border-subtle flex-shrink-0 z-10`}>
                <form onSubmit={handleSubmit} className="flex flex-col gap-2">
                    <div className="flex gap-2 items-end">
                        <div className="relative flex-1 bg-card border border-border rounded-lg focus-within:border-primary/40 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
                            <textarea
                                ref={commentInputRef}
                                placeholder={`Add a comment at ${formatTime(currentTime)}...`}
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                onCompositionStart={() => setIsComposing(true)}
                                onCompositionEnd={() => setIsComposing(false)}
                                className="w-full bg-transparent text-foreground text-[13px] rounded-lg px-3 py-2.5 min-h-[36px] max-h-[80px] outline-none resize-none placeholder-muted-foreground font-sans"
                                rows={1}
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
                        <Button
                            type="submit"
                            disabled={loading || !newComment.trim()}
                            className="h-9 w-9 p-0 rounded-lg shrink-0 flex items-center justify-center"
                        >
                            <Send size={14} />
                        </Button>
                    </div>
                    <div className="flex items-center gap-1.5 px-0.5">
                        <span className="text-[11px] text-muted-foreground">Posting as</span>
                        <input
                            type="text"
                            placeholder="Your name"
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                            className="bg-white/[0.04] border-none text-[11px] text-foreground/80 focus:text-foreground rounded px-1.5 py-0.5 placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 w-24"
                        />
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CommentSection;
