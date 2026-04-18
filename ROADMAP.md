# Handover Player — 販売までのロードマップ

> Last updated: 2026-04-17

## 🎯 Core Value Proposition

**「一次フィードバックを最速で集め、編集に戻す」**

- **Minimal Friction**: Dropbox直リンク・ログイン不要・NLEライクな操作性
- **High Precision**: フレーム単位の正確さ & プロ仕様ショートカット
- **Strong Exit**: Premiere/Resolve へ直結するマーカー書き出し

## 💰 ビジネスモデル方針

> Freemium + Pay-per-moment。SaaS月額は後回し、先に「必要な瞬間だけ小額課金」で販売を開始する。

| Tier | 価格 | 対象 | 収益期待 |
|---|---|---|---|
| **Lite** | 無料 | URL共有 / 7日期限 / 公開リンク | 獲得の入口 |
| **Add-on** | $2-5/回 | Passcode / 期限延長 / 追加エクスポート | 初期MRRの柱 |
| **Pro** | $9/月（将来） | 個人ダッシュボード / ブランド設定 | 継続収益 |
| **Team** | $29/月（将来） | 3-5人 / 社内用 | プロダクション向け |

競合: Frame.io $15/user/月, Dropbox Replay $12+$12/月, Wipster $12-25/user/月。**小規模制作会社・個人編集者のper-seat不満**を狙う。

---

## 🗺️ ロードマップ

### ✅ Phase 0: Product Polish（Done — 2026-04-17）

- [x] Dropbox直再生 / 4K / JKL / Realtimeコメント
- [x] Premiere XML / Resolve CSV / Generic CSV エクスポート
- [x] ライトテーマ刷新（モック準拠）
- [x] 競合水準UIへ引き上げ（タイムライン視認性 / タイムコードバッジ / コメント格上げ / ヘッダー / Shareモーダル）
- [x] 競合LP調査（Frame.io, Wipster, Filestage, Dropbox Replay, Vimeo）

---

### 🔨 Phase A: Ship-Ready（〜2026-04-30 · 2週間）

**ゴール**: 「お金を取っても恥ずかしくない」最小セットを完成させる。

#### A1. 販売の前提条件（必須）
- [ ] **Passcode UI復活**（ロジック既存） — ShareModal側で6桁パス設定→保存→検証画面
- [ ] **Expiration 動作確認** — 7日既定 / 48h前バナー / 期限切れロック画面
- [ ] **Error boundary + Sentry** — 顧客画面で落ちないこと
- [ ] **Terms of Service + Privacy Policy** — `/terms` `/privacy` に静的ページ
- [ ] **Cookie / LocalStorage consent** — EU対応最低限

#### A2. 決済基盤
- [ ] **Stripe Checkout 統合** — Payment Linkベースで単発課金（アカウント管理なし）
- [ ] **Add-on発動フロー** — 3ポイント:
  - Passcode ONトグル → $3決済 → 機能有効
  - Expiration 48h前バナー → +7日$2 / +30日$5
  - 2回目以降のExport → $3/回
- [ ] **課金成功時のメール領収書** — Stripe Customer Portal使用

#### A3. 監視・計測
- [ ] **PostHog or Plausible** 導入 — LP→サインアップ→課金のファネル可視化
- [ ] **Supabase usage アラート** — 帯域/DB容量
- [ ] **Status page** — 手動でOK、uptimerobot 無料プラン

#### A4. Ship前リスク対策（scale関係なく1日目から起きるもののみ）
- [ ] **Passcode デフォルトON (Pro/Team)** — NDA案件の情報漏洩防止。Liteは任意、Pro/Team共有時はPasscode初期値ON
- [ ] **DMCA takedown フォーム + ToS明記** — `/dmca` 静的ページ。違法コンテンツ禁止 / 悪用URL即時無効化の内部手順を Terms に記載
- [ ] **Dropbox 403 / rate-limit エラーUI** — 帯域超過時に「Dropbox側で帯域制限中。24時間後に再試行」を VideoPlayer の onError で表示
- [ ] **動画URL変換ロジックの単一箇所化** — `src/utils/dropboxUrl.js` を新規作成し、現状 App.jsx / batch-register 等に散らばっている URL 正規化を集約（抽象化はしない、置き場だけ決める）

---

### 🚀 Phase B: Soft Launch（2026-05 · 1ヶ月）

**ゴール**: 使ってくれる人を集めて、「どのAdd-onが実際に売れるか」を観測する。

#### B1. Landing Page
- [ ] **LP構築** — Handover本体と同じスタックで `/` or 別ドメイン
  - Hero: 今日撮ったUIスクショを使ってデモGIF作成
  - 差別化コピー: 「Dropboxの動画にそのままコメント」「per-seatなし」「NLEに直送」
  - Pricing: Lite / Add-on 価格表（Pro月額は "Coming soon"）
  - FAQ: 「Frame.ioとの違い」「セキュリティ」「リファンド」
- [ ] **デモ動画/GIF** — 30秒以内、英語・日本語両方
- [ ] **SEO最低限** — title/description/OGP、sitemap.xml

#### B2. 獲得チャネル（無料）
- [ ] **X投稿** — 個人アカウント / DELAX / 制作者向けハッシュタグ
- [ ] **YouTube動画編集者コミュニティ** — r/VideoEditing, r/editors（英）、編集者Discord
- [ ] **日本制作会社ネットワーク** — NHK案件経由の知り合い → 口コミ
- [ ] **Indie Hackers / Hacker News** — "Show HN" 投下
- [ ] **Dropbox User Group** — 公式フォーラム / 日本ユーザー会

#### B3. フィードバック収集
- [ ] **最初の5人を手で見つける** — DM で声かけ、zoom 15分、使ってもらって録画
- [ ] **NPS & テキスト自由記述** — Tallyフォーム、Share後とExport後
- [ ] **Weeklyレビュー** — 毎週金曜 15分で KPI確認（DAU / 共有数 / 課金数 / Churn理由）

---

### 💵 Phase C: First Paying Customer（2026-06 · 1ヶ月）

**ゴール**: **MRR $0 → $100**（30人 × $3 Add-on 程度のイメージ）。量より「自然発生的に払った人」が出ることを優先。

#### C1. 転換率改善
- [ ] **Paywall コピー A/Bテスト** — Passcode発動画面の文言3パターン
- [ ] **「まずは試せる」導線** — 1回だけPasscode無料体験を出す（心理障壁ダウン）
- [ ] **領収書メールに招待文** — 「友達にも試してほしい」参照リンク

#### C2. インタビュー駆動改善
- [ ] **払った人5人インタビュー** — 「なぜ払ったか」「何が決め手だったか」を録る
- [ ] **離脱ユーザー3人にアンケート** — 「なぜ払わなかった」「何があれば払ったか」
- [ ] **プロダクト改善は“払った理由”に集中** — 離脱理由は後回し

#### C3. 1,000アクティブユーザー到達時の警戒モード（観測のみ、対策は Phase D 以降）
- [ ] **Dropbox 403エラー発生率** — 週次で確認、全体の1%超えたらマルチストレージ検討開始
- [ ] **最大プロジェクトの日次帯域使用量** — Dropbox Plus 200GB/day の半分到達でアラート
- [ ] **Supabase Realtime 同時接続数ピーク** — Pro 500接続の80%到達で設計見直し

---

### 🌍 Phase D: Public Launch（2026-07 · 1ヶ月）

**ゴール**: Product Hunt / Hacker News / Japan community 本格投下。**MRR $100 → $500**。

#### D1. 月額Proプラン実装
- [ ] **Supabase Auth連携** — Email magic linkで個人アカウント
- [ ] **Cloud Sync Dashboard** — 自分のプロジェクト一覧 / active/archived / 簡易アクセスログ
- [ ] **Pro特典**: 期限無制限・無料Passcode・Export無制限・ブランド設定（logo置換）
- [ ] **Stripe Subscription** — 月額$9 / 年額$90（2ヶ月無料）

#### D2. Launch施策
- [ ] **Product Hunt準備** — screenshots / gif / tagline / マーカー配置
- [ ] **Hacker News "Show HN"** — 技術ブログ記事付き（Supabase Realtime × Dropbox OAuth の話）
- [ ] **日本メディア** — note.com で制作者向け記事 / Dev.to 英語版
- [ ] **早期割引** — ローンチ1週間は年額プラン50%OFF

#### D3. 運用体制
- [ ] **サポート導線** — support@handover.to → delax共通の Gmail に転送
- [ ] **Changelog** — 既存のChangelogModalを公開し続ける（信頼感）
- [ ] **Status page自動化** — uptimerobot → Slack/Discord
- [ ] **Stripe Tax 有効化（MRR $200 超えたら）** — 月$10課金してスイッチON、EU VAT / US sales tax / 日本消費税を一括委任。事前に悩まず閾値到達で切り替える

---

### 📈 Phase E: Scale（2026-09〜）

**ゴール**: **MRR $500 → $1,000**。1人で運営可能な範囲で成長。

- [ ] **Team tier** — $29/月 / 3-5人 / Shared folders
- [ ] **Integrations**:
  - Premiere Pro Panel（Wipsterの真似）
  - Slack通知（コメント投稿時）
  - Zapier webhook
- [ ] **Dark theme実装** — `public/design-dark.html` 既存モックあり
- [ ] **i18n** — 日本語UI / Japan billing (PayPay?)
- [ ] **アフィリエイト/紹介制度** — 制作会社が下請けに紹介するインセンティブ

---

## 📏 ガードレール

- **Liteは「URLを知る人は誰でも閲覧可」を明示表示**
- 乱用対策の通報導線・URL無効化ボタンを常設
- 機密案件は**Pro推奨バナー**を共有時に提示
- **顧客データは売らない、分析しない** — プライバシーを差別化要素に

---

## ⏱️ 想定タイムライン

| フェーズ | 期間 | マイルストーン | MRR目標 |
|---|---|---|---|
| Phase A: Ship-Ready | 2026-04-17 → 04-30 | Stripe稼働 / 利用規約公開 / NDA・DMCA対応 | $0 |
| Phase B: Soft Launch | 2026-05 | LP公開 / 50人利用 | $0 |
| Phase C: First Paying | 2026-06 | 30人課金 | $100 |
| Phase D: Public Launch | 2026-07 | Product Hunt / 月額Pro | $500 |
| Phase E: Scale | 2026-09〜 | Team / Integrations | $1,000 |

**break-even line**: Vercel Pro $20 + Supabase Pro $25 + Stripe手数料 + ドメイン → **月$50程度**。Phase C の30課金でカバー。

---

## 🔥 直近2週間でやること（2026-04-17 → 04-30）

優先順:

1. **Passcode UI復活**（半日） — ロジック残ってるので配線だけ
2. **Expiration 動作確認**（半日） — 7日 / 48h前バナー / ロック画面
3. **Stripe Payment Link統合**（1日） — Passcode $3 発動→有効化
4. **Terms / Privacy 静的ページ**（2時間） — テンプレから
5. **Sentry導入**（1時間） — Vite pluginで即入る
6. **LP骨子作成**（1日） — 今日撮った競合スクショと並べられる見た目を目指す
7. **Passcode デフォルトON設定**（1時間） — Pro/Team時のShareModal初期値変更（1.の延長）
8. **DMCA takedown ページ + ToS一文追記**（2時間） — 静的ページ1枚＋Terms追記
9. **Dropbox 403ハンドリング + URL集約**（2時間） — VideoPlayer.jsx の onError と `src/utils/dropboxUrl.js` 新規作成

合計 5-6日相当。GW前に仕上げてBに移行する。

---

## 🚫 やらないこと

- **Premiere Panelを最初に作る** — 開発コスト重いわりに市場検証に寄与しない。Phase E送り。
- **エンタープライズSSO / SAML** — ターゲット層ではない。
- **自前CDN / 動画トランスコード** — Dropboxに任せる設計が強みなので崩さない。
- **Phase Aで完璧を目指す** — ShipしてからAを振り返って直す、を繰り返す。
- **マルチストレージ抽象化を ship 前にやる** — 1,000ユーザー到達まで Dropbox 1本で走る。URL変換箇所を集約しておくだけで十分。本格抽象化は Phase C の観測結果を見てから。
- **Stripe Tax を Phase A で導入する** — MRRゼロ時点で月$10は無駄。$200到達時に切り替える（Phase D）。
