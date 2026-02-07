import React, { useRef, useState, useEffect, useCallback } from 'react';

// Deduplicate + sort comments to prevent double-display bugs
const normalizeComments = (rows = []) => {
  const map = new Map();
  for (const row of rows) {
    if (!row || row.id == null) continue;
    const id = String(row.id);
    if (!map.has(id)) {
      map.set(id, { ...row, id });
    }
  }
  return [...map.values()].sort((a, b) => {
    const pa = Number(a.ptime) || 0;
    const pb = Number(b.ptime) || 0;
    if (pa !== pb) return pa - pb;
    const ca = new Date(a.created_at || 0).getTime();
    const cb = new Date(b.created_at || 0).getTime();
    if (ca !== cb) return ca - cb;
    return a.id.localeCompare(b.id);
  });
};
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarOpen(false);
      } else if (window.innerWidth > 1024) {
        setIsSidebarOpen(true);
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

  // Fetch comments function (with stale-response guard)
  const fetchSeqRef = useRef(0);
  const fetchComments = useCallback(async (showLoading = false) => {
    if (!projectId) return;
    const seq = ++fetchSeqRef.current;
    if (showLoading) setIsLoadingComments(true);

    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('project_uuid', projectId)
      .order('ptime', { ascending: true });

    if (seq !== fetchSeqRef.current) return; // stale response — discard
    if (error) {
      console.error('[fetchComments] error', error);
    } else {
      const normalized = normalizeComments(data || []);
      console.log('[fetchComments]', { raw: (data || []).length, normalized: normalized.length, ids: normalized.map(c => c.id) });
      setComments(normalized);
    }
    setIsLoadingComments(false);
  }, [projectId]);

  // Fetch comments on mount
  useEffect(() => {
    if (!projectId) return;
    fetchComments(true);
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

          {/* Sidebar Toggle (desktop only — mobile always shows comments) */}
          {url && !isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`gap-2 font-semibold ${isSidebarOpen ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:bg-muted'}`}
              title={isSidebarOpen ? "コメントを隠す" : "コメントを表示"}
            >
              <LayoutDashboard size={18} />
              <span>コメント</span>
            </Button>
          )}
        </div>
      </div>

      {/* ===== MOBILE: Vertical stack (Dropbox Replay style) ===== */}
      {isMobile ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Video: compact fixed height */}
          <div className="flex-shrink-0 h-[30vh] min-h-[200px] bg-black relative">
            {sharedUrl && sharedUrl !== url && (
              <div className="absolute top-0 inset-x-0 bg-blue-900/80 p-2 flex items-center justify-center gap-3 z-10">
                <span className="text-xs text-blue-200">共有リンクあり</span>
                <button onClick={() => setUrl(sharedUrl)} className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded font-bold">読み込む</button>
              </div>
            )}
            {url ? (
              <VideoPlayer
                ref={videoRef}
                url={url}
                compact
                playbackRate={playbackRate}
                onPlaybackRateChange={handleSetPlaybackRate}
                onTimeUpdate={setCurrentTime}
                onDurationChange={handleDurationChange}
              >
                <Timeline duration={duration} currentTime={currentTime} comments={comments} onSeek={handleSeek} />
              </VideoPlayer>
            ) : (
              <div className="w-full h-full overflow-auto bg-background">
                <ProjectList />
              </div>
            )}
          </div>

          {/* Comments: fill remaining space */}
          {projectId && (
            <div className="flex-1 min-h-0 flex flex-col">
              <div className="px-3 py-2 bg-card border-b border-border flex gap-2 items-center flex-shrink-0">
                <Button onClick={() => setShowShareModal(true)} size="sm" className="flex-1 gap-2 font-bold shadow-sm">
                  <Share2 size={14} /> 共有・設定
                </Button>
                <ExportMenu comments={comments} filename={getFilename(url) || "Project"} />
              </div>
              <div className="flex-1 overflow-hidden min-h-0">
                <CommentSection
                  projectId={projectId}
                  currentTime={currentTime}
                  onSeek={handleSeek}
                  externalComments={comments}
                  isLoading={isLoadingComments}
                  commentInputRef={commentInputRef}
                  onRefreshComments={fetchComments}
                  compact
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ===== DESKTOP: Side-by-side ===== */
        <div className="flex-1 flex overflow-hidden relative">
          {/* Video Area */}
          <div className="flex-1 flex flex-col relative bg-black min-w-0 transition-all duration-300">
            {sharedUrl && sharedUrl !== url && (
              <div className="w-full bg-blue-900/20 border-b border-blue-900/50 p-3 flex items-center justify-center gap-4 flex-shrink-0 z-10">
                <span className="text-sm text-blue-200">共有リンクあり:</span>
                <button onClick={() => setUrl(sharedUrl)} className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded font-bold transition-colors">
                  読み込む
                </button>
              </div>
            )}
            <div className="flex-1 flex flex-col items-center justify-center overflow-hidden relative w-full h-full bg-black">
              <div className="w-full h-full flex flex-col">
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

          {/* Desktop Sidebar */}
          {projectId && (
            <div
              className={`z-30 bg-card border-l border-border shadow-2xl transition-transform duration-300 flex flex-col relative
                ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full hidden'}`}
              style={{ width: isSidebarOpen ? '400px' : '0px' }}
            >
              <div className="p-4 bg-card border-b border-border flex-shrink-0 flex gap-3">
                <Button onClick={() => setShowShareModal(true)} className="flex-1 gap-2 font-bold shadow-sm">
                  <Share2 size={14} /> 共有・設定
                </Button>
                <ExportMenu comments={comments} filename={getFilename(url) || "Project"} />
              </div>
              <div className="flex-1 overflow-hidden relative min-h-0">
                <CommentSection
                  projectId={projectId}
                  currentTime={currentTime}
                  onSeek={handleSeek}
                  externalComments={comments}
                  isLoading={isLoadingComments}
                  commentInputRef={commentInputRef}
                  onRefreshComments={fetchComments}
                />
              </div>
            </div>
          )}

          {/* Empty State Sidebar */}
          {!projectId && url && isSidebarOpen && (
            <div className="w-[400px] flex-shrink-0 border-l border-border bg-card flex flex-col h-full z-10 transition-all">
              <div className="p-8 text-center text-muted-foreground mt-10">
                {isCreatingProject ? (
                  <>
                    <Loader2 size={24} className="animate-spin text-primary mb-3 mx-auto" />
                    <p>プロジェクトを作成中...</p>
                  </>
                ) : (
                  <>
                    <p className="mb-4">自動作成に失敗しました。手動で作成してください。</p>
                    <Button
                      onClick={async () => {
                        try {
                          toast.success('プロジェクトを作成中...');
                          const { id, error } = await createProject(url);
                          if (error) throw error;
                          const params = new URLSearchParams(window.location.search);
                          params.set('p', id);
                          params.set('url', url);
                          window.location.search = params.toString();
                        } catch (e) {
                          toast.error('作成に失敗しました');
                          console.error(e);
                        }
                      }}
                      className="font-bold shadow-lg"
                    >
                      新しいプロジェクトを作成
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}

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
