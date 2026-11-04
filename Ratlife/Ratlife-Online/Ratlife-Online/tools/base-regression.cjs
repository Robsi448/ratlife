const fs=require('fs'),vm=require('vm'),assert=require('assert');
const root=require('path').resolve(__dirname,'..');
const script=fs.readFileSync(root+'/frontend/src/game.js','utf8');
function setup(saved={}){
 const elements=new Map(),storage=new Map(Object.entries(saved)),timers=[];let now=1000;
 const ctx2d=new Proxy({},{get:(o,k)=>o[k]||(()=>{})});
 const gl=new Proxy({bufferData:(target,data)=>{if(data instanceof Float32Array)for(const v of data)assert(Number.isFinite(v),'non-finite geometry value')}},{get:(o,k)=>o[k]|| (k==='getShaderParameter'||k==='getProgramParameter'?()=>true:k==='getAttribLocation'?()=>1:k==='getUniformLocation'?()=>({}):k==='getShaderInfoLog'?()=>null:k.startsWith('create')?()=>({}):()=>{})});
 function el(id){if(elements.has(id))return elements.get(id);const e={id,hidden:false,value:'',textContent:'',innerHTML:'',style:{},disabled:false,dataset:{},width:1000,height:700,classList:{add(){},remove(){},toggle(){}},getContext(t){return t==='2d'?ctx2d:gl},after(){},addEventListener(){},querySelectorAll(){return[]},querySelector(){return el('query')},insertAdjacentHTML(){},focus(){},select(){},setPointerCapture(){},click(){},getBoundingClientRect(){return{left:0,top:0,width:200,height:200}},toDataURL(){return'data:image/png;base64,AA'}};elements.set(id,e);return e}
 const document={body:el('body'),documentElement:el('html'),hidden:false,pointerLockElement:null,getElementById:el,querySelectorAll:()=>[],querySelector:()=>el('phoneShell'),createElement:id=>el('created'+id),addEventListener(){},exitPointerLock(){}};
 const sandbox={RatlifeNickname:'Test Rat',console:{log(){},warn(){},error(){}},document,innerWidth:1000,innerHeight:700,devicePixelRatio:1,performance:{now:()=>now},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},addEventListener(){},requestAnimationFrame(){},setInterval(){},clearInterval(){},setTimeout(fn){timers.push(fn);return timers.length},clearTimeout(){},MutationObserver:class{observe(){}},Image:class{async decode(){}},fetch:async path=>({ok:true,json:async()=>JSON.parse(fs.readFileSync(root+'/frontend/public/'+path,'utf8')),arrayBuffer:async()=>{const b=fs.readFileSync(root+'/frontend/public/'+path);return b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength)}}),Uint8Array,Float32Array,Math,Date,Number,JSON,Set,Map,Promise,Array,Object,String,Error,Infinity,location:{reload(){}}};
 vm.createContext(sandbox);vm.runInContext(script,sandbox,{timeout:10000});return{run:code=>vm.runInContext(code,sandbox),storage,elements,timers,setTime:n=>now=n};
}
(async()=>{
 let g=setup();await new Promise(r=>setImmediate(r));
 let n=0;const check=(name,fn)=>{fn();n++;console.log('PASS',name)};
 check('ordinary world and sewer rendering paths build finite geometry',()=>{g.run('frame(1000);underground=true;frame(1016);underground=false');assert(g.run('worldCount')>0);assert(g.run('sewerCount')>0)});
 check('main quest objects are placed on passable ground',()=>{const blockedItems=g.run(`R.lootItems.filter(o=>['crumb','quest','clue','stash','picnic'].includes(o.kind)).filter(o=>{underground=!!o.sewer;jumpY=0;return blocked(o.x,o.z)}).map(o=>o.id)`);g.run('underground=false');assert.deepEqual(Array.from(blockedItems),[])});
 check('complete game initializes',()=>assert.equal(g.run('!!R && ratReady'),true));
 check('calculator arithmetic and error handling',()=>{for(const [s,v]of [['1.5+2.25','3.75'],['(2+3)*4','20'],['9/0','Error'],['2+','Error'],['-3*2','-6']])assert.equal(g.run(`R.calculate(${JSON.stringify(s)})`),v)});
 check('damaged and partial save normalization',()=>{assert.equal(g.run('R.normalize(null)'),null);assert.equal(g.run('R.normalize({version:3,started:true,missions:{first:null},bag:{snack:-4}}).bag.snack'),0);assert.equal(g.run('R.normalize({version:3,started:true}).decor.length'),1)});
 check('nest exit and boundary protection',()=>{assert.equal(g.run('R.nestAllowed({x:0,z:1.4})'),false);assert.equal(g.run('R.nestAllowed({x:2,z:0})'),false);assert.equal(g.run('R.nestAllowed({x:1,z:-1})'),true)});
 g.run('R.begin()');
 check('new game starts free introduction',()=>assert.equal(g.run('R.state.missions.first.status'),'active'));
 g.run("R.collect(R.lootItems.find(x=>x.id==='crumb'));R.event('talk:pip')");
 check('introduction awards a free phone',()=>assert.equal(g.run('R.state.phone'),true));
 check('mission and collectible rewards cannot repeat',()=>{let c=g.run('coins');g.run("R.event('talk:pip');R.collect(R.lootItems.find(x=>x.id==='crumb'))");assert.equal(g.run('coins'),c)});
 check('all eight free mission chains complete without membership',()=>{g.run("R.state.pack=false;plusMode=false;");for(const id of ['delivery','pipes','race','nest','stash','helper','picnic']){assert.equal(g.run(`R.startMission('${id}')`),true,id);const stages=g.run(`R.missions.find(x=>x.id==='${id}').stages.map(x=>x[1])`);for(const stage of stages)g.run(`R.event(${JSON.stringify(stage)})`);assert.equal(g.run(`R.state.missions.${id}.status`),'done',id)}assert.equal(g.run('R.state.pack'),false)});
 check('purchase cannot make a balance negative',()=>{g.run('player.x=-5;player.z=10;underground=false;coins=0');assert.equal(g.run("R.purchase('snack')"),false);assert.equal(g.run('coins'),0);g.run('coins=10');assert.equal(g.run("R.purchase('snack')"),true);assert.equal(g.run('coins'),7)});
 check('one-time achievement reward is guarded',()=>{g.run("R.rewardOnce('unit',5,'Test')");let c=g.run('coins');g.run("R.rewardOnce('unit',5,'Test')");assert.equal(g.run('coins'),c)});
 check('saving and Continue preserve current coins',()=>{g.run('coins=123;R.save();R.menu();R.begin()');assert.equal(g.run('coins'),123)});
 check('phone clears movement and pauses simulation',()=>{g.run('velocityX=4;keys.add("w");R.openRatPhone("map")');assert.equal(g.run('velocityX'),0);assert.equal(g.run('keys.size'),0);assert.equal(g.run('R.isUI()'),true);let h=g.run('hunger');g.run('updateSurvival(10,5)');assert.equal(g.run('hunger'),h);g.run('R.closeRatPhone()')});
 check('all free apps produce implemented content',()=>{for(const id of ['map','missions','inventory','messages','camera','notes','calculator','settings','nest','achievements','album','help','styles','activities','shop']){g.run(`R.openRatPhone('${id}')`);assert(g.elements.get('phoneContent').innerHTML.length>100,id)}g.run('R.closeRatPhone()')});
 check('jetpack blocked underground and through walls',()=>{g.run('R.state.pack=true;plusMode=true;underground=true;toggleJetpack()');assert.equal(g.run('jetpackActive'),false);g.run('underground=false;player.x=20;player.z=20;toggleJetpack()');assert.equal(g.run('jetpackActive'),true);g.run('jumpY=0;obstacles.push({x:21,z:20,sx:1,sz:1,height:3})');assert.equal(g.run('R.flightCollision(21,20)'),true);assert.equal(g.run('R.flightCollision(69,20)'),true)});
 check('jetpack altitude, fuel and phone landing',()=>{g.run('keys.add(" ");R.tick(3,1000)');assert(g.run('jumpY')<=6);assert(g.run('R.state.flightFuel')<100);g.run('R.openRatPhone()');assert.equal(g.run('jetpackActive'),false);assert.equal(g.run('jumpY'),0)});
 g.run('R.save()');
 const saved=Object.fromEntries(g.storage),g2=setup(saved);await new Promise(r=>setImmediate(r));
 check('save reload preserves adventure but does not trust local membership',()=>{assert.equal(g2.run('R.state.missions.picnic.status'),'done');assert.equal(g2.run('R.state.pack'),false);assert.equal(g2.run('R.state.phone'),true);assert.equal(g2.run('coins'),g.run('coins'))});
 const g3=setup({'ratlife-progress-v1':JSON.stringify({coins:41,upgrades:{speed:2},ownedHats:['cap'],hat:'cap'})});await new Promise(r=>setImmediate(r));
 check('legacy coins, upgrades and hats migrate',()=>{assert.equal(g3.run('coins'),41);assert.equal(g3.run('upgrades.speed'),2);assert.equal(g3.run('hat'),'cap')});
 const g4=setup({'ratlife-adventure-v3':'{broken','ratlife-adventure-v3-backup':saved['ratlife-adventure-v3']});await new Promise(r=>setImmediate(r));
 check('corrupted save recovers from previous save',()=>assert.equal(g4.run('R.state.missions.picnic.status'),'done'));
 check('membership requires server adapter; no local bypass',()=>{});await assert.rejects(g.run("R.validateMembership('1972')"),/Online membership/);g.run("globalThis.RatlifeAccount={redeemPack:async()=>true};");assert.equal(await g.run("R.validateMembership('server-checked')"),true);
 check('new game keeps currently verified membership and clears adventure',()=>{g2.run('R.setPack(true);R.newGame()');g2.elements.get('confirmYes').onclick();assert.equal(g2.run('R.state.pack'),true);assert.equal(g2.run('R.state.cosmetics.includes("robot")'),true);assert.equal(g2.run('R.state.missions.picnic'),undefined);assert.equal(g2.run('coins'),8)});
 check('account import clears previous equipment and starts alive',()=>{g2.run("upgrades.speed=4;ownedHats=['none','cap'];hat='cap';alive=false;R.importSave({version:3,started:false,coins:8})");assert.equal(g2.run('upgrades.speed'),0);assert.equal(g2.run('hat'),'none');assert.equal(g2.run('alive'),true);assert.equal(g2.run('coins'),8)});
 check('membership change does not teleport or replace current coins',()=>{g2.run('player.x=33;coins=27;R.setPack(true)');assert.equal(g2.run('player.x'),33);assert.equal(g2.run('coins'),27)});
 console.log(n+' connected game logic checks passed. Browser rendering is tested separately.');
})().catch(e=>{console.error(e);process.exit(1)});
