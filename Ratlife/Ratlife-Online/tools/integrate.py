from pathlib import Path
root=Path(__file__).resolve().parents[1]
s=(root/'frontend/src/game-base.js').read_text()
s=s.replace("const RAT_ROYALE_URL = '';","const RAT_ROYALE_URL = globalThis.RATLIFE_CONFIG?.RAT_ROYALE_URL||'';")
s=s.replace("destination.protocol==='https:'||destination.protocol==='http:'", "destination.protocol==='https:'")
s=s.replace("function safeReturn(){returnDrone();","function safeReturn(){if(globalThis.MP?.active){globalThis.MP.command('recover').catch(e=>say(e.message));return}returnDrone();")
s=s.replace("function frame(t){", "function frame(t){globalThis.MP?.frame(t);",1)
s=s.replace("if(paused||shopOpen||menuOpen||phoneOpen||R.isUI()||document.hidden)dt=0;R.tick(dt,t);", "if(paused||shopOpen||menuOpen||phoneOpen||R.isUI()||document.hidden||globalThis.MP?.active||globalThis.MP?.isRiding())dt=0;if(!globalThis.MP?.active)R.tick(dt,t);")
s=s.replace("drawRat(speed);coord.textContent=", "drawRat(globalThis.MP?.active?(globalThis.MP.room?.players.find(p=>p.id===globalThis.MP.profile?.id)?.speed||0):speed);globalThis.MP?.afterRender();coord.textContent=",1)
s=s.replace("function save(quiet=false){if(!S.started)return;", "function save(quiet=false){if(globalThis.MP?.active)return;if(!S.started)return;")
s=s.replace("return menuOpen||phoneOpen||paused||shopOpen||modalOpen||photoMode", "return menuOpen||phoneOpen||paused||shopOpen||modalOpen||photoMode||!!globalThis.MP?.ui||!!globalThis.RatlifeExtraUI")
s=s.replace("addEventListener('keydown',e=>{const input=/INPUT|TEXTAREA|SELECT/", "addEventListener('keydown',e=>{if(globalThis.RatDeck?.opened)return;if(globalThis.MP?.ui){if(e.key==='Escape')globalThis.MP.closeUI();if(!/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))e.stopImmediatePropagation();return}if(globalThis.RatlifeExtraUI){if(e.key==='Escape')globalThis.MP?.closeGarage();e.stopImmediatePropagation();return}const input=/INPUT|TEXTAREA|SELECT/")
s=s.replace("if(k==='j'&&!e.repeat){e.stopImmediatePropagation();toggleFlight();return}", "if(k==='j'&&!e.repeat){e.stopImmediatePropagation();if(globalThis.MP?.active)globalThis.MP.jet();else toggleFlight();return}")
s=s.replace("if(isUI()||drone||!ratReady)return;const a=contextual();", "if(isUI()||drone||!ratReady)return;if(globalThis.RatlifeBridge?.extraInteraction?.())return;const a=contextual();")
# Online actions never alter local story, coins, HP or inventory.
s=s.replace("attack=function(){if(isUI()||drone)return;", "attack=function(){if(globalThis.MP?.active){say('Online uses co-op activities and preset emotes. Player combat is disabled.');return}if(isUI()||drone)return;")
# Membership flight recharge delay applies to the local existing pack.
s=s.replace("flightFuel:100,gameTime", "flightFuel:100,jetRecharge:0,gameTime")
s=s.replace("if(jetpackActive){S.flightFuel=Math.max(0,S.flightFuel-dt*7);", "if(jetpackActive){S.jetRecharge=globalThis.RATLIFE_CONFIG?.JETPACK_RECHARGE_DELAY??3;S.flightFuel=Math.max(0,S.flightFuel-dt*7);")
s=s.replace("else if(jumpY===0&&!isUI()){S.flightFuel=Math.min(100,S.flightFuel+dt*13)}", "else if(jumpY===0&&!isUI()){S.jetRecharge=Math.max(0,(S.jetRecharge||0)-dt);if(S.jetRecharge===0)S.flightFuel=Math.min(100,S.flightFuel+dt*24)}")
s=s.replace("(jetpackActive?'🚀 JETPACK':'🚀 FUEL')", "(jetpackActive?'🚀 THRUST':S.jetRecharge>0?'🚀 WAIT '+S.jetRecharge.toFixed(1)+'s':'🚀 RECHARGING')")
s=s.replace("get style(){return styles[S.style]?.c||[1,1,1]}", "get style(){return globalThis.MP?.active?globalThis.MP.localTint:styles[S.style]?.c||[1,1,1]}")
s=s.replace("case 'musicToggle':musicPlaying=!musicPlaying;initAudio();audioContext?.resume();renderApp();break;", "case 'musicToggle':initAudio();if(!audioContext){say('Audio is unavailable in this browser.');break}musicPlaying=!musicPlaying;audioContext.resume().catch(()=>say('Audio could not start. Tap Play again.'));renderApp();break;")
s=s.replace("musicPlaying=false,musicIndex=0,musicStep=0", "musicPlaying=false,musicIndex=0,musicStep=0")
s=s.replace("function flightCollision(x,z){if(underground)","function flightCollision(x,z){if(jetpackActive&&!underground&&Math.abs(x)<11.3&&z< -12.8&&z> -28.3)return true;if(underground)")
s=s.replace("if(S.pack&&!insideBin){","if(S.pack&&!insideBin&&!globalThis.MP?.active){")
s=s.replace("if(S.accessory!=='none'&&!insideBin){","if(S.accessory!=='none'&&!insideBin&&!globalThis.MP?.active){")
# Draw the exact original rat mesh for each remote player using validated/interpolated state.
needle="gl.uniform2f(loc('playerPos'),player.x,player.z);gl.uniform1f(loc('groundY'),ground(player.x,player.z)+jumpY);"
assert needle in s
remote="""for(const peer of(globalThis.MP?.remoteRats?.()||[])){gl.uniform3f(loc('tint'),...({grey:[.8,.95,1.1],cocoa:[1.1,.79,.65],robot:[.65,1,1.35],ninja:[.2,.25,.3],gold:[1.7,1.25,.35]}[peer.style]||[1,1,1]));gl.uniform2f(loc('playerPos'),peer.x,peer.z);gl.uniform1f(loc('groundY'),ground(peer.x,peer.z)+peer.height+(peer.vehicle ? .55 : 0));gl.uniform1f(loc('angle'),peer.angle);gl.uniform1f(loc('moving'),peer.vehicle?0:Math.min(1,peer.speed));gl.uniform1f(loc('phase'),peer.phase);gl.uniform1f(loc('bob'),peer.emote==='dance'?Math.sin(performance.now()*.01)*.07:0);gl.drawElements(gl.TRIANGLES,ratCount,gl.UNSIGNED_SHORT,0)}gl.uniform3f(loc('tint'),...R.style);"""
s=s.replace(needle,remote+needle,1)
# Append an explicit adapter: future multiplayer work need not guess internal variable names.
s+='''
;(() => {
let extraInteraction=null,menuHandler=null,jetHandler=null;
const drawBefore=drawExpansion;drawExpansion=function(cube,tri){drawBefore(cube,tri);globalThis.MP?.draw(cube,tri);if(globalThis.RatDeck?.opened)cube(player.x,ground(player.x,player.z)+jumpY+.42,player.z+.4,.42,.22,.08,[.31,.46,.38])};
const pauseBefore=togglePause;togglePause=function(v=!paused){if(globalThis.MP?.active){globalThis.MP.open();return}pauseBefore(v)};
const B={
 get extraInteraction(){return extraInteraction},setExtraInteraction(fn){extraInteraction=fn},
 pose:()=>({x:player.x,z:player.z,height:jumpY,vy:jumpV,angle:player.angle,sewer:underground,phase}),
 input:()=>({x:joy.x+(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0),z:-joy.y+(keys.has('w')||keys.has('arrowup')?1:0)-(keys.has('s')||keys.has('arrowdown')?1:0),yaw,run:R.run,boost:R.run,jump:keys.has(' ')||B.touchJump,down:keys.has('control')||B.touchDown,brake:keys.has(' ')||B.touchJump}),
 touchJump:false,touchDown:false,
 applyOnline(p){player.x=p.x;player.z=p.z;player.angle=p.angle;underground=p.sewer;jumpY=p.height+(p.vehicle?.kind?.length?.55:0);jumpV=0;phase=p.phase;velocityX=velocityZ=0;jetpackActive=p.flying;SnoopFuel(p)},
 applyRide(p){player.x=p.x;player.z=p.z;player.angle=p.angle;jumpY=p.height+(p.vehicle?.kind?.length?.55:0);jumpV=0;phase=p.phase;velocityX=velocityZ=0},
 camera:()=>cam?{...cam,yaw:cameraYaw??yaw,pitch:cameraPitch??pitch,w,h,focal}:null,
 visible:(x,z,tx,tz)=>underground?sewerPassable(tx,tz):lineOfSight(x,z,tx,tz),
 doors:()=>doors,pack:()=>R.state.pack,coins:()=>coins,volumes:()=>R.state.settings,
 spend(n){if(globalThis.MP?.active||!Number.isFinite(n)||n<0||coins<n)return false;coins-=n;refreshHUD();R.save();return true},
 say,land(){jetpackActive=false;jetpackHeight=0;jumpV=0},toggleJet:()=>toggleJetpack(),
 isUI:()=>R.isUI(),isTyping:e=>/INPUT|TEXTAREA|SELECT/.test(e.target.tagName),
 freeze(){clear();B.touchJump=B.touchDown=false;velocityX=velocityZ=0;document.exitPointerLock?.()},unfreeze(){clear();last=0;},
 beginOnline(){menuOpen=false;mainMenu.hidden=true;document.body.classList.remove('menuActive');phoneOpen=false;ratPhone.hidden=true;paused=false;document.getElementById('pausePanel').hidden=true;insideBin=null;alive=true;deathScreen.hidden=true;clear();},
 captureLocal:()=>({x:player.x,z:player.z,angle:player.angle,yaw,pitch,underground,jumpY,health,hunger,coins,doors:doors.map(x=>x.open),fridge:fridge.open,drains:drains.map(x=>x.open)}),
 restoreLocal(s){player.x=s.x;player.z=s.z;player.angle=s.angle;yaw=s.yaw;pitch=s.pitch;underground=s.underground;jumpY=s.jumpY;health=s.health;hunger=s.hunger;coins=s.coins;doors.forEach((d,i)=>d.open=s.doors[i]);drains.forEach((d,i)=>d.open=s.drains[i]);fridge.open=s.fridge;cameraYaw=cameraPitch=null;jetpackActive=false;velocityX=velocityZ=0;refreshHUD()},
 sharedObjects(o){doors.forEach((d,i)=>{d.open=!!o.doors[i]?.open;d.angle+=(Number(d.open)*1.57-d.angle)*.35});fridge.open=!!o.fridge;fridge.angle+=(Number(fridge.open)*1.57-fridge.angle)*.35;drains.forEach((d,i)=>d.open=!!o.drains[i])},
 fuel(value,delay,flying){const el=document.getElementById('fuelHUD');el.hidden=false;el.innerHTML=(flying?'THRUST':delay>0?'RECHARGE IN '+delay.toFixed(1)+'s':value>=100?'FUEL READY':'RECHARGING')+' '+Math.floor(value)+'%<progress max="100" value="'+value+'"></progress>'},
 menu:()=>R.menu(),closePhone:()=>R.closeRatPhone(),modal:(title,html)=>{document.getElementById('rlModalTitle').textContent=title;document.getElementById('rlModalBody').innerHTML=html;document.getElementById('rlModal').hidden=false;B.freeze()},
 onMenu(fn){menuHandler=fn;document.getElementById('menuReturn').onclick=fn},onJet(fn){jetHandler=fn;document.getElementById('jetpackButton').onclick=fn}
};
function SnoopFuel(p){document.getElementById('jetFlame').hidden=!p.flying;document.getElementById('descendTouch').hidden=!p.flying;}
globalThis.RatlifeBridge=B;
for(const [id,key]of[['jumpTouch','touchJump'],['descendTouch','touchDown']]){const el=document.getElementById(id);el.addEventListener('pointerdown',()=>B[key]=true);for(const event of['pointerup','pointercancel','lostpointercapture'])el.addEventListener(event,()=>B[key]=false)}
})();
'''
# Make numeric ternaries explicit rather than relying on optional-chain-looking tokenisation.
s=s.replace("p.vehicle?.kind?.length?.55:0", "p.vehicle ? .55 : 0")
(root/'frontend/src/game.js').write_text(s)
