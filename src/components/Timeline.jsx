import React from 'react';

const Timeline = ({ duration, comments, onSeek }) => {
    // Always render the track so we know it's there
    // If duration is missing, we treat it as 1 to avoid division by zero, but markers won't show correctly anyway
    const safeDuration = duration || 1;

    return (
        <div className="w-full h-8 bg-[#151515] relative group cursor-pointer border-t border-[#333] select-none flex items-center">
            {/* Label for debug/clarity if duration is missing */}
            {!duration && (
                <div className="absolute left-2 text-[10px] text-gray-600">Loading timeline...</div>
            )}

            {/* Base line - visible across full width minus margin */}
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-[#333] group-hover:bg-[#444] transition-colors mx-4 rounded-full" />

            {/* Markers area - offset by margin to match baseline */}
            <div className="absolute top-0 bottom-0 left-4 right-4 pointer-events-none">
                {comments.map((comment) => {
                    if (!comment.ptime) return null;
                    const positionPercent = Math.min(100, Math.max(0, (comment.ptime / safeDuration) * 100));

                    return (
                        <div
                            key={comment.id}
                            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-blue-500 border-2 border-[#151515] hover:bg-blue-400 hover:scale-125 transition-all cursor-pointer z-10 shadow-[0_0_8px_rgba(59,130,246,0.5)] pointer-events-auto"
                            style={{ left: `${positionPercent}%` }}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onSeek(comment.ptime);
                            }}
                            title={`${comment.user_name}: ${comment.text}`}
                        />
                    );
                })}
            </div>
        </div>
    );
};

export default Timeline;
