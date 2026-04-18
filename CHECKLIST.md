# Ship Checklist

> 隙間時間でパッと進めるための実務チェックリスト。詳細は [SHIP-TODO-MANUAL.md](SHIP-TODO-MANUAL.md) 参照。
> 期限: 2026-04-30

---

## 🏃 5分でできる（スマホでもOK）

- [ ] Stripe アカウント作成 or ログイン
- [ ] Sentry アカウント作成（https://sentry.io）
- [ ] uptimerobot アカウント作成（https://uptimerobot.com）
- [ ] PostHog か Plausible か決める（この1行だけ決めれば次進める）
- [ ] 返金ポリシー決定: **原則返金なし** / **7日以内無条件** / **14日以内** どれ？
- [ ] DMCA受付アドレスを `dmca@handover.to` でOKか確認
- [ ] Pro価格 $12 / Team価格 $29 で確定させるか判断
- [ ] LPワンライナー選択: 1) Frame.io for teams / 2) Review videos from Dropbox / 3) 自作

---

## ⏱ 15-30分（PCで集中）

- [ ] ドメイン `handover.to` の利用可否確認 → 取得（Cloudflare or お名前）
- [ ] Cloudflare Email Routing で `support@` `dmca@` `legal@` を Gmail に転送
- [ ] Vercel にドメイン接続
- [ ] Stripe で Payment Links 4本作成:
  - [ ] Passcode Add-on $3
  - [ ] Expiration +7days $2
  - [ ] Expiration +30days $5
  - [ ] Export Extra $3
- [ ] Stripe の Publishable / Secret key をメモ（後で .env 投入）
- [ ] Stripe Webhook Signing Secret を発行してメモ
- [ ] Sentry で React プロジェクト作成 → DSN コピー
- [ ] 選んだ分析ツールでプロジェクト作成 → API key / site ID コピー
- [ ] uptimerobot に `https://handover.to` を5分間隔で登録
- [ ] Slack or Discord の通知 webhook を uptimerobot に設定

---

## 🕒 1時間以上（腰据えて）

- [ ] 特定商取引法表記を決める:
  - [ ] 事業者名（個人 or 屋号）
  - [ ] 公開住所（バーチャルオフィス検討?）
  - [ ] 電話番号の公開方針
- [ ] 準拠法・管轄裁判所の決定（日本法・東京地裁 推奨）
- [ ] ロゴ/favicon 用意（既存あれば再利用）
- [ ] OGP画像 1200×630 作成（LP用スクショ＋コピー）

---

## 🧠 Claude に答える用（コード着手前に返答必要）

これらは即答でOK、後で Claude が聞いてくる:

- [ ] LP は Handover本体に埋め込む？ 別リポジトリ？
- [ ] LP は 1ページ長スクロール？ 複数ページ？
- [ ] Sentry サンプリング率 100% / 10%?
- [ ] Passcode デフォルトON の判定ロジック仕様（Pro/Team判別どうやる？）

---

## ✅ 全部済んだら Claude に渡すもの

`.env` に以下を埋めた状態でコード作業再開:

```
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
VITE_SENTRY_DSN=https://xxx@sentry.io/xxx
VITE_POSTHOG_KEY=phc_xxx   # or VITE_PLAUSIBLE_DOMAIN=handover.to
```

加えて Stripe Payment Link の URL 4本をコピペで渡す:

- Passcode $3: https://...
- Expiration +7d $2: https://...
- Expiration +30d $5: https://...
- Export Extra $3: https://...

---

## 進捗

| カテゴリ | 完了 | 合計 |
|---|---|---|
| 5分タスク | 0 | 8 |
| 15-30分 | 0 | 12 |
| 1時間以上 | 0 | 4 |
| Claude向け回答 | 0 | 4 |
