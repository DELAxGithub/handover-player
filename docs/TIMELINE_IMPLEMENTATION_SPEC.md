# Timeline Component Implementation Spec (v2)

## Design Requirement

**マーカーの色 = コメントしたユーザーのアバター色**

```
Timeline                                              3 markers
┌─────────────────────────────────────────────────────────────────┐
│     🟢          🔵              ▼           🟣                   │
│   John Doe   Sarah Kim    (playhead)    Mike Ross              │
│   (green)    (blue)                     (purple)               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Color Mapping Strategy

### Option A: User ID → Deterministic Color (推奨)

ユーザー名またはIDからハッシュ値を計算し、一貫した色を割り当てる。

```javascript
const USER_COLORS = [
    'bg-emerald-500',   // 緑
    'bg-blue-500',      // 青
    'bg-purple-500',    // 紫
    'bg-pink-500',      // ピンク
    'bg-amber-500',     // オレンジ
    'bg-cyan-500',      // シアン
    'bg-rose-500',      // ローズ
    'bg-indigo-500',    // インディゴ
];

const getUserColor = (userName) => {
    if (!userName) return 'bg-zinc-500';

    // Simple hash from string
    let hash = 0;
    for (let i = 0; i < userName.length; i++) {
        hash = userName.charCodeAt(i) + ((hash << 5) - hash);
    }

    const index = Math.abs(hash) % USER_COLORS.length;
    return USER_COLORS[index];
};
```

### Option B: Comment に color フィールドを持たせる

DB側で `user_color` を保存し、そのまま使用。

```jsx
// comment.user_color = "#10b981" (emerald-500)
style={{ backgroundColor: comment.user_color }}
```

---

## Full Implementation Code

```jsx
const USER_COLORS = [
    { bg: 'bg-emerald-500', hover: 'hover:bg-emerald-400' },
    { bg: 'bg-blue-500', hover: 'hover:bg-blue-400' },
    { bg: 'bg-purple-500', hover: 'hover:bg-purple-400' },
    { bg: 'bg-pink-500', hover: 'hover:bg-pink-400' },
    { bg: 'bg-amber-500', hover: 'hover:bg-amber-400' },
    { bg: 'bg-cyan-500', hover: 'hover:bg-cyan-400' },
    { bg: 'bg-rose-500', hover: 'hover:bg-rose-400' },
    { bg: 'bg-indigo-500', hover: 'hover:bg-indigo-400' },
];

const getUserColor = (userName) => {
    if (!userName) return USER_COLORS[0];

    let hash = 0;
    for (let i = 0; i < userName.length; i++) {
        hash = userName.charCodeAt(i) + ((hash << 5) - hash);
    }

    return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
};

const Timeline = ({ duration, currentTime, comments, onSeek }) => {
    const safeDuration = duration || 0;
    const progressPercent = safeDuration > 0 ? (currentTime / safeDuration) * 100 : 0;

    return (
        <div className="w-full relative select-none px-6 pb-2 min-h-[60px] sm:min-h-[80px] flex flex-col justify-end flex-shrink-0">

            {/* Header Label */}
            <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-xs text-zinc-500 font-mono tracking-wider font-bold uppercase">
                    Timeline
                </span>
                <span className="text-xs text-zinc-600 font-mono">
                    {comments?.length || 0} markers
                </span>
            </div>

            {/* Track Container */}
            <div
                className="relative w-full h-10 cursor-pointer group"
                onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const pct = Math.max(0, Math.min(1, x / rect.width));
                    onSeek(pct * safeDuration);
                }}
            >
                {/* Track Bar (Background) */}
                <div className="absolute top-2 bottom-2 left-0 right-0 bg-zinc-700/80 rounded-sm overflow-hidden">

                    {/* Markers - Color based on user */}
                    {comments && comments.map((comment) => {
                        const ptimeVal = parseFloat(comment.ptime);
                        if (isNaN(ptimeVal) || !safeDuration) return null;
                        const leftPct = (ptimeVal / safeDuration) * 100;
                        const color = getUserColor(comment.user_name);

                        return (
                            <div
                                key={comment.id}
                                className={`absolute top-0 bottom-0 w-[3px] z-10 ${color.bg} ${color.hover} transition-all cursor-pointer`}
                                style={{ left: `${leftPct}%`, transform: 'translateX(-50%)' }}
                                title={`${comment.user_name} @ ${formatTime(ptimeVal)}`}
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
                    className="absolute top-0 bottom-0 w-[2px] bg-white z-20 pointer-events-none shadow-[0_0_6px_rgba(255,255,255,0.5)]"
                    style={{ left: `${progressPercent}%`, transform: 'translateX(-50%)' }}
                />

                {/* Playhead Triangle */}
                <div
                    className="absolute top-0 w-3 h-3 z-30 pointer-events-none"
                    style={{ left: `${progressPercent}%`, transform: 'translateX(-50%)' }}
                >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M6 12L0 4V0H12V4L6 12Z" fill="white" />
                    </svg>
                </div>
            </div>
        </div>
    );
};

// Helper function
const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
};

export default Timeline;
```

---

## Avatar Color Consistency

CommentSection でも同じ `getUserColor` 関数を使用すれば、アバターとマーカーの色が一致する。

### 共通ユーティリティ化 (推奨)

```javascript
// src/utils/userColor.js

export const USER_COLORS = [
    { bg: 'bg-emerald-500', hover: 'hover:bg-emerald-400', hex: '#10b981' },
    { bg: 'bg-blue-500', hover: 'hover:bg-blue-400', hex: '#3b82f6' },
    { bg: 'bg-purple-500', hover: 'hover:bg-purple-400', hex: '#a855f7' },
    { bg: 'bg-pink-500', hover: 'hover:bg-pink-400', hex: '#ec4899' },
    { bg: 'bg-amber-500', hover: 'hover:bg-amber-400', hex: '#f59e0b' },
    { bg: 'bg-cyan-500', hover: 'hover:bg-cyan-400', hex: '#06b6d4' },
    { bg: 'bg-rose-500', hover: 'hover:bg-rose-400', hex: '#f43f5e' },
    { bg: 'bg-indigo-500', hover: 'hover:bg-indigo-400', hex: '#6366f1' },
];

export const getUserColor = (userName) => {
    if (!userName) return USER_COLORS[0];

    let hash = 0;
    for (let i = 0; i < userName.length; i++) {
        hash = userName.charCodeAt(i) + ((hash << 5) - hash);
    }

    return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
};
```

### 使用例

```jsx
// Timeline.jsx
import { getUserColor } from '../utils/userColor';
const color = getUserColor(comment.user_name);

// CommentSection.jsx (Avatar)
import { getUserColor } from '../utils/userColor';
const avatarColor = getUserColor(comment.user_name);
<div className={`w-8 h-8 rounded-full ${avatarColor.bg} ...`}>
```

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/utils/userColor.js` | **新規作成** - 色計算ロジック |
| `src/components/Timeline.jsx` | **更新** - ユーザー色マーカー |
| `src/components/CommentSection.jsx` | **更新** - 同じ色関数を使用 |

---

## Result Preview

```
Timeline                                              3 markers
┌─────────────────────────────────────────────────────────────────┐
│     🟢          🔵              ▼           🟣                   │
│   0:24        1:02          (now)        2:18                   │
│  (John)     (Sarah)                    (Mike)                   │
└─────────────────────────────────────────────────────────────────┘

Comments Panel:
┌────────────────────┐
│ 🟢 John Doe   0:24 │
│ 🔵 Sarah Kim  1:02 │
│ 🟣 Mike Ross  2:18 │
└────────────────────┘

→ Timeline マーカーとアバターの色が一致 ✓
```
