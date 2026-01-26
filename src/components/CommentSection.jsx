import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Play, Send, User, Radio, MessageSquare } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useToast } from './Toast';
import { CommentListSkeleton } from './Skeleton';
import Button from './ui/Button';
import Badge from './ui/Badge';

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
};

const CommentSection = ({ projectId, currentTime, onSeek, externalComments, isLoading, onCommentAdded, commentInputRef }) => {
    const toast = useToast();

    // If externalComments is provided, use it. Otherwise default to empty list (fallback)
    const [localComments, setLocalComments] = useState([]);
    const comments = externalComments || localComments;

    const [newComment, setNewComment] = useState('');
    const [userName, setUserName] = useState(() => localStorage.getItem('handover_username') || '');
    const [loading, setLoading] = useState(false);
    const [fetchError, setFetchError] = useState(null);

    // Only run internal fetch if no external comments provided (Legacy support)
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

        const subscription = supabase
            .channel('comments')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'comments',
                filter: `project_uuid=eq.${projectId}`
            }, (payload) => {
                setLocalComments(current => [...current, payload.new].sort((a, b) => a.ptime - b.ptime));
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [projectId, externalComments]);

    useEffect(() => {
        if (userName) localStorage.setItem('handover_username', userName);
    }, [userName]);

    const [isComposing, setIsComposing] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const commentText = newComment.trim();
        if (!commentText || !projectId) return;

        // Clear input immediately
        setNewComment('');
        setLoading(true);

        // 1. Optimistic Update
        const tempId = Date.now();
        const optimisticComment = {
            id: tempId,
            project_uuid: projectId,
            ptime: currentTime,
            user_name: userName || 'Anonymous',
            text: commentText,
            created_at: new Date().toISOString()
        };

        if (onCommentAdded) {
            onCommentAdded(optimisticComment);
        } else {
            setLocalComments(current => [...current, optimisticComment].sort((a, b) => a.ptime - b.ptime));
        }

        // 2. Background Sync
        const { error } = await supabase.from('comments').insert([{
            project_uuid: projectId,
            ptime: currentTime,
            user_name: userName || 'Anonymous',
            text: commentText
        }]);

        if (error) {
            toast.error('投稿に失敗しました: ' + error.message);
        } else {
            toast.success('コメントを追加しました');
        }
        setLoading(false);
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
        <div className="flex flex-col h-full bg-card border-l border-border min-h-0">
            {/* 1. Header (Fixed) */}
            <div className="p-3 border-b border-border flex justify-between items-center bg-card px-4 flex-shrink-0">
                <h2 className="text-foreground font-semibold text-sm">コメント ({comments.length})</h2>
                <Badge variant="success" className="gap-1.5 text-[10px] px-2 py-0.5 animate-pulse bg-success/10 text-success border-success/20">
                    <Radio size={8} />
                    <span>Live</span>
                </Badge>
            </div>

            {/* 2. Scrollable List */}
            <div className="flex-1 overflow-y-auto p-0 space-y-0 min-h-0" ref={listRef}>
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
                                    "group flex items-start gap-3 p-3 border-b border-border transition-colors hover:bg-muted/50",
                                    isActive ? "bg-primary/5 border-primary/20" : ""
                                )}
                            >
                                <button
                                    onClick={() => onSeek(comment.ptime)}
                                    type="button"
                                    className={cn(
                                        "flex-shrink-0 font-mono text-xs mt-0.5 hover:underline decoration-primary/50 underline-offset-2 transition-all",
                                        isActive ? "text-primary font-bold" : "text-muted-foreground group-hover:text-primary"
                                    )}
                                >
                                    {formatTime(comment.ptime)}
                                </button>

                                <div className="flex-1 min-w-0 text-sm leading-relaxed break-words">
                                    <span className={cn(
                                        "font-bold mr-1.5 text-xs select-none",
                                        isActive ? "text-primary" : "text-muted-foreground"
                                    )}>
                                        {comment.user_name}
                                    </span>
                                    <span className="text-muted-foreground mr-1.5 min-w-[3px] inline-block text-[10px] font-bold align-middle">:</span>
                                    <span className="text-foreground group-hover:text-foreground transition-colors">
                                        {comment.text}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* 3. Composer (Fixed Bottom) */}
            <div className="p-4 bg-muted/10 border-t border-border flex-shrink-0 z-10 backdrop-blur-sm">
                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 px-1">
                        <User size={14} className="text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="名前を入力"
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                            className="bg-transparent border-none text-xs text-foreground focus:text-primary focus:ring-0 p-0 placeholder-muted-foreground w-full focus:outline-none"
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
                            className="w-full bg-transparent text-foreground rounded-xl p-3 text-sm min-h-[50px] max-h-[150px] outline-none resize-none placeholder-muted-foreground transition-all font-sans"
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
