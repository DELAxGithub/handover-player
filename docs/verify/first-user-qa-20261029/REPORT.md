# First-user QA — handover-player (2026-10-29)

Before: build 4be2bc9 (`localhost:4401`). After: candidate with the fixes below (`localhost:4403`, production build, same 5 replay scripts, fresh contexts).

**Superseded by the update at the bottom (Supabase restored, first success reached).** Original verdict: NOT ready. The "first success" (save → comment → persists after reload) was never reached by any of the 5 personas, before or after, because the Supabase host in the 1Password-resolved env (`vhrnekgxtflamujzkreb.supabase.co`) does not resolve (NXDOMAIN, also via 8.8.8.8). Nothing was written to any real service; `created` is empty for all 5.

## Findings ranked by personas who hit them
| # | Finding | Hit by | Status |
|---|---|---|---|
| 1 | Backend unreachable → project creation fails, no comment box | 5/5 | OPEN (environment; Supabase / env must be fixed) |
| 2 | Create-failure shows unhelpful text, no retry, blank half on mobile | 4/5 (impatient, skeptic, mobile, literal) | FIXED: "This review was not saved…" + "Try saving again", also on mobile |
| 3 | Icon-only controls, no visible label | 2/5 (impatient, literal) | FIXED: Start button has text; aria-labels on link input / share / back / comments toggle |
| 4 | Tap targets < 44px | 1 (mobile) | FIXED (replay: 0 small targets) |
| 5 | Player overflows 375px (404px wide) | 1 (mobile) | FIXED (compact hides ±5s buttons; double-tap seeks) |
| 6 | Zoom disabled by viewport meta | 1 (mobile) | FIXED |
| 7 | "Dropbox link" only wording; unclear if other links are OK | 1 (literal) | FIXED (wording; the old test check forbade the word "Dropbox", replaced) |
| 8 | Whitespace / non-URL / javascript: URLs accepted and POSTed | 1 (breaker) | FIXED: http(s) validation, inline error, no POST |
| 9 | No terms / privacy / pricing / operator / contact / retention (routes fall back to home) | 1 (skeptic) | OPEN — product / legal content decision |
| 10 | Review page does not say who can see the link / retention | 1 (skeptic) | PARTIAL: home says "No account needed. Anyone with the review link can view and comment" |
| 11 | Reload mid-create re-POSTs (possible duplicate projects) | 1 (breaker) | OPEN (not verifiable without a live DB) |
| 12 | Stray empty Comments panel on `/?p=<bogus>` | 1 (breaker) | OPEN, minor |
| 13 | Jargon (Folder vs Project, 1.5x) unexplained | 1 (literal) | OPEN, minor |

## After-run results (all five replays exit 1; only backend-dependent checks fail)
- mobile: load 3.8s, no-hscroll, tap-targets (home + review), no-offscreen, video-plays PASS; comment-persists FAIL (backend).
- breaker: all garbage-input / XSS / triple-click checks PASS; backend-reachable, first-success, reload-mid-create, back-forward, comment, folder-back-forward FAIL.
- literal: labels + non-Dropbox wording PASS; project-auto-created, comment box, persists FAIL (backend). The auto-created check was matching the old "failed" wording and was widened to "not saved".
- skeptic: data-explanation PASS; legal links/urls, review-visibility, backend FAIL.
- impatient: reaches the review page, video plays, now sees explanation + retry; comment box FAIL (backend).

## Not verified
Comment save / persist / realtime, duplicates, folder flows after create, Dropbox-specific URLs (video was a localhost mp4, and 3G throttling also throttled the video bytes), real-device iOS Safari. Re-run `BASE_URL=... node <persona>.mjs after` once Supabase is back; the skeptic script types the comment before opening the panel and may need that step fixed.

## Update after Supabase restore (same day)
Cause of finding #1: project `delaxsupabase` (vhrnekgxtflamujzkreb) was paused (INACTIVE; all 6 projects in the account were). Restored from the dashboard; data intact. Production (`orion-review.vercel.app`) uses the same project, so production saving was also down until the restore.

With the backend alive, a new issue appeared and was fixed: **plain Enter does not send a comment (only Shift/Ctrl+Enter), and the Send button was icon-only** — hit by impatient, mobile and literal (3/5). Now: visible "Send" label + aria-label "Send comment"; Export button 44px; "Your name" field 44px on mobile. The earlier "reload-mid-create double POST" did not reproduce with a live DB (1 POST).

Final run (candidate = commits after cd4c1d5, fresh contexts, real Supabase, 4 of 5 exit 0):
| persona | first success | remaining |
|---|---|---|
| impatient | PASS (save → list → reload) | – |
| mobile (375px, slow 3G) | PASS | – |
| literal | PASS | – |
| breaker | PASS, 0 FAIL of 31 checks | – |
| skeptic | PASS (comment appears + persists) | FAIL: no terms/privacy/pricing/contact pages; review page does not explain who can see the link / retention |

Open: terms/privacy/pricing/operator/retention text (product decision), minor jargon, stray empty Comments panel on a bogus `?p=`. Not verified: Dropbox-specific links, iOS Safari device, video bytes over throttled 3G (video was local).

Test data: QA-* rows (39 projects with localhost source_url, 20 comments, 15 folders) were created in production Supabase on 2026-10-28 UTC. Automated deletion was blocked by the permission classifier and has NOT been done; delete them with the filters above (projects: source_url like `http://localhost*`; comments: text like `QA-*`; folders: title like `QA-*`).
