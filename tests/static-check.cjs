const fs=require('node:fs');const vm=require('node:vm');const assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8');
const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];
assert(scripts.length>0,'No inline scripts found');
for(const [index,script] of scripts.entries())new vm.Script(script[1],{filename:'inline-'+index+'.js'});
for(const token of ['function buildEarth()','function buildAtmosphere()','function buildSpace()','function applyRenderDPR(','visibilitychange','window.branchAdventurePerf','buildPlaces();buildIslands();buildMountains();','spacePromise=new Promise'])assert(html.includes(token),'Missing '+token);
console.log('PASS: inline JS syntax and critical feature presence ('+scripts.length+' scripts)');