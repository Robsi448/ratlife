# Verification report

Run from the project root (Node 22.9+ or Node 24):

```sh
npm --prefix server ci
python3 tools/integrate.py
npm --prefix frontend ci
npm --prefix frontend run build
npm --prefix server test
node --test tools/client-tests.mjs
node tools/base-regression.cjs
```

## Automated behaviour checks

Final run: **16 server/protocol tests passed**, the RatDeck behaviour test passed,
and **22 retained base-game checks passed**. Oversized messages were rejected
with WebSocket close code 1009 while the server remained healthy.

The server suite uses **real independently authenticated WebSocket clients** on
loopback HTTP ports, not localStorage messages or bots standing in for networking.
It checks public creation/listing/Quick Join, private unlisting and code join,
capacity (eight plus a rejected ninth), room isolation, duplicate creation,
validated input movement/jumping, rejection of claimed positions/balances/results,
server-only Pack access, exclusive vehicle occupancy, valid purchases, host
transfer, kick/rejoin blocking, malformed JSON/actions, stable secret identities,
reconnection, hashed profile persistence, empty-room expiry and both rooms
receiving periodic snapshots. A race is navigated using actual client input and
server-simulated movement with an accelerated test clock; ordered results and
single rewards are asserted. Co-op tests exercise duplicate/proximity checks,
layer transitions, disconnect vehicle cleanup and origin rejection. They do not
claim the entire game was manually played over the internet.

Shared physics checks cover running-jump momentum, fuel burn/three-second delay/
recharge, wall collision and matched vehicle classes. RatDeck tests run its actual
game state transitions for platformer jump/pause/three-level ending, Flappy Rat
flap/collision/score/restart, saved records and animation-loop cancellation.

The retained 22 connected base-game checks execute the assembled frontend in a
Node VM with DOM/WebGL test doubles. They cover local saves/migration/backup,
mission states and reward guards, economy, phone input isolation/app content,
calculator, nest boundaries, jetpack safety and geometry generation. Test doubles
do not compile GPU shaders or constitute a visual 3D playthrough.

## Browser checks performed here

The updated frontend loaded with its original and new menu options. The exact
Rat Pack explanation and Rat Royale Coming Soon panel were inspected. Multiplayer
opened its actual connection/loading interface. The static preview cannot route
the persistent backend, so browser-to-backend end-to-end play was **not** verified
there; server integration was verified separately over real loopback sockets.
The integrated RatDeck launcher opened Super Rat Bros and its controls. Further
browser checks were limited by an automation transport failure.

The available browser reports **WebGL unavailable**, as it did for the original
build. The 3D rat world therefore cannot be visually tested in that browser.
Menus and 2D console games are separate from that rendering capability.

## Still to verify on the deployed game

Use DEPLOYMENT.md's two-device checklist. Confirm remote rat mesh/name-tag
appearance, riding posture, wheels, flight effects, obstruction/latency comfort,
physical touch/portrait/landscape layout, audio playback/volume and a complete
adventure/online activity playthrough. Confirm exact Vercel origin and backend
WSS URL, persistent disk across restart and code redemption from Bob's configured
server codes. No internet deployment, Vercel-account change or paid service was
performed from this environment. Dependency installation used the supplied
lockfile; npm audit reported zero known vulnerabilities at the time checked.
