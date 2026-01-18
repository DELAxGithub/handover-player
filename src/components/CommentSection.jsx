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

    return (
        <div className="flex flex-col h-full bg-[#1a1a1a] border-l border-[#333]">
            <div className="p-4 border-b border-[#333] flex justify-between items-center bg-[#222] px-6">
                <h2 className="text-gray-200 font-semibold text-sm">コメント ({comments.length})</h2>
                <div className="flex items-center gap-1.5 text-[10px] text-green-400">
                    <Radio size={10} className="animate-pulse" />
                    <span>リアルタイム</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 px-6 space-y-3">
                {fetchError && (
                    <div className="text-red-400 text-xs p-2 bg-red-900/20 rounded border border-red-900">
                        エラー: {fetchError}. <br />テーブル作成SQLを実行しましたか？
                    </div>
                )}

                {isLoading ? (
                    <CommentListSkeleton count={4} />
                ) : comments.length === 0 && !fetchError ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                        <MessageSquare size={40} className="mb-3 opacity-30" />
                        <p className="text-sm">まだコメントはありません</p>
                        <p className="text-xs mt-1 opacity-60">動画を再生しながらコメントを追加しましょう</p>
                    </div>
                ) : (
                    comments.map((comment) => {
                        const isActive = Math.abs(currentTime - comment.ptime) < 2;
                        return (
                        <div
                            key={comment.id}
                            className={cn(
                                "group bg-[#2a2a2a] p-3 rounded-lg hover:bg-[#333] transition-all cursor-pointer border shadow-sm",
                                isActive
                                    ? "border-blue-500 bg-blue-900/20"
                                    : "border-[#333] hover:border-blue-500/30"
                            )}
                            onClick={() => onSeek(comment.ptime)}
                        >
                            <div className="flex justify-between items-center mb-1.5 opacity-80 group-hover:opacity-100">
                                <span className="font-bold text-blue-400 text-xs truncate max-w-[150px]">{comment.user_name}</span>
                                <div className="flex items-center text-[10px] text-yellow-500 font-mono bg-yellow-900/30 px-1.5 py-0.5 rounded border border-yellow-900/50">
                                    <Play size={8} className="mr-1 fill-current" />
                                    {formatTime(comment.ptime)}
                                </div>
                            </div>
                            <p className="text-gray-200 text-sm leading-relaxed break-words">{comment.text}</p>
                        </div>
                        );
                    })
                )}
            </div>

            <div className="p-4 px-6 bg-[#222] border-t border-[#333]">
                <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="flex items-center space-x-2">
                        <User size={16} className="text-gray-500" />
                        <input
                            type="text"
                            placeholder="名前を入力"
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                            className="bg-transparent border-b border-[#444] focus:border-blue-500 text-sm text-white w-full py-1 outline-none transition-colors placeholder-gray-600"
                        />
                    </div>
                    <div className="relative">
                        <textarea
                            ref={commentInputRef}
                            placeholder="コメントを入力..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            className="w-full bg-[#111] text-white rounded-lg p-3 pr-10 text-sm min-h-[80px] border border-[#333] focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none placeholder-gray-600"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit(e);
                                }
                            }}
                        />
                        <button
                            type="submit"
                            disabled={loading || !newComment.trim()}
                            className="absolute bottom-3 right-3 p-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
                        >
                            <Send size={14} />
                        </button>
                    </div>
                    <div className="text-[10px] text-gray-500 text-right font-mono">
                        @ {formatTime(currentTime)}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CommentSection;
