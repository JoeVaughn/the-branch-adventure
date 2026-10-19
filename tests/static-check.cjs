const fs=require('node:fs');const vm=require('node:vm');const assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8');
const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];
assert(scripts.length>0,'No inline scripts found');
for(const [index,script] of scripts.entries())new vm.Script(script[1],{filename:'inline-'+index+'.js'});
for(const token of ['function buildEarth()','function buildAtmosphere()','function buildSpace()','function applyRenderDPR(','visibilitychange','window.branchAdventurePerf','buildPlaces();buildIslands();buildGroundTraffic();buildLabels();','spacePromise=new Promise'])assert(html.includes(token),'Missing '+token);
console.log('PASS: inline JS syntax and critical feature presence ('+scripts.length+' scripts)');
const match=html.match(/const COUNTRY_ECONOMY=(\{[^\n]+\});/);
assert(match,'Country economy dataset missing');
const economy=JSON.parse(match[1]);
assert.equal(Object.keys(economy).length,64,'Expected curated economic facts for 64 countries/regions');
const cities=[...html.matchAll(/CITIES\.push\(([\s\S]*?)\);/g)];
assert(cities,'Additional city destinations missing');
assert.equal(cities.reduce((n,m)=>n+(m[1].match(/^\s*\[(?:"|')/gm)||[]).length,0),33,'Expected 30 global and 3 Hawaiian destinations');
for(const token of ['showVehicleRoute(it)','Illustrative service route','const stops=wps.length>2','requestIdleCallback','Examples of goods exported'])assert(html.includes(token),'Missing feature '+token);
console.log('PASS: 30 new cities, 64 country economy profiles, transport routes and space preload');

for(const id of ['hawaii','maui','oahu','kauai','molokai','lanai','niihau','kahoolawe'])assert(html.includes('"'+id+'"'),'Missing Hawaiian island '+id);
assert(html.includes('land*Math.pow(Math.max(0,e),1.65)*.014'),'Elevation displacement missing');
console.log('PASS: Eight Hawaiian island meshes and elevation shaping');

for(const token of ['function makeHelicopterOrbit(','function buildGroundTraffic()','VEHICLES.push(','new THREE.InstancedMesh(new THREE.BoxGeometry'])assert(html.includes(token),'Missing dynamic transport system '+token);
console.log('PASS: helicopter hovering, expanded air/sea routes and global road traffic');
