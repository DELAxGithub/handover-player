# Timeline Component Cutoff - Root Cause Analysis & Fix Proposal

## Root Cause

**App.css の `#root` に設定された padding が元凶**

```css
/* src/App.css - LINE 1-5 */
#root {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem;      /* ← これが64px (上下32px×2) を奪っている */
  text-align: center;
}
```

### 高さ計算の内訳 (768px viewport の場合)

```
Browser Viewport:        768px
─────────────────────────────────
#root padding (top):    - 32px
#root padding (bottom): - 32px
─────────────────────────────────
Available for App:       704px

Header (h-16):          - 64px
─────────────────────────────────
Available for content:   640px

Control Area:           ~250-270px
  - Progress bar:         32px
  - Controls row:        120px
  - Timeline (min-h):     88px
─────────────────────────────────
Video Area:             370-390px  ← 非常に狭い

→ overflow-hidden により Timeline が見切れる
```

---

## 修正方法

### Fix 1: App.css の #root スタイルを削除/修正 (必須)

```css
/* src/App.css */

/* BEFORE (問題あり) */
#root {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}

/* AFTER (修正後) */
#root {
  /* 全画面レイアウトのため制約を外す */
  width: 100%;
  height: 100%;
  /* padding と max-width は削除 */
}
```

**または App.css 自体を削除** (Tailwind で全てカバーしているため不要)

---

### Fix 2: Control Area に max-height を設定 (推奨)

```jsx
// src/components/VideoPlayer.jsx

// BEFORE
<div className="w-full bg-neutral-900/95 ... flex flex-col ... flex-shrink-0">

// AFTER - max-height と overflow 対策を追加
<div className="w-full bg-neutral-900/95 ... flex flex-col ... flex-shrink-0 max-h-[280px] overflow-y-auto">
```

---

### Fix 3: Timeline の min-h をレスポンシブ化 (任意)

```jsx
// src/components/Timeline.jsx

// BEFORE
<div className="... min-h-[80px] ...">

// AFTER - 小画面では縮小を許可
<div className="... min-h-[60px] sm:min-h-[80px] ...">
```

---

### Fix 4: Grid row に max-height 制約を追加 (代替案)

```jsx
// src/components/VideoPlayer.jsx

// BEFORE
<div className="... grid grid-rows-[minmax(0,1fr)_auto] ...">

// AFTER - Control row に最大値を設定
<div className="... grid grid-rows-[minmax(0,1fr)_minmax(auto,280px)] ...">
```

---

## 優先度

| 修正 | 優先度 | 効果 |
|------|--------|------|
| Fix 1: App.css の padding 削除 | **必須** | 64px の高さを即座に回復 |
| Fix 2: Control Area max-height | 高 | 小画面でのオーバーフロー防止 |
| Fix 3: Timeline レスポンシブ | 中 | 極小画面での表示改善 |
| Fix 4: Grid max-height | 低 | Fix 2 の代替 |

---

## 検証方法

```bash
# 1. Chrome DevTools でビューポートを 768px に設定
# 2. Elements パネルで各要素の computed height を確認
# 3. 以下が成立することを確認:

#root height      === 100dvh (padding なし)
App container     === 100dvh
Header            === 64px
Main content      === 100dvh - 64px
Control area      <= 280px
Timeline          >= 60px (visible)
```

---

## 補足: なぜ今まで見つからなかったか

- `App.css` は Vite のデフォルトテンプレートの残骸
- `h-[100dvh]` を App.jsx に設定したため、一見正しく見える
- 実際には `#root` の padding が CSS 詳細度で勝っていた
- `overflow-hidden` が切り取りを隠蔽していた

---

## ファイル修正箇所まとめ

| ファイル | 行 | 修正内容 |
|----------|-----|----------|
| `src/App.css` | 1-5 | `#root` のスタイルを削除または修正 |
| `src/components/VideoPlayer.jsx` | 126 | Control area に `max-h-[280px]` 追加 |
| `src/components/Timeline.jsx` | 7 | `min-h-[60px] sm:min-h-[80px]` に変更 |
