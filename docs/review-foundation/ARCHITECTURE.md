# Review Foundation Architecture

## Design rule

The durable product primitive is not `Comment` or `Subtitle`. It is a Marker attached to a versioned media asset.

```text
Workspace
  Project
    Asset version
      Marker[]
      Review session[]
      Pipeline job[]
```

## Marker v1

```json
{
  "id": "uuid",
  "asset_id": "uuid",
  "kind": "comment | instruction | caption",
  "start_s": 34.2,
  "end_s": 42.8,
  "text": "土地の記憶は 音から立ち上がる",
  "author_id": "uuid-or-null",
  "author_name": "Caption editor",
  "status": "open | resolved | approved",
  "color": "green",
  "speaker_id": "narrator",
  "lines": [
    {
      "text": "土地の記憶は",
      "speaker_id": "narrator",
      "delay_ms": 0
    }
  ],
  "version": 3,
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

`end_s = null` means a point marker. An end time means a range. `kind` is explicit; text prefixes such as `※` may remain a display convention but must not be the only persisted type signal.

## Why explicit kind wins

The May mock inferred instructions from a `※` prefix. That is convenient for imports, but fragile as the canonical model:

- users can delete the prefix accidentally;
- localization changes the convention;
- filters and permissions need stable semantics;
- export adapters should not parse prose to decide behavior.

Importers may map `※ text` to `kind=instruction`; storage remains explicit.

## Asset metadata

Each asset version needs:

```json
{
  "id": "uuid",
  "project_id": "uuid",
  "version_number": 2,
  "source_provider": "dropbox",
  "source_ref": "opaque-server-reference",
  "display_name": "episode-038-v2.mov",
  "duration_s": 1812.42,
  "fps_num": 24000,
  "fps_den": 1001,
  "timecode_start": "01:00:00:00",
  "media_hash": "optional"
}
```

The browser should not need the long-lived Dropbox credential or store a raw private source URL in every share link. A server-side adapter should exchange an opaque source reference for a short-lived playback URL.

## Concurrency

Marker updates use optimistic concurrency:

```text
update marker
set text = ..., version = version + 1
where id = :id and version = :expected_version
```

Zero updated rows means conflict. The UI then offers:

- reload remote;
- copy local text;
- compare and merge;
- create a proposal instead of overwriting.

This generalizes the protection already learned in tachi-shorts.

## Review roles

| Role | Read | Comment | Propose range/caption | Apply | Manage sharing |
|---|---:|---:|---:|---:|---:|
| Viewer | yes | no | no | no | no |
| Reviewer | yes | yes | optional | no | no |
| Editor | yes | yes | yes | yes | no |
| Owner | yes | yes | yes | yes | yes |

Anonymous links receive a scoped review-session token, not unrestricted anon-table access.

## Pipeline adapter

Handover emits a job request:

```json
{
  "job_type": "render_captions",
  "asset_id": "uuid",
  "marker_revision": 42,
  "callback_url": "server-generated",
  "requested_by": "uuid"
}
```

The tachi-shorts or field-archive adapter:

1. fetches approved caption markers;
2. converts them to its local timeline schema;
3. renders outside Handover;
4. uploads or links the result;
5. reports status and the resulting asset version.

Handover remains useful when no adapter is installed.

## DaVinci contract

Phase 1 is export:

- point comment -> timeline marker;
- range instruction -> marker with duration where supported, otherwise IN/OUT pair;
- caption -> SRT or subtitle CSV;
- asset fps and start time are authoritative.

Phase 2 is round trip:

- export includes stable marker IDs;
- an importer accepts status or timing changes;
- applied markers retain provenance and revision.

Direct Resolve scripting is an optional local adapter, not browser code.

## Local and hosted modes

### Local

- local JSON or SQLite;
- local media URLs;
- no hosted auth requirement;
- suitable for owner/editor use and private production.

### Hosted

- Supabase/Postgres;
- scoped share sessions;
- Dropbox short-lived playback links;
- audit log and abuse controls.

The same Marker JSON contract is used in both.
