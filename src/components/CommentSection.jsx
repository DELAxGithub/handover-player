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
        <div className="flex flex-col h-full min-h-0 overflow-hidden" style={{ backgroundColor: 'var(--background)' }}>
            {/* Sidebar Header — mockup: Comments / N comments */}
            {!compact && (
              <div className="flex justify-between items-center flex-shrink-0" style={{ padding: '16px 22px', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--foreground)', letterSpacing: '-0.2px' }}>Comments</span>
                  <span style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>{comments.length} {comments.length === 1 ? 'comment' : 'comments'}</span>
              </div>
            )}
            {/* Scrollable List */}
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
                                    "group relative flex items-start transition-all duration-200 cursor-default",
                                    isActive ? "" : ""
                                )}
                                style={{ gap: '14px', padding: '18px 22px', borderBottom: '1px solid var(--border)', position: 'relative', background: isActive ? 'rgba(99,102,241,0.06)' : undefined }}
                            >
                                {/* Active Indicator Bar — static, no pulse */}
                                {isActive && (
                                    <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ backgroundColor: 'var(--primary)' }} />
                                )}

                                {/* Avatar — 40px */}
                                <div className={cn(
                                    "shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold mt-0.5",
                                    getAvatarColor(comment.user_name)
                                )} style={{ fontSize: '13px' }}>
                                    {getInitials(comment.user_name)}
                                </div>

                                {/* Content Body */}
                                <div className="flex-1 min-w-0 flex flex-col">

                                    {/* Header */}
                                    <div className="flex w-full min-w-0" style={{ alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)', letterSpacing: '-0.1px' }} className="truncate">
                                            {comment.user_name || 'Anonymous'}
                                        </span>

                                        {/* Timecode pill badge */}
                                        <button
                                            onClick={() => onSeek(comment.ptime)}
                                            style={{
                                                fontFamily: "'JetBrains Mono', monospace",
                                                fontSize: '11px',
                                                fontWeight: 600,
                                                color: 'var(--primary)',
                                                backgroundColor: 'rgba(99,102,241,0.1)',
                                                padding: '3px 8px',
                                                borderRadius: '5px',
                                                border: 'none',
                                                cursor: 'pointer',
                                                flexShrink: 0,
                                                lineHeight: 1.3,
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(99,102,241,0.18)'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(99,102,241,0.1)'}
                                            title="Jump to this timecode"
                                        >
                                            {formatTime(comment.ptime)}
                                        </button>

                                        <span style={{ fontSize: '11px', color: 'var(--muted-foreground-subtle)', marginLeft: 'auto', flexShrink: 0 }}>
                                            {getRelativeTime(comment.created_at)}
                                        </span>

                                        {onDeleteComment && (userName || 'Anonymous') === (comment.user_name || 'Anonymous') && (
                                            <button
                                                onClick={() => {
                                                    if (window.confirm('Delete this comment?')) {
                                                        onDeleteComment(comment.id);
                                                    }
                                                }}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive p-0.5 rounded shrink-0"
                                                style={{ color: 'var(--muted-foreground-subtle)' }}
                                                title="Delete"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        )}
                                    </div>

                                    {/* Comment Text */}
                                    <p className="whitespace-pre-wrap break-words" style={{ fontSize: '14px', color: '#444', lineHeight: 1.55, overflowWrap: 'anywhere' }}>
                                        {renderLinkedText(comment.text)}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* 3. Composer (Fixed Bottom) */}
            <div className="flex-shrink-0 z-10" style={{ padding: compact ? '8px' : '18px 22px 22px', borderTop: '1px solid var(--border)', backgroundColor: 'var(--background)' }}>
                <form onSubmit={handleSubmit} className="flex flex-col gap-2">
                    <div className="flex items-end" style={{ gap: '10px' }}>
                        <div className="relative flex-1">
                            <textarea
                                ref={commentInputRef}
                                placeholder={`Add a comment at ${formatTime(currentTime)}...`}
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                onCompositionStart={() => setIsComposing(true)}
                                onCompositionEnd={() => setIsComposing(false)}
                                className="w-full rounded-lg outline-none resize-none font-sans transition-all focus:border-[color:var(--primary)] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)]"
                                style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)', border: '1.5px solid var(--border)', fontSize: '14px', padding: '12px 14px', minHeight: '56px', maxHeight: '120px' }}
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
                        <button
                            type="submit"
                            disabled={loading || !newComment.trim()}
                            style={{ width: '44px', height: '44px', backgroundColor: 'var(--foreground)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: loading || !newComment.trim() ? 0.4 : 1 }}
                        >
                            <Send size={16} />
                        </button>
                    </div>
                    <div className="flex items-center" style={{ gap: '6px', marginTop: '10px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>Posting as</span>
                        <input
                            type="text"
                            placeholder="Your name"
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                            className="focus:outline-none"
                            style={{ fontSize: '12px', fontWeight: 500, color: 'var(--foreground)', backgroundColor: 'var(--card)', padding: '4px 10px', borderRadius: '5px', border: '1px solid var(--border)', width: '110px' }}
                        />
                        <span style={{ fontSize: '10px', color: 'var(--muted-foreground-subtle)', marginLeft: 'auto', opacity: 0.8 }}>
                            <kbd style={{ fontFamily: 'inherit', backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '3px', padding: '1px 4px', fontSize: '10px' }}>Shift</kbd>
                            +
                            <kbd style={{ fontFamily: 'inherit', backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '3px', padding: '1px 4px', fontSize: '10px' }}>Enter</kbd>
                        </span>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CommentSection;
