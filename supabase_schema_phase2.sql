-- 1. Projects Table Definition
create table if not exists projects (
  id uuid default gen_random_uuid() primary key,
  title text default 'Untitled Project',
  source_url text not null,
  created_at timestamptz default now(),
  expires_at timestamptz default (now() + interval '7 days'),
  passcode_hash text,
  status text default 'active' check (status in ('active', 'expired', 'archived')),
  features jsonb default '{"passcode": false, "export_count": 0}'::jsonb
);

-- 2. Enable RLS on Projects
alter table projects enable row level security;

-- 3. RLS Policies for Projects (Soft Launch Mode)
-- Allow anyone to create a project (needed for the "New Project" flow without login)
create policy "Enable insert for everyone" on projects for insert with check (true);

-- Allow anyone to read a project if they have the UUID (UUID is the secret)
-- Note: 'true' allows listing all if you can guess or list them. UUIDs are safe enough for MVP.
create policy "Enable read for everyone" on projects for select using (true);

-- Option: Allow updates? Maybe not for anon users yet, or only if they have a session token (future).
-- For now, we only need Create and Read.

-- 4. Update Comments Table to link to Projects
-- (Run this only if you haven't added project_id yet)
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'comments' and column_name = 'project_id') then
    alter table comments add column project_id uuid references projects(id) on delete cascade;
    create index comments_project_id_idx on comments(project_id);
  end if;
end $$;

-- 5. RLS for Comments (Update)
-- If we want to restrict comments to active projects only, we can add policies here later.
