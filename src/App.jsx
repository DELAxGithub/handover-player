import React, { useRef, useState, useEffect, useCallback } from 'react';
import { LayoutDashboard, Plus, MonitorPlay } from 'lucide-react';
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
import Button from './components/ui/Button';
import Badge from './components/ui/Badge';

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

  // Responsive Sidebar Logic
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

    if (diff < 0) return { text: "期限切れ", color: "text-destructive bg-destructive/10 border-destructive/20", icon: "⛔" };
    if (hours < 24) return { text: `あと${hours}時間`, color: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20", icon: "⚠️" }; // Urgent
    return { text: `あと${days}日`, color: "text-muted-foreground bg-muted border-border", icon: "⏳" };
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

  // Auto-create project when URL exists but no project ID
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const createAttemptedRef = useRef(false);
  useEffect(() => {
    if (!url || projectId || createAttemptedRef.current) return;
    createAttemptedRef.current = true;
    setIsCreatingProject(true);

    const autoCreate = async () => {
      try {
        const { id, error } = await createProject(url);
        if (error) {
          toast.error('プロジェクト作成に失敗しました');
          console.error(error);
          setIsCreatingProject(false);
          return;
        }
        const params = new URLSearchParams(window.location.search);
        params.set('p', id);
        params.set('url', url);
        window.history.replaceState({}, '', `?${params.toString()}`);
        setProjectId(id);
        toast.success('プロジェクトを作成しました');
      } catch (e) {
        toast.error('プロジェクト作成に失敗しました');
        console.error(e);
      }
      setIsCreatingProject(false);
    };
    autoCreate();
  }, [url, projectId, toast]);

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
    <div className="flex h-[100dvh] w-full bg-background text-foreground overflow-hidden flex-col">
      {/* DEBUG BANNER */}
      {import.meta.env.DEV && (
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[10px] font-bold text-center py-1 tracking-wider uppercase z-50 shadow-md flex-shrink-0">
          🎨 Design System v8.1 - User Color Timeline 🎨
        </div>
      )}

      {/* 1. Top Bar: Header from Design */}
      <div className="w-full min-h-16 bg-background border-b border-border px-4 grid grid-cols-[auto_1fr_auto] items-center z-20 shadow-sm flex-shrink-0 gap-2 sm:gap-4 py-2">

        {/* Left: Branding */}
        <div className="flex items-center gap-4">
          <a href="/" className="flex items-center gap-3 text-foreground hover:opacity-80 transition-opacity" title="トップページ">
            {/* Icon Logo */}
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white shadow-lg ring-1 ring-white/10">
              <MonitorPlay size={20} className="ml-0.5" />
            </div>
            {/* Text Logo */}
            <span className="font-bold text-base sm:text-xl tracking-tight hidden sm:inline">ハンドオーバー</span>
          </a>
        </div>

        {/* Center: Filename */}
        <div className="flex justify-center min-w-0 px-1 sm:px-4">
          {url && (
            <h1 className="text-xs sm:text-sm font-semibold text-foreground/90 text-center bg-muted/20 px-3 sm:px-4 py-1 sm:py-1.5 rounded-lg border border-border/50 break-all leading-snug">
              {getFilename(url)}
            </h1>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 sm:gap-3">

          {/* Active Users (Presence) */}
          {url && projectId && (
            <PresenceAvatars projectId={projectId} />
          )}

          {/* Share Button (Prominent) */}
          {url && (
            <Button
              onClick={() => setShowShareModal(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-md gap-2 px-3 sm:px-4 flex"
              size="sm"
            >
              <Share2 size={14} />
              <span>共有</span>
            </Button>
          )}

          {/* Sidebar Toggle */}
          {url && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`gap-1 sm:gap-2 font-semibold ${isSidebarOpen ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:bg-muted'}`}
              title={isSidebarOpen ? "コメントを隠す" : "コメントを表示"}
            >
              <LayoutDashboard size={18} />
              <span className="hidden sm:inline">コメント</span>
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">

        {/* Left (or Top): Video Area */}
        <div className="flex-1 flex flex-col relative bg-black min-w-0 transition-all duration-300">

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

          <div className="flex-1 flex flex-col items-center justify-center overflow-hidden relative w-full h-full bg-black">
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
                  <div className="flex-1 w-full h-full overflow-auto bg-background">
                    <ProjectList />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Comment Sidebar - Bottom Sheet on Mobile, Side Panel on Desktop */}
        {projectId && (
          <div
            className={`
                    bg-card border-border shadow-2xl transition-all duration-300 flex flex-col
                    ${isMobile
                ? `fixed left-0 right-0 bottom-0 z-30 border-t rounded-t-2xl ${isSidebarOpen ? 'translate-y-0' : 'translate-y-full'}`
                : `relative border-l flex-shrink-0 h-full ${isSidebarOpen ? '' : '!hidden'}`
              }
                `}
            style={{
              ...(isMobile
                ? { height: '55dvh', width: '100%' }
                : { width: isSidebarOpen ? '400px' : '0px' }
              )
            }}
          >
            {/* Mobile drag handle */}
            {isMobile && (
              <div
                className="flex justify-center pt-2 pb-1 cursor-pointer"
                onClick={() => setIsSidebarOpen(false)}
              >
                <div className="w-10 h-1 bg-muted-foreground/40 rounded-full" />
              </div>
            )}
            {/* Sidebar Header with Actions */}
            <div className="p-3 sm:p-4 bg-card border-b border-border flex-shrink-0 flex gap-2 sm:gap-3">
              <Button
                onClick={() => setShowShareModal(true)}
                className="flex-1 gap-2 font-bold shadow-sm"
                size="sm"
              >
                <Share2 size={14} /> 共有・設定
              </Button>
              <ExportMenu comments={comments} filename={getFilename(url) || "Project"} />
              {isMobile && (
                <button onClick={() => setIsSidebarOpen(false)} className="p-2 bg-muted rounded text-muted-foreground">
                  <LayoutDashboard size={18} />
                </button>
              )}
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
          </div>
        )}

        {/* Loading State while auto-creating project */}
        {!projectId && url && isCreatingProject && isSidebarOpen && (
          <div className="w-full sm:w-[400px] flex-shrink-0 border-l border-border bg-card flex flex-col items-center justify-center h-full z-10">
            <Loader2 size={24} className="animate-spin text-primary mb-3" />
            <p className="text-sm text-muted-foreground">プロジェクトを作成中...</p>
          </div>
        )}
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
