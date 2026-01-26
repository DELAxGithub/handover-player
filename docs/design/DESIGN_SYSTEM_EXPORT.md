# Design System Export - Handover Player

**Exported**: January 26, 2026
**Source**: `handover.pen`
**Theme**: Dark Mode

---

## Design Tokens (CSS Variables)

### Colors - Dark Mode

```css
:root {
  /* Base */
  --background: #09090b;
  --foreground: #FAFAFA;
  --card: #18181b;
  --card-foreground: #FAFAFA;

  /* Primary */
  --primary: #FF8400;
  --primary-foreground: #111111;

  /* Secondary */
  --secondary: #27272a;
  --secondary-foreground: #FAFAFA;

  /* Muted */
  --muted: #27272a;
  --muted-foreground: #A1A1AA;

  /* Accent */
  --accent: #27272a;
  --accent-foreground: #FAFAFA;

  /* Destructive */
  --destructive: #EF4444;

  /* Border & Input */
  --border: #27272a;
  --input: #27272a;
  --ring: #4F46E5;

  /* Status Colors */
  --color-error: #450A0A;
  --color-error-foreground: #EF4444;
  --color-warning: #422006;
  --color-warning-foreground: #EAB308;
  --color-success: #052E16;
  --color-success-foreground: #22C55E;

  /* Sidebar */
  --sidebar: #18181b;
  --sidebar-foreground: #fafafa;
  --sidebar-accent: #2a2a30;
  --sidebar-accent-foreground: #fafafa;
  --sidebar-border: rgba(255, 255, 255, 0.1);

  /* Utility */
  --black: #000000;
  --white: #FFFFFF;
}
```

### Typography

```css
:root {
  --font-primary: 'Inter', sans-serif;
  --font-secondary: 'JetBrains Mono', monospace;
}
```

### Border Radius

```css
:root {
  --radius-none: 0;
  --radius-pill: 6px;  /* Default rounded */
  --radius-m: 8px;
}
```

---

## Component Specifications

### 1. Input OTP Group (`M5Mgn`)

6桁のパスコード入力フィールド

```
Width: 274px
Gap between inputs: -1px (overlapping borders)
Individual input: 40px height, fill_container width
```

**Structure:**
```
Input OTP Group
├── Label Text (optional)
│   └── Text: "Label Text" (14px, $--font-secondary, 500 weight)
└── Input OTP Container
    ├── Input OTP (left, rounded-left corners)
    ├── Input OTP × 5 (middle, no corner radius)
    └── Input OTP (right, rounded-right corners)
```

**Styling:**
- Background: `$--background`
- Border: 1px solid `$--input`
- Corner radius: `$--radius-pill` on outer edges
- Height: 40px per input

---

### 2. Button/Default (`ZETEA`)

標準ボタン

```
Height: 40px
Padding: 10px 16px
Corner Radius: $--radius-pill (999px / pill shape)
Gap: 6px (icon + text)
```

**Styling:**
- Background: `$--primary` (#FF8400)
- Text: `$--primary-foreground` (#111111)
- Font: 14px, $--font-primary, 500 weight
- Center aligned

---

### 3. Button/Large/Default (`ZGI9Z`)

大きいプライマリボタン

```
Height: 48px
Padding: 12px 24px
Corner Radius: $--radius-pill
Gap: 6px (icon + text)
Icon Size: 24px
```

**Styling:**
- Background: `$--primary` (#FF8400)
- Text: `$--primary-foreground` (#111111)
- Font: 14px, $--font-primary, 500 weight

---

### 4. Alert/Error (`YZjRF`)

エラーメッセージ表示

```
Width: fill_container (max 640px)
```

**Styling:**
- Background: `$--color-error` (#450A0A)
- Text/Icon: `$--color-error-foreground` (#EF4444)

**Content Structure:**
- Icon (24px)
- Title: "Communication link lost" style text
- Description: Detailed error message

---

### 5. Alert/Warning (`vbyqV`)

警告メッセージ表示

```
Width: fill_container (max 640px)
```

**Styling:**
- Background: `$--color-warning` (#422006)
- Text/Icon: `$--color-warning-foreground` (#EAB308)

**Use Case:** 期限切れ警告 ("Expires in 48 hours" など)

---

### 6. Label/Secondary (`it00G`)

ステータスバッジ / ラベル

**Use Case:** "Expired" バッジなど

---

### 7. Card (`ERkuB`)

コンテナカード

```
Width: 399px (default, adjustable)
Corner Radius: $--radius-none (0)
```

**Structure:**
```
Card
├── Card Header (68px height, padding 24px)
├── Card Content (fit_content, padding 24px, gap 8px)
└── Card Actions (68px height, padding 24px, gap 8px)
```

**Styling:**
- Background: `$--card` (#18181b)
- Border: 1px solid `$--border` (#27272a)
- Shadow: 0 1px 1.75px rgba(0,0,0,0.05)

---

### 8. Modal/Center (`5JUG0`)

中央配置モーダル

```
Width: 400px
Based on: Card component
```

**Structure:**
```
Modal/Center
├── Modal Header
│   ├── Modal Title (20px, 600 weight, center aligned)
│   └── Modal Subtitle (14px, $--muted-foreground, center aligned)
├── Modal Body (empty slot for content)
└── Modal Actions
    └── Actions Container (gap 12px, center justified)
        ├── Primary Button (fill_container)
        └── Secondary Button (fill_container)
```

---

### 9. Select Group/Default (`XhJWF`)

ドロップダウン選択

```
Width: 274px
Trigger Height: 40px
```

**Structure:**
```
Select Group
├── Label Text (14px, $--font-secondary, 500 weight)
└── Select Trigger
    ├── Selected Option Text (14px, $--muted-foreground)
    └── Chevron Down Icon (16px, 50% opacity)
```

**Styling:**
- Background: `$--background`
- Border: 1px solid `$--input`
- Corner Radius: `$--radius-pill`
- Padding: 8px 16px

---

## Phase 2 Screens - Component Mapping

### Screen 1: Passcode Entry

| Element | Component ID | Notes |
|---------|-------------|-------|
| OTP Input | `M5Mgn` | 6-digit input |
| Submit Button | `ZETEA` | "Enter" text |
| Error Message | `YZjRF` | "Incorrect passcode" |
| Container | `5JUG0` | Modal/Center |

### Screen 2: Expired Project Lock

| Element | Component ID | Notes |
|---------|-------------|-------|
| Container | `ERkuB` | Card |
| Expired Badge | `it00G` | Label/Secondary |
| Extend Button | `ZGI9Z` | Button/Large/Default |

### Screen 3: ShareModal Expiration Settings

| Element | Component ID | Notes |
|---------|-------------|-------|
| Duration Dropdown | `XhJWF` | Select Group |
| Warning Banner | `vbyqV` | Alert/Warning |

---

## Implementation Notes

1. **Dark Mode Only**: これらのスペックはダークモード専用
2. **Font Loading**: Inter と JetBrains Mono をプリロードすること
3. **Border Radius**: `--radius-pill: 6px` を使用（デザインでは999pxだがCSSでは6px推奨）
4. **Responsive**: モーダルは400px固定幅、モバイル対応は別途検討

---

## File Reference

- Design File: `/Users/delaxstudio/Documents/handover.pen`
- Target Frame: Step 3 Frame (`CzlXB`) - 1440×900px @ (3747, -1531)
