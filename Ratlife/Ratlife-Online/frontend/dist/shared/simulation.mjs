// Shared deterministic player/vehicle physics. The server owns input simulation.
export const VERSION=1;
export const JET={capacity:100,burn:9,recharge:24,delay:3,maxAltitude:6};
export const VEHICLES={
 scrapBike:{name:'Scrap Bike',type:'bike',cost:0,speed:9,accel:5,turn:2.3,color:[.48,.35,.20]},
 streetBike:{name:'Street Bike',type:'bike',cost:24,speed:9,accel:5,turn:2.3,color:[.26,.5,.4]},
 neonBmx:{name:'Neon BMX',type:'bike',cost:0,pack:true,speed:9,accel:5,turn:2.3,color:[.25,.65,.72]},
 rocketBike:{name:'Rat Rocket Bike',type:'bike',cost:0,pack:true,speed:9,accel:5,turn:2.3,color:[.72,.36,.2]},
 buggy:{name:'Bottlecap Buggy',type:'car',cost:0,speed:11,accel:4,turn:1.7,color:[.59,.46,.23]},
 kart:{name:'Scrap Kart',type:'car',cost:35,speed:11,accel:4,turn:1.7,color:[.4,.5,.35]},
 cruiser:{name:'Cheese Cruiser',type:'car',cost:0,pack:true,speed:11,accel:4,turn:1.7,color:[.85,.66,.2]},
 roadster:{name:'Neon Roadster',type:'car',cost:0,pack:true,speed:11,accel:4,turn:1.7,color:[.48,.3,.69]}
};
export const MODES={freeroam:'Free roam',foot:'Paw Sprint',bike:'Bike Race',car:'Kart Race',scavenge:'Co-op Cheese Hunt',delivery:'Parcel Relay'};
export const PRESETS=['Follow me!','Let’s race!','Meet at the nest.','Found something!','Need help!','Nice one!'];
export const EMOTES=['wave','dance','cheer','sleep'];
export const DRAINS=[{x:0,z:8},{x:0,z:-20},{x:24,z:8},{x:-24,z:8},{x:0,z:30}];
export const ROUTE=[[5,16],[15,18],[24,28],[14,34],[5,28],[5,16]];
export const SUPPLIES=[[-4,16],[8,24],[23,18],[-15,28],[0,32],[31,29]];
export const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const finite=(n,f=0)=>typeof n==='number'&&Number.isFinite(n)?n:f;
export function ground(x,z,sewer=false){return sewer?-4.5:Math.abs(x)<10.8&&z< -13&&z> -28?.02:.11*Math.sin(x*.23)*Math.cos(z*.19)+.055*Math.sin(x*.61+z*.29)}
export function sewerPassable(x,z,r=.16){return (Math.abs(x)<1.65-r&&z>-30+r&&z<35-r)||(Math.abs(z-8)<1.65-r&&x>-30+r&&x<30-r)}
export function blocked(x,z,height,sewer,world,doors=[],radius=.16){if(Math.abs(x)>67.5-radius||Math.abs(z)>67.5-radius)return true;if(sewer)return !sewerPassable(x,z,radius);if(world.some(o=>!o.humanOnly&&Math.abs(x-o.x)<o.sx/2+radius&&Math.abs(z-o.z)<o.sz/2+radius&&height<o.height+.02))return true;if(doors.some(d=>!d.open&&Math.abs(x-d.x)<1.7+radius&&Math.abs(z-d.z)<.14+radius&&height<2.9))return true;return false}
export function freshPlayer(id,name='Rat'){return{id,name,x:0,z:16,angle:0,vx:0,vz:0,height:0,vy:0,speed:0,fuel:100,rechargeIn:0,flying:false,vehicle:null,sewer:false,phase:0,style:'natural',emote:'',emoteUntil:0,ready:false,console:false,groundGrace:.1,jumpBuffer:0,lastJump:false,lastJet:false,seq:0}}
export function cleanInput(raw={}){return {x:clamp(finite(raw.x),-1,1),z:clamp(finite(raw.z),-1,1),yaw:clamp(finite(raw.yaw),-1000,1000),run:raw.run===true,jump:raw.jump===true,down:raw.down===true,jet:raw.jet===true,brake:raw.brake===true,boost:raw.boost===true,seq:Math.floor(clamp(finite(raw.seq),0,2**31-1))}}
export function step(p,input,dt,ctx){dt=clamp(dt,0,.05);const i=cleanInput(input),world=ctx.world||[],doors=ctx.doors||[],v=p.vehicle&&VEHICLES[p.vehicle.kind];p.seq=i.seq;const canFly=ctx.pack&&!p.sewer&&!v&&ctx.allowFlight!==false&&!(Math.abs(p.x)<11&&p.z< -13&&p.z> -28);if(i.jet&&!p.lastJet&&canFly&&p.fuel>8)p.flying=!p.flying;p.lastJet=i.jet;if(!canFly)p.flying=false;
if(i.jump&&!p.lastJump)p.jumpBuffer=.14;p.lastJump=i.jump;p.jumpBuffer=Math.max(0,p.jumpBuffer-dt);
if(p.height<=.001)p.groundGrace=.10;else p.groundGrace=Math.max(0,p.groundGrace-dt);
if(p.flying){p.rechargeIn=JET.delay;p.fuel=Math.max(0,p.fuel-JET.burn*dt);p.vy+=( (i.jump?2.8:i.down?-2.8:0)-p.vy)*(1-Math.exp(-dt*10));p.height=clamp(p.height+p.vy*dt,.03,JET.maxAltitude);if(p.fuel<=0||i.down&&p.height<=.04)p.flying=false}else{if(p.jumpBuffer>0&&p.groundGrace>0&&!v){p.vy=4.8;p.jumpBuffer=0;p.groundGrace=0}p.vy-=12*dt;p.height=Math.max(0,p.height+p.vy*dt);if(p.sewer&&p.height>1.5){p.height=1.5;p.vy=Math.min(0,p.vy)}if(p.height===0)p.vy=0;p.rechargeIn=Math.max(0,(p.rechargeIn||0)-dt);if(p.height===0&&p.rechargeIn===0)p.fuel=Math.min(JET.capacity,p.fuel+JET.recharge*dt)}
let dx=0,dz=0;
if(v){p.flying=false;p.height=p.vy=0;p.vehicle.boost=Math.max(0,Math.min(100,(p.vehicle.boost??100)+(i.boost?-40:18)*dt));let target=i.z*v.speed*(i.boost&&p.vehicle.boost>0?1.12:1);if(i.brake)target=0;p.speed+=(target-p.speed)*(1-Math.exp(-dt*(i.brake?11:v.accel)));p.angle+=i.x*v.turn*dt*clamp(p.speed/4,-1,1);dx=Math.sin(p.angle)*p.speed*dt;dz=Math.cos(p.angle)*p.speed*dt;p.vx=Math.sin(p.angle)*p.speed;p.vz=Math.cos(p.angle)*p.speed}
else{let n=Math.max(1,Math.hypot(i.x,i.z)),speed=p.flying?6.8:i.run?6.8:5,tx=(i.x*Math.cos(i.yaw)+i.z*Math.sin(i.yaw))/n*speed,tz=(-i.x*Math.sin(i.yaw)+i.z*Math.cos(i.yaw))/n*speed,ease=1-Math.exp(-dt*(p.height>0?7:14));p.vx+=(tx-p.vx)*ease;p.vz+=(tz-p.vz)*ease;p.speed=Math.hypot(p.vx,p.vz);if(p.speed>.1){const a=Math.atan2(p.vx,p.vz);p.angle+=Math.atan2(Math.sin(a-p.angle),Math.cos(a-p.angle))*(1-Math.exp(-dt*14))}dx=p.vx*dt;dz=p.vz*dt}
const r=v?v.type==='car'?.55:.32:.16,n=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.1));let travel=0;for(let k=0;k<n;k++){const ox=p.x,oz=p.z;if(!(p.flying&&Math.abs(p.x+dx/n)<11.3&&p.z< -12.8&&p.z> -28.3)&&!blocked(p.x+dx/n,p.z,p.height,p.sewer,world,doors,r))p.x+=dx/n;else if(v)p.speed*=.7;if(!(p.flying&&Math.abs(p.x)<11.3&&p.z+dz/n< -12.8&&p.z+dz/n> -28.3)&&!blocked(p.x,p.z+dz/n,p.height,p.sewer,world,doors,r))p.z+=dz/n;else if(v)p.speed*=.7;travel+=Math.hypot(p.x-ox,p.z-oz)}p.phase+=travel*2.8;if(!p.flying&&!v&&!p.sewer&&p.vy<=0){let support=0;for(const o of world)if(o.height>0&&o.height<1.05&&p.height>=o.height-.15&&Math.abs(p.x-o.x)<o.sx/2+r&&Math.abs(p.z-o.z)<o.sz/2+r)support=Math.max(support,o.height);if(support&&p.height<support){p.height=support;p.vy=0;p.groundGrace=.1}}if(v){p.vehicle.x=p.x;p.vehicle.z=p.z;p.vehicle.angle=p.angle;p.vehicle.wheel=(p.vehicle.wheel||0)+travel*5}return p}
export function safeDismount(p,world,doors=[]){for(const [dx,dz]of[[1.6,0],[-1.6,0],[0,1.6],[0,-1.6],[2.5,0]]){const x=p.x+dx,z=p.z+dz;if(!blocked(x,z,0,p.sewer,world,doors,.16))return{x,z}}return null}
