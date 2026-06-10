# Review Foundation Roadmap

## Order of operations

Security and data integrity precede subtitle features. Otherwise a richer editor only increases the amount of exposed or destructively editable data.

## Stage 0: Freeze and evidence

Duration: 1-2 days

- Freeze production schema changes.
- Capture the actual production schema separately from historical SQL files.
- Confirm whether comments use `project_uuid` or `project_id`.
- Replace README claims that are not wired, especially realtime comments and access protection.
- Add a threat model and migration rollback plan.

Exit:

- one authoritative schema snapshot;
- one list of deployed features;
- no unsupported security claims.

## Stage 1: Safe review links

Duration: 4-7 days

- Remove public table-wide select/update/delete policies.
- Introduce hashed, revocable, expiring review tokens.
- Do not include raw Dropbox source URLs in shared links.
- Enforce passcode and expiration server-side.
- Add scoped roles: viewer, reviewer, editor, owner.
- Add rate limiting for token and passcode attempts.

Exit:

- a reviewer can only access the intended project;
- revoked or expired links stop working;
- anonymous users cannot list or mutate unrelated records.

## Stage 2: Marker v1 migration

Duration: 4-6 days

- Add assets with fps, duration, and timecode start.
- Introduce point/range Marker v1.
- Migrate legacy comments to `kind=comment`.
- Keep a compatibility read path during migration.
- Add optimistic concurrency and marker revisions.
- Subscribe to marker changes with authoritative deduplication.

Exit:

- existing projects still display comments;
- point and range markers share one API;
- conflicting edits cannot silently overwrite.

## Stage 3: Review foundation UI

Duration: 5-8 days

- Port the isolated prototype to production components.
- Add marker filters and shared inspector.
- Add range creation and resize.
- Add statuses and resolve/approve actions.
- Support proposal-only reviewers.
- Preserve keyboard-first operation.

Exit:

- point comments and range instructions work end to end;
- 30-minute assets remain responsive with at least 1,000 markers.

## Stage 4: Caption editing

Duration: 6-10 days

- Add caption import/export.
- Add link-zero boundary editing.
- Add speaker metadata and lines.
- Add per-line `delay_ms` as an advanced control.
- Add WYSIWYG overlay preview.
- Add validation for overlap, empty text, and out-of-bounds timing.

Exit:

- a caption editor can correct timing and text without tachi's Flask UI;
- exported captions preserve stable marker IDs.

## Stage 5: Pipeline adapters

Duration: 5-10 days per adapter

- Define signed job requests and callbacks.
- Build tachi-shorts adapter first.
- Keep render/upload credentials outside Handover.
- Add field-archive adapter after the short-form contract stabilizes.
- Display queued, running, failed, and completed jobs.

Exit:

- approved captions can trigger a render without granting the browser production credentials;
- resulting media appears as a new asset version.

## Stage 6: DaVinci round trip

Duration: 5-8 days

- Correct export using stored fps and start time.
- Export point/range markers and SRT.
- Add a local Resolve adapter for import and applied-state reporting.
- Test 23.976, 24, 25, 29.97 DF/NDF, and 59.94.

Exit:

- marker times round-trip within one frame;
- applied revisions remain traceable.

## Stage 7: OSS and hosted packaging

Duration: 4-7 days

- Publish the Marker contract and local demo.
- Document local/self-hosted mode.
- Separate hosted-only auth, abuse, billing, and operations.
- Replace real media with generated fixtures.
- Add license and dependency audit.

## Explicit non-goals for the first release

- self-built transcoding/CDN;
- enterprise SSO;
- forensic watermarking;
- arbitrary cloud-storage abstraction;
- browser-owned YouTube publishing;
- automatic editorial decisions.
