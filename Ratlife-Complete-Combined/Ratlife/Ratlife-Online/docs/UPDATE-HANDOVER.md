> Combined-package note: this archive includes the original game files and assets
> as well as all update files. The original patch-only checklist is replaced by
> a complete source-file list. See START-HERE.txt for upload instructions.

# Ratlife accounts, administration and room chat update

Start with **INSTALL-FIRST.md** for the ordered Vercel/Render installation walkthrough.
Review fixes and current verification are in REVIEW-FIXES.md and ../TESTING.md.

This package changes the existing game at repository commit
`e291eeb510d5e437bc32a5f60b7a257f409c6196`. It preserves the supplied world,
missions, phone, public/private WebSocket multiplayer, eight vehicle styles,
RatDeck games, procedural music and single-player systems. No push or deployment
has been performed. See REPLACEMENT-CHECKLIST.txt for exact paths.

## Hosting decision — do this before replacing the live backend

This implementation uses **SQLite on a mounted persistent disk**, Node **24**,
and **one running backend instance**. Your current free Render service has no
persistent disk. This update must not be launched on that temporary filesystem.
Use a Render service supporting a persistent disk (this may require changing
service plan), or an equivalent Node 24 host with durable storage. No external
PostgreSQL integration is included. Never set the confirmation variable merely
to bypass this requirement on an ephemeral filesystem.

The server fails clearly if DATA_DIR / persistent-storage confirmation is missing,
or if the first migration has no initial Rat Pack code. It never falls back to
an in-memory account database. Rooms and normal chat remain intentionally in memory.

Preserve `https://ratlife.vercel.app` and `https://ratlife.onrender.com` in their
existing projects. Attach the disk to the existing Render service if supported.
If you must create a replacement backend, update the frontend environment URL
to its real WSS endpoint; keep the Vercel player-facing website unchanged.

## Private pre-release backup

Stop new gameplay while preparing the switch. With server-owner access, privately
copy the OLD backend's DATA_DIR/profiles.json before redeployment. Put this file
in the NEW mounted DATA_DIR before its first start. Never commit or upload it to
Vercel. It allows the release migration to retain guest identity hashes and
nicknames while resetting gameplay and memberships. If the old free Render
filesystem has already been destroyed, those missing identities cannot be
reconstructed from nicknames. Affected guests must explicitly reset their old
online identity in Multiplayer settings and receive a fresh identity.

Existing browser credentials, nicknames and settings are retained by the browser
migration. Offline cached old code cannot be remotely reset before it updates.

## Render configuration

Root directory: `Ratlife/Ratlife-Online`
Build: `npm --prefix server ci --omit=dev --ignore-scripts`
Start: `node server/src/index.js`
Node: 24 (`NODE_VERSION=24` if needed by your host)
Health check: `/healthz`
Disk mount: `/var/data` (or actual mount supplied by your host)

Private environment settings:

| Name | Value |
| --- | --- |
| DATA_DIR | `/var/data/ratlife` on the real mounted disk |
| PERSISTENT_STORAGE_CONFIRMED | `1`, only after confirming the mount |
| ALLOWED_ORIGINS | `https://ratlife.vercel.app` |
| TRUST_PROXY | `1` behind Render's trusted reverse proxy |
| INITIAL_RAT_PACK_CODE | Set `ratpackunlock` privately for the first migration |
| REPORT_RETENTION_DAYS | `90` default |
| CHAT_MESSAGES_PER_10S | `5` default |
| CHAT_CHARACTERS_PER_30S | `1000` default |
| CHAT_BLOCKED_TERMS | Optional comma-separated terms; not complete moderation |

Do not set RAT_PACK_ACCESS_CODES from the old release: it is no longer used.
The initial code is case-insensitive and used once to create a salted verifier.
Remove INITIAL_RAT_PACK_CODE after confirming the migration. Later code changes
are stored in SQLite and cannot be overwritten by environment defaults.
No private settings belong in Vercel or in frontend source files.

## BobAdmin private setup and recovery

There is **no bootstrap HTTP endpoint** and public registration reserves BobAdmin
in every letter case. Only the server owner can run this terminal-only command.

On the durable backend, privately set `BOBADMIN_PASSWORD` to a new strong password
of 12–128 characters using your host's private environment UI or a terminal
secret-entry mechanism. Do not put it in a command line shared in chat, source,
GitHub, example files or screenshots. From the server directory run:

```
npm run admin:setup
```

Remove BOBADMIN_PASSWORD from the environment immediately afterward. Log in via
the game's Account button with username BobAdmin. The server-confirmed role makes
the Admin Panel button appear. Choosing BobAdmin as a nickname does nothing.
Bootstrap refuses to overwrite an existing administrator.

If locked out: server-owner access is required. Set BOBADMIN_PASSWORD privately
to a replacement, run `npm run admin:recover`, then remove the variable. This
revokes existing admin sessions and records an owner recovery audit event.
There is no email recovery service. Normal password changes require the current
password and revoke other sessions.

## Vercel configuration

Keep the existing project/domain `ratlife.vercel.app`.
Root directory: `Ratlife/Ratlife-Online`
Framework: Other
Install: `npm --prefix frontend ci --ignore-scripts`
Build: `npm --prefix frontend run build`
Output: `frontend/dist`
Production environment: `MULTIPLAYER_SERVER_URL=wss://ratlife.onrender.com/ws`
Leave RAT_ROYALE_URL empty (Coming Soon).
Redeploy **both Render and Vercel** after replacing source files. Backend first,
then frontend. Only build outputs are served; never expose server or DATA_DIR.
The ZIP contains changed source, not a preconfigured dist directory.

## Accounts and guest play

Nicknames are required, remembered, editable, 1–20 characters and displayed as text.
Guests have server-issued random bearer credentials and ordinary gameplay,
multiplayer, promo and membership access without registration. They appear in
the admin directory after first connection. Clearing browser data can lose guest
access and can bypass recognised-identity limits; guest bans are not perfect.

Accounts have unique usernames, scrypt password verifiers with unique random
salts, seven-day expiring bearer sessions and explicit logout/revocation. Guest
sessions last 180 days; a recognised durable guest key renews its own session
on reconnect, including before the expired-session cleanup runs. Tokens are stored
in browser storage; protect the site against XSS. No cookie dependency or
third-party-cookie assumption is involved: authentication is inside the WSS
protocol, after exact Origin validation. Never put tokens in URLs. Only health
information is public HTTP. There are no unauthenticated account/admin HTTP APIs.

Another connection for the same identity closes the previous one. The displaced
session must reconnect explicitly if it was playing; it does not fight an endless
reconnect loop. Multiple valid account sessions still face save revision checks.

Account adventure snapshots sync about every 15 seconds and on explicit logout.
They include missions, inventory, adventure coins, cosmetics, nest, records,
notes/settings and world state. Adventure snapshots are untrusted single-player
state and NEVER become authoritative multiplayer money or membership. Server
online coins/vehicles/membership are a separate server-owned profile. Promo coins
are online coins. A failed sync leaves local progress intact with an indicator.
On conflict you can download this device's checkpoint or load the server version;
the older device never silently overwrites a newer revision.

Login/registration loads the destination account adventure, without silently
merging it with the current guest. An explicit transfer panel offers keeping the
account or replacing it with the guest's latest server checkpoint/online wallet.
Membership moves once, atomically; an existing account membership is retained,
and the guest cannot retain a duplicate. A private transfer checkpoint is stored
for owner recovery. Transfer cannot import arbitrary local money into online play.

## Administrator operations

- Players: search/filter/page through guests/accounts; inspect public nickname,
  private account username, stable ID, presence, first/last seen, room, membership,
  source/expiry, suspensions and audit entries. Presence is approximate.
- Grant/revoke Rat Pack for guests or accounts. Optional expiry. Connected players
  receive changes; premium vehicle use ends with a safe dismount, flight stops,
  premium styles unequip. Free items/progress remain intact.
- Change Rat Pack code with confirmation + administrator reauthentication. Optional
  **Also revoke all current Rat Pack memberships** defaults OFF. Rotation alone
  keeps grants. Revocation blocks that identity from reusing the current code
  version; Allow code redemption again is an explicit action. A newly rotated code
  version is eligible unless that rotation explicitly revoked everyone.
- Promo codes: create/generate, edit reward, real item ID, quantity, expiry, global
  and per-identity cap, account-only (default off), enable/disable/archive. Verifiers
  are salted; list responses never reveal codes. Double-click/network retries use
  idempotency keys; all caps and rewards share one transaction. Updates affect
  future redemptions. Disabling does not undo existing rewards. Pack promos have a
  separate confirmed, reauthenticated revocation action.
- Kick, temporary chat mute, full identity suspension with reason/expiry, remove
  suspension, room closure, announcements, maintenance banner and audit log.
- A full gameplay suspension remains across reloads/resets; a new unrecognised
  guest identity may evade it. Hosts have no global directory or admin access.
- The fixed release reset is not a repeatable dashboard button. Further global
  resets require an owner-reviewed migration rather than deleting reset markers.

## Room chat and moderation

Real same-room WebSocket text chat, including guests; no direct messages/voice.
Enter focuses; Enter submits; Escape releases focus. Typing clears movement and
releases pointer lock. UI touch input is isolated from the game camera; viewport
resize support keeps input within the visual viewport. Minimise, hide, unread
count, timestamps, server-confirmed admin/host badges, failure feedback and local
mute/unmute are implemented. Duplicate names use short stable non-secret tags.

Limits: 200 characters, one line, no control/format characters; plain text only,
no markup, links, embeds or images. Default five messages/10s and 1,000 chars/30s
per recognised identity, plus IP/action limits and rapid duplicate suppression.
Ordinary commands max 8 KiB; saves up to 128 KiB wire / 100,000 JSON characters.
The server supplies sender, role, message ID and timestamp. Room history never
appears in lobby listings. A 60-message buffer is transient and room-isolated;
512 recent send acknowledgements per room deduplicate ordinary retry windows.
Very old retries outside this bounded window are not guaranteed; the client
never automatically retries messages or moves them to another room.

Reports reference an existing server message and a selected reason, are
rate-limited, include limited nearby server context and are confirmed only after
a successful database commit. Reports expire after 90 days by default, pruned
about every 10 seconds while the server runs. Report evidence remains after an
active-buffer deletion until retention expiry. Backups can retain older evidence:
apply the same retention policy to backup rotations. Do not retain backups
indefinitely. Audit records contain moderation IDs/actions, not full chat text.
Normal conversations are not written to routine logs or permanently archived.

Chat Moderation reviews reports, marks reviewed/resolved, mutes/unmutes globally,
kicks/suspends recognised identities, removes active messages from connected
clients, disables selected-room chat and sends verified administrator notices.
Host controls are limited to their current room: kick, 15-minute room chat mute,
and room chat enable/disable. Local mute affects only the choosing browser.
A basic configurable word filter is not complete moderation. Review reports and
set clear community rules; this is not an abuse-proof service.

## Controls

WASD/arrows move; Shift runs/boosts; Space jumps (brakes in vehicles); E interacts,
mounts/dismounts; G garage; M phone; J jetpack; Space ascend/Control descend during
flight; R camera reset; Escape panels/pause; Enter room chat. Vehicles: W/S
forward/reverse, A/D steering, Space brake. HUD Recover returns safely to the path.
Touch: joystick, camera-look area, Run, Jump/Brake, contextual interaction/Ride,
Garage, jetpack/descend, phone and chat controls. Portrait and landscape retained.

## Known limits / required manual checks

No public deployment was changed. No rendered browser, real mouse/touch, mobile
keyboard or WebGL integration test could be completed: the browser binary was
unavailable and its attempted download failed. See TESTING.md for actual checks.

SQLite's small transactional state-document design is for a modest single-server
community. It is not a horizontally scaled account service. Use one backend
process/replica on the same durable disk; owner CLI operations are transactional.
No distributed PostgreSQL adapter is included. Maintain private backups with
consistent SQLite backup tooling or stop the server before copying the database;
copying only the main file while WAL is active is not a safe backup procedure.

No email password reset, payment, cloud guest recovery, voice chat or direct
messages. Story missions remain single-player. Online activities remain shared.
No new bike tricks/passengers/vehicle damage simulation. Existing optional drone,
phone apps, music and RatDeck are preserved; their rendered/audio behaviour needs
manual regression testing. Accounts sync useful adventure data but browser code
is not tamper-proof; only online economy/privileges are server authoritative.
