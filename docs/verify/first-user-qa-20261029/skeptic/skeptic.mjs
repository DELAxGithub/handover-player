import puppeteer from '../../../../node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js';
import fs from 'fs';
const BASE=process.env.BASE_URL||'http://localhost:4401';
const mode=process.argv[2]||'before';const dir=`./shots-${mode}`;fs.mkdirSync(dir,{recursive:true});
const VIDEO='http://localhost:4402/qa-sample.mp4';
const checks=[],findings=[],created=[];
const b=await puppeteer.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const c=await b.createBrowserContext();const p=await c.newPage();await p.setViewport({width:1280,height:800});
const shot=async n=>{const f=`${dir}/${n}.png`;await p.screenshot({path:f});return f};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const chk=(id,pass,expected,actual,steps,screenshot)=>checks.push({id,pass,expected,actual,steps,screenshot});
const netfail=[];p.on('requestfailed',r=>{if(/supabase/.test(r.url()))netfail.push(r.failure()?.errorText)});
await p.goto(BASE,{waitUntil:'networkidle0'});
const home=await p.evaluate(()=>({t:document.body.innerText,links:[...document.querySelectorAll('a')].map(a=>a.href)}));
const s1=await shot('01-home');
chk('legal-links-on-home',/terms|privacy|pricing|利用規約|プライバシー|料金/i.test(home.t)||home.links.some(l=>/terms|privacy|pricing/i.test(l)),'Terms/privacy/pricing links visible on landing','none: text="'+home.t.replace(/\n+/g,' / ')+'" links='+home.links.join(','),['open /'],s1);
const exp=/who can see|anyone with|retention|stored|expire|passcode|contact|operator|保存|閲覧|削除/i.test(home.t);
chk('data-explanation',exp,'Landing explains storage, link visibility, retention, operator','no explanation text',['read landing'],s1);
const dead=[];
for(const u of ['/terms','/privacy','/pricing','/about','/contact']){await p.goto(BASE+u,{waitUntil:'networkidle0'});const t=await p.evaluate(()=>document.body.innerText);dead.push(u+' => '+t.replace(/\n+/g,' / ').slice(0,80));}
const s2=await shot('02-terms-url');
chk('legal-urls-exist',!dead.every(d=>/Start a review/.test(d)),'/terms etc. show legal pages','all fall back to home: '+dead.join(' || '),['visit /terms,/privacy,/pricing,/about,/contact'],s2);
// flow
await p.goto(BASE,{waitUntil:'networkidle0'});
await p.type('input[placeholder^="https://dropbox"]',VIDEO);
await p.keyboard.press('Enter');
await sleep(300);
if(await p.evaluate(()=>location.pathname==='/'))await p.evaluate(()=>{const bs=[...document.querySelectorAll('button')].filter(x=>!x.innerText.includes('Create'));bs[0]&&bs[0].click()});
await sleep(4000);
const url1=p.url();created.push(url1);
const s3=await shot('03-review');
const vid=await p.evaluate(()=>{const v=document.querySelector('video');return v?{src:v.currentSrc,rs:v.readyState,err:v.error&&v.error.code,dur:v.duration}:null});
chk('video-loads',!!vid&&vid.rs>=1&&!vid.err,'video element loaded','video='+JSON.stringify(vid)+' url='+url1,['paste link','Enter'],s3);
const body=await p.evaluate(()=>document.body.innerText);
const share=/share|link|共有|anyone|private/i.test(body);
chk('review-explains-visibility',share,'review page says who can see link/comments','text="'+body.replace(/\n+/g,' / ').slice(0,200)+'"',['inspect review page'],s3);
chk('backend-reachable',netfail.length===0,'Supabase requests succeed','supabase failures: '+netfail.length+' '+netfail[0]+'; page text: '+body.replace(/\n+/g,' / ').slice(0,120),['open review'],s3);
// comment
const MSG='QA-skeptic comment '+Date.now();
const ta=await p.$('textarea, input[type=text]:not([placeholder^="https://dropbox"])');
let ok=false;
if(ta){await ta.type(MSG);await p.keyboard.down('Control');await p.keyboard.press('Enter');await p.keyboard.up('Control');await sleep(1500);
 if(!(await p.evaluate(m=>document.body.innerText.includes(m),MSG))){const bt=await p.$$('button');for(const x of bt){const t=await x.evaluate(e=>e.innerText);if(/send|post|add|submit|送信|コメント/i.test(t)){await x.click();break}}await sleep(1500)}
 ok=await p.evaluate(m=>document.body.innerText.includes(m),MSG)}
const s4=await shot('04-comment');
chk('comment-appears',ok,'comment visible','visible='+ok,['type comment','submit'],s4);
await p.reload({waitUntil:'networkidle0'});await sleep(2500);
const per=await p.evaluate(m=>document.body.innerText.includes(m),MSG);
const s5=await shot('05-after-reload');
chk('comment-persists',per,'comment visible after reload','visible='+per,['reload'],s5);
if(ok&&per)fs.copyFileSync(s5,`${dir}/success.png`);
fs.writeFileSync(`${dir}/state.json`,JSON.stringify({checks,created,MSG},null,1));
console.log(JSON.stringify(checks.map(x=>[x.id,x.pass])));
await b.close();
process.exit(checks.every(x=>x.pass)?0:1);
