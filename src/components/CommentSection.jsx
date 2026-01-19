import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase';
import { Play, Send, User, Radio, MessageSquare, Download, CheckCircle, MessageCircle, Clock, Reply, X } from 'lucide-react';
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
    const [localComments, setLocalComments] = useState([]);
    const comments = externalComments || localComments;
    const [newComment, setNewComment] = useState('');
    const [userName, setUserName] = useState(() => localStorage.getItem('handover_username') || 'Guest');
    const [replyingTo, setReplyingTo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [fetchError, setFetchError] = useState(null);
    const [filter, setFilter] = useState('unresolved'); // 'unresolved', 'resolved', 'all'

    // Persist username
    useEffect(() => {
        localStorage.setItem('handover_username', userName);
    }, [userName]);

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
                setLocalComments(current => {
                    if (current.some(c => c.id === payload.new.id)) return current;
                    return [...current, payload.new].sort((a, b) => a.ptime - b.ptime);
                });
            })
            .on('postgres_changes', {
                event: 'UPDATE', // Listen for updates (resolves)
                schema: 'public',
                table: 'comments',
                filter: `project_uuid=eq.${projectId}`
            }, (payload) => {
                setLocalComments(current => current.map(c => c.id === payload.new.id ? payload.new : c));
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [projectId, externalComments]);


    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        const comment = {
            id: crypto.randomUUID(),
            project_uuid: projectId,
            text: newComment,
            user_name: userName,
            ptime: currentTime,
            created_at: new Date().toISOString(),
            parent_id: replyingTo,
            resolved: false
        };

        setNewComment('');
        setReplyingTo(null);

        // Optimistic update
        if (onCommentAdded) {
            onCommentAdded(comment);
        } else {
            setLocalComments(current => [...current, comment].sort((a, b) => a.ptime - b.ptime));
        }

        const { error } = await supabase.from('comments').insert([comment]);
        if (error) {
            toast.error('投稿に失敗しました: ' + error.message);
        } else {
            toast.success('コメントを追加しました');
        }
    };

    const toggleResolve = async (e, comment) => {
        e.stopPropagation();
        const newStatus = !comment.resolved;

        // Optimistic update (Local only, relies on subscription for external)
        if (!externalComments) {
            setLocalComments(current =>
                current.map(c => c.id === comment.id ? { ...c, resolved: newStatus } : c)
            );
        }

        const { error } = await supabase
            .from('comments')
            .update({ resolved: newStatus })
            .eq('id', comment.id);

        if (error) {
            toast.error('ステータス更新に失敗しました');
        }
    };

    const exportCommentsToCSV = () => {
        if (!comments.length) return;
        const headers = ["Time", "User", "Comment", "Status"];
        const rows = comments.map(c => [
            formatTime(c.ptime),
            `"${c.user_name.replace(/"/g, '""')}"`,
            `"${c.text.replace(/"/g, '""')}"`,
            c.resolved ? "Resolved" : "Open"
        ]);
        const csvContent = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `comments_${projectId}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Calculate counts
    const unresolvedCount = comments.filter(c => !c.resolved).length;
    const resolvedCount = comments.filter(c => c.resolved).length;
    const allCount = comments.length;

    // Filter comments based on selection
    const filteredComments = comments.filter(c => {
        // Simple filtering: show threads if parent matches? 
        // For Replay style flat look with threads, usually we filter by thread status or show all if part of thread matches.
        // Simplifying to item status for now to match tab exactly.

        // However, if we filter out a parent but show child, tree breaks. 
        // We will filter at the render level (in the map) or just filter flat list if we were purely flat.
        // Since we are maintaining thread structure (replyMap), let's keep all checks inside the render loop?
        // No, let's filter the 'threads' (parents) that are relevant.

        // Actually, Replay tabs usually toggle visibility.
        return true;
    });

    return (
        <div className="flex flex-col h-full w-full min-h-[500px] bg-[#0e0e0e] text-gray-200 font-sans">
            {/* Header / Tabs */}
            <div className="flex-none bg-[#0e0e0e] border-b border-white/5 z-10">
                <div className="flex items-center justify-between p-4 pb-2">
                    <h2 className="font-bold text-base text-gray-100 flex items-center gap-2">
                        コメント <span className="text-gray-500 text-xs font-normal">History</span>
                    </h2>
                    <div className="flex gap-2">
                        <button onClick={exportCommentsToCSV} className="text-gray-500 hover:text-white p-1.5 rounded-md hover:bg-white/10 transition-colors" title="CSV Export"><Download size={14} /></button>
                    </div>
                </div>
                <div className="flex px-4 gap-6 text-xs font-medium text-gray-500">
                    <button
                        onClick={() => setFilter('unresolved')}
                        className={cn("pb-3 border-b-[2px] transition-all flex items-center gap-1.5", filter === 'unresolved' ? "text-gray-100 border-indigo-500" : "border-transparent hover:text-gray-300")}
                    >
                        未解決 <span className="bg-white/10 px-1.5 py-0.5 rounded-full text-[10px]">{unresolvedCount}</span>
                    </button>
                    <button
                        onClick={() => setFilter('resolved')}
                        className={cn("pb-3 border-b-[2px] transition-all flex items-center gap-1.5", filter === 'resolved' ? "text-gray-100 border-indigo-500" : "border-transparent hover:text-gray-300")}
                    >
                        解決済み <span className="bg-white/10 px-1.5 py-0.5 rounded-full text-[10px]">{resolvedCount}</span>
                    </button>
                    <button
                        onClick={() => setFilter('all')}
                        className={cn("pb-3 border-b-[2px] transition-all flex items-center gap-1.5", filter === 'all' ? "text-gray-100 border-indigo-500" : "border-transparent hover:text-gray-300")}
                    >
                        すべて <span className="bg-white/10 px-1.5 py-0.5 rounded-full text-[10px]">{allCount}</span>
                    </button>
                </div>
            </div>

            {/* Scrollable List */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
                {isLoading ? (
                    <CommentListSkeleton count={4} />
                ) : filteredComments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500/50 pb-20">
                        <MessageSquare size={48} className="mb-4 opacity-20" />
                        <p className="text-sm font-medium">コメントはありません</p>
                    </div>
                ) : (
                    (() => {
                        const threads = [];
                        const replyMap = {};
                        comments.forEach(c => {
                            if (c.parent_id) {
                                if (!replyMap[c.parent_id]) replyMap[c.parent_id] = [];
                                replyMap[c.parent_id].push(c);
                            } else {
                                threads.push(c);
                            }
                        });

                        const visibleThreads = threads.filter(t => {
                            if (filter === 'all') return true;
                            const statusMatch = filter === 'resolved' ? t.resolved : !t.resolved;
                            return statusMatch;
                        });

                        return visibleThreads.map((comment) => {
                            const replies = replyMap[comment.id] || [];

                            const CommentRow = ({ item, isReply = false }) => {
                                const isActive = Math.abs(currentTime - item.ptime) < 2;

                                return (
                                    <div
                                        className={cn("flex gap-3 group relative transition-colors p-2 -mx-2 rounded-lg hover:bg-white/[0.02]", isActive ? "bg-indigo-500/10" : "")}
                                        onClick={(e) => { e.stopPropagation(); onSeek(item.ptime); }}
                                    >
                                        {/* Avatar */}
                                        <div className="flex-none pt-0.5">
                                            <div className={cn(
                                                "w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm ring-1 ring-white/10",
                                                item.user_name === 'Test User' ? "bg-teal-600" : "bg-indigo-600"
                                            )}>
                                                {item.user_name.charAt(0)}
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="flex items-center gap-2">
                                                    <span className={cn("font-bold text-xs text-gray-200", item.resolved && "text-gray-500")}>{item.user_name}</span>
                                                    <span className="text-[10px] text-gray-500">{new Date(item.created_at).toLocaleString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            </div>

                                            <div className={cn("text-sm text-gray-300 leading-relaxed whitespace-pre-wrap break-words", item.resolved && "text-gray-500 line-through")}>
                                                <button
                                                    className="text-blue-400 hover:text-blue-300 hover:underline mr-1.5 font-mono text-xs bg-blue-500/10 px-1 rounded inline-block"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onSeek(item.ptime);
                                                    }}
                                                >
                                                    {formatTime(item.ptime)}
                                                </button>
                                                {item.text}
                                            </div>

                                            <div className="flex items-center gap-3 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {!isReply && !item.resolved && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setReplyingTo(item.id); commentInputRef.current?.focus(); }}
                                                        className="text-[11px] text-gray-500 hover:text-gray-200 hover:underline flex items-center gap-1"
                                                    >
                                                        <Reply size={10} /> 返信
                                                    </button>
                                                )}
                                                <button
                                                    onClick={(e) => toggleResolve(e, item)}
                                                    className={cn(
                                                        "text-[11px] hover:underline flex items-center gap-1 transition-colors",
                                                        item.resolved ? "text-green-500" : "text-gray-500 hover:text-green-400"
                                                    )}
                                                >
                                                    <CheckCircle size={10} className={item.resolved ? "fill-current" : ""} />
                                                    {item.resolved ? "解決済み" : "解決する"}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            };

                            return (
                                <div key={comment.id} className="relative pb-4 mb-4 border-b border-white/5 last:border-0 last:mb-0 last:pb-0">
                                    <CommentRow item={comment} />
                                    {replies.length > 0 && (
                                        <div className="pl-6 ml-3.5 border-l border-white/10 mt-2 space-y-3">
                                            {replies.map(reply => (
                                                <CommentRow key={reply.id} item={reply} isReply={true} />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        });
                    })()
                )}
            </div>

            {/* Input Area */}
            <div className="flex-none bg-[#0e0e0e] border-t border-white/5 p-4 z-20">
                {/* Replying Status */}
                {replyingTo && (
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-2 px-1 animate-in slide-in-from-bottom-2">
                        <span className="flex items-center gap-1.5">
                            <Reply size={12} className="text-blue-500" />
                            <span className="text-gray-300 font-bold">{comments.find(c => c.id === replyingTo)?.user_name}</span>
                            <span>への返信</span>
                        </span>
                        <button onClick={() => setReplyingTo(null)} className="hover:text-white p-1 rounded-full hover:bg-white/10"><X size={12} /></button>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 px-1">
                        <div className="w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center flex-none ring-1 ring-white/10">
                            <User size={10} className="text-gray-500" />
                        </div>
                        <input
                            type="text"
                            value={userName}
                            onChange={e => setUserName(e.target.value)}
                            className="bg-transparent border-none text-[11px] text-gray-500 p-0 focus:ring-0 focus:text-gray-300 w-full placeholder-gray-700"
                            placeholder="名前を入力..."
                        />
                    </div>

                    <div className="relative group bg-[#161616] rounded-xl border border-white/10 focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/20 transition-all shadow-lg overflow-hidden">
                        <textarea
                            ref={commentInputRef}
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                                    e.preventDefault();
                                    handleSubmit(e);
                                }
                            }}
                            placeholder="ここにコメントを入力..."
                            className="w-full bg-transparent border-none text-sm text-gray-200 p-3 pb-10 min-h-[50px] resize-none focus:outline-none placeholder-gray-600 block"
                            rows={1}
                            style={{ minHeight: '80px' }}
                        />

                        {/* Status Bar inside Input */}
                        <div className="absolute bottom-0 left-0 right-0 p-2 flex justify-between items-center bg-gradient-to-t from-[#161616] via-[#161616] to-transparent">
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1.5 text-[10px] text-blue-400 bg-blue-500/5 px-2 py-1 rounded border border-blue-500/10 cursor-pointer hover:bg-blue-500/10 transition-colors">
                                    <Clock size={10} />
                                    {formatTime(currentTime)}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] text-gray-600 font-mono hidden group-focus-within:inline-block transition-opacity">Ctrl + Enter</span>
                                <button
                                    type="submit"
                                    disabled={!newComment.trim()}
                                    className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all disabled:opacity-0 disabled:translate-y-2 shadow-lg shadow-indigo-900/20"
                                >
                                    <Send size={14} className={cn("transition-transform", newComment.trim() ? "translate-x-0.5 -translate-y-0.5" : "")} />
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CommentSection;
