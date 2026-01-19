import React, { useRef, useState, useEffect, useCallback } from 'react';
import { LayoutDashboard, Plus } from 'lucide-react';
import VideoPlayer from './components/VideoPlayer';
import CommentSection from './components/CommentSection';
import Timeline from './components/Timeline';
import KeyboardShortcutsModal from './components/KeyboardShortcutsModal';
import { supabase } from './supabase';
import { ToastProvider, ToastContainer, useToast } from './components/Toast';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts.jsx';
import ExportMenu from './components/ExportMenu';
import ProjectList from './components/ProjectList';
import PresenceAvatars from './components/PresenceAvatars';
import ChangelogModal from './components/ChangelogModal';
import { addToHistory } from './utils/history';
import { createProject, getProject } from './utils/project';
import { Sparkles, Loader2, Clock, Share2 } from 'lucide-react';
import ShareModal from './components/ShareModal';

function AppContent() {
  const toast = useToast();

  // Initialize state directly from URL params to avoid useEffect race conditions
  const searchParams = new URLSearchParams(window.location.search);
  const [url, setUrl] = useState(searchParams.get('url') || '');
  const [projectId, setProjectId] = useState(searchParams.get('p') || '');
  const [projectMeta, setProjectMeta] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [comments, setComments] = useState([]);
  const [isLoadingComments, setIsLoadingComments] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);
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

  // Fetch Project Metadata (Expiration, etc.)
  useEffect(() => {
    if (!projectId) {
      setProjectMeta(null);
      return;
    }
    const loadProject = async () => {
      const { data, error } = await getProject(projectId);
      if (data) {
        setProjectMeta(data);
        // If URL is missing in params but exists in DB, we could set it here.
        // But for now we rely on URL params for playback to keep it fast.
      }
    };
    loadProject();
  }, [projectId]);

  // Expiration Helper
  const getExpirationStatus = (expiresAt) => {
    if (!expiresAt) return null;
    const diff = new Date(expiresAt) - new Date();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (diff < 0) return { text: "期限切れ", color: "text-red-500 bg-red-950/30 border-red-900/50", icon: "⛔" };
    if (hours < 24) return { text: `あと${hours}時間`, color: "text-yellow-500 bg-yellow-950/30 border-yellow-900/50", icon: "⚠️" }; // Urgent
    return { text: `あと${days}日`, color: "text-zinc-500 bg-zinc-900 border-zinc-800", icon: "⏳" };
  };

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

  // Save to history when project is active
  useEffect(() => {
    if (projectId && url) {
      addToHistory({
        id: projectId,
        url: url,
        title: getFilename(url)
      });
    }
  }, [projectId, url]);

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
      <div className="w-full bg-zinc-950 border-b border-zinc-800 p-2 flex items-center justify-between z-20 shadow-md flex-shrink-0 gap-4">
        <div className="flex-1 flex items-center gap-3 min-w-0 pl-2">
          {/* Dashboard / Home Button */}
          <a href="/" className="flex items-center gap-2 text-zinc-500 hover:text-zinc-100 transition-colors group" title="Dashboard">
            <div className="p-1.5 rounded-md group-hover:bg-zinc-800 transition-colors">
              <LayoutDashboard size={18} />
            </div>
            {!url && <span className="font-bold text-sm text-zinc-300">Handover Player</span>}
          </a>

          {/* Current Project Title */}
          {url && (
            <>
              <div className="h-4 w-px bg-zinc-800 mx-1"></div>
              <div className="flex flex-col items-start min-w-0">
                <h1 className="text-sm font-bold text-zinc-200 truncate max-w-[200px] sm:max-w-md leading-tight" title={getFilename(url)}>
                  {getFilename(url)}
                </h1>
              </div>

              {/* New Project Shortcut */}
              <a href="/" className="ml-2 flex items-center gap-1.5 px-2 py-1 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 text-zinc-400 hover:text-white rounded text-xs transition-colors" title="New Project">
                <Plus size={12} />
                <span className="hidden sm:inline font-medium">New</span>
              </a>
            </>
          )}
        </div>

        <div className="flex items-center gap-4">

          {/* Expiration Badge */}
          {projectMeta && projectMeta.expires_at && (() => {
            const status = getExpirationStatus(projectMeta.expires_at);
            if (!status) return null;
            return (
              <div className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-mono font-medium ${status.color}`}>
                <span>{status.icon}</span>
                <span>{status.text}</span>
              </div>
            );
          })()}

          {/* Active Users (Presence) */}
          {url && projectId && (
            <PresenceAvatars projectId={projectId} />
          )}

          {/* Changelog Button */}
          <button
            onClick={() => setShowChangelog(true)}
            className="text-zinc-500 hover:text-zinc-300 transition-colors p-1.5 hover:bg-zinc-800 rounded-md"
            title="What's New"
          >
            <Sparkles size={16} />
          </button>

          {/* Search Input */}
          <div className="w-64 flex gap-2">
            <input
              type="text"
              placeholder="Dropbox link..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-xs text-zinc-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-zinc-600"
            />
          </div>
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
                {url ? (
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
                ) : (
                  <div className="flex-1 w-full h-full overflow-auto bg-zinc-950">
                    <ProjectList />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Comment Sidebar (FIXED WIDTH) - Slightly lighter bg for depth */}
        <div className="w-[400px] flex-shrink-0 border-l border-zinc-800 bg-zinc-900 flex flex-col h-full z-10 transition-all">
          {projectId ? (
            <>
              {/* Sidebar Header with Actions */}
              <div className="p-4 bg-zinc-900 border-b border-zinc-800 flex-shrink-0 flex gap-3">
                <button
                  onClick={() => setShowShareModal(true)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-md transition-colors shadow-sm ring-1 ring-inset ring-indigo-500"
                >
                  <Share2 size={14} /> 共有・設定
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
                onClick={async () => {
                  try {
                    toast.success('プロジェクトを作成中...');
                    const { id, error } = await createProject(url);
                    if (error) throw error;

                    const params = new URLSearchParams(window.location.search);
                    params.set('p', id);
                    if (url) {
                      params.set('url', url);
                    }
                    window.location.search = params.toString();
                  } catch (e) {
                    toast.error('作成に失敗しました');
                    console.error(e);
                  }
                }}
                className="px-4 py-2 bg-blue-600 rounded text-white text-sm hover:bg-blue-500 font-bold shadow-lg transition-transform active:scale-95"
              >
                新しいプロジェクトを作成（保存）
              </button>
            </div>
          )}
        </div>
      </div>

      <KeyboardShortcutsModal
        isOpen={showShortcutsHelp}
        onClose={() => setShowShortcutsHelp(false)}
      />
      <ChangelogModal
        isOpen={showChangelog}
        onClose={() => setShowChangelog(false)}
      />
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        url={url}
        projectId={projectId}
        projectMeta={projectMeta}
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
