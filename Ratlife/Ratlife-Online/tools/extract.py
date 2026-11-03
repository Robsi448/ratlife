from pathlib import Path
import re,base64,json
root=Path(__file__).resolve().parents[1]
s=(root/'original/Ratlife-Backyard-Stories.html').read_text()
for name,mime,pattern in [('Rat.gltf','application/json',r"fetch\('data:application/json;base64,([^']+)'\)"),('Rat.bin','application/octet-stream',r"fetch\('data:application/octet-stream;base64,([^']+)'\)"),('Rat.png','image/png',r"img.src='data:image/png;base64,([^']+)'" )]:
 m=re.search(pattern,s);assert m,name
 d=root/'frontend/public/rat';d.mkdir(exist_ok=True)
 (d/name).write_bytes(base64.b64decode(m[1]))
 s=s[:m.start()]+("img.src='rat/Rat.png'" if name=='Rat.png' else "fetch('rat/"+name+"')")+s[m.end():]
style=s.split('<style>',1)[1].split('</style>',1)[0]
js=s.split('<script>',1)[1].split('</script>',1)[0]
html=s.replace('<style>'+style+'</style>','<link rel="stylesheet" href="game.css"><link rel="stylesheet" href="online.css">').replace('<script>'+js+'</script>','<script src="config.js"></script><script src="game.js"></script><script type="module" src="online.js"></script>')
(root/'frontend/src/index.html').write_text(html)
(root/'frontend/src/game-base.js').write_text(js)
(root/'frontend/src/game.css').write_text(style)
