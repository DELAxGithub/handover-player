import React, { useRef, useState, useEffect } from 'react';
import VideoPlayer from './components/VideoPlayer';
import CommentSection from './components/CommentSection';
import Timeline from './components/Timeline';
import { supabase } from './supabase';

function App() {
  // Initialize state directly from URL params to avoid useEffect race conditions
  const searchParams = new URLSearchParams(window.location.search);
  const [url, setUrl] = useState(searchParams.get('url') || '');
  const [projectId, setProjectId] = useState(searchParams.get('p') || '');

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [comments, setComments] = useState([]);
  const videoRef = useRef(null);

  // Fetch comments and subscribe if projectId exists
  useEffect(() => {
    if (projectId) {
      // Only fetch comments if we have a project ID
      const fetchComments = async () => {
        const { data } = await supabase
          .from('comments')
          .select('*')
          .eq('project_uuid', projectId)
          .order('ptime', { ascending: true });
        if (data) setComments(data);
      };
      fetchComments();

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
  }, [projectId]);

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
      alert('共有用リンクをクリップボードにコピーしました！\nチームメンバーにこのURLを送ってください。');
    });
  };

  return (
    <div className="flex h-screen w-screen bg-black text-white overflow-hidden flex-col">
      {/* 1. Top Bar: Persistent Input */}
      <div className="w-full bg-[#111] border-b border-[#333] p-4 flex items-center justify-center z-20 shadow-md">
        <div className="w-full max-w-4xl flex gap-2">
          <input
            type="text"
            placeholder="Dropboxのリンクをここに貼り付け..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 bg-[#222] border border-[#444] rounded px-4 py-2 text-white focus:border-blue-500 outline-none transition-colors"
          />
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Video Area */}
        <div className="flex-1 flex flex-col relative bg-[#0a0a0a]">

          {/* 2. Workaround: Shared Link Display */}
          {sharedUrl && sharedUrl !== url && (
            <div className="w-full bg-blue-900/20 border-b border-blue-900/50 p-3 flex items-center justify-center gap-4">
              <span className="text-sm text-blue-200">共有された動画リンクがあります:</span>
              <span className="text-xs text-gray-400 font-mono truncate max-w-xs">{sharedUrl}</span>
              <button
                onClick={() => setUrl(sharedUrl)}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded font-bold transition-colors"
              >
                📋 コピーして読み込む
              </button>
            </div>
          )}

          <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-hidden">

            {/* 3. Filename & URL Display */}
            {url && (
              <div className="w-full max-w-4xl mb-4 text-left bg-[#151515] p-3 rounded border border-[#333]">
                <h1 className="text-lg font-bold text-gray-200 truncate mb-1">{getFilename(url)}</h1>
                <p className="text-xs text-gray-500 font-mono break-all line-clamp-2">{url}</p>
              </div>
            )}

            <div className="w-full max-w-4xl h-full flex flex-col justify-center">
              <VideoPlayer
                ref={videoRef}
                url={url}
                onTimeUpdate={setCurrentTime}
                onDurationChange={handleDurationChange}
              />

              {/* Timeline Bar below video */}
              <div className="mt-4">
                <Timeline duration={duration} comments={comments} onSeek={handleSeek} />
                <p className="text-xs text-center text-gray-500 mt-2">UUID: {projectId || 'なし'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Comment Sidebar */}
        <div className="w-[350px] flex-shrink-0 border-l border-[#333] bg-[#1a1a1a] flex flex-col">
          {projectId ? (
            <>
              <div className="p-3 bg-[#222] border-b border-[#333]">
                <button
                  onClick={copyShareLink}
                  className="w-full py-2 bg-green-600 hover:bg-green-500 text-white text-sm rounded font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <span>🔗</span> 共有リンクをコピー
                </button>
              </div>
              <div className="flex-1 overflow-hidden relative">
                <CommentSection
                  projectId={projectId}
                  currentTime={currentTime}
                  onSeek={handleSeek}
                  externalComments={comments}
                  onCommentAdded={(newC) => setComments(prev => [...prev, newC].sort((a, b) => a.ptime - b.ptime))}
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
    </div>
  );
}

export default App;
