const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--disable-web-security']});
 const page=await browser.newPage({viewport:{width:1280,height:800}});
 await page.addInitScript(()=>localStorage.setItem('tinyplanet.v1',JSON.stringify({ql:'fast'})));
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8000/',{waitUntil:'domcontentloaded',timeout:30000});
 await page.waitForFunction(()=>Boolean(window.branchAdventurePerf&&document.querySelector('#gl')),null,{timeout:90000});
 await page.waitForTimeout(1200);
 const state=await page.evaluate(()=>({canvas:!!document.querySelector('#gl'),perf:window.branchAdventurePerf.snapshot(),loading:!!document.querySelector('#loading'),body:document.body.innerText.slice(0,100)}));
 await page.screenshot({path:'earth-smoke.png'});
 if(errors.length)throw Error('Browser JavaScript errors: '+errors.join(' | '));
 if(!state.canvas||!state.perf.frames)throw Error('No active canvas frames: '+JSON.stringify(state));
 console.log('Browser Earth smoke test passed:',JSON.stringify(state));
 // Verify the complete state atlas is navigable and educational details are present.
 await page.locator('#btnDex').click();
 await page.locator('#dexTabs .tab[data-cat="state"]').click();
 const statesListed=await page.locator('#dexGrid .cell.seen').count();
 if(statesListed!==50)throw Error('Expected 50 browsable U.S. states, got '+statesListed);
 await page.locator('#dexGrid .cell.seen').first().click();
 const details=await page.locator('#card').innerText();
 if(!details.includes('Alabama')||!details.includes('Montgomery'))throw Error('U.S. state facts unavailable: '+details.slice(0,240));
 console.log('Browser U.S. States atlas passed:',statesListed,'profiles, Alabama capital verified');

 // Exercise the deferred space-loading path as well as the initial Earth render.
 await page.goto('http://127.0.0.1:8000/#space',{waitUntil:'domcontentloaded',timeout:30000});
 // Changing just the hash does not reload the app; test the documented direct-entry route.
 await page.reload({waitUntil:'domcontentloaded',timeout:30000});
 await page.waitForFunction(()=>window.branchAdventurePerf&&window.branchAdventurePerf.snapshot().mode==='space',null,{timeout:120000});
 await page.waitForTimeout(1500);
 const space=await page.evaluate(()=>window.branchAdventurePerf.snapshot());
 await page.screenshot({path:'space-smoke.png'});
 if(errors.length)throw Error('Browser JavaScript errors: '+errors.join(' | '));
 if(space.mode!=='space'||space.frames<1)throw Error('Space scene failed: '+JSON.stringify(space));
 console.log('Browser Space smoke test passed:',JSON.stringify(space));
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
