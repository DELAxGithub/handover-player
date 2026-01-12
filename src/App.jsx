import React, { useRef, useState, useEffect } from 'react';
import VideoPlayer from './components/VideoPlayer';
import CommentSection from './components/CommentSection';

function App() {
  const [url, setUrl] = useState('');
  const [projectId, setProjectId] = useState('');
  const [currentTime, setCurrentTime] = useState(0);
  const videoRef = useRef(null);

  // Parse URL params on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const p = params.get('p'); // Project UUID
    const paramUrl = params.get('url'); // Optional direct video URL for testing without DB lookup

    if (p) setProjectId(p);

    // For now, in this simpler version, we might just paste the Dropbox link directly 
    // or fetch it from DB based on Project ID. The prompt implies "Input Dropbox link".
    // So let's provide a UI to input it if not provided.
    if (paramUrl) setUrl(paramUrl);
  }, []);

  const handleSeek = (time) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      videoRef.current.play();
    }
  };

  return (
    <div className="flex h-screen w-screen bg-black text-white overflow-hidden">
      {/* Left: Video Area */}
      <div className="flex-1 flex flex-col relative">
        <div className="flex-1 flex items-center justify-center p-6 bg-[#0a0a0a]">
          <VideoPlayer
            ref={videoRef}
            url={url}
            onTimeUpdate={setCurrentTime}
          />
        </div>

        {/* Simple Input if no URL set (Handover Mode) */}
        {!url && (
          <div className="absolute top-0 left-0 w-full p-4 bg-gradient-to-b from-black/80 to-transparent z-10">
            <input
              type="text"
              placeholder="Paste Dropbox Link here..."
              className="w-full max-w-2xl mx-auto block bg-[#222] border border-[#444] rounded px-4 py-2 text-white"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setUrl(e.target.value);
                }
              }}
            />
            <p className="text-xs text-center text-gray-500 mt-2">UUID: {projectId || 'None'}</p>
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
          />
        ) : (
          <div className="p-8 text-center text-gray-500">
            <p className="mb-4">Project ID used for comments.</p>
            <p className="text-xs">Add ?p=YOUR_UUID to the URL to enable comments.</p>
            <button
              onClick={() => {
                const newUuid = crypto.randomUUID();
                window.location.search = `?p=${newUuid}`;
              }}
              className="mt-4 px-4 py-2 bg-blue-600 rounded text-white text-sm hover:bg-blue-500"
            >
              Generate New Project
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
