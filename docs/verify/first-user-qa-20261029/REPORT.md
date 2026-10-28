# First-user QA — handover-player (2026-10-29)

Before: build 4be2bc9 (`localhost:4401`). After: candidate with the fixes below (`localhost:4403`, production build, same 5 replay scripts, fresh contexts).

**Launch verdict: NOT ready.** The "first success" (save → comment → persists after reload) was never reached by any of the 5 personas, before or after, because the Supabase host in the 1Password-resolved env (`vhrnekgxtflamujzkreb.supabase.co`) does not resolve (NXDOMAIN, also via 8.8.8.8). Nothing was written to any real service; `created` is empty for all 5.

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
