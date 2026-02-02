# Timeline Overflow Fix - v5.2 以降の対策

## 問題の本質

`grid-rows-[minmax(0,1fr)_auto]` は理論上正しいが、**`<video>` 要素の intrinsic aspect ratio が Grid の縮小計算を上書きする**ことがある。

特に Safari / Chrome では `object-contain` を指定した video 要素が「最低限このサイズは必要」と主張し、Grid Row 1 が期待通りに縮まない。

---

## 推奨修正: 絶対配置コントロールバー (YouTube/Netflix 方式)

最も堅牢な解決策は、**コントロールバーを Video の上に重ねる絶対配置**にすること。

### VideoPlayer.jsx の変更

```jsx
// BEFORE: Grid で縦分割
<div className="w-full h-full grid grid-rows-[minmax(0,1fr)_auto] ...">
    <div>Video</div>
    <div>Controls</div>
</div>

// AFTER: Video がフルサイズ、Controls は絶対配置でオーバーレイ
<div className="w-full h-full relative bg-black overflow-hidden">

    {/* Video: フル画面 */}
    <div className="absolute inset-0 flex items-center justify-center">
        <video className="w-full h-full object-contain" ... />
    </div>

    {/* Controls: 下部に固定オーバーレイ */}
    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent z-20 transition-opacity duration-300 group-hover:opacity-100 opacity-0 hover:opacity-100">
        {/* Progress Bar */}
        {/* Buttons */}
        {/* Timeline */}
    </div>
</div>
```

### メリット
- 高さ計算の競合が完全に解消
- レスポンシブ対応が簡単
- 一般的なビデオプレイヤーのUXに準拠
- ホバー時にフェードイン/アウト可能

### デメリット
- Timeline がビデオの上に重なる（透過度で軽減可能）
- コントロールを常時表示したい場合は調整が必要

---

## 代替案 A: CSS `contain` プロパティ

Video 領域に `contain: strict` を指定し、内部のレイアウトが外に影響しないようにする。

```jsx
// Video Area に contain を追加
<div className="w-full h-full ... [contain:strict]">
    <video ... />
</div>
```

**Tailwind で `[contain:strict]` は arbitrary value として使用可能**

---

## 代替案 B: Video を `position: absolute` で囲む

Video 自体は絶対配置のラッパー内に閉じ込め、そのラッパーを Grid Row 1 に配置。

```jsx
<div className="w-full h-full grid grid-rows-[minmax(0,1fr)_auto] ...">

    {/* Row 1: Video Container (相対配置) */}
    <div className="relative w-full h-full min-h-0 overflow-hidden">
        {/* Video は絶対配置で親にフィット */}
        <video className="absolute inset-0 w-full h-full object-contain" ... />
    </div>

    {/* Row 2: Controls (変更なし) */}
    <div className="...">
        ...
    </div>
</div>
```

### ポイント
- `<video>` を `absolute inset-0` で配置
- 親 div は `relative overflow-hidden min-h-0`
- これにより video の intrinsic size がレイアウトに影響しなくなる

---

## 代替案 C: 明示的な高さ計算 (JavaScript)

ResizeObserver で親コンテナの高さを監視し、Control Area の高さを引いた値を Video Area に設定。

```jsx
const [videoHeight, setVideoHeight] = useState('100%');
const containerRef = useRef(null);
const controlsRef = useRef(null);

useEffect(() => {
    const observer = new ResizeObserver(() => {
        if (containerRef.current && controlsRef.current) {
            const containerH = containerRef.current.clientHeight;
            const controlsH = controlsRef.current.clientHeight;
            setVideoHeight(`${containerH - controlsH}px`);
        }
    });
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
}, []);

return (
    <div ref={containerRef} className="w-full h-full flex flex-col">
        <div style={{ height: videoHeight }}>
            <video ... />
        </div>
        <div ref={controlsRef}>
            {/* Controls */}
        </div>
    </div>
);
```

**欠点**: JavaScript 依存、リサイズ時に一瞬ちらつく可能性

---

## 推奨順位

| 順位 | 方法 | 難易度 | 堅牢性 |
|------|------|--------|--------|
| 1 | **代替案 B**: Video を absolute で囲む | 低 | 高 |
| 2 | 推奨修正: 絶対配置コントロールバー | 中 | 最高 |
| 3 | 代替案 A: contain プロパティ | 低 | 中 |
| 4 | 代替案 C: JS で高さ計算 | 高 | 高 |

---

## 即時適用できる最小修正 (代替案 B)

```diff
// src/components/VideoPlayer.jsx (line 81-91)

- <div
-     className="w-full h-full relative bg-black cursor-pointer flex items-center justify-center overflow-hidden min-h-0"
-     onClick={togglePlay}
- >
-     {src ? (
-         <>
-             <video
-                 ref={ref}
-                 src={src}
-                 className="w-full h-full object-contain max-h-full"

+ <div
+     className="relative w-full h-full min-h-0 overflow-hidden bg-black cursor-pointer"
+     onClick={togglePlay}
+ >
+     {src ? (
+         <>
+             <video
+                 ref={ref}
+                 src={src}
+                 className="absolute inset-0 w-full h-full object-contain"
```

**変更点:**
1. Video wrapper から `flex items-center justify-center` を削除
2. `relative` を追加（子の absolute の基準）
3. `<video>` に `absolute inset-0` を追加
4. `<video>` から `max-h-full` を削除（不要）

---

## 検証方法

```bash
# 1. 小さいビューポート (768x600) でテスト
# 2. DevTools で以下を確認:

Video wrapper computed height < 親の高さ - Controls の高さ
Controls computed height === 期待値 (~280px)
Timeline visible === true
```
