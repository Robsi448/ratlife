# Ratlife — Online Backyard update

**Your player-facing website remains https://ratlife.vercel.app.**
This ZIP is source code plus a prebuilt frontend. It has not been deployed to
that site or to a public multiplayer host. Knowing the website URL does not
provide access to its source repository, Vercel account or settings.

Start with **[DEPLOYMENT.md](DEPLOYMENT.md)** for numbered hosting instructions.
The clearly labelled public frontend setting is **`MULTIPLAYER_SERVER_URL`**.

## What is included

- The supplied Backyard Stories game, preserving its textured rat, world,
  sewers, free missions, shops, phone, local saves and Rat Pack prototype.
- Real Node/WebSocket multiplayer, up to eight players per room: active public
  listings, Quick Join, private invitations/codes, ready/start, host transfer,
  kicks, waiting for ongoing races, room isolation, reconnect attempts and errors.
- Server-owned movement/physics, online guest identities, balances, purchases,
  vehicle occupancy, race checkpoints/results, shared scavenging/delivery,
  doors/fridge/drains and online membership redemption. Client-reported positions,
  coin totals and finish/reward claims are not accepted.
- Interpolated remote rats using the original rat mesh, stable ID-based name
  tags, animation state, appearances, flight, vehicles and preset signals.
- Eight procedural bike/car styles, a garage with actual model previews, free
  starters and earnable styles, safe mount/dismount, steering/braking/reverse,
  wheel motion and boost. Race classes have matched vehicle performance.
- RatDeck: Super Rat Bros (three original short levels, checkpoints, collectibles,
  enemies and ending), and Flappy Rat. Both free, with pause/restart/home/exit,
  keyboard/touch controls and local high scores. Loops stop when closed.
- Rat Pack jetpack recharge delay: **3 seconds**, separately defined from capacity,
  burn and recharge speed. Original procedural music remains local to each player.
- Rat Royale — Coming Soon, with **`RAT_ROYALE_URL`** empty by default and HTTPS-only.
  It is a separate future game, not pretend playable content.

## Which files go where

| Files | Purpose | Hosting |
|---|---|---|
| `frontend/src`, `frontend/public`, `frontend/build.mjs`, `shared/` | Game source, assets and shared simulation | Built by Vercel |
| `frontend/dist/` | Generated public website files | The only output Vercel serves |
| `server/src`, `server/package.json`, `server/package-lock.json`, `shared/` | Persistent WebSocket process | A separate Node web service |
| `server/data/` or configured `DATA_DIR` | Secret profile database and backups | Persistent server disk; never Vercel static output |
| `original/` | Recoverable copy of your supplied HTML | Backup, not the new player entry point |
| `tools/`, `server/test/`, `docs/` | Build, tests and handover | Development only |

The simplest approach is putting the whole extracted folder in one Git repository
and connecting **that same repository** to two services. Vercel builds the web
files; the Node host runs the server. The two services have different commands.
There is no need to upload `node_modules`: `npm ci` installs the locked dependency.

## Commands

Node **22.9+** (or Node 24) is required. No global packages are required.

Server, from `server/`:

```sh
npm ci
npm start
```

The start script is `node --env-file-if-exists=.env src/index.js`.
From the project root on a hosting service, the equivalent start command is:

```sh
node server/src/index.js
```

Frontend, from `frontend/`:

```sh
npm ci
npm run build
npm start
```

Set `MULTIPLAYER_SERVER_URL` in your shell or Vercel **before** running build.
See DEPLOYMENT.md for Windows PowerShell commands. The generated `config.js`
contains public settings only. Do not put server secrets in frontend variables.

## Controls

On foot: WASD/arrows move; Shift/Run runs; Space/Jump jumps without cancelling
movement; E/context button interacts; F attacks in single-player; M opens phone;
J/rocket toggles jetpack; Ctrl/Down descends; R resets camera; Escape backs out.
G opens the garage. Online combat between players is deliberately disabled.

Vehicles: W/S or joystick up/down accelerate and reverse; A/D or joystick left/
right steer; Space/Jump brakes; Shift/Run boosts; E/context or Ride button enters/
exits. Spawn outdoors on clear ground. Starter bikes and cars are free.

RatDeck: left/right arrows or A/D, Space/W/up for platformer jump; tap/click/Space
for Flappy Rat. Labelled touch controls, Pause, Restart, Console home and Close
are implemented. Escape closes the console. Single-player pauses; an online rat
idles while the shared server world continues.

Online activities: the host selects the mode when creating the room. Guests
ready up, then the host starts. Races have a three-second countdown and ordered
checkpoints. Scavenging requires E by the gold challenge cheese; delivery uses E
at the marked pickup/drop stations. Each successful delivery round needs three
parcels. Results and rewards come from the server. Host can replay the round.
Joining a running race waits for the next round. Free-roam allows late joining.

## Saves and identity

Local single-player data keeps its existing keys and migration. Online progress
is a **different** server-owned balance and vehicle collection. Local coins or
a client membership flag are never imported as online authority.

The server creates a random guest bearer key and stores its hash with a stable
player ID. The browser remembers that key for this backend. Nicknames are not
credentials; duplicate names are distinguished by IDs. There is no email login,
friends service, account recovery, cross-device sync or fabricated cloud save.
Clearing browser storage loses access to that guest profile. A persistent disk
is needed to keep online profiles across server restarts. Active rooms are
in-memory and close on a full backend restart; reconnect then return to the lobby.
A brief connection loss can resume a still-active room within its cleanup window.

Offline Rat Pack retains prototype code handling. Online Rat Pack uses the
server-only `RAT_PACK_ACCESS_CODES` configuration; by default none are enabled.
Bob can deliberately configure a test code, including his existing prototype,
but the embedded short prototype is not a secure production secret. Use long
random server codes for real public membership. There are no prices or billing.

## Tests and limitations

See [TESTING.md](TESTING.md) and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
This is a real first-version server implementation, not a hosted/live internet
service yet. It needs your backend deployment and Vercel configuration.

A single server instance owns rooms and its persistent profile file. **Do not
run multiple replicas or cluster workers** without a shared-room/database adapter.
The current guest system, preset-only communication and host kicks are suited
to this first version, not a complete public-service moderation/account platform.

The original eight adventure missions/NPC story economy remain single-player.
Multiplayer contains the separate shared free-roam/race/scavenging/delivery loop,
not fully synchronised NPC combat or story quests. Vehicles are stylised planar
arcade vehicles rather than rigid-body rollovers; bike-specific trick/pedalling
animations, passengers, vehicle damage and player trading are not implemented.
Extra photo poses/angles and additional save slots remain omitted. No new weather
or day/night lighting system is claimed. Actual 3D networking, physical touch,
latency under real internet conditions and audio need device testing; see tests.
