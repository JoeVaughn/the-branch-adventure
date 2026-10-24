const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8');
function extract(name){const start=html.indexOf('function '+name+'(');assert(start>=0,name);let pos=html.indexOf('{',start),depth=1;for(let i=pos+1;i<html.length;i++){if(html[i]==='{')depth++;else if(html[i]==='}'&&!--depth)return html.slice(start,i+1)}throw Error(name)}
for(const [input,expected] of [['null',{found:[],q:0,snd:true,ql:'high'}],['{bad',{found:[],q:0,snd:true,ql:'high'}],['{"found":"oops","q":"2","ql":"invalid","snd":false}',{found:[],q:0,snd:false,ql:'high'}],['{"found":["c-brazil",3,null],"q":-1,"ql":"fast"}',{found:['c-brazil'],q:0,snd:true,ql:'fast'}],['{"found":["saturn"],"q":3}',{found:['saturn'],q:3,snd:true,ql:'high'}]]){
 const context={localStorage:{getItem:()=>input}};vm.createContext(context);vm.runInContext(extract('readProgress')+';result=readProgress()',context);assert.deepEqual(JSON.parse(JSON.stringify(context.result)),expected);
}
const blocked={localStorage:{getItem(){throw Error('blocked')}}};vm.createContext(blocked);vm.runInContext(extract('readProgress')+';result=readProgress()',blocked);assert.equal(blocked.result.ql,'high');
const milestones={};vm.createContext(milestones);vm.runInContext(extract('nextMilestone'),milestones);
for(const [n,total,want] of [[0,0,0],[0,3,3],[4,391,5],[5,391,10],[10,391,20],[20,391,30],[390,391,391],[391,391,391]])assert.equal(milestones.nextMilestone(n,total),want);
console.log('PASS: saved progress validation (6 cases), milestone boundaries (8 cases)');
