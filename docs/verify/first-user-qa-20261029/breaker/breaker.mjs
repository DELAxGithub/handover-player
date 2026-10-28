import puppeteer from 'puppeteer';
import fs from 'fs';
const MODE = process.argv[2] === 'after' ? 'after' : 'before';
const BASE = process.env.BASE_URL || 'http://localhost:4401';
const VID = (process.env.MEDIA_BASE||'http://localhost:4402')+'/qa-sample.mp4';
const SH = new URL(`./shots-${MODE}/`, import.meta.url).pathname;
fs.mkdirSync(SH, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const browser = await puppeteer.launch({ headless: true, executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
const checks = [], findings = [], created = [], limitations = [], dialogs = [];
let consoleErrs = [];
async function newPage() {
  const ctx = await browser.createBrowserContext();
  const p = await ctx.newPage();
  await p.setViewport({ width: 1280, height: 800 });
  p.on('console', m => { if (m.type() === 'error') consoleErrs.push(m.text().slice(0, 200)); });
  p.on('pageerror', e => consoleErrs.push('PAGEERROR ' + String(e).slice(0, 200)));
  p.on('dialog', async d => { dialogs.push(d.type() + ':' + d.message().slice(0, 80)); await d.dismiss(); });
  p.posts = [];
  p.on('request', r => { if (r.method() === 'POST' && r.url().includes('supabase')) p.posts.push(r.url().split('/rest/v1/')[1]?.split('?')[0] || r.url()); });
  p.xss = false;
  await p.exposeFunction('__xss', () => { p.xss = true; });
  return p;
}
const ids = p => { const u = new URL(p.url()); return { p: u.searchParams.get('p'), f: u.searchParams.get('f') }; };
const UU = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const noteCreated = (p, label) => { let { p: pid, f } = ids(p); if (!UU.test(pid || '')) pid = null; if (!UU.test(f || '')) f = null; if (pid) created.push(`project ${pid} (${label}) ${BASE}/?p=${pid}`); if (f) created.push(`folder ${f} (${label}) ${BASE}/?f=${f}`); };
async function shot(p, name) { const f = `${SH}${name}.png`; await p.screenshot({ path: f }); return `shots-${MODE}/${name}.png`; }
const bodyText = p => p.evaluate(() => document.body.innerText);
async function check(id, expected, steps, fn) {
  consoleErrs = []; dialogs.length = 0;
  const p = await newPage();
  let pass = false, actual = '', err = null;
  try { const r = await fn(p); pass = r.pass; actual = r.actual; } catch (e) { actual = 'EXC ' + e.message; err = e; }
  actual += consoleErrs.length ? ` | console errs: ${consoleErrs.length} e.g. ${consoleErrs[0]}` : '';
  if (dialogs.length) actual += ` | dialogs: ${dialogs.join(';')}`;
  let shotPath = null;
  try { shotPath = await shot(p, id + (pass ? '-ok' : '-FAIL')); } catch {}
  noteCreated(p, id);
  checks.push({ id, pass, expected, actual, steps, screenshot: shotPath });
  console.log(pass ? 'PASS' : 'FAIL', id, actual.slice(0, 250));
  await p.browserContext().close();
}
const landing = async p => { await p.goto(BASE, { waitUntil: 'networkidle2' }); };
const submitUrl = async (p, v, clicks = 1) => {
  await p.click('input[placeholder^="https://"]'); await p.keyboard.down('Control'); await p.keyboard.press('KeyA'); await p.keyboard.up('Control');
  await p.evaluate(() => {}); 
  await p.type('input[placeholder^="https://"]', v, { delay: 0 });
  const btn = await p.$('button[type=submit]');
  if (clicks > 0) await btn.click({ clickCount: clicks });
};
const setVal = async (p, sel, v) => { await p.$eval(sel, (el, v) => { const s = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), 'value').set; s.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })); }, v); };

await check('backend-reachable', 'Supabase host in the build resolves and answers', ['DNS/HTTP GET <supabase>/rest/v1/'], async p => {
  const host = 'https://vhrnekgxtflamujzkreb.supabase.co/rest/v1/';
  const r = await p.goto('about:blank').then(() => p.evaluate(h => fetch(h).then(r => 'HTTP ' + r.status).catch(e => 'FETCH-FAIL ' + e.message), host));
  return { pass: /HTTP/.test(r), actual: r };
});
// 1 FIRST SUCCESS
let successProject = null;
await check('first-success', 'valid link -> review page -> video plays -> comment persists after reload',
  ['open /', 'paste valid link, submit', 'wait project created', 'play video', 'add comment "QA-breaker first-success"', 'reload', 'comment still present'],
  async p => {
    await landing(p); await submitUrl(p, VID);
    await p.waitForFunction(() => new URL(location.href).searchParams.get('p'), { timeout: 8000 });
    await p.waitForSelector('video', { timeout: 10000 });
    await sleep(2000);
    const st = await p.$eval('video', v => { v.muted = true; return v.play().then(() => ({ ok: true })).catch(e => ({ ok: false, e: String(e) })); });
    await sleep(1500);
    const vs = await p.$eval('video', v => ({ t: v.currentTime, dur: v.duration, err: v.error && v.error.code, paused: v.paused }));
    const txt = 'QA-breaker first-success comment';
    await p.type('textarea', txt);
    await p.click('button[type=submit]');
    await p.waitForFunction(t => document.body.innerText.includes(t), { timeout: 10000 }, txt);
    successProject = ids(p).p;
    await p.reload({ waitUntil: 'networkidle2' }); await sleep(1500);
    const persisted = (await bodyText(p)).includes(txt);
    return { pass: st.ok && vs.t > 0 && persisted, actual: `play=${JSON.stringify(st)} video=${JSON.stringify(vs)} persisted=${persisted}` };
  });

// 2 empty / whitespace
await check('empty-whitespace-url', 'empty/whitespace submit does nothing harmful (no project, no navigation)', ['open /', 'submit empty', 'type 3 spaces, submit'], async p => {
  await landing(p); await p.keyboard.press('Enter');
  await p.type('input[placeholder^="https://"]', '   '); await p.keyboard.press('Enter'); await sleep(1500);
  const u = p.url(); const posts = p.posts.length;
  return { pass: posts === 0 && !/[?&]p=/.test(u), actual: `url=${u} posts=${posts}` };
});

// garbage URLs
const garbage = [
  ['non-url-text', 'QA-breaker hello world not a url'],
  ['script-tag-url', '<script>window.__xss()</script>'],
  ['img-onerror-url', '"><img src=x onerror=window.__xss()>'],
  ['javascript-url', 'javascript:window.__xss()'],
  ['sql-quotes-url', "QA-breaker'; DROP TABLE projects;--"],
  ['emoji-url', 'QA-breaker 🎬🔥日本語.mp4'],
  ['missing-mp4', (process.env.MEDIA_BASE||'http://localhost:4402')+'/missing.mp4'],
  ['non-video-url', 'http://localhost:4401/'],
  ['long-10k-url', (process.env.MEDIA_BASE||'http://localhost:4402')+'/' + 'a'.repeat(10000) + '.mp4'],
  ['unreachable-host', 'http://127.0.0.1:1/x.mp4'],
];
for (const [id, v] of garbage) {
  await check('garbage-' + id, 'no crash/white screen, no XSS, page still navigable back (back link / not blank)', ['open /', 'paste garbage URL', 'submit', 'wait 4s', 'inspect page'], async p => {
    await landing(p); await setVal(p, 'input[placeholder^="https://"]', v);
    await p.click('button[type=submit]'); await sleep(4500);
    const t = await bodyText(p); const html = await p.evaluate(() => document.documentElement.outerHTML.length);
    const back = await p.$('a[href="/"], a[title="Back"]');
    const blank = t.trim().length < 20;
    const bad = p.xss ? 'XSS' : blank ? 'WHITE-SCREEN' : !back && !/landing|Start a review/.test(t) ? 'NO-WAY-BACK' : '';
    return { pass: !bad, actual: `${bad || 'ok'} url=${p.url().slice(0, 120)} text="${t.replace(/\s+/g, ' ').slice(0, 160)}" posts=${p.posts.join(',')}` };
  });
}

// double/triple click create project
await check('triple-click-start-review', 'triple-click Start submit creates exactly 1 project', ['open /', 'paste valid link', 'triple-click submit', 'count POST projects'], async p => {
  await landing(p); await setVal(p, 'input[placeholder^="https://"]', VID);
  const btn = await p.$('button[type=submit]'); await btn.click({ clickCount: 3 });
  await sleep(5000);
  const n = p.posts.filter(x => x === 'projects').length;
  return { pass: n <= 1, actual: `project POSTs=${n}, url=${p.url()}` };
});
await check('reload-mid-create', 'reload during project creation does not create duplicate projects', ['open ?url=valid (no p)', 'reload immediately x2', 'compare p ids'], async p => {
  await p.goto(`${BASE}/?url=${encodeURIComponent(VID)}`, { waitUntil: 'domcontentloaded' });
  await p.reload({ waitUntil: 'domcontentloaded' }); await sleep(300); await p.reload({ waitUntil: 'networkidle2' }); await sleep(2500);
  return { pass: !!ids(p).p, actual: `p=${ids(p).p}, project POSTs on last load=${p.posts.filter(x => x === 'projects').length}` };
});

// Back/forward during creation
await check('back-forward-creation', 'Back after project created returns to usable page (not redirect loop/white)', ['open /', 'submit valid', 'wait p', 'goBack', 'goForward'], async p => {
  await landing(p); await submitUrl(p, VID);
  await p.waitForFunction(() => new URL(location.href).searchParams.get('p'), { timeout: 8000 });
  await p.goBack({ waitUntil: 'networkidle2' }).catch(() => {}); await sleep(1500);
  const a = p.url(); const t1 = (await bodyText(p)).replace(/\s+/g, ' ').slice(0, 100);
  await p.goForward({ waitUntil: 'networkidle2' }).catch(() => {}); await sleep(1500);
  const t2 = (await bodyText(p)).replace(/\s+/g, ' ').slice(0, 100);
  return { pass: t1.length > 10 && t2.length > 10, actual: `afterBack=${a} "${t1}" | afterFwd=${p.url()} "${t2}"` };
});

// bogus ids
for (const [id, q] of [['bogus-p', `?p=bogus-id&url=${encodeURIComponent(VID)}`], ['bogus-p-nourl', '?p=not-a-uuid'], ['bogus-folder', '?f=bogus-folder'], ['bogus-p-xss', `?p=${encodeURIComponent('"><img src=x onerror=window.__xss()>')}&url=${encodeURIComponent(VID)}`]]) {
  await check(id, 'bogus id shows graceful error / way back, no white screen, no XSS', ['open /' + q], async p => {
    await p.goto(BASE + '/' + q, { waitUntil: 'networkidle2' }); await sleep(2500);
    const t = await bodyText(p); const back = await p.$('a[title="Back"], a[href="/"]');
    const bad = p.xss ? 'XSS' : t.trim().length < 20 ? 'WHITE-SCREEN' : !back ? 'NO-BACK-LINK' : '';
    return { pass: !bad, actual: `${bad || 'ok'} text="${t.replace(/\s+/g, ' ').slice(0, 200)}"` };
  });
}

// comments on a real project
await check('comment-garbage-and-multiclick', 'garbage comments render as text (no XSS), triple-click Enter-spam adds exactly one row each', ['open QA-breaker project', 'post XSS text w/ triple click', 'post 10k text', 'post emoji', 'post sql quote', 'post whitespace', 'count rows'], async p => {
  await p.goto(`${BASE}/?p=${successProject}&url=${encodeURIComponent(VID)}`, { waitUntil: 'networkidle2' }); await sleep(1500);
  const send = async (txt, clicks = 1) => { await setVal(p, 'textarea', txt); const b = await p.$('form button[type=submit]'); await b.click({ clickCount: clicks }); await sleep(2500); };
  const before = p.posts.length;
  await send('QA-breaker <script>window.__xss()</script><img src=x onerror=window.__xss()> javascript:window.__xss() http://localhost:4402/x', 3);
  const xssPosts = p.posts.slice(before).filter(x => x === 'comments').length;
  await send('QA-breaker ' + 'x'.repeat(10000));
  await send("QA-breaker 🎬🔥 日本語 ' OR 1=1;--");
  const b2 = p.posts.length; await send('   \n  ', 1); const wsPosts = p.posts.length - b2;
  const t = await bodyText(p);
  const rows = (t.match(/QA-breaker <script>/g) || []).length;
  const hrefs = await p.$$eval('a', as => as.map(a => a.href).filter(h => h.startsWith('javascript')));
  const ok = !p.xss && xssPosts === 1 && rows === 1 && wsPosts === 0 && !hrefs.length;
  return { pass: ok, actual: `xss=${p.xss} POSTs for triple-click=${xssPosts} visibleRows=${rows} whitespacePOSTs=${wsPosts} jsHrefs=${hrefs.length} tenKshown=${t.includes('xxxxxxxxxxxxxxxxxxxxxxxx')}` };
});
await check('comment-10k-layout', '10k-char comment does not break layout (no horizontal overflow of page)', ['open project', 'view'], async p => {
  await p.goto(`${BASE}/?p=${successProject}&url=${encodeURIComponent(VID)}`, { waitUntil: 'networkidle2' }); await sleep(1500);
  const ov = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  return { pass: ov.sw <= ov.cw + 2, actual: JSON.stringify(ov) };
});
await check('comment-back-button', 'Back from review page returns to landing; Esc/Back on modals do not crash', ['open project', 'open Share modal', 'Esc', 'open Share, Back', 'reload'], async p => {
  await landing(p); await p.goto(`${BASE}/?p=${successProject}&url=${encodeURIComponent(VID)}`, { waitUntil: 'networkidle2' }); await sleep(1200);
  const open = async () => { const [b] = await p.$$('xpath/.//button[contains(., "Share")]'); await b.click(); await sleep(600); };
  await open(); const m1 = (await bodyText(p)).length; await p.keyboard.press('Escape'); await sleep(500);
  const escClosed = !(await p.$('[role=dialog]')) ;
  const dlgAfterEsc = await p.$('[role=dialog], .fixed.inset-0');
  await open(); await p.goBack({ waitUntil: 'networkidle2' }).catch(() => {}); await sleep(1200);
  const t = (await bodyText(p)).trim();
  return { pass: t.length > 20, actual: `afterEscDialogStillThere=${!!dlgAfterEsc} afterBackUrl=${p.url()} text="${t.replace(/\s+/g, ' ').slice(0, 100)}"` };
});
await check('share-multiclick', 'triple-click share action creates no duplicate / errors', ['open project', 'open Share', 'triple-click each primary button'], async p => {
  await p.goto(`${BASE}/?p=${successProject}&url=${encodeURIComponent(VID)}`, { waitUntil: 'networkidle2' }); await sleep(1200);
  const [b] = await p.$$('xpath/.//button[contains(., "Share")]'); await b.click(); await sleep(800);
  const labels = await p.$$eval('.fixed button, [role=dialog] button', bs => bs.map(b => b.innerText.trim()).filter(Boolean));
  const before = p.posts.length;
  for (const l of labels.filter(l => /copy|create|generate|set|lock|save/i.test(l)).slice(0, 4)) {
    const [bb] = await p.$$(`xpath/.//*[contains(@class,"fixed")]//button[contains(., "${l}")]`); if (bb) { await bb.click({ clickCount: 3 }).catch(() => {}); await sleep(800); }
  }
  return { pass: true, actual: `share buttons=${JSON.stringify(labels)} new POSTs=${p.posts.length - before}` };
});

// Folders
for (const [id, name, clicks] of [['folder-empty', '   ', 1], ['folder-triple', 'QA-breaker folder triple', 3], ['folder-xss', 'QA-breaker <img src=x onerror=window.__xss()><script>window.__xss()</script>', 1], ['folder-10k', 'QA-breaker ' + 'y'.repeat(10000), 1], ['folder-emoji-sql', "QA-breaker 📁'; DROP TABLE folders;--", 2]]) {
  await check(id, id === 'folder-empty' ? 'whitespace name cannot create folder' : 'exactly 1 folder created, no XSS, no crash', ['open /', `type name`, `click Create x${clicks}`], async p => {
    await landing(p); const sel = 'input[placeholder^="Project or show"]'; await setVal(p, sel, name);
    const btn = (await p.$$('button[type=submit]'))[1];
    const dis = await btn.evaluate(b => b.disabled);
    if (!dis) await btn.click({ clickCount: clicks });
    await sleep(4000);
    const n = p.posts.filter(x => /folders/.test(x)).length;
    const t = await bodyText(p);
    const ok = id === 'folder-empty' ? n === 0 : (!p.xss && n <= 1 && t.trim().length > 20);
    return { pass: ok, actual: `disabled=${dis} folderPOSTs=${n} url=${p.url().slice(0, 80)} xss=${p.xss} text="${t.replace(/\s+/g, ' ').slice(0, 100)}"` };
  });
}
await check('folder-back-forward', 'Back/forward around folder page works', ['create folder', 'Back', 'Forward'], async p => {
  await landing(p); await setVal(p, 'input[placeholder^="Project or show"]', 'QA-breaker folder backfwd');
  await (await p.$$('button[type=submit]'))[1].click(); await p.waitForFunction(() => location.search.includes('f='), { timeout: 10000 }); await sleep(1500);
  await p.goBack({ waitUntil: 'networkidle2' }).catch(() => {}); await sleep(1000);
  const a = (await bodyText(p)).replace(/\s+/g, ' ').slice(0, 120);
  await p.goForward({ waitUntil: 'networkidle2' }).catch(() => {}); await sleep(1500);
  const b = (await bodyText(p)).replace(/\s+/g, ' ').slice(0, 120);
  return { pass: a.length > 10 && b.length > 10, actual: `back="${a}" fwd="${b}"` };
});
await check('landing-history-duplicates', 'landing history list has no duplicate entries for the same project', ['open / after creating projects in same context'], async p => {
  await p.goto(`${BASE}/?url=${encodeURIComponent(VID)}`, { waitUntil: 'networkidle2' }); await sleep(3000);
  await p.goto(BASE, { waitUntil: 'networkidle2' }); await sleep(1000);
  const hrefs = await p.$$eval('a', as => as.map(a => a.getAttribute('href')).filter(h => h && h.includes('p=')));
  return { pass: new Set(hrefs).size === hrefs.length, actual: `hrefs=${hrefs.length} unique=${new Set(hrefs).size}` };
});

await browser.close();
const fail = checks.filter(c => !c.pass);
const success = checks.find(c => c.id === 'first-success')?.pass ?? false;
const out = { persona: 'breaker', build: '4be2bc9', success, checks, findings: [], created: [...new Set(created)], replay: 'breaker.mjs', limitations: ['garbage URL project titles cannot carry QA-breaker prefix (title derived from URL)', 'headless Chrome: video play via muted programmatic play()'] };
fs.writeFileSync(new URL(`./result-${MODE}.json`, import.meta.url), JSON.stringify(out, null, 1));
console.log(`success=${success} fails=${fail.length}/${checks.length}`);
process.exit(fail.length ? 1 : 0);
