const {chromium}=require('playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
// Inject test access into the served response only; the shipped page exposes no mutation API.
const access=`window.audit={ITEMS,DISCOVERY_IDS,QUESTS,LANDMARKS,ANIMALS,CITIES,ISLANDS,US_STATES,VEHICLES,COUNTRIES,BIBLICAL_SITES,DEXCATS,
 openItem,discover,renderDex,renderQuest,updateCounts,startExperience,stopExperience,experienceFor,experienceUpdate,startRide,exitRide,updateEarth,launch,launchUpdate,ensureSpaceReady,enterSpace,goEarth,scFlyTo,spaceCamUpdate,drawUSStateBoundaries,
 state:()=>({mode,returning,experience:!!experience,ride:!!ride,launch:launchState?.phase,spaceReady,simulationTime:T,found:[...found],questIdx,quality,spaceItems:spaceItems.length,labels:sLabels.length,picks:spacePick.length,frames:perfStats.frames}),
 selectCategory:c=>{dexCat=c;renderDex()}, camera:()=>({alt:EC.tAlt,dist:SC.tDist,focus:SC.focus,fly:SC.fly?.it.id}),
 stopWelcome:()=>clearTimeout(spaceWelcomeTimer), stepLaunch:(dt,t)=>launchState&&launchUpdate(dt,t),
 muteValue:()=>audioGain?.gain.value, progress:()=>({found,questIdx}), renderer,
 failNextSpace:()=>{const original=buildSpace;buildSpace=async()=>{buildSpace=original;const obj=new THREE.Mesh(new THREE.SphereGeometry(1),new THREE.MeshBasicMaterial());spaceScene.add(obj);sItem({id:'test-partial',name:'Partial',obj,r:1});throw Error('Injected space build failure')}},
 questFound:ids=>{found=new Set(ids);questIdx=0;renderQuest();updateCounts()}
};
Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));`;
const html=fs.readFileSync('index.html','utf8').replace('boot().catch(err=>',access+'\nboot().catch(err=>');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl']});
 try{
 const page=await browser.newPage({viewport:{width:1000,height:720}});page.setDefaultTimeout(60000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&/THREE.WebGLProgram|VALIDATE_STATUS|shader error|CONTEXT_LOST/i.test(m.text()))errors.push(m.text())});
 await page.route('http://127.0.0.1:8000/',route=>route.fulfill({contentType:'text/html',body:html}));
 await page.addInitScript(()=>{if(!sessionStorage.auditSeeded){localStorage.setItem('tinyplanet.v1','{"ql":"fast","q":"3","found":["c-brazil","saturn",null,2],"snd":false}');sessionStorage.auditSeeded='1'}});
 await page.goto('http://127.0.0.1:8000/',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.branchAdventurePerf?.snapshot().bootMs>0,null,{timeout:90000});
 assert.equal(await page.getAttribute('#zSound','aria-label'),'Sound off');
 assert.equal(await page.evaluate(()=>audit.state().questIdx),0);await page.waitForFunction(()=>audit.state().simulationTime>0);console.log('PASS: visibility change before boot does not freeze simulation');
 assert.equal(await page.locator('#dexCount').innerText(),'2/391');
 // Real UI: every Dex tab, empty/locked categories, atlas, dismissals, zoom, audio.
 await page.locator('#btnDex').click();
 for(const cat of ['landmark','animal','country','island','city','biblical','state','space']){
   await page.locator('#dexTabs [data-cat="'+cat+'"]').click();
   assert(!/NaN|Infinity/.test(await page.locator('#dexBar').getAttribute('style')));
 }
 await page.locator('#dexTabs [data-cat="state"]').click();assert.equal(await page.locator('#dexGrid .seen').count(),50);
 await page.locator('#dexGrid [data-id="state-hi"]').click();assert((await page.locator('#card').innerText()).includes('Honolulu'));
 await page.locator('#cardActions [data-a="experience"]').click();assert.equal(await page.evaluate(()=>audit.state().experience),true);
 await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>audit.state().experience),false);
 let alt=await page.evaluate(()=>audit.camera().alt);await page.locator('#zIn').click();assert((await page.evaluate(()=>audit.camera().alt))<alt);
 await page.locator('#zOut').click();await page.locator('#zHome').click();
 await page.locator('#zSound').click();await page.waitForFunction(()=>audit.muteValue()===1);await page.locator('#zSound').click();await page.waitForFunction(()=>audit.muteValue()===0);
 console.log('PASS: Dex categories, Hawaii facts/tour, Escape, zoom/reset and audio mute');
 // A partial initialization failure must release the launch lock and permit retry.
 await page.evaluate(()=>{audit.startExperience(audit.ITEMS.get('c-brazil'));audit.failNextSpace()});
 await page.evaluate(()=>audit.launch());
 const failed=await page.evaluate(()=>audit.state());assert.equal(failed.launch,undefined);assert.equal(failed.experience,false);assert.equal(failed.spaceReady,false);assert.equal(failed.spaceItems,0);assert.equal(failed.picks,0);
 await page.evaluate(()=>audit.ensureSpaceReady());
 assert.equal(await page.evaluate(()=>audit.state().spaceReady),true);
 await page.waitForFunction(()=>[...audit.ITEMS.values()].filter(i=>i.cat==='city').length===audit.CITIES.length,null,{timeout:90000});
 // Freeze rendering for exhaustive deterministic model/state checks, then resume below.
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'))});
 const auditResult=await page.evaluate(()=>{
   const a=audit,fail=m=>{throw Error(m)},all=[...a.ITEMS.values()],counts={};
   for(const it of all){counts[it.cat]=(counts[it.cat]||0)+1;if(!it.name||!Array.isArray(it.facts)||!it.facts.length)fail('Invalid profile '+it.id);
     if(it.lat!==undefined&&(!Number.isFinite(it.lat)||!Number.isFinite(it.lon)||Math.abs(it.lat)>90||Math.abs(it.lon)>180))fail('Invalid coordinates '+it.id);
     a.openItem(it,false);if(!document.querySelector('#cardName').textContent.includes(it.name))fail('Card '+it.id);
     it.obj?.traverse(o=>{if(o.geometry?.attributes.position){for(const n of o.geometry.attributes.position.array)if(!Number.isFinite(n))fail('Non-finite model '+it.id)}});
   }
   for(const q of a.QUESTS)if(!a.ITEMS.has(q[0]))fail('Missing quest target '+q[0]);
   if(all.filter(it=>it.cat!=='vehicle').length!==a.DISCOVERY_IDS.size)fail('Catalog total differs from loaded profiles');for(const id of a.DISCOVERY_IDS)if(!a.ITEMS.has(id))fail('Missing catalog entry '+id);
   for(const id of ['hawaii','maui','oahu','kauai','molokai','lanai','niihau','kahoolawe'])if(!a.ITEMS.get('isl-'+id).place.includes('Pacific'))fail('Hawaiian island mislabeled '+id);
   let tours=0,rides=0;
   for(const it of all){if(a.experienceFor(it)){a.startExperience(it);if(!a.state().experience)fail('Tour '+it.id);for(let t=0;t<30;t++)a.experienceUpdate(1);if(a.state().experience)fail('Tour did not finish '+it.id);tours++}
     if(it.ride){a.updateEarth(.016,1);a.startRide(it);a.updateEarth(.016,1);if(!a.state().ride)fail('Ride '+it.id);a.exitRide();rides++}}
   const ids=a.QUESTS.slice(0,3).map(q=>q[0]);a.questFound(ids);if(a.state().questIdx!==3)fail('Quest reconciliation');if(JSON.parse(localStorage.getItem('tinyplanet.v1')).q!==3)fail('Quest not persisted');
   a.questFound([...a.ITEMS.values()].filter(i=>i.cat!=='vehicle').slice(0,5).map(i=>i.id));if(!document.querySelector('#msCount').textContent.includes('/ 10'))fail('Milestone 5 -> 10');
   const collection=[...a.DISCOVERY_IDS];a.questFound(collection.slice(0,390));if(document.querySelector('#msBar').style.width!=='0%')fail('Final milestone interval');a.questFound(collection);if(!document.querySelector('#msLabel').textContent.includes('complete'))fail('Completion label');
   for(const topology of [null,{}, {objects:{states:{}},transform:{}}]){let caught=false;try{a.drawUSStateBoundaries(topology)}catch{caught=true}if(!caught)fail('Invalid boundaries silently accepted')}
   document.querySelector('#cardClose').click();return {profiles:all.length,counts,tours,rides};
 });
 console.log('PASS: complete profile/model/quest/tour/ride audit',JSON.stringify(auditResult));
 // Full liftoff including detached boosters; verify transforms survive repeated launch.
 const scales=await page.evaluate(()=>audit.ITEMS.get('ksc').obj.userData.boosters.map(b=>b.scale.toArray()));
 await page.evaluate(()=>audit.launch());
 await page.evaluate(()=>{for(let t=0;t<16;t+=.05)audit.stepLaunch(.05,t);audit.stopWelcome()});
 assert.equal(await page.evaluate(()=>audit.state().mode),'space');
 assert.deepEqual(await page.evaluate(()=>audit.ITEMS.get('ksc').obj.userData.boosters.map(b=>b.scale.toArray())),scales);
 assert.equal(await page.evaluate(()=>location.hash),'#space');
 await page.evaluate(()=>{audit.goEarth();audit.scFlyTo(audit.ITEMS.get('saturn'));for(let i=0;i<30;i++)audit.spaceCamUpdate(.25)});
 await page.waitForFunction(()=>audit.state().mode==='earth');assert.equal(await page.evaluate(()=>location.hash),'');
 await page.evaluate(()=>audit.launch());await page.locator('#ctSkip').click();await page.evaluate(()=>audit.stepLaunch(.016,1));
 await page.waitForFunction(()=>audit.state().mode==='space');await page.evaluate(()=>audit.stopWelcome());
 assert.deepEqual(await page.evaluate(()=>audit.ITEMS.get('ksc').obj.userData.boosters.map(b=>b.scale.toArray())),scales);
 // User selects a destination immediately, then returns before the welcome camera timer.
 await page.evaluate(()=>{audit.enterSpace();audit.goEarth();audit.scFlyTo(audit.ITEMS.get('mars'))});
 await page.waitForTimeout(1000);assert.equal(await page.evaluate(()=>audit.camera().fly),'earth');
 await page.evaluate(()=>{for(let i=0;i<30;i++)audit.spaceCamUpdate(.25)});await page.waitForFunction(()=>audit.state().mode==='earth');
 console.log('PASS: failure/retry, full launch, booster restoration, skip, immediate return and navigation race');
 const before=await page.evaluate(()=>audit.state().frames);await page.waitForTimeout(200);assert.equal(await page.evaluate(()=>audit.state().frames),before);
 await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'))});
 await page.waitForFunction(n=>audit.state().frames>n,before);console.log('PASS: background pause and resume');
 // Browser reload checks storage persistence and real HQ/FAST quality controls.
 await page.locator('#zQ').click();await page.waitForFunction(()=>document.querySelector('#qLbl')?.textContent==='HQ',null,{timeout:90000});
 await page.waitForFunction(()=>window.branchAdventurePerf?.snapshot().bootMs>0,null,{timeout:90000});
 assert.equal(await page.evaluate(()=>audit.state().quality),'high');assert.equal(await page.evaluate(()=>audit.state().mode),'earth');
 assert((await page.evaluate(()=>audit.state().found)).length>=5);
 assert.deepEqual(errors,[]);console.log('PASS: quality reload, persisted discovery, runtime/shader error checks');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
