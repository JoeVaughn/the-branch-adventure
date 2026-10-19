const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--disable-web-security']});
 const page=await browser.newPage({viewport:{width:1280,height:800}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8000/',{waitUntil:'domcontentloaded',timeout:30000});
 await page.waitForFunction(()=>Boolean(window.branchAdventurePerf&&document.querySelector('#gl')),{timeout:60000});
 await page.waitForTimeout(4000);
 const state=await page.evaluate(()=>({canvas:!!document.querySelector('#gl'),perf:window.branchAdventurePerf.snapshot(),loading:!!document.querySelector('#loading'),body:document.body.innerText.slice(0,100)}));
 await page.screenshot({path:'earth-smoke.png'});
 if(errors.length)throw Error('Browser JavaScript errors: '+errors.join(' | '));
 if(!state.canvas||!state.perf.frames)throw Error('No active canvas frames: '+JSON.stringify(state));
 console.log('Browser Earth smoke test passed:',JSON.stringify(state));
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
