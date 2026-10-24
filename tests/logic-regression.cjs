const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8');
function extract(name){const start=html.indexOf('function '+name+'(');assert(start>=0,name);let pos=html.indexOf('{',start),depth=1;for(let i=pos+1;i<html.length;i++){if(html[i]==='{')depth++;else if(html[i]==='}'&&!--depth)return html.slice(start,i+1)}throw Error(name)}
for(const [input,expected] of [['null',{found:[],q:0}],['{bad',{found:[],q:0}],['{"found":"oops","q":"2"}',{found:[],q:0}],['{"found":["c-brazil",3,null],"q":-1}',{found:['c-brazil'],q:0}],['{"found":["saturn"],"q":3}',{found:['saturn'],q:3}]]){
 const context={localStorage:{getItem:()=>input}};vm.createContext(context);vm.runInContext(extract('readProgress')+';result=readProgress()',context);assert.deepEqual(JSON.parse(JSON.stringify(context.result)),expected);
}
const blocked={localStorage:{getItem(){throw Error('blocked')}}};vm.createContext(blocked);vm.runInContext(extract('readProgress')+';result=readProgress()',blocked);assert.deepEqual(JSON.parse(JSON.stringify(blocked.result)),{found:[],q:0});
const transfer={};vm.createContext(transfer);vm.runInContext(extract('parseTransferData'),transfer);
assert.deepEqual(JSON.parse(JSON.stringify(transfer.parseTransferData('{"format":"the-branch-adventure-save","version":1,"progress":{"found":["eiffel",4,null],"q":2}}'))),{found:['eiffel'],q:2});
for(const bad of ['nope','{}','{"format":"the-branch-adventure-save","version":2,"progress":{}}','{"format":"the-branch-adventure-save","version":1,"progress":{"found":[],"q":-1}}'])assert.throws(()=>transfer.parseTransferData(bad));
const milestones={};vm.createContext(milestones);vm.runInContext(extract('nextMilestone'),milestones);
for(const [n,total,want] of [[0,0,0],[0,3,3],[4,391,5],[5,391,10],[10,391,20],[20,391,30],[390,391,391],[391,391,391]])assert.equal(milestones.nextMilestone(n,total),want);
console.log('PASS: local progress validation (6 cases), transfer validation (5 cases), milestone boundaries (8 cases)');
