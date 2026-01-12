import React, { forwardRef, useEffect, useState } from 'react';

const VideoPlayer = forwardRef(({ url, onTimeUpdate, onDurationChange }, ref) => {
    const [src, setSrc] = useState('');
    const [playbackRate, setPlaybackRate] = useState(1.0);

    useEffect(() => {
        if (!url) return;
        let finalUrl = url;
        if (url.includes('www.dropbox.com')) {
            finalUrl = url.replace('www.dropbox.com', 'dl.dropboxusercontent.com');
        }
        finalUrl = finalUrl.replace('?dl=0', '').replace('&dl=0', '');
        setSrc(finalUrl);
    }, [url]);

    // Force playback rate update whenever state changes or video plays
    useEffect(() => {
        if (ref && ref.current) {
            ref.current.playbackRate = playbackRate;
        }
    }, [playbackRate, ref]);

    const handleRateChange = (rate) => {
        setPlaybackRate(rate);
        // Explicitly set it on the element immediately
        if (ref && ref.current) {
            ref.current.playbackRate = rate;
        }
    };

    return (
        <div className="w-full flex flex-col gap-2">
            <div className="w-full aspect-video bg-black rounded-lg overflow-hidden shadow-2xl relative group">
                {src ? (
                    <>
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
                                // Keep state in sync if user changes it via native controls (if available)
                                if (e.target.playbackRate !== playbackRate) {
                                    setPlaybackRate(e.target.playbackRate);
                                }
                            }}
                        />
                        {/* Speed Overlay - Smaller and more robust */}
                        <div
                            className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity z-50 bg-black/20 backdrop-blur-sm rounded p-0.5"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {[1.0, 1.5, 2.0, 3.0].map((rate) => (
                                <button
                                    key={rate}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        console.log('Changing rate to', rate); // Debug log
                                        handleRateChange(rate);
                                    }}
                                    className={`px-1.5 py-0.5 text-[10px] font-bold rounded transition-colors ${Math.abs(playbackRate - rate) < 0.1
                                        ? 'bg-blue-600 text-white'
                                        : 'text-gray-300 hover:bg-white/20'
                                        }`}
                                >
                                    {rate}x
                                </button>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        Enter a Dropbox link to start
                    </div>
                )}
            </div>
        </div>
    );
});

export default VideoPlayer;
