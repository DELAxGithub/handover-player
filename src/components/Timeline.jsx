import { getUserColor } from '../utils/userColor';

// Format seconds to M:SS
const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
};

const Timeline = ({ duration, currentTime, comments, onSeek }) => {
    const safeDuration = duration || 0;
    const progressPercent = safeDuration > 0 ? (currentTime / safeDuration) * 100 : 0;

    return (
        <div className="w-full relative select-none px-4 py-1 flex-shrink-0">

            {/* Track Container */}
            <div
                className="relative w-full h-10 rounded cursor-pointer bg-timeline border border-timeline-border"
                onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const pct = Math.max(0, Math.min(1, x / rect.width));
                    onSeek(pct * safeDuration);
                }}
            >
                {/* Track inner content */}
                <div className="absolute inset-0">

                    {/* Markers - color is dynamic per user, must stay inline */}
                    {comments && comments.map((comment) => {
                        const ptimeVal = parseFloat(comment.ptime);
                        if (isNaN(ptimeVal) || !safeDuration) return null;
                        const leftPct = (ptimeVal / safeDuration) * 100;
                        const color = getUserColor(comment.user_name);

                        return (
                            <div
                                key={comment.id}
                                className="absolute top-1 bottom-1 w-1.5 z-10 cursor-pointer rounded-full hover:brightness-125 transition-all"
                                style={{
                                    left: `${leftPct}%`,
                                    transform: 'translateX(-50%)',
                                    backgroundColor: color.hex,
                                }}
                                title={`${comment.user_name || 'Anonymous'} @ ${formatTime(ptimeVal)}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onSeek(ptimeVal);
                                }}
                            />
                        );
                    })}
                </div>

                {/* Playhead Line */}
                <div
                    className="absolute top-0 bottom-0 w-[2px] z-20 pointer-events-none bg-white shadow-[0_0_12px_rgba(255,255,255,0.7)]"
                    style={{
                        left: `${progressPercent}%`,
                        transform: 'translateX(-50%)',
                    }}
                />

                {/* Playhead Triangle (Top) */}
                <div
                    className="absolute -top-1 w-0 h-0 z-30 pointer-events-none"
                    style={{
                        left: `${progressPercent}%`,
                        transform: 'translateX(-50%)',
                        borderLeft: '6px solid transparent',
                        borderRight: '6px solid transparent',
                        borderTop: '8px solid var(--timeline-playhead)',
                    }}
                />
            </div>
        </div>
    );
};

export default Timeline;
