import React, { forwardRef, useEffect, useState, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX, Maximize, Minimize } from 'lucide-react';
import Button from './ui/Button';

const VideoPlayer = forwardRef(({ url, children, compact, playbackRate: externalPlaybackRate, onPlaybackRateChange, onTimeUpdate, onDurationChange }, ref) => {
    const [src, setSrc] = useState('');
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isSeeking, setIsSeeking] = useState(false);

    const containerRef = useRef(null);
    const progressBarRef = useRef(null);
    const lastTapRef = useRef({ time: 0, x: 0 });
    const doubleTapTimerRef = useRef(null);
    const [doubleTapSide, setDoubleTapSide] = useState(null); // 'left' | 'right' | null

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

    // Sync volume to video element
    useEffect(() => {
        if (ref && ref.current) {
            ref.current.volume = isMuted ? 0 : volume;
            ref.current.muted = isMuted;
        }
    }, [volume, isMuted, ref]);

    // Sync muted state from video element (e.g. toggled via keyboard shortcut on videoRef)
    useEffect(() => {
        const video = ref?.current;
        if (!video) return;
        const handleVolumeChange = () => {
            setIsMuted(video.muted);
        };
        video.addEventListener('volumechange', handleVolumeChange);
        return () => video.removeEventListener('volumechange', handleVolumeChange);
    }, [ref, src]); // re-attach when src changes (video element may remount)

    // Fullscreen change listener
    useEffect(() => {
        const handleFSChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFSChange);
        document.addEventListener('webkitfullscreenchange', handleFSChange);
        return () => {
            document.removeEventListener('fullscreenchange', handleFSChange);
            document.removeEventListener('webkitfullscreenchange', handleFSChange);
        };
    }, []);

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

    const handleJumpForward = () => {
        if (ref && ref.current) {
            ref.current.currentTime = Math.min(duration, ref.current.currentTime + 5);
        }
    };

    const toggleMute = () => setIsMuted(m => !m);

    const toggleFullscreen = async () => {
        const el = containerRef.current;
        if (!el) return;
        try {
            if (document.fullscreenElement) {
                await document.exitFullscreen();
            } else if (el.requestFullscreen) {
                await el.requestFullscreen();
            } else if (el.webkitRequestFullscreen) {
                await el.webkitRequestFullscreen();
            }
        } catch (e) {
            console.warn('Fullscreen failed:', e);
        }
    };

    const formatTime = (seconds) => {
        if (!seconds && seconds !== 0) return "00:00";
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    // --- Progress bar: click + drag (mouse & touch) ---
    const seekFromEvent = useCallback((e, barEl) => {
        if (!duration || !barEl) return;
        const rect = barEl.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const x = clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, x / rect.width));
        const newTime = percentage * duration;
        if (ref && ref.current) {
            ref.current.currentTime = newTime;
        }
    }, [duration, ref]);

    const handleProgressMouseDown = (e) => {
        e.preventDefault();
        setIsSeeking(true);
        seekFromEvent(e, progressBarRef.current);

        const handleMove = (ev) => seekFromEvent(ev, progressBarRef.current);
        const handleUp = () => {
            setIsSeeking(false);
            document.removeEventListener('mousemove', handleMove);
            document.removeEventListener('mouseup', handleUp);
        };
        document.addEventListener('mousemove', handleMove);
        document.addEventListener('mouseup', handleUp);
    };

    const handleProgressTouchStart = (e) => {
        setIsSeeking(true);
        seekFromEvent(e, progressBarRef.current);
    };
    const handleProgressTouchMove = (e) => {
        if (isSeeking) {
            e.preventDefault();
            seekFromEvent(e, progressBarRef.current);
        }
    };
    const handleProgressTouchEnd = () => setIsSeeking(false);

    // --- Double-tap on video to skip ---
    const handleVideoAreaClick = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const now = Date.now();
        const tapGap = now - lastTapRef.current.time;
        const tapDist = Math.abs(x - lastTapRef.current.x);

        if (tapGap < 350 && tapDist < 80) {
            // Double tap detected
            clearTimeout(doubleTapTimerRef.current);
            const side = x < rect.width / 2 ? 'left' : 'right';
            if (side === 'left') {
                handleJumpBack();
            } else {
                handleJumpForward();
            }
            setDoubleTapSide(side);
            setTimeout(() => setDoubleTapSide(null), 500);
            lastTapRef.current = { time: 0, x: 0 };
        } else {
            // Single tap — delay to check for double
            lastTapRef.current = { time: now, x };
            doubleTapTimerRef.current = setTimeout(() => {
                togglePlay();
            }, 300);
        }
    };

    // --- Volume slider (desktop) ---
    const handleVolumeChange = (e) => {
        const val = parseFloat(e.target.value);
        setVolume(val);
        if (val > 0 && isMuted) setIsMuted(false);
    };

    const progressPercent = duration ? (currentTime / duration) * 100 : 0;

    return (
        <div
            ref={containerRef}
            data-player-root
            className="flex-1 w-full h-full grid grid-rows-[minmax(0,1fr)_auto] bg-black select-none overflow-hidden group font-sans relative"
        >
            {/* 1. Video Area */}
            <div
                className="relative w-full h-full min-h-0 overflow-hidden bg-black cursor-pointer"
                onClick={handleVideoAreaClick}
            >
                {src ? (
                    <>
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
                        {/* Play/Pause Overlay */}
                        {!isPlaying && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none transition-opacity z-10">
                                <div className={`${compact ? 'p-4' : 'p-8'} rounded-full bg-black/60 text-white border border-white/20 shadow-2xl`}>
                                    <Play size={compact ? 40 : 80} fill="currentColor" className="ml-1" />
                                </div>
                            </div>
                        )}
                        {/* Double-tap skip indicator */}
                        {doubleTapSide && (
                            <div className={`absolute top-0 bottom-0 ${doubleTapSide === 'left' ? 'left-0 right-1/2' : 'left-1/2 right-0'} flex items-center justify-center pointer-events-none z-20`}>
                                <div className="bg-white/20 rounded-full p-4 animate-ping-once">
                                    {doubleTapSide === 'left' ? <RotateCcw size={32} className="text-white" /> : <RotateCw size={32} className="text-white" />}
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

            {/* 2. Control Area */}
            <div
                className={`w-full bg-neutral-900/95 backdrop-blur border-t border-white/10 z-20 flex flex-col shadow-2xl relative flex-shrink-0 ${compact ? 'min-h-[70px]' : 'min-h-[120px] sm:min-h-[180px]'}`}
            >
                {/* A. Progress Bar — draggable */}
                <div className={`w-full px-3 sm:px-6 ${compact ? 'pt-1 pb-0.5' : 'pt-2 sm:pt-4 pb-1 sm:pb-2'}`}>
                    <div
                        ref={progressBarRef}
                        className={`w-full relative cursor-pointer group/progress flex items-center bg-white/10 rounded-full hover:bg-white/20 transition-colors ${isSeeking ? 'h-3' : 'h-2'}`}
                        onMouseDown={handleProgressMouseDown}
                        onTouchStart={handleProgressTouchStart}
                        onTouchMove={handleProgressTouchMove}
                        onTouchEnd={handleProgressTouchEnd}
                    >
                        <div
                            className="absolute h-full bg-indigo-500 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                            style={{ width: `${progressPercent}%` }}
                        ></div>
                        <div
                            className={`absolute h-5 w-5 bg-white rounded-full shadow-lg border-2 border-indigo-600 top-1/2 -translate-y-1/2 transition-transform duration-100 ${isSeeking ? 'scale-100' : 'scale-0 group-hover/progress:scale-100'}`}
                            style={{ left: `${progressPercent}%`, transform: 'translate(-50%, -50%)' }}
                        ></div>
                    </div>
                </div>

                <div className={`w-full max-w-[1920px] mx-auto px-3 sm:px-6 ${compact ? 'py-0.5 gap-0' : 'py-1 sm:py-2 gap-1 sm:gap-2'} flex flex-col flex-shrink-0`}>

                    {/* B. Controls Row */}
                    <div className="flex items-center justify-between min-w-0">

                        {/* Left: Playback controls + Time */}
                        <div className="flex items-center gap-2 sm:gap-12 shrink-0">
                            <div className="flex items-center gap-1 sm:gap-4">
                                {/* Rewind 5s */}
                                <Button
                                    variant="ghost"
                                    onClick={handleJumpBack}
                                    className="rounded-full h-8 w-8 sm:h-10 sm:w-auto sm:px-4 p-0 gap-1 sm:gap-2 text-zinc-400 hover:text-white hover:bg-white/10 transition-all active:scale-95 flex items-center justify-center"
                                    title="5秒戻る"
                                >
                                    <RotateCcw size={16} className="sm:w-5 sm:h-5" strokeWidth={2} />
                                    <span className="text-[10px] sm:text-xs font-bold hidden sm:inline">5s</span>
                                </Button>

                                {/* Play/Pause */}
                                <Button
                                    onClick={togglePlay}
                                    className="h-10 w-10 sm:h-14 sm:w-14 rounded-full p-0 shadow-[0_0_20px_rgba(255,255,255,0.15)] border-2 border-white/10 bg-white text-black hover:bg-gray-100 hover:scale-105 transition-all active:scale-95 flex items-center justify-center shrink-0"
                                    title={isPlaying ? "一時停止" : "再生"}
                                >
                                    {isPlaying ? (
                                        <Pause size={20} className="sm:w-7 sm:h-7" fill="currentColor" strokeWidth={0} />
                                    ) : (
                                        <Play size={20} className="sm:w-7 sm:h-7 ml-0.5" fill="currentColor" strokeWidth={0} />
                                    )}
                                </Button>

                                {/* Forward 5s */}
                                <Button
                                    variant="ghost"
                                    onClick={handleJumpForward}
                                    className="rounded-full h-8 w-8 sm:h-10 sm:w-auto sm:px-4 p-0 gap-1 sm:gap-2 text-zinc-400 hover:text-white hover:bg-white/10 transition-all active:scale-95 flex items-center justify-center"
                                    title="5秒送る"
                                >
                                    <RotateCw size={16} className="sm:w-5 sm:h-5" strokeWidth={2} />
                                    <span className="text-[10px] sm:text-xs font-bold hidden sm:inline">5s</span>
                                </Button>
                            </div>

                            {/* Time display */}
                            <div className="flex items-center gap-1 sm:gap-3 text-base sm:text-2xl font-mono font-bold tracking-wider sm:tracking-widest select-none tabular-nums">
                                <span className="text-white drop-shadow-md">{formatTime(currentTime)}</span>
                                <span className="text-zinc-700 mx-0.5 sm:mx-1 font-light">|</span>
                                <span className="text-zinc-500">{formatTime(duration)}</span>
                            </div>
                        </div>

                        {/* Right: Volume, Speed, Fullscreen */}
                        <div className="flex items-center gap-1 sm:gap-6 shrink-0">
                            {/* Volume (desktop only) */}
                            {!compact && (
                                <div className="hidden sm:flex items-center gap-2 group/vol">
                                    <button
                                        onClick={toggleMute}
                                        className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
                                        title={isMuted ? "ミュート解除" : "ミュート"}
                                    >
                                        {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                                    </button>
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.05"
                                        value={isMuted ? 0 : volume}
                                        onChange={handleVolumeChange}
                                        className="w-20 h-1 accent-indigo-500 cursor-pointer opacity-0 group-hover/vol:opacity-100 transition-opacity"
                                    />
                                </div>
                            )}

                            {/* Speed */}
                            <div className="flex items-center gap-0.5 sm:gap-2 bg-zinc-900 p-1 sm:p-2 rounded-xl sm:rounded-2xl border border-zinc-800">
                                {[1.0, 1.5, 2.0].map((rate) => (
                                    <button
                                        key={rate}
                                        onClick={() => handleRateChange(rate)}
                                        className={`px-2 sm:px-5 py-1 sm:py-2 text-xs sm:text-base font-bold rounded-lg sm:rounded-xl transition-all ${Math.abs(playbackRate - rate) < 0.1
                                            ? 'bg-zinc-700 text-white shadow-md'
                                            : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
                                            }`}
                                    >
                                        {rate}x
                                    </button>
                                ))}
                            </div>

                            {/* Fullscreen */}
                            <button
                                onClick={toggleFullscreen}
                                className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
                                title={isFullscreen ? "フルスクリーン解除" : "フルスクリーン"}
                            >
                                {isFullscreen ? <Minimize size={compact ? 16 : 20} /> : <Maximize size={compact ? 16 : 20} />}
                            </button>
                        </div>
                    </div>

                    {/* C. Bottom Timeline (Comments) — hidden in compact mode */}
                    {!compact && (
                      <div className="w-full relative mt-2 pt-2 group/timeline border-t border-zinc-800/50">
                          {children}
                      </div>
                    )}
                </div>
            </div>
        </div>
    );
});

export default VideoPlayer;
