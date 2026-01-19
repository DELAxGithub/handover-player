# Handover Player Design Guidelines

## 1. Design Philosophy
**"Invisible & Professional"**
プロフェッショナルな映像制作ツールとして、UIはコンテンツ（映像）の邪魔をせず、かつ「信頼感」のある堅牢なデザインを目指す。
行き当たりばったりのスタイル（独自の青、緑など）を排除し、彩度を落としたモノトーンベースで統一する。

## 2. Color System (Dark Mode Only)

### Backgrounds
*   **App Background**: `bg-zinc-950` (#09090b) - メイン背景。完全な黒ではなく、深みのある黒。
*   **Surface (Card/Sidebar)**: `bg-zinc-900` (#18181b) - サイドバーやパネル。
*   **Elevated (Modal/Dropdown)**: `bg-zinc-800` (#27272a) - ドロップダウン、モーダル。borderと併用。
*   **Input/Item**: `bg-zinc-950` or `bg-zinc-800` - 入力欄など。

### Borders
*   **Subtle**: `border-zinc-800` (#27272a) - 区切り線。
*   **Interactive**: `border-zinc-700` (#3f3f46) - ホバー時や入力欄。

### Text
*   **Primary**: `text-zinc-100` (#f4f4f5) - 本文、主要ラベル。
*   **Secondary**: `text-zinc-400` (#a1a1aa) - 補足情報、プレースホルダー。
*   **Muted**: `text-zinc-500` (#71717a) - 無効化、メタデータ。

### Accents (Functional)
*   **Primary Action (Brand)**: `bg-indigo-600` (Hover: `bg-indigo-500`) - 重要な実行ボタン。
*   **Destructive**: `text-red-400` / `hover:bg-red-900/20`
*   **Success**: `text-emerald-400`

## 3. Component Styles

### Buttons
*   **Primary**: `bg-zinc-100 text-zinc-900 hover:bg-zinc-200 font-medium rounded-md px-3 py-1.5`
*   **Secondary**: `bg-zinc-800 text-zinc-200 border border-zinc-700 hover:bg-zinc-700 rounded-md px-3 py-1.5`
*   **Ghost/Icon**: `text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 rounded-md p-1.5`

### Overlays (Dropdowns/Modals)
*   Shadow: `shadow-xl shadow-black/50`
*   Border: `border border-zinc-700`
*   Animation: `transition-all duration-200 ease-out`
*   Backdrop: `bg-black/60 backdrop-blur-sm`

## 4. Typography
*   **Font Family**: `Inter` (Sans-serif), `JetBrains Mono` (Code/Timecode)
*   **Size**:
    *   Base: `text-sm` (14px)
    *   Small: `text-xs` (12px)
    *   Heading: `text-base` (16px) font-bold

## 5. Spacing
*   **Grid**: 4px base (`gap-1`, `p-1`).
*   **Padding**:
    *   Container: `p-4` or `p-6`
    *   Item: `py-2 px-3`

---
*このガイドラインに基づき、既存のコンポーネントを順次リファクタリングする。*
