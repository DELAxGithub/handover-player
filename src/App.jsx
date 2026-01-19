import React, { useRef, useState, useEffect, useCallback } from 'react';
import VideoPlayer from './components/VideoPlayer';
import CommentSection from './components/CommentSection';
import Timeline from './components/Timeline';
import KeyboardShortcutsModal from './components/KeyboardShortcutsModal';
import { supabase } from './supabase';
import { ToastProvider, ToastContainer, useToast } from './components/Toast';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts.jsx';
import ExportMenu from './components/ExportMenu';

function AppContent() {
  const toast = useToast();

  // Initialize state directly from URL params to avoid useEffect race conditions
  const searchParams = new URLSearchParams(window.location.search);
  const [url, setUrl] = useState(searchParams.get('url') || '');
  const [projectId, setProjectId] = useState(searchParams.get('p') || '');

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [comments, setComments] = useState([]);
  const [isLoadingComments, setIsLoadingComments] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const videoRef = useRef(null);
  const commentInputRef = useRef(null);

  // Keyboard shortcut callbacks
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  }, []);

  const seekRelative = useCallback((seconds) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(video.duration || 0, video.currentTime + seconds));
  }, []);

  const handleSetPlaybackRate = useCallback((rate) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  }, []);

  const focusCommentInput = useCallback(() => {
    commentInputRef.current?.focus();
  }, []);

  // Initialize keyboard shortcuts
  useKeyboardShortcuts(videoRef, {
    onTogglePlay: togglePlay,
    onSeekRelative: seekRelative,
    onSetPlaybackRate: handleSetPlaybackRate,
    onFocusComment: focusCommentInput,
    onShowHelp: () => setShowShortcutsHelp(true),
  });

  // Fetch comments function
  const fetchComments = useCallback(async (showLoading = false) => {
    if (!projectId) return;
    if (showLoading) setIsLoadingComments(true);
    const { data } = await supabase
      .from('comments')
      .select('*')
      .eq('project_uuid', projectId)
      .order('ptime', { ascending: true });
    if (data) setComments(data);
    setIsLoadingComments(false);
  }, [projectId]);

  // Fetch comments and subscribe if projectId exists
  useEffect(() => {
    if (projectId) {
      fetchComments(true); // Show loading on initial fetch

      // Subscribe to changes
      const subscription = supabase
        .channel('comments')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `project_uuid=eq.${projectId}`
        }, (payload) => {
          setComments(current => {
            // Avoid duplicates if optimistic UI already added it
            if (current.some(c => c.id === payload.new.id)) return current;
            return [...current, payload.new].sort((a, b) => a.ptime - b.ptime);
          });
        })
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [projectId, fetchComments]);

  // Auto-refresh comments when window regains focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && projectId) {
        fetchComments();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [projectId, fetchComments]);

  const handleSeek = (time) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      videoRef.current.play();
    }
  };

  const handleDurationChange = (d) => {
    setDuration(d);
  };

  // Extract filename from URL
  const getFilename = (link) => {
    try {
      if (!link) return '';
      const urlObj = new URL(link);
      const pathname = urlObj.pathname;
      return decodeURIComponent(pathname.substring(pathname.lastIndexOf('/') + 1));
    } catch (e) {
      return '';
    }
  };

  const sharedUrl = new URLSearchParams(window.location.search).get('url');

  const copyShareLink = () => {
    const baseUrl = window.location.origin + window.location.pathname;
    const params = new URLSearchParams();
    params.set('p', projectId);
    if (url) {
      params.set('url', url);
    }
    const shareLink = `${baseUrl}?${params.toString()}`;
    navigator.clipboard.writeText(shareLink).then(() => {
      toast.success('共有リンクをコピーしました');
    });
  };

  return (
    <div className="flex h-[100dvh] w-full bg-black text-white overflow-hidden flex-col">
      {/* 1. Top Bar: Persistent Input */}
      <div className="w-full bg-[#111] border-b border-[#333] p-2 flex items-center justify-between z-20 shadow-md flex-shrink-0 gap-4">
        {url ? (
          <div className="flex-1 flex flex-col items-start min-w-0 pl-2">
            <h1 className="text-sm font-bold text-gray-200 truncate max-w-full leading-tight" title={getFilename(url)}>{getFilename(url)}</h1>
            <span className="text-[10px] text-gray-500 truncate max-w-full">{url}</span>
          </div>
        ) : (
          <div className="font-bold text-gray-500 text-sm pl-2">Handover Player</div>
        )}

        <div className="w-1/3 min-w-[300px] flex gap-2">
          <input
            type="text"
            placeholder="Dropbox link..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 bg-[#222] border border-[#444] rounded px-3 py-1.5 text-xs text-white focus:border-blue-500 outline-none transition-colors"
          />
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">

        {/* Left (or Top): Video Area */}
        <div className="flex-1 flex flex-col relative bg-[#0a0a0a] min-w-0">

          {/* 2. Workaround: Shared Link Display */}
          {sharedUrl && sharedUrl !== url && (
            <div className="w-full bg-blue-900/20 border-b border-blue-900/50 p-3 flex items-center justify-center gap-4 flex-shrink-0 z-10">
              <span className="text-sm text-blue-200">共有リンクあり:</span>
              <button
                onClick={() => setUrl(sharedUrl)}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded font-bold transition-colors"
              >
                📋 読み込む
              </button>
            </div>
          )}

          <div className="flex-1 flex flex-col items-center justify-center overflow-hidden relative w-full h-full bg-[#0a0a0a]">
            {/* Inner Flex Container */}
            <div className="w-full h-full flex flex-col">

              {/* Video Player Area - Flex 1 to take available space */}
              <div className="flex-1 min-h-0 w-full relative flex flex-col justify-center">
                <VideoPlayer
                  ref={videoRef}
                  url={url}
                  playbackRate={playbackRate}
                  onPlaybackRateChange={handleSetPlaybackRate}
                  onTimeUpdate={setCurrentTime}
                  onDurationChange={handleDurationChange}
                >
                  <Timeline duration={duration} currentTime={currentTime} comments={comments} onSeek={handleSeek} />
                </VideoPlayer>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Comment Sidebar (FIXED WIDTH) - Slightly lighter bg for depth */}
        <div className="w-[400px] flex-shrink-0 border-l border-[#222] bg-[#161616] flex flex-col h-full z-10">
          {projectId ? (
            <>
              {/* Sidebar Header with Actions */}
              <div className="p-4 bg-[#1a1a1a] border-b border-[#2a2a2a] flex-shrink-0 flex gap-2">
                <button
                  onClick={copyShareLink}
                  className="flex-1 py-2 bg-green-600 hover:bg-green-500 text-white text-sm rounded font-bold transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <span>🔗</span> 共有リンク
                </button>
                <ExportMenu comments={comments} filename={getFilename(url) || "Project"} />
              </div>
              <div className="flex-1 overflow-hidden relative">
                <CommentSection
                  projectId={projectId}
                  currentTime={currentTime}
                  onSeek={handleSeek}
                  externalComments={comments}
                  isLoading={isLoadingComments}
                  onCommentAdded={(newC) => setComments(prev => [...prev, newC].sort((a, b) => a.ptime - b.ptime))}
                  commentInputRef={commentInputRef}
                />
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-gray-500 mt-10">
              <p className="mb-4">コメント機能を使うにはプロジェクトIDが必要です。</p>
              <button
                onClick={() => {
                  const newUuid = crypto.randomUUID();
                  const params = new URLSearchParams(window.location.search);
                  params.set('p', newUuid);
                  if (url) {
                    params.set('url', url);
                  }
                  window.location.search = params.toString();
                }}
                className="px-4 py-2 bg-blue-600 rounded text-white text-sm hover:bg-blue-500 font-bold"
              >
                新しいプロジェクトを作成
              </button>
            </div>
          )}
        </div>
      </div>

      <KeyboardShortcutsModal
        isOpen={showShortcutsHelp}
        onClose={() => setShowShortcutsHelp(false)}
      />
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <AppContent />
      <ToastContainer />
    </ToastProvider>
  );
}

export default App;
