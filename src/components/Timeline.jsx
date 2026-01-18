import React from 'react';

const Timeline = ({ duration, comments, onSeek }) => {
    // Always render the track so we know it's there
    // If duration is missing, we treat it as 1 to avoid division by zero, but markers won't show correctly anyway
    const safeDuration = duration || 1;

    return (
        <div className="w-full h-10 bg-[#151515] relative group cursor-pointer rounded-lg select-none flex items-center px-2">
            {/* Label for debug/clarity if duration is missing */}
            {!duration && (
                <div className="absolute left-4 text-[10px] text-gray-600">タイムライン読み込み中...</div>
            )}

            {/* Base line - visible across full width */}
            <div className="w-full h-1.5 bg-[#333] group-hover:bg-[#444] transition-colors rounded-full relative">
                {/* Markers positioned within the baseline */}
                {comments.map((comment) => {
                    // Accept ptime of 0 or positive numbers
                    if (comment.ptime === undefined || comment.ptime === null) return null;
                    const positionPercent = Math.min(100, Math.max(0, (comment.ptime / safeDuration) * 100));

                    return (
                        <div
                            key={comment.id}
                            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-blue-500 border-2 border-[#222] hover:bg-blue-400 hover:scale-125 transition-all cursor-pointer z-10 shadow-[0_0_10px_rgba(59,130,246,0.6)]"
                            style={{ left: `calc(${positionPercent}%)` }}
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

            {/* Comment count indicator */}
            {comments.length > 0 && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500">
                    {comments.length}件
                </div>
            )}
        </div>
    );
};

export default Timeline;
