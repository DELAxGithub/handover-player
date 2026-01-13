import React, { useRef, useState, useEffect } from 'react';
import VideoPlayer from './components/VideoPlayer';
import CommentSection from './components/CommentSection';
import Timeline from './components/Timeline';
import { supabase } from './supabase';

function App() {
  const [url, setUrl] = useState('');
  const [projectId, setProjectId] = useState('');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [comments, setComments] = useState([]);
  const videoRef = useRef(null);

  // Parse URL params on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const p = params.get('p');
    const paramUrl = params.get('url');

    // FIX: Set URL independently before checking project ID
    if (paramUrl) {
      setUrl(paramUrl);
    }

    if (p) {
      setProjectId(p);
      // Only fetch comments if we have a project ID
      const fetchComments = async () => {
        const { data } = await supabase
          .from('comments')
          .select('*')
          .eq('project_uuid', p)
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
          filter: `project_uuid=eq.${p}`
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
  }, []);

  const handleSeek = (time) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      videoRef.current.play();
    }
  };

  const handleDurationChange = (d) => {
    setDuration(d);
  };

  return (
    <div className="flex h-screen w-screen bg-black text-white overflow-hidden">
      {/* Left: Video Area */}
      <div className="flex-1 flex flex-col relative">
        <div className="flex-1 flex flex-col items-center justify-center bg-[#0a0a0a] relative">
          <div className="w-full h-full flex flex-col">
            <div className="flex-1 flex items-center justify-center p-6 bg-[#0a0a0a] overflow-hidden">
              <VideoPlayer
                ref={videoRef}
                url={url}
                onTimeUpdate={setCurrentTime}
                onDurationChange={handleDurationChange}
              />
            </div>
            {/* Timeline Bar below video */}
            <Timeline duration={duration} comments={comments} onSeek={handleSeek} />
          </div>
        </div>

        {/* Simple Input if no URL set */}
        {!url && (
          <div className="absolute top-0 left-0 w-full p-4 bg-gradient-to-b from-black/80 to-transparent z-10">
            <input
              type="text"
              placeholder="Dropboxのリンクをここに貼り付け..."
              className="w-full max-w-2xl mx-auto block bg-[#222] border border-[#444] rounded px-4 py-2 text-white"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setUrl(e.target.value);
                }
              }}
            />
            <p className="text-xs text-center text-gray-500 mt-2">UUID: {projectId || 'なし'}</p>
          </div>
        )}
      </div>

      {/* Right: Comment Sidebar */}
      <div className="w-[350px] flex-shrink-0 border-l border-[#333] bg-[#1a1a1a]">
        {projectId ? (
          <CommentSection
            projectId={projectId}
            currentTime={currentTime}
            onSeek={handleSeek}
            externalComments={comments}
            onCommentAdded={(newC) => setComments(prev => [...prev, newC].sort((a, b) => a.ptime - b.ptime))}
          />
        ) : (
          <div className="p-8 text-center text-gray-500">
            <p className="mb-4">コメント機能を使うにはプロジェクトIDが必要です。</p>
            <p className="text-xs mb-4">URLに ?p=YOUR_UUID を追加するとコメントが有効になります。</p>
            <button
              onClick={() => {
                const newUuid = crypto.randomUUID();
                const params = new URLSearchParams();
                params.set('p', newUuid);
                if (url) {
                  params.set('url', url);
                }
                window.location.search = params.toString();
              }}
              className="mt-4 px-4 py-2 bg-blue-600 rounded text-white text-sm hover:bg-blue-500 font-bold"
            >
              新しいプロジェクトを作成
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
