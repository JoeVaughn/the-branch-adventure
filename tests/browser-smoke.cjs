const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--disable-web-security']});
 let page=await browser.newPage({viewport:{width:1280,height:800}});
 await page.addInitScript(()=>localStorage.setItem('tinyplanet.v1',JSON.stringify({ql:'high',found:['c-brazil']})));
 const errors=[];
 // Freeze through the app's background-tab lifecycle only during capture.
 // SwiftShader can starve Chrome's compositor when a continuous WebGL loop is active.
 // Resume immediately afterwards so interaction checks still run against live animation.
 const capture=async(p,options)=>{
   await p.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'))});
   try{await p.screenshot({...options,timeout:60000})}
   finally{await p.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'))})}
 };
 const watch=p=>{p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error'&&/THREE.WebGLProgram|VALIDATE_STATUS|shader error|CONTEXT_LOST/i.test(m.text()))errors.push(m.text())})};
 watch(page);
 await page.goto('http://127.0.0.1:8000/',{waitUntil:'domcontentloaded',timeout:30000});
 await page.waitForFunction(()=>Boolean(window.branchAdventurePerf?.snapshot().bootMs>0&&document.querySelector('#gl')),null,{timeout:90000});
 await page.waitForTimeout(1200);
 const state=await page.evaluate(()=>({canvas:!!document.querySelector('#gl'),perf:window.branchAdventurePerf.snapshot(),loading:!!document.querySelector('#loading'),body:document.body.innerText.slice(0,100)}));
 await capture(page,{path:'earth-smoke.png'});
 if(errors.length)throw Error('Browser JavaScript errors: '+errors.join(' | '));
 if(!state.canvas||!state.perf.frames)throw Error('No active canvas frames: '+JSON.stringify(state));
 console.log('Browser Earth smoke test passed:',JSON.stringify(state));
 if(state.perf.visualVersion!=='cinematic-v2'||!state.perf.weather)throw Error('HQ weather layer missing');
 // Verify the complete state atlas is navigable and educational details are present.
 await page.locator('#btnDex').click();
 await page.locator('#dexTabs .tab[data-cat="state"]').click();
 const statesListed=await page.locator('#dexGrid .cell.seen').count();
 if(statesListed!==50)throw Error('Expected 50 browsable U.S. states, got '+statesListed);
 await page.locator('#dexGrid .cell.seen').first().click();
 const details=await page.locator('#card').innerText();
 if(!details.includes('Alabama')||!details.includes('Montgomery'))throw Error('U.S. state facts unavailable: '+details.slice(0,240));
 console.log('Browser U.S. States atlas passed:',statesListed,'profiles, Alabama capital verified');
 await page.locator('#cardClose').click();
 // Validate global boundary data and a guided country adventure.
 await page.waitForFunction(()=>{const p=window.branchAdventurePerf.snapshot();return p.countryBordersMs>0||p.countryBordersError},null,{timeout:30000});
 const borders=await page.evaluate(()=>window.branchAdventurePerf.snapshot());
 if(borders.countryBordersError)throw Error('Country borders failed: '+borders.countryBordersError);
 await page.locator('#btnDex').click();
 await page.locator('#dexTabs .tab[data-cat="country"]').click();
 const brazil=page.locator('#dexGrid .cell.seen[data-id="c-brazil"]');
 if(await brazil.count()!==1)throw Error('Brazil profile not unlocked for interaction smoke test');
 await brazil.click();
 const adventure=page.locator('#cardActions button[data-a="experience"]');
 if(await adventure.count()!==1)throw Error('Brazil guided adventure action missing');
 await adventure.click();
 await page.waitForTimeout(800);
 const exp=await page.evaluate(()=>({hidden:document.querySelector('#expHud').hidden,width:document.querySelector('#expBar').style.width,name:document.querySelector('#expName').textContent}));
 if(exp.hidden||!exp.name.includes('Amazon')||parseFloat(exp.width)<=0)throw Error('Guided adventure animation failed: '+JSON.stringify(exp));
 await page.locator('#expSkip').click();
 if(state.perf.bootMs<=0||state.perf.bootMs>75000)throw Error('HQ Earth boot exceeded 75s software-GPU budget: '+JSON.stringify(state.perf));
 if(borders.countryBordersMs>30000)throw Error('Country borders exceeded 30s deferred budget: '+JSON.stringify(borders));
 console.log('HQ Earth performance budget passed:',JSON.stringify({bootMs:state.perf.bootMs,countryBordersMs:borders.countryBordersMs}));

 // Exercise the deferred space-loading path as well as the initial Earth render.
 await page.close();
 page=await browser.newPage({viewport:{width:1280,height:800}});
 await page.addInitScript(()=>localStorage.setItem('tinyplanet.v1',JSON.stringify({ql:'fast'})));
 watch(page);
 await page.goto('http://127.0.0.1:8000/#space',{waitUntil:'domcontentloaded',timeout:90000});
 await page.waitForFunction(()=>window.branchAdventurePerf&&window.branchAdventurePerf.snapshot().mode==='space',null,{timeout:120000});
 await page.waitForTimeout(1500);
 const space=await page.evaluate(()=>window.branchAdventurePerf.snapshot());
 await capture(page,{path:'space-smoke.png'});
 if(errors.length)throw Error('Browser JavaScript errors: '+errors.join(' | '));
 if(space.mode!=='space'||space.frames<1)throw Error('Space scene failed: '+JSON.stringify(space));
 if(space.spaceReadyMs<=0||space.spaceReadyMs>120000)throw Error('Direct-space load exceeded 120s software-GPU budget: '+JSON.stringify(space));
 console.log('Browser Space smoke test passed:',JSON.stringify(space));
 if(space.weather)throw Error('FAST mode allocated the HQ weather layer');
 // Compile the HQ-only corona and inspect the lit rings in a real WebGL context.
 await page.close();
 page=await browser.newPage({viewport:{width:1280,height:800}});watch(page);
 await page.addInitScript(()=>localStorage.setItem('tinyplanet.v1',JSON.stringify({ql:'high'})));
 await page.goto('http://127.0.0.1:8000/#space',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.branchAdventurePerf?.snapshot().mode==='space',null,{timeout:120000});
 await page.locator('.sbtn[data-id="saturn"]').click();
 await page.waitForFunction(()=>!window.branchAdventurePerf.snapshot().cameraMoving,null,{timeout:90000});
 await page.waitForTimeout(1500);
 await capture(page,{path:'saturn-hq.png'});
 await page.locator('#cardClose').click();
 await page.locator('.sbtn[data-id="sun"]').click();
 await page.waitForFunction(()=>!window.branchAdventurePerf.snapshot().cameraMoving,null,{timeout:90000});
 await page.waitForTimeout(1500);
 await capture(page,{path:'sun-hq.png'});
 await page.locator('#cardClose').click();
 await page.locator('#btnEarth').click();
 await page.waitForFunction(()=>window.branchAdventurePerf.snapshot().mode==='earth',null,{timeout:90000});
 await page.waitForTimeout(1500);
 await capture(page,{path:'earth-hq.png'});
 await page.setViewportSize({width:390,height:844});
 await page.waitForTimeout(1000);
 const mobile=await page.evaluate(()=>({width:document.documentElement.scrollWidth,viewport:innerWidth,frames:window.branchAdventurePerf.snapshot().frames}));
 if(mobile.width>mobile.viewport||mobile.frames<1)throw Error('Mobile layout/render failed: '+JSON.stringify(mobile));
 await capture(page,{path:'earth-mobile.png'});
 if(errors.length)throw Error('Shader/runtime regression: '+errors.join(' | '));
 console.log('HQ space, return to Earth and mobile viewport passed');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
