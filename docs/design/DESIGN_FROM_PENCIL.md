# Pencil デザイン情報

**ファイル**: `pencil-welcome-desktop.pen`
**取得日**: 2026年1月26日

---

## フレーム一覧

### Step 1 Frame (`cOnQP`)
- **テーマ**: Light mode
- **サイズ**: 1440 x 900px
- **内容**: サイドバー付きダッシュボード

**構成要素**:
- サイドバー (`d5ZTS`) - LUNARIS ブランディング
  - セクションタイトル (`h12kK`)
  - アクティブアイテム (`dOLzc`)
  - 通常アイテム (`X6nwq`) x3
- コンテンツエリア
  - タブ (`Kbr4h`): Integrations(アクティブ), Billing, Profile, Advanced
  - 成功アラート (`nIj3a`)
  - データテーブル (`yLiVX`)

---

### Step 2 Frame (`tlPHu`)
- **テーマ**: Dark mode
- **サイズ**: 1440 x (height未指定)
- **内容**: ローバーデータテーブル

**テーブル構造** (`pPOgy`):
| Status | Name | Description | Return date |
|--------|------|-------------|-------------|
| New (Success) | Aurora Scout | Lightweight rover ideal for high-speed reconnaissance. | Sol 543 |
| Active (Orange) | Curiosity-X | Reliable all-rounder for exploration and sample collection. | Sol 527 |
| Active (Orange) | Pathfinder Neo | Compact model for short-range geological missions. | Sol 519 |
| Maintenance (Secondary) | Spirit-9 | Completed mapping of Sector D-12 successfully. | — |

**使用ラベルコンポーネント**:
- `7KC5U`: Label/Success (New)
- `L8Rgv`: Label/Orange (Active)
- `it00G`: Label/Secondary (Maintenance)

---

### Step 3 Frame (`CzlXB`)
- **テーマ**: Dark mode
- **サイズ**: 1440 x 900px
- **位置**: x: 3747, y: -1531
- **状態**: **空** (背景色のみ: `$--background`)

---

## デザインシステム変数

### カラー（Dark mode 値）

| 変数名 | 値 |
|--------|-----|
| `--background` | `#09090b` |
| `--foreground` | `#FAFAFA` |
| `--card` | `#18181b` |
| `--card-foreground` | `#FAFAFA` |
| `--primary` | `#FF8400` |
| `--primary-foreground` | `#111111` |
| `--secondary` | `#27272a` |
| `--secondary-foreground` | `#FAFAFA` |
| `--muted` | `#27272a` |
| `--muted-foreground` | `#A1A1AA` |
| `--accent` | `#27272a` |
| `--accent-foreground` | `#FAFAFA` |
| `--destructive` | `#EF4444` |
| `--border` | `#27272a` |
| `--input` | `#27272a` |
| `--ring` | `#4F46E5` |

### ステータスカラー

| 変数名 | 値 |
|--------|-----|
| `--color-success` | `#052E16` |
| `--color-success-foreground` | `#22C55E` |
| `--color-warning` | `#422006` |
| `--color-warning-foreground` | `#EAB308` |
| `--color-error` | `#450A0A` |
| `--color-error-foreground` | `#EF4444` |

### フォント

| 変数名 | 値 |
|--------|-----|
| `--font-primary` | `Inter` |
| `--font-secondary` | `JetBrains Mono` |

### 角丸

| 変数名 | 値 |
|--------|-----|
| `--radius-m` | `8` |
| `--radius-pill` | `6` |
| `--radius-none` | `0` |

---

## 利用可能なコンポーネント（100個）

### ボタン
- `ZETEA`: Button/Default
- `U83R7`: Button/Secondary
- `ftEoU`: Button/Destructive
- `4x7RU`: Button/Outline
- `Svd9t`: Button/Ghost
- `ZGI9Z`: Button/Large/Default
- `89sf2`: Button/Large/Secondary
- `HXajN`: Button/Large/Destructive
- `EAwax`: Button/Large/Outline
- `zIDRN`: Button/Large/Ghost

### アイコンボタン
- `pEY1B`: Icon Button/Default
- `HWbHA`: Icon Button/Secondary
- `ai6BP`: Icon Button/Destructive
- `xQWwZ`: Icon Button/Outline
- `eNU2w`: Button/Ghost
- `o27Xt`: Icon Button/Large/Default
- `vv6Lu`: Icon Button/Large/Secondary
- `o49Ro`: Icon Button/Large/Destructive
- `tzDL1`: Icon Button/Large/Outline
- `ubB6W`: Icon Button/Large/Ghost

### 入力
- `592AB`: Input/Default
- `URXVp`: Input/Filled
- `gKpi4`: Input Group/Default
- `z6HCm`: Input Group/Filled
- `oiT6B`: Textarea/Default
- `nvIIa`: Textarea/Filled
- `QFzE8`: Textarea Group
- `M5Mgn`: Input OTP Group/Default
- `JFrjZ`: Input OTP Group/Filled
- `T5yK2`: Search Box/Default
- `Zksub`: Search Box/Filled

### 選択
- `XhJWF`: Select Group/Default
- `mTHMq`: Select Group/Filled
- `Wxq1C`: Checkbox/Default
- `r91nP`: Checkbox/Checked
- `5Wp4y`: Checkbox/Default
- `YIw6B`: Checkbox/Checked
- `VYDf7`: Checkbox Description/Default
- `8zOyn`: Checkbox Description/Checked
- `t3kqz`: Radio/Default
- `hMm4B`: Radio/Selected
- `Ao9E1`: Radio/Default
- `u61z6`: Radio/Selected
- `yoahP`: Radio Description/Default
- `20Ebu`: Radio Description/Selected
- `wk1O8`: Switch/Default
- `zdFKu`: Switch/Checked

### ラベル・バッジ
- `7KC5U`: Label/Success
- `L8Rgv`: Label/Orange
- `rjvI1`: Label/Violet
- `it00G`: Label/Secondary
- `XYdcn`: Icon Label/Secondary
- `Ffti9`: Icon Label/Success
- `A58oI`: Icon Label/Violet
- `7Fif0`: Icon Label/Orange

### アラート
- `ITZkn`: Alert/Info
- `nIj3a`: Alert/Success
- `vbyqV`: Alert/Warning
- `YZjRF`: Alert/Error

### ナビゲーション
- `Kbr4h`: Tabs
- `KbyBJ`: Tab Item/Active
- `BdBJJ`: Tab Item/Inactive
- `d5ZTS`: Sidebar
- `h12kK`: Sidebar Section Title
- `dOLzc`: Sidebar Item/Active
- `X6nwq`: Sidebar Item/Default
- `nW26m`: Breadcrumb Item/Default
- `mErlM`: Breadcrumb Item/Active
- `axCNF`: Breadcrumb Item/Separator
- `xzG1l`: Breadcrumb Item/Ellipsis
- `9PVw5`: Pagination
- `oT0d2`: Pagination Item/Active
- `Doslm`: Pagination Item/Default
- `Irk3I`: Pagination Item/Ellipsis

### テーブル
- `pPOgy`: Table
- `T73Cd`: Table Row
- `uKYIj`: Table Cell
- `tbrR4`: Table Column Header
- `yLiVX`: Data Table
- `VnGc5`: Data Table Header
- `j9N2Y`: Data Table Footer

### カード
- `ERkuB`: Card
- `ksvfk`: Card Image
- `wg5F3`: Card Action
- `eBwLd`: Card Plain

### モーダル・ダイアログ
- `cYAuh`: Dialog
- `izigX`: Modal/Left
- `5JUG0`: Modal/Center
- `DBtsv`: Modal/Center Icon

### その他
- `xCEfn`: Tooltip
- `W4YFH`: Progress
- `DFcCn`: Accordion/Closed
- `3bQzF`: Accordion/Open
- `cH4wO`: Dropdown
- `5RtqD`: List Item/Checked
- `Nb9Jh`: List Item/Unchecked
- `IAQUJ`: List Item Title
- `ZIXiw`: List Divider
- `4AN1p`: Avatar/Image
- `90SQo`: Avatar/Text

---

## Phase 2 デザイン作成に推奨するコンポーネント

### パスコード入力画面
- `M5Mgn`: Input OTP Group/Default（6桁入力）
- `ZETEA`: Button/Default（送信ボタン）
- `YZjRF`: Alert/Error（エラー表示）
- `5JUG0`: Modal/Center（モーダルコンテナ）

### 期限切れロック画面
- `ERkuB`: Card（コンテナ）
- `ZETEA`: Button/Default（延長CTAボタン）
- `it00G`: Label/Secondary（ステータス表示）

### ShareModal 拡張
- `XhJWF`: Select Group/Default（期限プリセット選択）
- `vbyqV`: Alert/Warning（リマインダーバナー）
