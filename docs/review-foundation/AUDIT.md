# Handover as a Video Review Foundation

Date: 2026-06-11  
Scope: current `handover-player`, tachi-shorts ADR 0007 and its three UI mockups

## Executive conclusion

Handover already has a credible point-comment review loop: Dropbox playback, timestamped feedback, folders, presence, and NLE export. It is not yet a safe Frame.io replacement for client or broadcast work.

The immediate blocker is not subtitle UI. It is the access boundary:

- RLS policies allow public read, update, and delete across all projects.
- Project UUIDs are treated as secrets while queries can list rows.
- Passcode and expiration screens exist but are not wired into access control.
- A shared URL contains both the project UUID and the original Dropbox URL.
- Comment deletion is authorized by a locally stored display name, not identity.

The subtitle editor should be built after the boundary is corrected. Its natural shape is a unified Marker model supporting both points and ranges.

## Current implementation

| Capability | State | Evidence | Assessment |
|---|---|---|---|
| Dropbox direct playback | Implemented | `VideoPlayer.jsx` | Core differentiator; URL conversion remains client-side and duplicated |
| Point comments | Implemented | `CommentSection.jsx` | Works as the current primary record |
| Timeline markers | Implemented | `Timeline.jsx` | Point-only, author color |
| Realtime comments | Partial | README claim vs no `postgres_changes` subscription in current app | Presence is realtime; comments rely on refetch/focus |
| Presence | Implemented | `PresenceAvatars.jsx` | Anonymous display-name presence |
| Folders / episodes | Implemented | `FolderView.jsx`, `folder.js` | Publicly mutable under current RLS |
| Premiere / Resolve export | Implemented | `exporters.js` | Point markers work; range and caption semantics are absent |
| Passcode | UI shell only | `PasscodeModal.jsx`, `ShareModal.jsx` | No server verification or routing gate |
| Expiration | UI shell only | `ExpiredLockScreen.jsx` | `expires_at` is stored but not enforced in `App.jsx` |
| Subtitle regions | Not implemented | tachi ADR 0007 and mockups | Prototype supplied in this branch |
| Concurrent editing | Not implemented | Current writes have no version precondition | Needs optimistic concurrency |
| DaVinci round trip | Export only | Resolve CSV exporter | No import, applied-state, or pipeline callback |

## Important inconsistencies

### Comment foreign key

Runtime code reads and writes `comments.project_uuid`. `DEPLOYMENT.md` defines that column. `supabase_schema_phase2.sql` instead adds `project_id`. A fresh installation can therefore be incompatible with the app.

### Realtime claim

The README says comments appear in realtime. The current app has Supabase Presence realtime, but no active `postgres_changes` subscription for comment inserts, updates, or deletes. Comments refresh after posting and when the page regains focus.

### Passcode and expiration

Both have polished components, but `App.jsx` does not render them as access gates. `ShareModal` explicitly calls its values mock state. These features must not be represented as protection.

### Frame accuracy

Comments are stored as floating-point seconds. Export converts seconds to timecode using a user-selected fps rather than asset metadata. This is useful, but not frame-authoritative unless the asset fps and timeline start time are stored with the asset.

## What transfers from tachi-shorts

### Transfer directly

- Point and range markers on one time axis.
- Caption text as a range marker.
- `lines[]` with `speaker_id` and optional `delay_ms`.
- Link-zero caption boundary behavior.
- Optimistic locking and explicit conflict handling.
- Backup or revision history before destructive regeneration.
- Proposal and approval workflow for external reviewers.

### Keep outside Handover

- Whisper execution.
- Rendering and re-encoding.
- YouTube publishing and OAuth.
- Episode-specific clip selection.
- Pipeline-specific file discovery.

Those belong behind an adapter or worker contract. Handover should request work and display state, not own every media pipeline.

## Frame.io replacement boundary

### Credible target

Handover can be a strong review foundation for small teams already using Dropbox:

- no second media upload;
- link-based review;
- point and range feedback;
- caption correction;
- Resolve/Premiere export;
- optional self-hosted deployment.

### Not credible without more work

- enterprise-grade security claims;
- audit logs with verified identities;
- forensic watermarking;
- managed transcoding and proxies;
- storage-independent playback guarantees;
- large-team permissions and SSO;
- high-volume annotation on feature-length assets.

The product should initially say "Dropbox-native review for small production teams", not "complete Frame.io replacement".

## OSS and commercial boundary

### OSS core

- Marker domain model and validation.
- Review UI.
- Dropbox URL adapter interface.
- Generic JSON, CSV, Premiere, and Resolve exporters.
- Local demo data and self-host guide.
- Pipeline adapter contract.

### Deployment-specific or commercial

- Hosted Supabase schema and hardened access RPCs.
- Rate limiting, abuse handling, audit retention.
- Email, billing, domain, analytics, and support.
- Managed Dropbox OAuth broker.
- Team administration and branded portals.

### Never in the public repository

- production Supabase identifiers;
- Dropbox refresh tokens;
- real broadcast transcripts or media;
- customer project URLs;
- internal incident data.

## Prototype

Run the app and open:

```text
http://localhost:5173/?prototype=review-foundation
```

The prototype demonstrates:

- point comments;
- range instructions;
- range captions;
- a shared inspector;
- caption overlay and per-line delay;
- a unified JSON export;
- marker validation.

It intentionally does not write to Supabase or execute a media pipeline.
