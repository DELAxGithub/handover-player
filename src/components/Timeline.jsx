import { useState, useRef, useCallback } from 'react';
import { getUserColor } from '../utils/userColor';

const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
};

const Timeline = ({ duration, currentTime, comments, onSeek }) => {
    const safeDuration = duration || 0;
    const progressPercent = safeDuration > 0 ? (currentTime / safeDuration) * 100 : 0;
    const trackRef = useRef(null);
    const [hoverInfo, setHoverInfo] = useState(null); // { x, time, comment }
    const [tooltipMarker, setTooltipMarker] = useState(null); // { x, name, time }

    const handleClick = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const pct = Math.max(0, Math.min(1, x / rect.width));
        onSeek(pct * safeDuration);
    };

    const handleMouseMove = useCallback((e) => {
        if (!safeDuration) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const pct = Math.max(0, Math.min(1, x / rect.width));
        const time = pct * safeDuration;
        setHoverInfo({ x, time });
    }, [safeDuration]);

    const handleMouseLeave = () => {
        setHoverInfo(null);
        setTooltipMarker(null);
    };

    return (
        <div className="w-full relative select-none flex-shrink-0">
            {/* Track */}
            <div
                ref={trackRef}
                className="relative w-full h-5 rounded-full cursor-pointer bg-white/[0.06] hover:bg-white/[0.1] transition-colors"
                onClick={handleClick}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
            >
                {/* Hover time preview */}
                {hoverInfo && !tooltipMarker && (
                    <div
                        className="absolute -top-7 pointer-events-none z-40 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-mono text-zinc-300 whitespace-nowrap"
                        style={{ left: hoverInfo.x, transform: 'translateX(-50%)' }}
                    >
                        {formatTime(hoverInfo.time)}
                    </div>
                )}

                {/* Marker tooltip */}
                {tooltipMarker && (
                    <div
                        className="absolute -top-8 pointer-events-none z-40 px-2 py-1 rounded bg-black/90 backdrop-blur-sm whitespace-nowrap flex items-center gap-1.5"
                        style={{ left: `${tooltipMarker.x}%`, transform: 'translateX(-50%)' }}
                    >
                        <span className="text-[10px] font-mono text-primary">{formatTime(tooltipMarker.time)}</span>
                        <span className="text-[10px] text-zinc-400">{tooltipMarker.name}</span>
                    </div>
                )}

                {/* Comment markers — diamond shape */}
                {comments && comments.map((comment) => {
                    const ptimeVal = parseFloat(comment.ptime);
                    if (isNaN(ptimeVal) || !safeDuration) return null;
                    const leftPct = (ptimeVal / safeDuration) * 100;
                    const color = getUserColor(comment.user_name);

                    return (
                        <div
                            key={comment.id}
                            className="absolute top-1/2 z-10 cursor-pointer hover:scale-125 transition-transform"
                            style={{
                                left: `${leftPct}%`,
                                transform: 'translateX(-50%) translateY(-50%) rotate(45deg)',
                                width: 7,
                                height: 7,
                                backgroundColor: color.hex,
                                borderRadius: 1,
                            }}
                            onMouseEnter={() => setTooltipMarker({
                                x: leftPct,
                                name: comment.user_name || 'Anonymous',
                                time: ptimeVal,
                            })}
                            onMouseLeave={() => setTooltipMarker(null)}
                            onClick={(e) => {
                                e.stopPropagation();
                                onSeek(ptimeVal);
                            }}
                        />
                    );
                })}

                {/* Playhead line */}
                <div
                    className="absolute top-0 bottom-0 w-[2px] z-20 pointer-events-none bg-white shadow-[0_0_6px_rgba(255,255,255,0.4)]"
                    style={{
                        left: `${progressPercent}%`,
                        transform: 'translateX(-50%)',
                    }}
                />

                {/* Playhead dot */}
                <div
                    className="absolute top-1/2 w-2.5 h-2.5 z-30 pointer-events-none bg-white rounded-full shadow-[0_0_6px_rgba(255,255,255,0.4)]"
                    style={{
                        left: `${progressPercent}%`,
                        transform: 'translate(-50%, -50%)',
                    }}
                />
            </div>
        </div>
    );
};

export default Timeline;
