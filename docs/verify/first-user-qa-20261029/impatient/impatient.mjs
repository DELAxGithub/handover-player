import puppeteer from 'puppeteer';
import fs from 'fs';
const BASE=process.env.BASE_URL||'http://localhost:4401';
const mode=process.argv[2]==='after'?'after':'before';
const dir=`./shots-${mode}`;fs.mkdirSync(dir,{recursive:true});
const LINK=(process.env.MEDIA_BASE||'http://localhost:4402')+'/qa-sample.mp4';
const b=await puppeteer.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const c=await b.createBrowserContext();const p=await c.newPage();await p.setViewport({width:1280,height:800});
const log=[];p.on('console',m=>{if(['error','warning'].includes(m.type()))log.push('console '+m.type()+': '+m.text())});
p.on('requestfailed',r=>log.push('reqfail '+r.url()));p.on('response',r=>{if(r.status()>=400)log.push('http '+r.status()+' '+r.url())});
const checks=[];const sh=async n=>{await p.screenshot({path:`${dir}/${n}.png`});return `${dir}/${n}.png`};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const chk=async(id,pass,expected,actual,steps)=>{const s=await sh(id);checks.push({id,pass,expected,actual,steps,screenshot:s});return pass};
const created=[];let success=false;const TEXT='QA-impatient comment '+Date.now();
async function run(){
 await p.goto(BASE,{waitUntil:'networkidle2'});await sh('01-landing');
 await p.type('input[placeholder^="https://dropbox"]',LINK);
 await Promise.all([p.keyboard.press('Enter'),sleep(4000)]);
 const url=p.url();created.push(url);
 const hasVideo=await p.evaluate(()=>!!document.querySelector('video'));
 if(!await chk('02-open-review',hasVideo&&url!==BASE+'/','review page w/ video',`url=${url} video=${hasVideo} text=${(await p.evaluate(()=>document.body.innerText)).slice(0,200)}`,['paste link','Enter']))return;
 await sleep(3000);
 const st=await p.evaluate(()=>{const v=document.querySelector('video');return {rs:v.readyState,err:v.error&&v.error.code,dur:v.duration,src:v.currentSrc}});
 await p.evaluate(()=>document.querySelector('video').play().catch(()=>{}));await sleep(1500);
 const t=await p.evaluate(()=>document.querySelector('video').currentTime);
 if(!await chk('03-plays',t>0,'currentTime>0',JSON.stringify({...st,t}),['wait','play']))return;
 const ta=await p.$('textarea, input[placeholder*="omment" i]');
 if(!await chk('04-comment-box',!!ta,'comment input exists','inputs: '+await p.evaluate(()=>[...document.querySelectorAll('button,input,textarea')].map(e=>e.tagName+'|'+(e.innerText||e.placeholder)).join(', ')),['look']))return;
 await ta.type(TEXT);await sh('05-typed');
 const btns=await p.$$('button');let sent=false;
 for(const bt of btns){const tx=await bt.evaluate(e=>e.innerText);if(/send|post|add|submit|送信|投稿|追加/i.test(tx)){await bt.click();sent=true;break}}
 if(!sent)await p.keyboard.press('Enter');
 await sleep(2500);
 const inList=(await p.evaluate(()=>document.body.innerText)).includes(TEXT);
 if(!await chk('06-in-list',inList,'comment visible','visible='+inList,['type','send']))return;
 await p.reload({waitUntil:'networkidle2'});await sleep(2500);
 const persisted=(await p.evaluate(()=>document.body.innerText)).includes(TEXT);
 if(!await chk('07-persist',persisted,'comment after reload','persisted='+persisted,['reload']))return;
 success=true;
}
try{await run()}catch(e){checks.push({id:'exception',pass:false,expected:'no error',actual:String(e),steps:[],screenshot:await sh('99-exc')})}
fs.writeFileSync('./run-'+mode+'.json',JSON.stringify({success,checks,created,log},null,1));
console.log(JSON.stringify({success,checks:checks.map(c=>[c.id,c.pass,c.actual]),log},null,1));
await b.close();process.exit(success?0:1);
