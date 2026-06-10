-- Design proposal only. Do not run directly against production.
-- Access must go through server-side RPCs or an API that validates share tokens.

create type marker_kind as enum ('comment', 'instruction', 'caption');
create type marker_status as enum ('open', 'resolved', 'approved');
create type review_role as enum ('viewer', 'reviewer', 'editor', 'owner');

create table workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table projects_v2 (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  title text not null,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table assets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects_v2(id) on delete cascade,
  version_number integer not null default 1,
  source_provider text not null,
  source_ref text not null,
  display_name text not null,
  duration_s double precision,
  fps_num integer,
  fps_den integer not null default 1,
  timecode_start text,
  media_hash text,
  created_at timestamptz not null default now(),
  unique(project_id, version_number)
);

create table markers (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references assets(id) on delete cascade,
  kind marker_kind not null,
  start_s double precision not null check (start_s >= 0),
  end_s double precision check (end_s is null or end_s > start_s),
  text text not null default '',
  author_id uuid,
  author_name text not null default 'Anonymous',
  status marker_status not null default 'open',
  color text,
  speaker_id text,
  lines jsonb not null default '[]'::jsonb,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index markers_asset_time_idx on markers(asset_id, start_s);
create index markers_asset_kind_idx on markers(asset_id, kind);

create table review_links (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects_v2(id) on delete cascade,
  token_hash text not null unique,
  role review_role not null default 'reviewer',
  passcode_hash text,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table marker_revisions (
  id bigint generated always as identity primary key,
  marker_id uuid not null,
  marker_version integer not null,
  snapshot jsonb not null,
  actor_id uuid,
  created_at timestamptz not null default now()
);

create table pipeline_jobs (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references assets(id) on delete cascade,
  job_type text not null,
  requested_marker_revision integer not null,
  status text not null default 'queued',
  adapter text,
  result_asset_id uuid references assets(id),
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table workspaces enable row level security;
alter table projects_v2 enable row level security;
alter table assets enable row level security;
alter table markers enable row level security;
alter table review_links enable row level security;
alter table marker_revisions enable row level security;
alter table pipeline_jobs enable row level security;

-- No `using (true)` policies are intentionally included.
-- Browser clients should receive only scoped rows through validated RPCs/API routes.
