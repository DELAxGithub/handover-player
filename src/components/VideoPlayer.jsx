import React, { forwardRef, useEffect, useState } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

const VideoPlayer = forwardRef(({ url, children, playbackRate: externalPlaybackRate, onPlaybackRateChange, onTimeUpdate, onDurationChange }, ref) => {
    const [src, setSrc] = useState('');
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    // Use external playback rate if provided, otherwise manage locally
    const playbackRate = externalPlaybackRate ?? 1.0;
    const setPlaybackRate = onPlaybackRateChange ?? (() => { });

    useEffect(() => {
        if (!url) return;
        try {
            const urlObj = new URL(url);
            if (urlObj.hostname.includes('dropbox.com')) {
                urlObj.hostname = 'dl.dropboxusercontent.com';
                urlObj.searchParams.delete('dl');
                urlObj.searchParams.delete('preview');
            }
            setSrc(urlObj.toString());
        } catch (e) {
            console.error("Invalid URL provided:", url);
            setSrc(url);
        }
    }, [url]);

    useEffect(() => {
        if (ref && ref.current) {
            ref.current.playbackRate = playbackRate;
        }
    }, [playbackRate, ref]);

    const handleRateChange = (rate) => setPlaybackRate(rate);

    const togglePlay = () => {
        if (ref && ref.current) {
            if (ref.current.paused) {
                ref.current.play();
            } else {
                ref.current.pause();
            }
        }
    };

    const handleJumpBack = () => {
        if (ref && ref.current) {
            ref.current.currentTime = Math.max(0, ref.current.currentTime - 5);
        }
    };

    const formatTime = (seconds) => {
        if (!seconds && seconds !== 0) return "00:00";
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        // REVERTED TO GRID LAYOUT (The "Good" Version)
        // grid-rows-[minmax(0,1fr)_140px]
        <div className="w-full h-full grid grid-rows-[minmax(0,1fr)_140px] bg-black select-none overflow-hidden group font-sans relative">



            {/* 1. Video Area */}
            <div
                className="w-full h-full relative bg-black cursor-pointer flex items-center justify-center overflow-hidden min-h-0"
                onClick={togglePlay}
            >
                {src ? (
                    <>
                        <video
                            ref={ref}
                            src={src}
                            className="w-full h-full object-contain max-h-full"
                            controls={false}
                            playsInline
                            onTimeUpdate={(e) => {
                                setCurrentTime(e.target.currentTime);
                                onTimeUpdate(e.target.currentTime);
                                if (onDurationChange && e.target.duration) onDurationChange(e.target.duration);
                            }}
                            onLoadedMetadata={(e) => {
                                setDuration(e.target.duration);
                                if (onDurationChange && e.target.duration) onDurationChange(e.target.duration);
                            }}
                            onPlay={() => {
                                setIsPlaying(true);
                                if (ref.current) ref.current.playbackRate = playbackRate;
                            }}
                            onPause={() => setIsPlaying(false)}
                            onRateChange={(e) => { if (e.target.playbackRate !== playbackRate) setPlaybackRate(e.target.playbackRate); }}
                        />
                        {/* Play/Pause Overlay Animation */}
                        {!isPlaying && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none transition-opacity z-10">
                                <div className="p-8 rounded-full bg-black/60 backdrop-blur-sm text-white border border-white/20 shadow-2xl">
                                    <Play size={80} fill="currentColor" className="ml-2" />
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-gray-500 font-medium">
                        Dropboxのリンクを入力してください
                    </div>
                )}
            </div>

            {/* 2. Control Area */}
            <div
                className="w-full h-full bg-[#222] border-t border-[#444] z-20 shadow-[0_-4px_30px_rgba(0,0,0,0.6)] overflow-hidden"
            >
                <div className="w-full h-full max-w-[1920px] mx-auto px-6 py-4 flex flex-col justify-between">

                    {/* Timeline Area (Top part) */}
                    <div className="w-full px-2">
                        {children}
                    </div>

                    {/* Controls Row (Bottom part) */}
                    <div className="flex items-center justify-between whitespace-nowrap min-w-0 px-2 pb-2">

                        {/* Left Group: Playback & Time */}
                        <div className="flex items-center gap-8 shrink-0">
                            <div className="flex items-center gap-5">
                                <button
                                    onClick={handleJumpBack}
                                    className="p-2.5 text-gray-400 hover:text-white transition-colors hover:bg-[#333] rounded-full"
                                    title="Rewind 5s"
                                >
                                    <RotateCcw size={24} />
                                </button>
                                <button
                                    onClick={togglePlay}
                                    className="p-4 bg-[#333] hover:bg-[#444] text-white rounded-full transition-all focus:outline-none shadow-lg border border-[#555] active:scale-95"
                                    title={isPlaying ? "Pause" : "Play"}
                                >
                                    {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
                                </button>
                            </div>

                            <div className="flex items-center gap-2 text-lg font-mono font-medium tracking-wide">
                                <span className="text-white">{formatTime(currentTime)}</span>
                                <span className="text-gray-500 text-base">/</span>
                                <span className="text-gray-400 text-lg">{formatTime(duration)}</span>
                            </div>
                        </div>

                        {/* Right Group: Speed & Tools */}
                        <div className="flex items-center gap-8 shrink-0">
                            <div className="flex items-center gap-4 bg-[#1a1a1a] px-5 py-2 rounded-xl border border-[#333]">
                                <span className="text-sm text-gray-400 font-bold uppercase tracking-wider">Speed</span>
                                <div className="flex gap-2">
                                    {[1.0, 1.5, 2.0].map((rate) => (
                                        <button
                                            key={rate}
                                            onClick={() => handleRateChange(rate)}
                                            className={`px-3 py-1 text-sm font-bold rounded-lg transition-all ${Math.abs(playbackRate - rate) < 0.1
                                                ? 'bg-blue-600 text-white shadow-md'
                                                : 'text-gray-400 hover:text-white hover:bg-[#333]'
                                                }`}
                                        >
                                            {rate}x
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="text-sm text-gray-400 flex items-center gap-2 cursor-help hover:text-white transition-colors bg-[#333] px-4 py-2 rounded-xl border border-[#444]">
                                <span className="w-5 h-5 flex items-center justify-center bg-[#555] rounded-md text-white font-bold text-[10px] border border-[#666]">?</span>
                                <span>Shortcuts</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

export default VideoPlayer;
