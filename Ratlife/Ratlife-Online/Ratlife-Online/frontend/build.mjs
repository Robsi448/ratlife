import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const base=fileURLToPath(new URL('.',import.meta.url));const root=path.resolve(base);const out=path.join(root,'dist');fs.mkdirSync(out,{recursive:true});
fs.cpSync(path.join(root,'public'),out,{recursive:true});
for(const file of ['index.html','game.js','game.css','online.js','online.css','vehicles.mjs','ratdeck.mjs','community.mjs','community.css','release.js'])fs.copyFileSync(path.join(root,'src',file),path.join(out,file));
fs.mkdirSync(path.join(out,'shared'),{recursive:true});for(const f of ['simulation.mjs','world.json'])fs.copyFileSync(path.join(root,'../shared',f),path.join(out,'shared',f));
const url=process.env.MULTIPLAYER_SERVER_URL||'',royale=process.env.RAT_ROYALE_URL||'';
if(url){const u=new URL(url);if(!['ws:','wss:'].includes(u.protocol))throw Error('MULTIPLAYER_SERVER_URL must start with ws:// or wss://');if(u.username||u.password)throw Error('Do not embed credentials in MULTIPLAYER_SERVER_URL')}
if(royale&&new URL(royale).protocol!=='https:')throw Error('RAT_ROYALE_URL must be empty or HTTPS');
fs.writeFileSync(path.join(out,'config.js'),'globalThis.RATLIFE_CONFIG='+JSON.stringify({MULTIPLAYER_SERVER_URL:url,RAT_ROYALE_URL:royale,JETPACK_RECHARGE_DELAY:3})+';\n');console.log('Built Ratlife frontend. Multiplayer endpoint: '+(url||'NOT CONFIGURED — single-player remains available.'));
