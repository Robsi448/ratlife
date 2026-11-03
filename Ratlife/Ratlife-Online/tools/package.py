from pathlib import Path
import zipfile,hashlib
root=Path(__file__).resolve().parents[1]
out=root.parent/'Ratlife-Multiplayer-Complete.zip'
files=[]
for p in root.rglob('*'):
 if not p.is_file():continue
 rel=p.relative_to(root)
 if any(k in rel.parts for k in ['node_modules','.git','.openai','__pycache__']):continue
 if p.name=='.env' or p.suffix in ['.log','.pyc'] or (rel.parts[0]=='server' and 'data' in rel.parts):continue
 if str(rel)=='tools/preview.mjs':continue
 files.append(p)
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for p in sorted(files):z.write(p,'Ratlife-Online/'+p.relative_to(root).as_posix())
with zipfile.ZipFile(out) as z:
 assert z.testzip() is None
 names=z.namelist()
 for required in ['server/package.json','server/package-lock.json','server/src/index.js','shared/simulation.mjs','shared/world.json','frontend/dist/index.html','frontend/dist/online.js','frontend/dist/config.js','frontend/public/rat/Rat.png','DEPLOYMENT.md','README.md','vercel.json']:
  assert 'Ratlife-Online/'+required in names,required
 assert not any('/node_modules/' in n or n.endswith('/.env') or 'profiles.json' in n for n in names)
 assert b'MULTIPLAYER_SERVER_URL' in z.read('Ratlife-Online/frontend/.env.example')
print(out)
print('Files:',len(files),'ZIP bytes:',out.stat().st_size,'SHA256:',hashlib.sha256(out.read_bytes()).hexdigest())
