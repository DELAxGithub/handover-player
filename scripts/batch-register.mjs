#!/usr/bin/env node
/**
 * batch-register.mjs
 * Dropboxフォルダ内の動画をHandover Playerに一括登録する
 *
 * Usage:
 *   node scripts/batch-register.mjs --folder "/OrionRoom/S2_納品手前" --title "Orion S2"
 *   node scripts/batch-register.mjs --folder "/OrionRoom/S2_納品手前" --dry-run
 *
 * Options:
 *   --folder   Dropbox上のフォルダパス（必須）
 *   --title    Handover Playerのフォルダ名（省略時: Dropboxフォルダ名）
 *   --token    Dropboxアクセストークン（省略時: DROPBOX_ACCESS_TOKEN env）
 *   --dry-run  実際に登録せず、取得されるリンク一覧だけ表示
 *   --list     Supabaseに登録済みのフォルダ・エピソード一覧を表示
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname, basename, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── .env.local 読み込み ──
function loadEnv() {
  const envPath = resolve(__dirname, '..', '.env.local');
  const lines = readFileSync(envPath, 'utf-8').split('\n');
  const env = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    env[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
  }
  return env;
}

// ── 引数パース ──
function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { dryRun: false };
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--folder': opts.folder = args[++i]; break;
      case '--title':  opts.title = args[++i]; break;
      case '--token':  opts.token = args[++i]; break;
      case '--dry-run': opts.dryRun = true; break;
      case '--list':    opts.list = true; break;
    }
  }
  // --list モードではfolder/tokenは不要
  if (opts.list) return opts;
  if (!opts.folder) {
    console.error('Error: --folder is required');
    console.error('Usage: node scripts/batch-register.mjs --folder "/path/to/folder"');
    process.exit(1);
  }
  opts.token = opts.token || process.env.DROPBOX_ACCESS_TOKEN;
  if (!opts.token) {
    console.error('Error: Dropbox access token required (--token or DROPBOX_ACCESS_TOKEN env)');
    console.error('Get one at: https://www.dropbox.com/developers/apps');
    process.exit(1);
  }
  return opts;
}

// ── 動画ファイル拡張子 ──
const VIDEO_EXTS = new Set(['.mp4', '.mov', '.mxf', '.avi', '.mkv', '.webm', '.m4v']);

// ── Dropbox API ──
async function dropboxListFolder(token, folderPath) {
  const res = await fetch('https://api.dropboxapi.com/2/files/list_folder', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ path: folderPath, limit: 2000 }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Dropbox list_folder failed: ${res.status} ${err?.error_summary || ''}`);
  }
  const data = await res.json();
  return data.entries
    .filter(e => e['.tag'] === 'file' && VIDEO_EXTS.has(extname(e.name).toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function dropboxGetSharedLink(token, filePath) {
  // まず作成を試みる
  const createRes = await fetch('https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ path: filePath, settings: { requested_visibility: 'public' } }),
  });

  if (createRes.ok) {
    const data = await createRes.json();
    return data.url;
  }

  // 既にリンクがある場合 (409 conflict)
  if (createRes.status === 409) {
    const listRes = await fetch('https://api.dropboxapi.com/2/sharing/list_shared_links', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ path: filePath, direct_only: true }),
    });
    if (!listRes.ok) {
      throw new Error(`Dropbox list_shared_links failed for ${filePath}`);
    }
    const listData = await listRes.json();
    if (listData.links && listData.links.length > 0) {
      return listData.links[0].url;
    }
    throw new Error(`No shared links found for ${filePath}`);
  }

  const err = await createRes.json().catch(() => ({}));
  throw new Error(`Dropbox create_shared_link failed: ${createRes.status} ${err?.error_summary || ''}`);
}

// ── Supabase 接続ヘルパー ──
function connectSupabase(env) {
  const supabaseUrl = env.VITE_SUPABASE_URL;
  const supabaseKey = env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    console.error('Error: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY not found in .env.local');
    process.exit(1);
  }
  return createClient(supabaseUrl, supabaseKey);
}

// ── --list モード ──
async function listAll(supabase) {
  const { data: folders, error: fErr } = await supabase
    .from('folders')
    .select('*')
    .order('created_at', { ascending: false });
  if (fErr) { console.error(`Error: ${fErr.message}`); process.exit(1); }

  if (!folders || folders.length === 0) {
    console.log('\nNo folders found.\n');
    return;
  }

  for (const f of folders) {
    const created = new Date(f.created_at).toLocaleDateString('ja-JP');
    console.log(`\n📁 ${f.title}  (${created})`);
    console.log(`   ID: ${f.id}`);
    console.log(`   URL: /?f=${f.id}`);

    const { data: eps } = await supabase
      .from('projects')
      .select('id, title, source_url, sort_order')
      .eq('folder_id', f.id)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (eps && eps.length > 0) {
      console.log(`   Episodes (${eps.length}):`);
      eps.forEach((ep, i) => console.log(`     ${String(i + 1).padStart(2)}. ${ep.title}`));
    } else {
      console.log('   (no episodes)');
    }
  }

  // フォルダに属さないスタンドアロンプロジェクト
  const { data: standalone } = await supabase
    .from('projects')
    .select('id, title, created_at')
    .is('folder_id', null)
    .order('created_at', { ascending: false });

  if (standalone && standalone.length > 0) {
    console.log(`\n📄 Standalone projects (${standalone.length}):`);
    standalone.forEach(p => {
      const created = new Date(p.created_at).toLocaleDateString('ja-JP');
      console.log(`   - ${p.title}  (${created})  /?p=${p.id}`);
    });
  }
  console.log('');
}

// ── メイン ──
async function main() {
  const opts = parseArgs();
  const env = loadEnv();
  const supabase = connectSupabase(env);

  // --list モード
  if (opts.list) {
    await listAll(supabase);
    return;
  }

  console.log(`\n📂 Dropbox folder: ${opts.folder}`);
  console.log(`🔍 Listing video files...\n`);

  // 1. ファイル一覧取得
  const files = await dropboxListFolder(opts.token, opts.folder);
  if (files.length === 0) {
    console.log('No video files found.');
    process.exit(0);
  }
  console.log(`Found ${files.length} video file(s):\n`);
  files.forEach((f, i) => console.log(`  ${String(i + 1).padStart(2)}. ${f.name}`));

  // 2. 共有リンク取得
  console.log(`\n🔗 Getting shared links...\n`);
  const episodes = [];
  for (const [i, file] of files.entries()) {
    try {
      const url = await dropboxGetSharedLink(opts.token, file.path_display);
      const title = basename(file.name, extname(file.name));
      episodes.push({ title, url, sortOrder: i });
      console.log(`  ✓ ${file.name}`);
    } catch (err) {
      console.error(`  ✗ ${file.name}: ${err.message}`);
    }
  }

  if (episodes.length === 0) {
    console.error('\nNo shared links obtained. Aborting.');
    process.exit(1);
  }

  // dry-run ならここで終了
  if (opts.dryRun) {
    console.log(`\n── Dry Run Results ──\n`);
    episodes.forEach(ep => console.log(`  ${ep.title}\n    ${ep.url}\n`));
    console.log(`Total: ${episodes.length} episodes (not registered)`);
    process.exit(0);
  }

  // 3. 同名フォルダがあれば再利用、なければ作成
  const folderTitle = opts.title || basename(opts.folder);
  let folderId;

  const { data: existingFolders } = await supabase
    .from('folders')
    .select('id')
    .eq('title', folderTitle)
    .limit(1);

  if (existingFolders && existingFolders.length > 0) {
    folderId = existingFolders[0].id;
    console.log(`\n📁 Using existing folder: "${folderTitle}" (${folderId})`);
  } else {
    console.log(`\n📁 Creating folder: "${folderTitle}"`);
    const { data: folder, error: folderErr } = await supabase
      .from('folders')
      .insert([{ title: folderTitle }])
      .select()
      .single();
    if (folderErr) {
      console.error(`Failed to create folder: ${folderErr.message}`);
      process.exit(1);
    }
    folderId = folder.id;
    console.log(`  ✓ folder_id: ${folderId}`);
  }

  // 4. 既存エピソードを取得して重複チェック用セットを作る
  const { data: existingEps } = await supabase
    .from('projects')
    .select('title')
    .eq('folder_id', folderId);
  const existingTitles = new Set((existingEps || []).map(e => e.title));

  // 5. 新規エピソードだけ登録
  const newEpisodes = episodes.filter(ep => !existingTitles.has(ep.title));
  const skipped = episodes.length - newEpisodes.length;

  if (skipped > 0) {
    console.log(`\n⏭  Skipping ${skipped} already registered episode(s)`);
  }

  if (newEpisodes.length === 0) {
    console.log(`\n✓ All ${episodes.length} episodes already registered. Nothing to do.\n`);
    process.exit(0);
  }

  // sort_order は既存の最大値の続きから
  const maxExisting = (existingEps || []).length;
  console.log(`\n📼 Registering ${newEpisodes.length} new episode(s)...\n`);
  let success = 0;
  for (const [i, ep] of newEpisodes.entries()) {
    const { error } = await supabase
      .from('projects')
      .insert([{
        source_url: ep.url,
        title: ep.title,
        folder_id: folderId,
        sort_order: maxExisting + i,
        status: 'active',
      }]);
    if (error) {
      console.error(`  ✗ ${ep.title}: ${error.message}`);
    } else {
      success++;
      console.log(`  ✓ ${ep.title}`);
    }
  }

  // 6. 結果サマリー
  console.log(`\n${'═'.repeat(40)}`);
  console.log(`✓ ${success} new / ${skipped} skipped / ${episodes.length} total`);
  console.log(`Folder URL: /?f=${folderId}`);
  console.log(`${'═'.repeat(40)}\n`);
}

main().catch(err => {
  console.error(`\nFatal: ${err.message}`);
  process.exit(1);
});
