
# Handover Player Roadmap & Strategy

## 🎯 Core Value Proposition

**「一次フィードバックを最速で集め、編集に戻す」**

* **Minimal Friction**: Dropbox直リンク・ログイン不要・NLEライクな操作性
* **High Precision**: フレーム単位の正確さ & プロ仕様ショートカット
* **Strong Exit**: NLE（Premiere/Resolve）へ直結するマーカー書き出し

## 🗺️ Roadmap

### Phase 1: MVP Polish & "The Exit" (Done ✅)

* [x] **Basic Playback**（Dropbox直再生 / 4K）
* [x] **Pro Controls**（JKL / 近似フレーム精度）
* [x] **Comment System**（スレッド/Realtime）
* [x] **Export**：Premiere XML / Resolve CSV / Generic CSV
* [x] **UX/UI Polish**：Dark DS / Local History / Top Nav / Live Presence / Changelog

---

### Phase 2: Security & Peace of Mind（実装中）

**目的**：外部共有の“最低限ガード”を低摩擦で提供し、商用利用の安心ラインを作る。

**機能要件（MVP）**

* [ ] **Projects 基盤の整備（新規・最優先）**
  * Supabaseに `projects` を新設し、**期限/パス/状態/アドオン**を一元管理
  * RLSで**“閲覧＝有効セッション×対象プロジェクトのみ”**に制限
* [ ] **Passcode（基本機能）**
  * 共有リンクに**任意パスコード**を付与（6桁以上）
  * 3回ミスで30秒クールダウン / 成功で24hセッション
  * **後付け可能**（付与時は既存セッション失効）
* [ ] **Expiration（期限）**
  * 既定**7日**。プリセット：3/7/14/30/60/100日
  * 期限前**48h/24h/当日**のリマインダーバナー
  * 期限切れ時は**ロック画面**（タイトル/件数表示＋延長CTA）

**要件定義：Projects 基盤**

*   **Schema**:
    *   `id` (UUID), `source_url`, `created_at`
    *   `expires_at` (Default: +7days)
    *   `passcode_hash` (Null=Public)
    *   `status` (active/expired/archived)
    *   `features` (JSONB: {passcode:bool, export_count:int})
*   **Access Control**:
    *   `projects`: Not public. Fetched via secure Edge Functions.
    *   `comments`: RLS restricted to valid sessions (sid).
*   **Lifecycle**:
    *   Active -> Expired (Auto by date).
    *   Expired: View/Comments blocked -> "Extend" CTA shown.

---

### Phase 2.5: Lite-style Add-ons（“必要瞬間だけ課金”）⭐新規

**目的**：ギガファイル期待値を維持しつつ、困りどころで小額課金を成立させる。

**プロダクト方針**
*   デフォは**超低摩擦（Lite）**。URL＋任意パス、7日で自然終了。
*   課金は**3つの瞬間**に限定：**パス付けたい／期限延長したい／書き出し2回目以降**。

**アドオン要件**
* [ ] **Passcode Add-on**：**$3 / プロジェクト**
  * 共有モーダルでONトグル→決済→即有効
* [ ] **Expiration Extend**：**+7日 $2 / +30日 $5**
  * 期限48h前から上部バーで提案→1クリック決済→`expires_at`更新
* [ ] **Export Extra**：**2回目以降 $3/回**
  * 初回は無料。同一内容の再DLは無料。

---

### Phase 3: Monetization & Validation

**目的**：継続利用向けに“Pro”の土台を可視化し、価格妥当性を検証。

* [ ] **Pricing Page（Smoke Test）**
  * Lite vs Pro 比較表：**Lite=使い捨て**, **Pro=責任ある共有**
* [ ] **Cloud Sync Dashboard（Proの核）**
  * Supabase Authでプロジェクトをクラウド管理
  * Active/Archive、簡易アクセスログ、ブランド設定

**互換・移行ポリシー**
*   既存プロジェクト（IDのみ）は、初回アクセス時に `projects` レコードを自動生成（期限7日）。
*   コメントAPI利用時は `project_id` 存在チェックを厳格化。

---

## 📏 ガードレール（ポリシー）

* Liteは**「URLを知る人は誰でも閲覧可」**を明示表示
* 乱用対策の通報導線・URL無効化ボタンを常設
* 重要案件／機密は**Pro推奨バナー**を共有時に提示

---
