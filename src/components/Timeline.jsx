import React, { useRef, useState } from 'react';

const Timeline = ({ duration, currentTime, comments, onSeek }) => {
    const [isHovering, setIsHovering] = useState(false);
    const [hoverTime, setHoverTime] = useState(null);
    const containerRef = useRef(null);

    const safeDuration = duration || 0;
    const progress = safeDuration > 0 ? (currentTime / safeDuration) : 0;
    const progressPercent = progress * 100;

    const handleScrub = (e) => {
        if (!safeDuration) return;
        const newTime = (Number(e.target.value) / 100) * safeDuration;
        onSeek(newTime);
    };

    const handleMouseMove = (e) => {
        if (!containerRef.current || !safeDuration) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const pct = Math.max(0, Math.min(1, x / rect.width));
        setHoverTime(pct * safeDuration);
    };

    const formatTime = (seconds) => {
        if (!seconds && seconds !== 0) return "--:--";
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        // Root: Explicitly set relative and block
        <div
            className="w-full relative block bg-[#333] rounded-md border border-[#555] mx-auto"
            style={{
                height: '80px',
                minHeight: '80px',
                flexShrink: 0,
                display: 'block',
                position: 'relative'
            }}
            ref={containerRef}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => {
                setIsHovering(false);
                setHoverTime(null);
            }}
        >


            {/* 1. Track Background (Gray) - Forced inline styles */}
            <div
                className="absolute bg-[#666] rounded-full pointer-events-none z-10"
                style={{
                    top: '20px',
                    left: '12px',
                    right: '12px',
                    height: '6px',
                    position: 'absolute'
                }}
            ></div>

            {/* 2. Progress Fill (Blue) - Forced inline styles */}
            <div
                className="absolute bg-[#3b82f6] rounded-l-full pointer-events-none shadow-md z-20"
                style={{
                    top: '20px',
                    left: '12px',
                    height: '6px',
                    width: `calc(${Math.max(0, progressPercent)}% - 6px)`,
                    position: 'absolute'
                }}
            ></div>

            {/* 3. Comment Markers (Line + Avatar) */}
            <div
                className="absolute pointer-events-none z-30"
                style={{ top: '20px', left: '12px', right: '12px', height: '0px' }}
            >
                {comments && comments.map((comment) => {
                    const ptimeVal = parseFloat(comment.ptime);
                    if (isNaN(ptimeVal) || !safeDuration) return null;

                    const leftPct = (ptimeVal / safeDuration) * 100;
                    const isPassed = currentTime >= ptimeVal;
                    const initial = comment.user_name ? comment.user_name.charAt(0).toUpperCase() : '?';

                    return (
                        <div
                            key={comment.id}
                            className="absolute top-0 flex flex-col items-center group/marker transition-transform hover:z-50 cursor-pointer pointer-events-auto"
                            style={{ left: `${leftPct}%`, transform: 'translateX(-50%)' }}
                            onClick={(e) => {
                                e.stopPropagation();
                                onSeek(ptimeVal);
                            }}
                        >
                            {/* Tick on Bar */}
                            <div className="w-[2px] h-2 bg-white shadow-sm relative z-20"></div>

                            {/* Connector Line */}
                            <div className={`w-[1px] h-4 ${isPassed ? 'bg-[#3b82f6]' : 'bg-white/60'}`}></div>

                            {/* Avatar Bubble */}
                            <div className={`
                                w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shadow-md border 
                                transition-all duration-150 transform group-hover/marker:scale-125
                                ${isPassed
                                    ? 'bg-[#3b82f6] text-white border-blue-400'
                                    : 'bg-[#1f2937] text-gray-300 border-white/40'}
                            `}>
                                {initial}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* 4. Playhead - Forced inline styles */}
            {safeDuration > 0 && (
                <div
                    className="absolute bg-white rounded-full shadow-md z-40 pointer-events-none border border-gray-200"
                    style={{
                        top: '23px', /* 20px (track top) + 3px (half of track height) */
                        left: `calc(${progressPercent}% + 12px)`,
                        width: '16px',
                        height: '16px',
                        transform: 'translate(-50%, -50%)',
                        position: 'absolute'
                    }}
                />
            )}

            {/* 5. Invisible Interaction Layer */}
            <input
                type="range"
                min="0"
                max="100"
                step="0.01"
                value={safeDuration ? progressPercent : 0}
                onChange={handleScrub}
                disabled={!safeDuration}
                className="absolute inset-0 w-full h-full opacity-0 z-[60] cursor-pointer disabled:cursor-not-allowed"
                onMouseMove={handleMouseMove}
                aria-label="Seek Video"
                style={{ position: 'absolute', top: 0, left: 0 }}
            />

            {/* Tooltip */}
            {isHovering && hoverTime !== null && (
                <div
                    className="absolute -top-8 bg-[#1f2937] text-white text-[11px] font-mono px-2 py-1 rounded border border-[#374151] transform -translate-x-1/2 pointer-events-none z-[70] shadow-xl opacity-100"
                    style={{ left: `${(hoverTime / safeDuration) * 100}%` }}
                >
                    {formatTime(hoverTime)}
                </div>
            )}
        </div>
    );
};

export default Timeline;
