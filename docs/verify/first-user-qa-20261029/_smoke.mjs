import puppeteer from 'puppeteer';
const b = await puppeteer.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}); const c = await b.createBrowserContext(); const p = await c.newPage();
await p.goto(process.argv[2]); console.log(await p.title(), (await p.evaluate(()=>document.body.innerText)).slice(0,300)); await b.close();
