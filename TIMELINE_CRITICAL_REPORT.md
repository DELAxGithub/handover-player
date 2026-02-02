# 🚨 Critical UX Issue Report: Timeline Implementation & Layout Stability

## 概要
タイムラインUI（マーカー表示、再生位置インジケーター、トラックデザイン）の実装が、度重なるレイアウト修正（Grid vs Overlay）の過程で意図した状態になっていない、または見えなくなってしまっています。
現在 v7.0 (Grid Layout with Absolute Video) ですが、UX要件を満たす実装が見当たらない状態です。

## 現状の問題点
1. **タイムラインのデザイン未反映**: 以前実装した「塗りつぶしなしトラック」「鋭いプレイヘッド」「強調されたマーカー」が、レイアウトロールバックなどの影響で消失、あるいは視認できない状態になっている可能性があります。
2. **Layout Thrashing**: Grid → Overlay → Grid と変更を繰り返した結果、コードベースに不要なスタイル定義が残存している可能性があります。
3. **ユーザー体験の毀損**: 「見切れる」問題を直そうとして「デザインそのもの」が犠牲になっています。

## 現在のコード状況 (v7.0)
### `VideoPlayer.jsx`
- Layout: Grid (`rows-[minmax(0,1fr)_auto]`)
- VideoWrapper: `relative min-h-0` + `absolute video` (レイアウト崩れ対策済み)
- ControlArea: `bg-neutral-900/95` (Solid background)

### `Timeline.jsx` (疑わしい箇所)
```jsx
// 現在の最新コードでは以下のはずですが、ブラウザで見えていない可能性があります
<div className="absolute top-2 bottom-2 left-0 right-0 bg-zinc-600 ...">
  {/* Markers: bg-cyan-400 */}
</div>
```
Gridレイアウトに戻ったことで、Timelineコンテナの高さ (`min-h-[80px]`) が正しく確保されているか、背景色とのコントラストが十分か再確認が必要です。

## CTOへの質問事項
1. **デザインの永続化**: レイアウト方式（Grid/Overlay）に関わらず、Timelineコンポーネント内部のデザイン（トラック、マーカー、ヘッド）が確実に描画されるようにするには、Timelineをどのように「独立」させるべきか？
2. **絶対的なレイアウト保証**: ブラウザのレンダリング癖（特にVideoタグ）に左右されず、常に「画面下部 100px は確実にコントロール領域として確保する」ためのベストプラクティスは何か？（現在の `minmax(0,1fr)` + `absolute video` アプローチで正しいか？）
3. **現状の打開策**: 今まさに「戻っただけで実装されていない」と言われている状況に対し、最も低リスクかつ確実にデザインを反映させる手順は？

## 添付資料
- 現在のスクリーンショット (ユーザー提供)
- `src/components/Timeline.jsx` のソースコード
- `src/components/VideoPlayer.jsx` のソースコード
