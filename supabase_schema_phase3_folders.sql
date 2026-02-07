-- Phase 3: Folder → Episode hierarchy
-- Run this on Supabase SQL Editor (project: delaxsupabase vhrnekgxtflamujzkreb)

-- 1. Folders table
CREATE TABLE IF NOT EXISTS folders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT DEFAULT 'Untitled Folder',
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '30 days'),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'archived'))
);

-- 2. Enable RLS
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;

-- 3. RLS policies (same public pattern as projects)
CREATE POLICY "Enable insert for everyone" ON folders FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable read for everyone" ON folders FOR SELECT USING (true);
CREATE POLICY "Enable update for everyone" ON folders FOR UPDATE USING (true);

-- 4. Add folder_id and sort_order to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES folders(id) ON DELETE SET NULL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- 5. Index for fast folder->episodes lookup
CREATE INDEX IF NOT EXISTS projects_folder_id_idx ON projects(folder_id);
