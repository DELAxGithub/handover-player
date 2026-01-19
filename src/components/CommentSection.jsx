import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Play, Send, User, Radio, MessageSquare } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useToast } from './Toast';
import { CommentListSkeleton } from './Skeleton';

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
        <div className="flex flex-col h-full bg-[#161616] border-l border-[#222] min-h-0">
            {/* 1. Header (Fixed) */}
            <div className="p-3 border-b border-[#2a2a2a] flex justify-between items-center bg-[#1a1a1a] px-4 flex-shrink-0">
                <h2 className="text-gray-200 font-semibold text-sm">コメント ({comments.length})</h2>
                <div className="flex items-center gap-1.5 text-[10px] text-green-400 bg-green-900/10 px-2 py-0.5 rounded-full border border-green-900/20">
                    <Radio size={8} className="animate-pulse" />
                    <span>Live</span>
                </div>
            </div>

            {/* 2. Scrollable List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 min-h-0" ref={listRef}>
                {fetchError && (
                    <div className="text-red-400 text-xs p-3 bg-red-900/20 rounded border border-red-900 mb-2">
                        エラー: {fetchError}
                    </div>
                )}

                {isLoading ? (
                    <div className="p-4">
                        <CommentListSkeleton count={4} />
                    </div>
                ) : comments.length === 0 && !fetchError ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-600">
                        <MessageSquare size={32} className="mb-2 opacity-20" />
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
                                    "group flex items-start gap-3 p-3 border-b border-[#222] transition-colors hover:bg-[#1f1f1f]",
                                    isActive ? "bg-[#1f1f1f]" : ""
                                )}
                            >
                                <button
                                    onClick={() => onSeek(comment.ptime)}
                                    type="button"
                                    className={cn(
                                        "flex-shrink-0 font-mono text-xs mt-0.5 hover:underline decoration-blue-500/50 underline-offset-2 transition-all",
                                        isActive ? "text-blue-400 font-bold" : "text-gray-500 group-hover:text-blue-400"
                                    )}
                                >
                                    {formatTime(comment.ptime)}
                                </button>

                                <div className="flex-1 min-w-0 text-sm leading-relaxed break-words">
                                    <span className={cn(
                                        "font-bold mr-1.5 text-xs select-none",
                                        isActive ? "text-blue-200" : "text-gray-400"
                                    )}>
                                        {comment.user_name}
                                    </span>
                                    <span className="text-gray-500 mr-1.5 min-w-[3px] inline-block text-[10px] font-bold align-middle">:</span>
                                    <span className="text-gray-300 group-hover:text-gray-200 transition-colors">
                                        {comment.text}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* 3. Composer (Fixed Bottom, "Desk" style) with Floating look */}
            <div className="p-4 bg-[#161616] border-t border-[#2a2a2a] flex-shrink-0 z-10">
                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 px-1">
                        <User size={14} className="text-gray-500" />
                        <input
                            type="text"
                            placeholder="名前を入力"
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                            className="bg-transparent border-none text-xs text-gray-300 focus:text-white focus:ring-0 p-0 placeholder-gray-600 w-full"
                        />
                    </div>

                    <div className="relative group shadow-lg rounded-xl transition-shadow hover:shadow-xl bg-[#242424] border border-[#333] focus-within:border-blue-500/50 focus-within:bg-[#2a2a2a] focus-within:ring-1 focus-within:ring-blue-500/20">
                        <textarea
                            ref={commentInputRef}
                            placeholder="コメントを入力... (Shift+Enter で送信)"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onCompositionStart={() => setIsComposing(true)}
                            onCompositionEnd={() => setIsComposing(false)}
                            className="w-full bg-transparent text-gray-200 rounded-xl p-4 text-sm min-h-[50px] max-h-[150px] outline-none resize-none placeholder-gray-500 transition-all"
                            rows={3}
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

                    {/* Separate Submit Button Row */}
                    <div className="flex justify-end pt-2">
                        <button
                            type="submit"
                            disabled={loading || !newComment.trim()}
                            className="px-6 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg"
                        >
                            <span>送信</span>
                            <Send size={14} />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CommentSection;
