import puppeteer from 'puppeteer';
import fs from 'fs';
const BASE = process.env.BASE_URL || 'http://localhost:4401';
const mode = process.argv[2] || 'before';
const dir = `./shots-${mode}`; fs.mkdirSync(dir, { recursive: true });
const VIDEO = 'http://localhost:4402/qa-sample.mp4';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const checks = [], findings = [], created = [];
const b = await puppeteer.launch({ headless: true, executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
const p = await (await b.createBrowserContext()).newPage();
await p.setViewport({ width: 1280, height: 800 });
const shot = async n => { const f = `${dir}/${n}.png`; await p.screenshot({ path: f }); return f; };
const chk = (id, pass, expected, actual, steps, screenshot) => checks.push({ id, pass, expected, actual, steps, screenshot });
const text = () => p.evaluate(() => document.body.innerText.replace(/\n+/g, ' / '));
const unlabeled = () => p.evaluate(() => [...document.querySelectorAll('button,a,input')].filter(e =>
  !(e.innerText || '').trim() && !e.title && !e.getAttribute('aria-label') && !e.placeholder).map(e => e.tagName + ':' + (e.type || e.className.toString().slice(0, 30))));

await p.goto(BASE, { waitUntil: 'networkidle2' });
const s1 = await shot('01-home');
const u1 = await unlabeled();
chk('home-controls-labeled', u1.length === 0, 'every button has a text label', 'icon-only without name: ' + u1.join(','), ['open /'], s1);
chk('home-says-non-dropbox-ok', /(any|other)\s+(video\s+)?link|works best/i.test(await text()), 'UI does not require Dropbox for a plain video link', 'Home says "Paste a Dropbox video link" and placeholder is dropbox.com; given link is not Dropbox', ['read home'], s1);

await p.type('input[type=text]', VIDEO);
await p.click('button[type=submit]');
await sleep(5000);
const s2 = await shot('02-review-after-paste');
const t2 = await text();
const vid = await p.evaluate(() => { const v = document.querySelector('video'); return v && { rs: v.readyState, err: v.error && v.error.code, dur: v.duration }; });
chk('video-plays', !!vid && vid.rs >= 1 && !vid.err, 'video loads', JSON.stringify(vid), ['paste link', 'press submit icon'], s2);
const failed = /failed|not saved/i.test(t2);
chk('project-auto-created', !failed, 'review page ready, no error', t2.slice(0, 200), ['wait 5s'], s2);
created.push(p.url());
if (failed) {
  const btn = (await p.$$('xpath/.//button[contains(., "Create New Project")]'))[0];
  if (btn) await btn.click();
  await sleep(3000);
}
const s3 = await shot('03-after-create-new-project');
const t3 = await text();
const hasInput = await p.$('textarea, input[placeholder*="omment" i]');
chk('comment-box-available', !!hasInput, 'a comment box with a label', 'text: ' + t3.slice(0, 200), ['click "Create New Project"'], s3);
const unl = await unlabeled();
chk('review-controls-labeled', unl.length === 0, 'every button has name', 'icon-only without name: ' + unl.join(','), ['inspect review page'], s2);

let persisted = false;
if (hasInput) {
  const MSG = 'QA-literal comment ' + Date.now();
  await hasInput.type(MSG); await (await p.$('button[aria-label="Send comment"]')).click(); await sleep(1500); // the visible "Send" button, as the UI says
  await p.reload({ waitUntil: 'networkidle2' }); await sleep(2500);
  persisted = (await text()).includes(MSG);
  await shot(persisted ? 'success' : '04-comment-lost');
}
chk('comment-persists', persisted, 'comment visible after reload', persisted ? 'yes' : 'no comment possible/persisted', ['type comment', 'reload'], `${dir}/03-after-create-new-project.png`);

const success = checks.find(c => c.id === 'comment-persists').pass;
fs.writeFileSync(`${dir}/state.json`, JSON.stringify({ success, checks, created }, null, 1));
console.log(JSON.stringify(checks.map(c => [c.id, c.pass])));
await b.close();
process.exit(checks.every(c => c.pass) ? 0 : 1);
