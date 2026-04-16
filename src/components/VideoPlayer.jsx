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
    const [isBuffering, setIsBuffering] = useState(false);
    const [loadError, setLoadError] = useState(null);

    const containerRef = useRef(null);
    const progressBarRef = useRef(null);
    const lastTapRef = useRef({ time: 0, x: 0 });
    const doubleTapTimerRef = useRef(null);
    const retryCountRef = useRef(0);
    const retryTimerRef = useRef(null);
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

    // Buffering detection & error recovery
    useEffect(() => {
        const video = ref?.current;
        if (!video) return;

        let bufferingTimer = null;

        const handleWaiting = () => setIsBuffering(true);
        const handlePlaying = () => {
            setIsBuffering(false);
            setLoadError(null);
            retryCountRef.current = 0;
        };
        const handleCanPlay = () => setIsBuffering(false);

        const handleStalled = () => {
            setIsBuffering(true);
            // Auto-retry: nudge the playback position to force re-fetch
            bufferingTimer = setTimeout(() => {
                if (video.paused || !video.readyState || video.readyState < 3) {
                    const ct = video.currentTime;
                    video.currentTime = ct; // re-trigger range request
                }
            }, 3000);
        };

        const handleError = () => {
            const MAX_RETRIES = 3;
            if (retryCountRef.current < MAX_RETRIES && src) {
                retryCountRef.current += 1;
                const delay = retryCountRef.current * 2000;
                setLoadError(`Loading error — retrying (${retryCountRef.current}/${MAX_RETRIES})...`);
                retryTimerRef.current = setTimeout(() => {
                    video.load();
                    video.play().catch(() => {});
                }, delay);
            } else {
                setLoadError('Failed to load video. Please check the link.');
                setIsBuffering(false);
            }
        };

        video.addEventListener('waiting', handleWaiting);
        video.addEventListener('playing', handlePlaying);
        video.addEventListener('canplay', handleCanPlay);
        video.addEventListener('stalled', handleStalled);
        video.addEventListener('error', handleError);

        return () => {
            video.removeEventListener('waiting', handleWaiting);
            video.removeEventListener('playing', handlePlaying);
            video.removeEventListener('canplay', handleCanPlay);
            video.removeEventListener('stalled', handleStalled);
            video.removeEventListener('error', handleError);
            clearTimeout(bufferingTimer);
            clearTimeout(retryTimerRef.current);
        };
    }, [ref, src]);

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
                            preload="auto"
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
                        {/* Play/Pause Overlay — subtle, no dimming */}
                        {!isPlaying && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity z-10">
                                <div className={`${compact ? 'p-3' : 'p-5'} rounded-full bg-black/50 text-white/80 backdrop-blur-sm`}>
                                    <Play size={compact ? 28 : 48} fill="currentColor" className="ml-0.5" />
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
                        {/* Buffering spinner */}
                        {isBuffering && isPlaying && !loadError && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span className="text-white/70 text-sm">Loading...</span>
                                </div>
                            </div>
                        )}
                        {/* Error overlay with retry */}
                        {loadError && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-20">
                                <div className="flex flex-col items-center gap-3 px-6 text-center">
                                    <span className="text-white text-sm">{loadError}</span>
                                    {retryCountRef.current >= 3 && (
                                        <button
                                            onClick={() => {
                                                retryCountRef.current = 0;
                                                setLoadError(null);
                                                if (ref?.current) {
                                                    ref.current.load();
                                                    ref.current.play().catch(() => {});
                                                }
                                            }}
                                            className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm rounded-lg transition-colors"
                                        >
                                            Retry
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-muted-foreground font-medium flex items-center justify-center h-full">
                        Enter a Dropbox link to start
                    </div>
                )}
            </div>

            {/* 2. Control Area — compressed single-row */}
            <div
                className="w-full bg-black/90 backdrop-blur-sm z-20 flex flex-col relative flex-shrink-0 min-h-[48px]"
            >
                {/* A. Progress Bar — flush top, no padding */}
                <div className="w-full">
                    <div
                        ref={progressBarRef}
                        className={`w-full relative cursor-pointer group/progress flex items-center bg-white/[0.08] hover:bg-white/[0.14] transition-colors ${isSeeking ? 'h-2' : 'h-1.5 hover:h-2'}`}
                        style={{ transition: 'height 0.15s ease' }}
                        onMouseDown={handleProgressMouseDown}
                        onTouchStart={handleProgressTouchStart}
                        onTouchMove={handleProgressTouchMove}
                        onTouchEnd={handleProgressTouchEnd}
                    >
                        <div
                            className="absolute h-full bg-primary rounded-r-full"
                            style={{ width: `${progressPercent}%` }}
                        ></div>
                        <div
                            className={`absolute h-3.5 w-3.5 bg-white rounded-full shadow-md top-1/2 -translate-y-1/2 transition-transform duration-100 ${isSeeking ? 'scale-100' : 'scale-0 group-hover/progress:scale-100'}`}
                            style={{ left: `${progressPercent}%`, transform: 'translate(-50%, -50%)' }}
                        ></div>
                    </div>
                </div>

                {/* B. Single Controls Row: [play/skip/time] [timeline] [speed/vol/fs] */}
                <div className="w-full px-3 sm:px-4 py-1 flex items-center gap-2 sm:gap-3 min-w-0 flex-1">

                    {/* Left: Playback controls + Time */}
                    <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                        {/* Rewind 5s */}
                        <button
                            onClick={handleJumpBack}
                            className="h-7 w-7 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-all active:scale-95 flex items-center justify-center"
                            title="Rewind 5s"
                        >
                            <RotateCcw size={14} strokeWidth={2} />
                        </button>

                        {/* Play/Pause */}
                        <button
                            onClick={togglePlay}
                            className="h-8 w-8 rounded-full text-white hover:bg-white/10 transition-all active:scale-95 flex items-center justify-center shrink-0"
                            title={isPlaying ? "Pause" : "Play"}
                        >
                            {isPlaying ? (
                                <Pause size={16} fill="currentColor" strokeWidth={0} />
                            ) : (
                                <Play size={16} className="ml-0.5" fill="currentColor" strokeWidth={0} />
                            )}
                        </button>

                        {/* Forward 5s */}
                        <button
                            onClick={handleJumpForward}
                            className="h-7 w-7 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-all active:scale-95 flex items-center justify-center"
                            title="Forward 5s"
                        >
                            <RotateCw size={14} strokeWidth={2} />
                        </button>

                        {/* Time display */}
                        <div className="flex items-center gap-1 text-[11px] sm:text-xs font-mono font-medium tracking-wide select-none tabular-nums ml-1">
                            <span className="text-zinc-300">{formatTime(currentTime)}</span>
                            <span className="text-zinc-600">/</span>
                            <span className="text-zinc-500">{formatTime(duration)}</span>
                        </div>
                    </div>

                    {/* Center: Timeline (Comment Markers) */}
                    {!compact && children && (
                        <div className="flex-1 min-w-0 mx-1 sm:mx-3">
                            {children}
                        </div>
                    )}
                    {(compact || !children) && <div className="flex-1" />}

                    {/* Right: Speed, Volume, Fullscreen */}
                    <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                        {/* Volume (desktop only) */}
                        {!compact && (
                            <div className="hidden sm:flex items-center group/vol">
                                <button
                                    onClick={toggleMute}
                                    className="h-7 w-7 rounded-md text-zinc-400 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center"
                                    title={isMuted ? "Unmute" : "Mute"}
                                >
                                    {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
                                </button>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.05"
                                    value={isMuted ? 0 : volume}
                                    onChange={handleVolumeChange}
                                    className="w-16 h-1 cursor-pointer opacity-0 group-hover/vol:opacity-100 transition-opacity"
                                    style={{ accentColor: 'var(--primary)' }}
                                />
                            </div>
                        )}

                        {/* Speed */}
                        <div className="flex items-center">
                            {[1.0, 1.5, 2.0].map((rate) => (
                                <button
                                    key={rate}
                                    onClick={() => handleRateChange(rate)}
                                    className={`px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold rounded transition-all ${Math.abs(playbackRate - rate) < 0.1
                                        ? 'bg-white/15 text-white'
                                        : 'text-zinc-500 hover:text-zinc-300'
                                        }`}
                                >
                                    {rate}x
                                </button>
                            ))}
                        </div>

                        {/* Fullscreen */}
                        <button
                            onClick={toggleFullscreen}
                            className="h-7 w-7 rounded-md text-zinc-400 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center"
                            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                        >
                            {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
});

export default VideoPlayer;
