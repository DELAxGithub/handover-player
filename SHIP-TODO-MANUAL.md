# Ship前の手動TODO (Phase A)

> Claude が自動で実行できない「人間側が動く必要がある」タスクだけまとめた。
> 期限: 2026-04-30。完了したらチェック。

---

## 🔑 外部サービスのアカウント作成・クレデンシャル取得

コード側は Claude が書けるが、アカウント作成と API キー/secret 取得は手動。

### Stripe（必須 / 最優先）
- [ ] Stripe アカウント作成（既存なければ）
- [ ] テストモード → ライブモード切り替え準備
- [ ] **Publishable key / Secret key** を `.env` に登録（Claude に渡す）
- [ ] **Payment Links 3種類作成**:
  - Passcode Add-on — $3（1回払い）
  - Expiration Extend +7days — $2（1回払い）
  - Expiration Extend +30days — $5（1回払い）
  - Export Extra — $3（1回払い）
- [ ] 各 Payment Link の `metadata` に `feature_type` を設定（後でWebhookで判別用）
- [ ] **Webhook endpoint** 作成先URL を決定（Vercel Edge Function予定 `/api/stripe-webhook`）
- [ ] Webhook Signing Secret を取得 → `.env`

### エラー監視 (Sentry)
- [ ] Sentry アカウント作成（無料プランでOK、$0 / 5k events）
- [ ] プロジェクト作成（React 用）
- [ ] **DSN** 取得 → `.env` に `VITE_SENTRY_DSN`

### 分析 (どちらか1つ選ぶ)
- [ ] 選択: **PostHog**（ファネル強い、無料1M events/月） or **Plausible**（プライバシー重視、有料$9/月）
- [ ] アカウント作成 → API key or site ID 取得 → `.env`

### 死活監視
- [ ] uptimerobot アカウント作成（無料）
- [ ] `handover.to` への ping 5分間隔で登録
- [ ] Slack or Discord webhook で通知先を決める

### ドメイン・メール
- [ ] **ドメイン確定** — `handover.to` 利用可能か確認、取得 (~$40/年)
- [ ] Vercel にドメイン接続
- [ ] `support@handover.to` を Gmail (h.kodera@gmail.com) に転送設定（Cloudflare Email Routing 無料でOK）
- [ ] `legal@handover.to` / `dmca@handover.to` も同じく転送設定

---

## 📝 方針決定 (Claude が決められない選択)

### 価格確定
- [ ] Pro月額: **$12** で確定？ それとも $9 にする？
- [ ] Team月額: **$29** で確定？
- [ ] Add-on料金は ROADMAP 通り（Passcode $3 / +7d $2 / +30d $5 / Export $3）でOK？
- [ ] 年額プラン: Pro $120 (2ヶ月無料) ？ or Phase D まで月額のみ？

### LP ポジショニング
- [ ] **一番目立つワンライナー** を確定
  - 案1: "Frame.io for teams that don't want to count seats."
  - 案2: "Review videos from Dropbox — no re-uploads, no per-seat fees."
  - 案3: 自分で書く
- [ ] 日本語サブコピー要る？（JP/EN 両対応するか）
- [ ] 対象顧客明示: 「フリーランス動画編集者 / 小規模プロダクション」でOK？

### 返金ポリシー
- [ ] Add-on（単発課金）の返金: **原則返金なし** or **7日以内無条件返金**？
- [ ] 月額: 7日 / 14日 / 30日 クーリングオフ?

### DMCA
- [ ] 受付メール: `dmca@handover.to` で統一？
- [ ] 対応SLA明記: 「24h以内確認 / 72h以内判断」等

### ブランド資産
- [ ] ロゴ/favicon（既にある？要確認）
- [ ] OGP画像（LP用、1200×630）
- [ ] メールから送る時の署名/テンプレート

---

## ⚖️ 法務・公開準備

### Terms of Service / Privacy Policy
- [ ] Claude がテンプレ起こしたドラフトを **個人で必ず目を通す**
- [ ] 準拠法: **日本法** or **米国DE州**？（個人事業なら日本法が自然）
- [ ] 裁判管轄: 東京地裁 指定？
- [ ] 免責の範囲（動画コンテンツ起因の損害は免責、など）
- [ ] 必要なら弁護士チェック（Phase Bで有料ユーザー出る前に）

### 特定商取引法表記（日本法人/個人事業の場合必須）
- [ ] 事業者名: **小寺 秀和** / 屋号 DELAX で登記？
- [ ] 住所: 公開可能な住所（マラガ滞在中だがビジネス住所は日本？）→ **バーチャルオフィス** or 自宅公開？
- [ ] 電話番号: 必須項目（公開しない場合は即時開示対応）
- [ ] `/tokutei` 静的ページ作成判断

### クッキー・プライバシー
- [ ] 日本の改正個人情報保護法 / EU GDPR / 米国CCPA の適用範囲判断
  - 個人データ保存最小化は既に設計済み → OK
  - Cookie consent は分析ツール入れるなら必須

---

## 🎨 Claude にやってもらう時に必要な判断材料

以下は Claude がコードを書く前に返答が必要なもの:

- [ ] **LP のレイアウト方針**: 1ページ長いスクロール or 複数ページ？
- [ ] **LP のスタック**: Handover本体に埋め込む？ 別リポジトリ？ 別ドメイン？
- [ ] **Sentry 追加時のサンプリング率**: 100% / 10%（有料プラン節約用）？
- [ ] **Passcode デフォルトON の判定**: projectMeta に Pro/Team フラグがない場合どう判定する？（要仕様）

---

## ⏱️ 推奨実施順

1. **ドメイン取得** → Vercel 接続（他が進めやすくなる）
2. **Stripe アカウント + Payment Links**（決済ブロック外す）
3. **Sentry + 分析ツール選定**（計測ブロック外す）
4. **方針決定（価格・LP文言）**（LP 着手ブロック外す）
5. **法務関連**（Terms ドラフト後に判断）

ここがクリアになれば、あとは Claude が自動で走れる。
