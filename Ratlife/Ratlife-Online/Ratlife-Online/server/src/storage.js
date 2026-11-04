import {DatabaseSync} from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import {randomBytes,randomUUID,createHash,scryptSync,timingSafeEqual} from 'node:crypto';
export const RELEASE='ratlife-2026-11-accounts-chat-reset-1';
export const hash=s=>createHash('sha256').update(String(s)).digest('hex');
export function secret(value){const salt=randomBytes(16).toString('hex');return salt+':'+scryptSync(value,salt,64,{N:16384}).toString('hex')}
export function matches(value,encoded){try{const [salt,h]=encoded.split(':');const a=Buffer.from(h,'hex'),b=scryptSync(value,salt,64,{N:16384});return a.length===b.length&&timingSafeEqual(a,b)}catch{return false}}
export function nickname(v){if(typeof v!=='string')throw Error('Choose a nickname first.');const s=v.trim();if(!s||s.length>20||/[\p{Cc}\p{Cf}<>]/u.test(s))throw Error('Use a nickname of 1–20 characters without control characters or angle brackets.');return s}
export const norm=v=>String(v||'').trim().toLowerCase();
export function password(v){if(typeof v!=='string'||v.length<12||v.length>128)throw Error('Use a password of 12–128 characters.');return v}
export function starter(id=randomUUID(),name=''){return{id,name,kind:'guest',role:'player',coins:30,owned:['scrapBike','buggy'],pack:false,style:'natural',accessory:'none',cosmetics:['natural','grey','cocoa','bandana','cap','backpack','helmet'],decor:[],created:Date.now(),lastSeen:Date.now(),epoch:RELEASE,blockedVersion:0,chatUntil:0,suspendedUntil:0}}
const fresh=()=>({profiles:{},guestKeys:{},accounts:{},sessions:{},saves:{},promos:{},redemptions:{},reports:[],checkpoints:[],audit:[],rates:{},code:null,maintenance:'',epoch:RELEASE});
export class Storage{
 constructor({dataDir,clock=()=>Date.now(),initialCode=process.env.INITIAL_RAT_PACK_CODE,confirmed=false}={}){
 if(!dataDir||(!confirmed&&process.env.PERSISTENT_STORAGE_CONFIRMED!=='1'))throw Error('Durable storage required. Set DATA_DIR to a persistent mounted disk and PERSISTENT_STORAGE_CONFIRMED=1. Temporary Render storage is not supported.');
 this.clock=clock;fs.mkdirSync(dataDir,{recursive:true});this.file=path.join(dataDir,'ratlife.sqlite');this.db=new DatabaseSync(this.file);this.db.exec('PRAGMA busy_timeout=10000; PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; CREATE TABLE IF NOT EXISTS state (id INTEGER PRIMARY KEY CHECK(id=1), body TEXT NOT NULL); CREATE TABLE IF NOT EXISTS migrations (id TEXT PRIMARY KEY, applied_at INTEGER NOT NULL);');
 this.db.prepare('INSERT OR IGNORE INTO state VALUES (1,?)').run(JSON.stringify(fresh()));
 const pending=!this.db.prepare('SELECT id FROM migrations WHERE id=?').get(RELEASE);
 if(pending&&!initialCode){this.db.close();throw Error('First release migration needs INITIAL_RAT_PACK_CODE set privately. It is used once only.');}
 // The owner retains a private checkpoint. Never serve DATA_DIR as web content.
 if(pending)this.db.exec(`VACUUM INTO '${path.join(dataDir,'pre-release-'+Date.now()+'-'+process.pid+'.sqlite').replaceAll("'","''")}'`);
 this.transaction(s=>{
 if(this.db.prepare('SELECT id FROM migrations WHERE id=?').get(RELEASE))return;
 const legacy=path.join(dataDir,'profiles.json');if(fs.existsSync(legacy)){const old=JSON.parse(fs.readFileSync(legacy,'utf8'));for(const [key,p]of Object.entries(old.profiles||{})){s.profiles[p.id]={...starter(p.id,p.name),created:p.created||this.clock()};s.guestKeys[key]=p.id}}
 for(const [id,p]of Object.entries(s.profiles)){const n=starter(id,p.name);s.profiles[id]={...n,kind:p.kind,role:p.role,created:p.created,chatUntil:p.chatUntil,suspendedUntil:p.suspendedUntil};}
 s.saves={};s.redemptions={};s.epoch=RELEASE;s.code={version:1,verifier:secret(norm(initialCode)),created:this.clock()};
 this.audit(s,'release-migration','system',RELEASE,{reset:true});this.db.prepare('INSERT INTO migrations VALUES (?,?)').run(RELEASE,this.clock());
 });
 }
 transaction(fn){this.db.exec('BEGIN IMMEDIATE');try{const s=JSON.parse(this.db.prepare('SELECT body FROM state WHERE id=1').get().body);const result=fn(s);this.db.prepare('UPDATE state SET body=? WHERE id=1').run(JSON.stringify(s));this.db.exec('COMMIT');return result}catch(e){this.db.exec('ROLLBACK');throw e}}
 read(fn){return fn(JSON.parse(this.db.prepare('SELECT body FROM state WHERE id=1').get().body))}
 audit(s,action,actor,target,details={}){s.audit.push({id:randomUUID(),action,actor,target,at:this.clock(),outcome:'success',details})}
 limit(s,key,max,span,amount=1){const now=this.clock();const a=(s.rates[key]||[]).filter(x=>x.at>now-span);if(a.reduce((n,x)=>n+x.n,0)+amount>max)throw Error('Please wait before trying again.');a.push({at:now,n:amount});s.rates[key]=a;for(const k of Object.keys(s.rates))if(!s.rates[k].some(x=>x.at>now-3600000))delete s.rates[k]}
 view(p,s){const pack=!!p.pack&&(!p.packExpiry||p.packExpiry>this.clock());const a=Object.values(s.accounts).find(a=>a.id===p.id);return {...Object.fromEntries(['id','name','kind','role','coins','owned','style','accessory','cosmetics','decor','created','lastSeen','lastRoom','epoch','chatUntil','suspendedUntil','suspendReason','packGranted'].map(k=>[k,p[k]])),pack,style:!pack&&['robot','ninja','gold'].includes(p.style)?'natural':p.style,accessory:!pack&&p.accessory==='wings'?'none':p.accessory,packSource:p.packSource,packExpiry:p.packExpiry,username:a?.username}}
 auth(s,token){const session=s.sessions[hash(token||'')];if(!session||session.expires<this.clock())throw Error('Session expired. Log in or reconnect your guest identity.');const p=s.profiles[session.id];if(!p)throw Error('Identity unavailable.');if(p.suspendedUntil>this.clock())throw Error('This identity is suspended. '+(p.suspendReason||''));return p}
 issue(s,id,days=7){const token=randomBytes(32).toString('base64url');s.sessions[hash(token)]={id,expires:this.clock()+days*86400000};return token}
 hello(token,name,ip){return this.transaction(s=>{this.limit(s,'hello:'+ip,30,60000);let p,session=token;
 if(token&&s.sessions[hash(token)]?.expires>this.clock())p=this.auth(s,token);
 else if(token&&s.guestKeys[hash(token)]){p=s.profiles[s.guestKeys[hash(token)]];if(p.suspendedUntil>this.clock())throw Error('This identity is suspended.');s.sessions[hash(token)]={id:p.id,expires:this.clock()+180*86400000};session=token}
 else if(token)throw Error('Saved identity expired or invalid. Use Account to log in, or explicitly create a new guest.');
 else{const name2=nickname(name);p=starter(randomUUID(),name2);s.profiles[p.id]=p;const key=randomBytes(32).toString('base64url');s.guestKeys[hash(key)]=p.id;session=key;s.sessions[hash(key)]={id:p.id,expires:this.clock()+180*86400000}}
 p.lastSeen=this.clock();if(name&&p.kind==='guest')p.name=nickname(name);return{token:session,profile:this.view(p,s),epoch:s.epoch,maintenance:s.maintenance}})}
 account(token,action,m,ip){this.transaction(s=>this.limit(s,'account:'+ip,12,60000));return this.transaction(s=>{const current=this.auth(s,token);let a;
 if(action==='register'){const u=norm(m.username);if(!/^[a-z0-9_]{3,24}$/.test(u)||u==='bobadmin')throw Error('Choose an available username of 3–24 letters, digits or underscores.');password(m.password);if(s.accounts[u])throw Error('That username is unavailable.');const p=starter(randomUUID(),nickname(m.nickname||current.name));p.kind='account';s.profiles[p.id]=p;a={id:p.id,username:m.username.trim(),password:secret(m.password)};s.accounts[u]=a;this.audit(s,'account-created',p.id,p.id)}
 else if(action==='login'){a=s.accounts[norm(m.username)];const valid=matches(String(m.password||''),a?.password||this.dummyHash());if(!a||!valid)throw Error('Username or password did not match.');if(s.profiles[a.id].suspendedUntil>this.clock())throw Error('This identity is suspended.');}
 else if(action==='logout'){delete s.sessions[hash(token)];return {loggedOut:true}}
 else if(action==='password'){a=Object.values(s.accounts).find(a=>a.id===current.id);if(!a||!matches(String(m.current||''),a.password))throw Error('Reauthentication failed.');a.password=secret(password(m.password));for(const [k,v]of Object.entries(s.sessions))if(v.id===a.id)delete s.sessions[k];this.audit(s,'password-changed',a.id,a.id);return{token:this.issue(s,a.id),profile:this.view(current,s)}}
 else throw Error('Unknown account action.');
 const p=s.profiles[a.id];return {token:this.issue(s,a.id),profile:this.view(p,s),epoch:s.epoch,hasSave:!!s.saves[p.id],guestTransfer:current.kind==='guest'&&current.id!==p.id?{source:current.id,destination:p.id,hasMembership:!!current.pack}:null};})}
 dummyHash(){return this._dummy||=secret('not-a-real-password-placeholder')}
 profile(id){return this.read(s=>s.profiles[id]?this.view(s.profiles[id],s):null)}
 persist(p){this.transaction(s=>{const old=s.profiles[p.id];if(!old)throw Error('Identity missing.');for(const k of ['coins','owned','style','accessory','lastRoom','name'])old[k]=p[k];old.lastSeen=this.clock()})}
 privileged(token,fn){return this.transaction(s=>{const p=this.auth(s,token);if(p.role!=='admin'||!Object.values(s.accounts).some(a=>a.id===p.id&&norm(a.username)==='bobadmin'))throw Error('Administrator access denied.');return fn(s,p)})}
 reauth(s,p,pw){const a=Object.values(s.accounts).find(a=>a.id===p.id);if(!a||!matches(String(pw||''),a.password))throw Error('Reauthentication failed.')}
 pack(token,code,ip){ // Rate counters commit even for failed codes.
 this.transaction(s=>{const p=this.auth(s,token);this.limit(s,'redeem:'+p.id,5,60000);this.limit(s,'redeem-ip:'+ip,15,60000)});
 return this.transaction(s=>{const p=this.auth(s,token);if(p.blockedVersion>=s.code.version)throw Error('This grant was revoked. Ask Bob to allow redemption again.');if(!matches(norm(code),s.code.verifier))throw Error('That code didn’t work. Check it and try again, or ask Bob for help.');p.pack=true;p.packSource='access-code';p.packVersion=s.code.version;p.packGranted=this.clock();p.packExpiry=null;return this.view(p,s)})}
 save(token,m){return this.transaction(s=>{const p=this.auth(s,token);if(m.epoch!==s.epoch)throw Error('Old progress epoch rejected. Reload the updated game.');const old=s.saves[p.id]||{revision:0};if(m.op==='load')return{...old,epoch:s.epoch};if(m.revision!==old.revision)return{conflict:true,revision:old.revision,epoch:s.epoch};if(m.data?.epoch!==RELEASE)throw Error('Old adventure data rejected.');if(!m.data||typeof m.data!=='object'||Array.isArray(m.data)||JSON.stringify(m.data).length>100000)throw Error('Invalid adventure save.');const data=structuredClone(m.data);delete data.pack;delete data.online; // Adventure data is untrusted offline play, never used for online wallet/entitlement.
 const next={revision:old.revision+1,data,epoch:s.epoch,at:this.clock(),previous:old.data||null};s.saves[p.id]=next;return{revision:next.revision,epoch:s.epoch}})}
 transfer(token,sourceToken,choice){return this.transaction(s=>{const to=this.auth(s,token),from=this.auth(s,sourceToken);if(to.kind!=='account'||from.kind!=='guest'||to.id===from.id||from.transferred)throw Error('Guest transfer unavailable.');if(!['keep','replace'].includes(choice))throw Error('Choose Keep account or Replace with guest.');const before={to:s.saves[to.id],from:s.saves[from.id]};if(choice==='replace'&&before.from){s.saves[to.id]={...before.from,revision:(before.to?.revision||0)+1,previous:before.to?.data||null}}
 if(this.view(from,s).pack){if(!this.view(to,s).pack){to.pack=true;to.packSource='guest-transfer';to.packExpiry=from.packExpiry;to.packGranted=this.clock()}from.pack=false;from.blockedVersion=s.code.version;}
 if(choice==='replace'){to.coins=from.coins;to.owned=[...from.owned];to.cosmetics=[...from.cosmetics];to.decor=[...from.decor];from.coins=30;from.owned=['scrapBike','buggy']}
 from.transferred=to.id;const checkpointId=randomUUID();(s.checkpoints||=[]).push({id:checkpointId,to:to.id,from:from.id,at:this.clock(),saves:before});this.audit(s,'guest-transfer',to.id,from.id,{choice,checkpointId});return this.view(to,s)})}
 close(){this.db.close()}
}
