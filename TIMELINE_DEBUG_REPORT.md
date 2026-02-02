# 🐛 Bug Report: Timeline Control Bar Overflowing Screen (v5.2)

## 概要
動画プレイヤーのUIにおいて、下部のコントロールバー（特にTimeline部分）が**画面下にはみ出してしまい、見えなくなる**、または**スクロールバーが出現してしまう**問題が解決しません。
デザインシステム v5.2（Grid修正＋root修正版）でも解消されません。

## 現象
- プレイヤー画面全体の高さ計算が合わず、一番下のTimelineが見切れる。
- スクロールバーが出現し、スクロールしないとTimeline全体が見えない。

## 実装履歴と結果
1. **v3.x**: Timelineが潰れる (`h-0` になる) → `flex-shrink-0` と `min-h` で解決を試みるも見切れ発生。
2. **v4.x**: `#root` の `padding` が原因と推測し `src/index.css` で `#root { width: 100%; height: 100%; padding: 0; }` を適用 → 変化なし。
3. **v5.0**: コントロールバーに `max-h-[280px]` と `overflow-y-auto` を適用 → **スクロールバーが出現してしまう（ユーザビリティ低下）。**
4. **v5.2**: `overflow` を削除し、Grid (`minmax(0, 1fr)`) にリフローを任せる → **再び見切れる、またははみ出す。**

## 現在のコード構造
```jsx
// src/components/VideoPlayer.jsx
<div className="w-full h-full grid grid-rows-[minmax(0,1fr)_auto] bg-black ...">
    <div className="... min-h-0"> {/* Video Area */} </div>
    <div className="... flex-shrink-0"> {/* Control Area */} </div>
</div>
```

```css
/* src/index.css */
#root {
  width: 100%;
  height: 100%;
  padding: 0;
  margin: 0;
}
```

## 疑われる原因
ブラウザ（特にSafari/Mac Chrome）における `100vh` と `100%` の挙動、および `video` 要素の `aspect-ratio` 維持がGridの縮小計算より優先されている可能性が高いです。Flexbox / Grid の `min-height: 0` が内側の `video` タグまで伝播していない可能性があります。

## 依頼事項
物理的に画面内に収めるための、より強力なレイアウト修正案（絶対配置の使用や、Videoタグへのラッパー変更など）を検討してください。
