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
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarOpen(false); // Default close on mobile
      } else if (window.innerWidth > 1024) {
        setIsSidebarOpen(true); // Default open on large screens
      }
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
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[10px] font-bold text-center py-1 tracking-wider uppercase z-50 shadow-md">
          🎨 Design System v2 Active (Debug Mode) 🎨
        </div>
      )}

      {/* 1. Top Bar: Persistent Input */}
      <div className="w-full h-16 bg-background border-b border-border px-4 flex items-center justify-between z-20 shadow-sm flex-shrink-0 gap-4">
        <div className="flex-1 flex items-center gap-4 min-w-0">
          {/* Dashboard / Home Button */}
          <a href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group" title="Dashboard">
            <div className="p-2 rounded-md group-hover:bg-muted transition-colors">
              <LayoutDashboard size={20} />
            </div>
            {!url && <span className="font-bold text-lg text-foreground tracking-tight">Handover Player</span>}
          </a>

          {/* Current Project Title */}
          {url && (
            <>
              <div className="h-6 w-px bg-border mx-1"></div>
              <div className="flex flex-col items-start min-w-0">
                <h1 className="text-base font-bold text-foreground truncate max-w-[200px] sm:max-w-2xl leading-tight tracking-tight" title={getFilename(url)}>
                  {getFilename(url)}
                </h1>
              </div>

              {/* New Project Shortcut */}
              <a href="/" className="ml-2 flex items-center gap-2 px-3 py-1.5 bg-muted border border-border hover:border-primary/50 text-muted-foreground hover:text-primary rounded-md text-xs font-medium transition-all hover:shadow-sm" title="New Project">
                <Plus size={14} />
                <span className="hidden sm:inline">New</span>
              </a>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">

          {/* Sidebar Toggle (Visible on all sizes, but more critical on small) */}
          {url && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`h-10 w-10 rounded-full hover:bg-muted ${!isSidebarOpen && 'text-muted-foreground'}`}
              title={isSidebarOpen ? "Hide Comments" : "Show Comments"}
            >
              <LayoutDashboard size={20} />
            </Button>
          )}

          {/* Expiration Badge */}
          {projectMeta && projectMeta.expires_at && (() => {
            const status = getExpirationStatus(projectMeta.expires_at);
            if (!status) return null;
            return (
              <Badge variant="outline" className={`hidden md:flex gap-2 px-3 py-1.5 text-xs font-mono font-medium ${status.color} border-current`}>
                <span>{status.icon}</span>
                <span>{status.text}</span>
              </Badge>
            );
          })()}

          {/* Active Users (Presence) */}
          {url && projectId && (
            <PresenceAvatars projectId={projectId} />
          )}

          {/* Changelog Button */}
          <button
            onClick={() => setShowChangelog(true)}
            className="text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-muted rounded-full"
            title="What's New"
          >
            <Sparkles size={18} />
          </button>

          {/* Search Input */}
          <div className="w-80 hidden sm:flex"> {/* Hide input on mobile to save space, rely on Dashboard */}
            <input
              type="text"
              placeholder="Dropbox link..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full bg-muted/30 border border-input rounded-md px-4 py-2 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-muted-foreground/70"
            />
          </div>
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

        {/* Right: Comment Sidebar - Collapsible & Overlay on Mobile */}
        {projectId && (
          <div
            className={`
                    fixed inset-y-0 right-0 z-30 w-full sm:w-[400px] bg-card border-l border-border shadow-2xl transition-transform duration-300 transform 
                    ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}
                    ${!isMobile ? 'relative translate-x-0' : ''} 
                    ${!isSidebarOpen && !isMobile ? '!hidden' : ''}
                `}
            style={{ position: isMobile ? 'absolute' : 'relative', width: isSidebarOpen ? (isMobile ? '100%' : '400px') : '0px' }}
          >
            {/* Sidebar Header with Actions */}
            <div className="p-4 bg-card border-b border-border flex-shrink-0 flex gap-3">
              <Button
                onClick={() => setShowShareModal(true)}
                className="flex-1 gap-2 font-bold shadow-sm"
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
            <div className="flex-1 overflow-hidden relative h-[calc(100%-70px)]">
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

        {/* Empty State Sidebar Placeholder if no Project ID */}
        {!projectId && url && isSidebarOpen && (
          <div className="w-[400px] flex-shrink-0 border-l border-border bg-card flex flex-col h-full z-10 transition-all">
            <div className="p-8 text-center text-muted-foreground mt-10">
              <p className="mb-4">コメント機能を使うにはプロジェクトIDが必要です。</p>
              <Button
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
                className="font-bold shadow-lg"
              >
                新しいプロジェクトを作成（保存）
              </Button>
            </div>
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
