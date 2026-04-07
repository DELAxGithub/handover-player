#!/usr/bin/env node
/**
 * dropbox-auth.mjs
 * Dropbox OAuth2 PKCE フローで refresh_token を取得し .env.local に保存する
 *
 * Usage:
 *   node scripts/dropbox-auth.mjs --app-key YOUR_APP_KEY
 *
 * 手順:
 *   1. ブラウザが開くので Dropbox にログインして認可
 *   2. リダイレクト先に表示される認可コードをターミナルに貼り付け
 *   3. refresh_token が .env.local に保存される
 */

import { createInterface } from 'readline';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_PATH = resolve(__dirname, '..', '.env.local');

// ── 引数パース ──
function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--app-key') opts.appKey = args[++i];
    if (args[i] === '--app-secret') opts.appSecret = args[++i];
    if (args[i] === '--code') opts.code = args[++i];
  }
  if (!opts.appKey || !opts.appSecret) {
    console.error('Usage: node scripts/dropbox-auth.mjs --app-key KEY --app-secret SECRET [--code CODE]');
    console.error('\nApp Key/Secret は https://www.dropbox.com/developers/apps で確認できます');
    process.exit(1);
  }
  return opts;
}

// ── readline ──
function ask(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, answer => { rl.close(); resolve(answer.trim()); }));
}

// ── .env.local 更新 ──
function upsertEnv(key, value) {
  let content = '';
  if (existsSync(ENV_PATH)) {
    content = readFileSync(ENV_PATH, 'utf-8');
  }
  const regex = new RegExp(`^${key}=.*$`, 'm');
  if (regex.test(content)) {
    content = content.replace(regex, `${key}=${value}`);
  } else {
    content = content.trimEnd() + `\n${key}=${value}\n`;
  }
  writeFileSync(ENV_PATH, content);
}

// ── メイン ──
async function main() {
  const { appKey, appSecret, code: preCode } = parseArgs();

  // 1. 認可URL生成（PKCEなし、client_secret方式）
  const authUrl = `https://www.dropbox.com/oauth2/authorize?client_id=${appKey}&response_type=code&token_access_type=offline`;

  let code = preCode;
  if (!code) {
    console.log('\n🔐 Dropbox OAuth2 セットアップ\n');
    console.log('ブラウザで以下のURLを開いて認可してください:');
    console.log(`\n  ${authUrl}\n`);

    // macOS ならブラウザを自動で開く
    try { execSync(`open "${authUrl}"`); } catch {}

    // 2. 認可コード入力
    code = await ask('認可コードを貼り付けてください: ');
    if (!code) {
      console.error('認可コードが空です。中止します。');
      process.exit(1);
    }
  }

  // 3. トークン交換（client_secret方式）
  console.log('\n🔄 トークンを取得中...');
  const res = await fetch('https://api.dropboxapi.com/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      grant_type: 'authorization_code',
      client_id: appKey,
      client_secret: appSecret,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error(`\n❌ トークン取得失敗: ${res.status}`);
    console.error(JSON.stringify(err, null, 2));
    process.exit(1);
  }

  const data = await res.json();

  // 4. .env.local に保存
  upsertEnv('DROPBOX_APP_KEY', appKey);
  upsertEnv('DROPBOX_APP_SECRET', appSecret);
  upsertEnv('DROPBOX_REFRESH_TOKEN', data.refresh_token);
  upsertEnv('DROPBOX_ACCESS_TOKEN', data.access_token);

  console.log('\n✅ 保存完了 (.env.local)');
  console.log(`   DROPBOX_APP_KEY=${appKey}`);
  console.log(`   DROPBOX_REFRESH_TOKEN=${data.refresh_token.slice(0, 20)}...`);
  console.log(`   DROPBOX_ACCESS_TOKEN=${data.access_token.slice(0, 20)}... (自動更新されます)`);
  console.log('\nこれ以降 batch-register.mjs は自動でトークンを更新します。\n');
}

main().catch(err => {
  console.error(`\nFatal: ${err.message}`);
  process.exit(1);
});
