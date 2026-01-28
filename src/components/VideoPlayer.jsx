import React, { forwardRef, useEffect, useState } from 'react';
import { Play, Pause, RotateCcw, Keyboard } from 'lucide-react';
import Button from './ui/Button';
import Badge from './ui/Badge';

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

    const handleSeek = (e) => {
        if (!duration) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, x / rect.width));
        const newTime = percentage * duration;

        if (ref && ref.current) {
            ref.current.currentTime = newTime;
        }
        // Notify parent if needed, but Video's onTimeUpdate will handle the state sync
    };

    return (


        // GRID LAYOUT V7.0 (Stable & Fixed)
        <div className="flex-1 w-full h-full grid grid-rows-[minmax(0,1fr)_auto] bg-black select-none overflow-hidden group font-sans relative">

            {/* 1. Video Area (Responsive Grid Cell) */}
            <div
                className="relative w-full h-full min-h-0 overflow-hidden bg-black cursor-pointer"
                onClick={togglePlay}
            >
                {src ? (
                    <>
                        {/* Video is absolute to prevent stretching the grid cell */}
                        <video
                            ref={ref}
                            src={src}
                            className="absolute inset-0 w-full h-full object-contain"
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
                    <div className="text-muted-foreground font-medium flex items-center justify-center h-full">
                        Dropboxのリンクを入力してください
                    </div>
                )}
            </div>

            {/* 2. Control Area - Stable Bottom Block */}
            <div
                className="w-full bg-neutral-900/95 backdrop-blur border-t border-white/10 z-20 flex flex-col shadow-2xl relative flex-shrink-0 min-h-[180px]"
            >
                {/* A. Top Progress Bar */}
                <div className="w-full px-6 pt-4 pb-2">
                    <div
                        className="w-full h-2 relative cursor-pointer group/progress flex items-center bg-white/10 rounded-full hover:bg-white/20 transition-colors"
                        onClick={handleSeek}
                    >
                        {/* Progress Fill */}
                        <div
                            className="absolute h-full bg-indigo-500 rounded-full transition-all shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                            style={{ width: `${(currentTime / duration) * 100}%` }}
                        ></div>

                        {/* Handle (Thumb) */}
                        <div
                            className="absolute h-5 w-5 bg-white rounded-full shadow-lg border-2 border-indigo-600 top-1/2 -translate-y-1/2 scale-0 group-hover/progress:scale-100 transition-transform duration-100"
                            style={{ left: `${(currentTime / duration) * 100}%`, transform: 'translate(-50%, -50%)' }}
                        ></div>
                    </div>
                </div>

                <div className="w-full max-w-[1920px] mx-auto px-6 py-2 flex flex-col gap-2 flex-shrink-0">

                    {/* B. Controls Row */}
                    <div className="flex items-center justify-between min-w-0">

                        {/* Left Group: Playback & Time */}
                        <div className="flex items-center gap-12 shrink-0">
                            <div className="flex items-center gap-8">
                                <Button
                                    variant="ghost"
                                    onClick={handleJumpBack}
                                    className="rounded-full h-10 px-4 gap-2 text-zinc-400 hover:text-white hover:bg-white/10 transition-all active:scale-95 flex items-center"
                                    title="Rewind 5s"
                                >
                                    <RotateCcw size={20} strokeWidth={2} />
                                    <span className="text-xs font-bold">5秒戻る</span>
                                </Button>
                                <Button
                                    onClick={togglePlay}
                                    className="h-14 w-14 rounded-full p-0 shadow-[0_0_20px_rgba(255,255,255,0.15)] border-2 border-white/10 bg-white text-black hover:bg-gray-100 hover:scale-105 transition-all active:scale-95 flex items-center justify-center shrink-0"
                                    title={isPlaying ? "Pause" : "Play"}
                                >
                                    {isPlaying ? (
                                        <Pause size={28} fill="currentColor" strokeWidth={0} />
                                    ) : (
                                        <Play size={28} fill="currentColor" strokeWidth={0} className="ml-1" />
                                    )}
                                </Button>
                            </div>

                            <div className="flex items-center gap-3 text-2xl font-mono font-bold tracking-widest select-none tabular-nums">
                                <span className="text-white drop-shadow-md">{formatTime(currentTime)}</span>
                                <span className="text-zinc-700 mx-1 font-light">|</span>
                                <span className="text-zinc-500">{formatTime(duration)}</span>
                            </div>
                        </div>

                        {/* Right Group: Speed & Tools */}
                        <div className="flex items-center gap-10 shrink-0">
                            <div className="flex items-center gap-2 bg-zinc-900 p-2 rounded-2xl border border-zinc-800">
                                {[1.0, 1.5, 2.0].map((rate) => (
                                    <button
                                        key={rate}
                                        onClick={() => handleRateChange(rate)}
                                        className={`px-5 py-2 text-base font-bold rounded-xl transition-all ${Math.abs(playbackRate - rate) < 0.1
                                            ? 'bg-zinc-700 text-white shadow-md'
                                            : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
                                            }`}
                                    >
                                        {rate}x
                                    </button>
                                ))}
                            </div>

                            <button className="flex items-center gap-3 group px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-zinc-500 hover:text-white">
                                <Keyboard size={24} strokeWidth={2} />
                                <span className="text-sm font-bold tracking-wider hidden sm:inline">ショートカット</span>
                            </button>
                        </div>
                    </div>

                    {/* C. Bottom Timeline (Comments) */}
                    <div className="w-full relative mt-2 pt-2 group/timeline border-t border-zinc-800/50">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
});

export default VideoPlayer;
