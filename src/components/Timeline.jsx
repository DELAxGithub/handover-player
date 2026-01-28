import { getUserColor } from '../utils/userColor';

// Format seconds to M:SS
const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
};

const Timeline = ({ duration, currentTime, comments, onSeek }) => {
    // Timeline Component v8.3 - All inline styles for Tailwind JIT bypass
    const safeDuration = duration || 0;
    const progressPercent = safeDuration > 0 ? (currentTime / safeDuration) * 100 : 0;

    return (
        <div className="w-full relative select-none px-4 py-2 flex-shrink-0">

            {/* Header Label */}
            <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-xs text-zinc-400 font-mono tracking-wider font-bold uppercase">
                    Timeline
                </span>
                <span className="text-xs text-zinc-500 font-mono">
                    {comments?.length || 0} markers
                </span>
            </div>

            {/* Track Container - Using inline styles for reliable rendering */}
            <div
                className="w-full rounded cursor-pointer"
                style={{
                    height: '32px',
                    backgroundColor: '#3f3f46',
                    border: '1px solid #52525b',
                    position: 'relative'
                }}
                onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const pct = Math.max(0, Math.min(1, x / rect.width));
                    onSeek(pct * safeDuration);
                }}
            >
                {/* Track inner content */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>

                    {/* Markers - Color based on user (all inline styles for reliability) */}
                    {comments && comments.map((comment) => {
                        const ptimeVal = parseFloat(comment.ptime);
                        if (isNaN(ptimeVal) || !safeDuration) return null;
                        const leftPct = (ptimeVal / safeDuration) * 100;
                        const color = getUserColor(comment.user_name);

                        return (
                            <div
                                key={comment.id}
                                className="cursor-pointer rounded-sm hover:opacity-80"
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    bottom: 0,
                                    left: `${leftPct}%`,
                                    transform: 'translateX(-50%)',
                                    width: '4px',
                                    backgroundColor: color.hex,
                                    zIndex: 10,
                                    transition: 'all 0.15s'
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
                    className="pointer-events-none"
                    style={{
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        left: `${progressPercent}%`,
                        transform: 'translateX(-50%)',
                        width: '2px',
                        backgroundColor: 'white',
                        boxShadow: '0 0 8px rgba(255,255,255,0.6)',
                        zIndex: 20
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
                        borderTop: '8px solid white'
                    }}
                />
            </div>
        </div>
    );
};

export default Timeline;
