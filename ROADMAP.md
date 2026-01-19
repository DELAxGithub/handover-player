# Handover Player Roadmap & Strategy

## 🎯 Core Value Proposition
**「一次フィードバックを最速で集め、編集に戻す」**
*   **Minimal Friction**: Dropbox直リンク・ログイン不要・NLEライクな操作性。
*   **High Precision**: フレーム単位の正確さと、プロ仕様のショートカット。
*   **Strong Exit**: NLE（Premiere/Resolve）へ直結するマーカー書き出し。

## 🗺️ Roadmap

### Phase 1: MVP Polish & "The Exit" (Done ✅)
*   [x] **Basic Playback**: Dropbox Direct Play, 4K support.
*   [x] **Pro Controls**: JKL shortcuts, Frame-accurate seek (approx).
*   [x] **Comment System**: Threaded comments, Realtime sync.
*   [x] **Export Capability**:
    *   Adobe Premiere Pro (XML)
    *   DaVinci Resolve (CSV)
    *   Generic CSV
*   [x] **UX/UI Polish**:
    *   **Design System**: Zinc-based professional dark mode / Guidelines.
    *   **Dashboard**: Local History (Recently opened projects).
    *   **Navigation**: Top bar navigation & New Project flow.
    *   **Live Presence**: Real-time active user avatars.
    *   **Changelog**: In-app "What's New" modal.

### Phase 2: Security & "Peace of Mind" (Current Focus)
*   [ ] **Access Control**:
    *   Project Password (Passcode).
    *   Expiration Date (7 days default).
*   [ ] **Viewer Auditing**:
    *   "Who's watching" (Persistent logs beyond Live Presence).
    *   Basic access logs (IP/User Agent) for admins.
*   [ ] **Watermark**: Simple DOM-based overlay (Email/Name) aimed at deterrence.

### Phase 3: Monetization & Validation
*   [ ] **Pricing Page (Smoke Test)**:
    *   Create "Upgrade" buttons tracking clicks.
    *   Show Starter/Team plan differentiation.
*   [ ] **Cloud Sync Dashboard**:
    *   Upgrade Local Dashboard to Cloud (Supabase Auth).
    *   Archive/Active management.

---

## 💡 Business Model (Hypothesis)

### Pricing Strategy: "Active Project" Model
席数（Seat）ではなく、**案件（Project）** に課金することで、フリーランスや小規模プロダクションの流動的なチーム編成にフィットさせる。

*   **Free**: 公開リンク1件, コメント100件, 期限7日
*   **Starter ($9/mo)**: Active 3, 期限設定, CSV Export
*   **Team ($29/mo)**: Active 10, ドメイン制限, 監査ログ
*   **Add-on**: +$3 / project

### Avoid "Red Ocean"
*   **No Hosting**: Always "Bring Your Own Storage" to keep costs near zero.
*   **No Heavy Features**: Skip drawing tools, version stacking, and diffing for now. Focus purely on **Speed to Feedback**.
