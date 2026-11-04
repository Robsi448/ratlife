import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import WebSocket from 'ws';
import {createGameServer} from '../src/index.js';
import {Storage,RELEASE} from '../src/storage.js';
const pause=()=>new Promise(r=>setTimeout(r,20));
async function fixture(){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ratlife-review-'));let now=Date.now();
 const g=createGameServer({dataDir:dir,confirmed:true,initialCode:'review-test-code',clock:()=>now,manual:true});await g.listen();const all=[];
 async function connect(token){
  const ws=new WebSocket('ws://127.0.0.1:'+g.server.address().port+'/ws',{origin:'http://localhost:3000'}),pending=new Map(),events=[];let rid=0;
  await new Promise((resolve,reject)=>{ws.once('open',resolve);ws.once('error',reject)});
  ws.on('message',data=>{const m=JSON.parse(data);events.push(m);const p=pending.get(m.rid);if(m.t==='result'&&p){clearTimeout(p.timer);pending.delete(m.rid);m.ok?p.resolve(m.data):p.reject(Error(m.error))}});
  const call=(t,data={})=>new Promise((resolve,reject)=>{const id=++rid;const timer=setTimeout(()=>{pending.delete(id);reject(Error('Request timed out: '+t))},2000);pending.set(id,{resolve,reject,timer});ws.send(JSON.stringify({t,rid:id,...data}))});
  const c={ws,events,call};all.push(c);c.hello=await call('hello',{name:'Review rat',token});return c;
 }
 return{g,connect,advance:n=>now+=n,async close(){all.forEach(c=>c.ws.terminate());await g.close();fs.rmSync(dir,{recursive:true,force:true})}};
}
test('JSON primitives and null are rejected without crashing the server',async()=>{
 const f=await fixture();try{const c=await f.connect();for(const text of ['null','false','1','"hello"','[]']){c.ws.send(text);await pause();assert.equal(c.events.at(-1).ok,false);assert.match(c.events.at(-1).error,/Invalid message/)}assert(Array.isArray((await c.call('list')).rooms))}finally{await f.close()}
});
test('session revocation rejects movement immediately, before the heartbeat',async()=>{
 const f=await fixture();try{const c=await f.connect();const r=await c.call('create',{});await c.call('start');f.g.storage.transaction(s=>{s.sessions={}});await assert.rejects(c.call('input',{input:{x:1,seq:1}}),/expired/);const p=f.g.rooms.get(r.id).players.get(c.hello.profile.id);assert.equal(p.input.x,0)}finally{await f.close()}
});
test('duplicate connection closure cannot remove its replacement from a room',async()=>{
 const f=await fixture();try{const old=await f.connect();await old.call('create',{});const next=await f.connect(old.hello.token);const room=await next.call('create',{});await pause();assert(f.g.rooms.get(room.id).players.has(next.hello.profile.id));assert.equal((await next.call('chat.history')).room,room.id)}finally{await f.close()}
});
test('chat history and save commands share the authenticated action rate limit',async()=>{
 const f=await fixture();try{const c=await f.connect();await c.call('create',{});f.advance(1100);for(let i=0;i<40;i++)await c.call('chat.history');await assert.rejects(c.call('save',{op:'load',epoch:RELEASE}),/Slow down/);f.advance(1100);assert.equal((await c.call('save',{op:'load',epoch:RELEASE})).revision,0)}finally{await f.close()}
});
test('a later profile flush cannot restore the transferred guest wallet',async()=>{
 const f=await fixture();try{const guest=await f.connect();const guestId=guest.hello.profile.id;f.g.profiles[guestId].coins=90;f.g.storage.persist(f.g.profiles[guestId]);const account=await guest.call('account',{action:'register',username:'review_account',password:'review-test-password'});await guest.call('transfer',{sourceToken:guest.hello.token,choice:'replace'});await guest.call('name',{name:'Renamed account'});assert.equal(f.g.storage.profile(guestId).coins,30);assert.equal(f.g.storage.profile(account.profile.id).coins,90);await guest.call('account',{action:'logout'});assert.equal((await guest.call('hello',{name:'New guest'})).profile.kind,'guest')}finally{await f.close()}
});
test('expired guest session can renew consistently before and after pruning',async()=>{
 const f=await fixture();try{const c=await f.connect();f.advance(181*86400000);const again=await f.connect(c.hello.token);assert.equal(again.hello.profile.id,c.hello.profile.id);assert.equal(again.hello.token,c.hello.token)}finally{await f.close()}
});
test('guest transfer respects expired versus active memberships',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ratlife-transfer-review-'));const now=Date.now();const s=new Storage({dataDir:dir,confirmed:true,initialCode:'review-test-code',clock:()=>now});
 try{const guest=s.hello(null,'Guest','loopback');const account=s.account(guest.token,'register',{username:'expiry_test',password:'review-test-password'},'loopback');s.transaction(d=>{Object.assign(d.profiles[guest.profile.id],{pack:true,packExpiry:now+60000});Object.assign(d.profiles[account.profile.id],{pack:true,packExpiry:now-1})});const out=s.transfer(account.token,guest.token,'keep');assert(out.pack);assert.equal(out.packExpiry,now+60000);assert.equal(s.profile(guest.profile.id).pack,false)}finally{s.close();fs.rmSync(dir,{recursive:true,force:true})}
});
