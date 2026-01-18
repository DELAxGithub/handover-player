import React, { forwardRef, useEffect, useState } from 'react';

const VideoPlayer = forwardRef(({ url, playbackRate: externalPlaybackRate, onPlaybackRateChange, onTimeUpdate, onDurationChange }, ref) => {
    const [src, setSrc] = useState('');
    // Use external playback rate if provided, otherwise manage locally
    const playbackRate = externalPlaybackRate ?? 1.0;
    const setPlaybackRate = onPlaybackRateChange ?? (() => {});

    useEffect(() => {
        if (!url) return;

        try {
            // Create a URL object to safely parse and manipulate parameters
            const urlObj = new URL(url);

            // 1. Handle Hostname: Convert www.dropbox.com to dl.dropboxusercontent.com
            // This is the direct download domain that supports ranged requests (seeking)
            if (urlObj.hostname.includes('dropbox.com')) {
                urlObj.hostname = 'dl.dropboxusercontent.com';

                // 2. Handle Parameters: 
                // We MUST keep 'rlkey' for private/scoped links.
                // We remove 'dl' and 'preview' to clean up, but 'raw=1' isn't strictly needed for dl.dropboxusercontent.com
                // as it serves raw content by default.
                urlObj.searchParams.delete('dl');
                urlObj.searchParams.delete('preview');
            }

            setSrc(urlObj.toString());
        } catch (e) {
            console.error("Invalid URL provided:", url);
            setSrc(url); // Fallback to original if parsing fails
        }
    }, [url]);

    // Force playback rate update whenever state changes or video plays
    useEffect(() => {
        if (ref && ref.current) {
            ref.current.playbackRate = playbackRate;
        }
    }, [playbackRate, ref]);

    const handleRateChange = (rate) => {
        setPlaybackRate(rate);
    };

    return (
        <div className="w-full flex flex-col gap-2">
            <div className="w-full aspect-video bg-black rounded-lg overflow-hidden shadow-2xl relative">
                {src ? (
                    <video
                        ref={ref}
                        src={src}
                        className="w-full h-full"
                        controls
                        playsInline
                        onTimeUpdate={(e) => {
                            onTimeUpdate(e.target.currentTime);
                            if (onDurationChange && e.target.duration) onDurationChange(e.target.duration);
                        }}
                        onLoadedMetadata={(e) => {
                            if (onDurationChange && e.target.duration) onDurationChange(e.target.duration);
                        }}
                        onPlay={() => {
                            if (ref.current) ref.current.playbackRate = playbackRate;
                        }}
                        onRateChange={(e) => {
                            if (e.target.playbackRate !== playbackRate) {
                                setPlaybackRate(e.target.playbackRate);
                            }
                        }}
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        Dropboxのリンクを入力してください
                    </div>
                )}
            </div>

            {/* Speed Control - Always visible below video */}
            {src && (
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-2 opacity-70 hover:opacity-100 transition-opacity">
                        <span className="text-xs text-gray-500">速度:</span>
                        <div className="flex bg-[#222] rounded-lg p-1 gap-0.5">
                            {[1.0, 1.5, 2.0, 3.0].map((rate) => (
                                <button
                                    key={rate}
                                    onClick={() => handleRateChange(rate)}
                                    className={`px-2 py-1 text-xs rounded transition-colors ${
                                        Math.abs(playbackRate - rate) < 0.1
                                            ? 'bg-blue-600 text-white'
                                            : 'text-gray-400 hover:text-white hover:bg-[#333]'
                                    }`}
                                >
                                    {rate}x
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="text-[10px] text-gray-600">
                        <kbd className="px-1.5 py-0.5 bg-[#222] border border-[#333] rounded text-gray-400">?</kbd>
                        <span className="ml-1">ショートカット</span>
                    </div>
                </div>
            )}
        </div>
    );
});

export default VideoPlayer;
