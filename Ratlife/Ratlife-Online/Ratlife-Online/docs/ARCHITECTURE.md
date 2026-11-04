# Current architecture

Frontend: original low-poly WebGL game plus `online.js`, shared deterministic
physics, vehicle system and RatDeck. New `release.js` runs before legacy save loads.
New `community.mjs` integrates optional identity/account, save sync, administration,
promo and room-chat interfaces. `community.css` supplies responsive panels.
`game.js` remains the complete integrated runtime. Do not regenerate it with the
retired legacy integrate.py script. Root `npm run build` now builds source directly.

Backend: existing server-authoritative room simulation and WebSocket transport.
`storage.js` adds Node 24 SQLite transactions, session/account/guest identity,
scrypt verifiers, save revisions, private checkpoints and the fixed reset migration.
`community.js` adds room history, chat/reporting, promo and admin commands.
`owner.js` is a private terminal-only administrator bootstrap/recovery command.

SQLite persists one transactional domain document plus an indexed migration table.
Each mutation loads and commits the domain document under BEGIN IMMEDIATE. This
keeps reward/idempotency/migration checks atomic in this small single-instance
release. It is not designed for a large/horizontally scaled service. Rooms, movement
and ordinary chat are transient in-memory state; reported evidence is durable.

Passwords/access codes use salted scrypt verifiers. Session/guest credentials
are 32-byte random bearer values, indexed by SHA-256; raw values are never stored
in the database or routine logs. Exact WebSocket Origin allowlists protect the
cross-origin Vercel/Render connection. Credentials travel within WSS messages,
not cookies or URL parameters. Admin code is inspectable; privileges are checked
against server-side BobAdmin identity/role for every operation.

Adventure snapshots are untrusted offline game data for cross-device convenience.
Authoritative online wallet, ownership, membership, moderation and rewards are
separate and cannot be supplied through an adventure snapshot.

Runtime data/backups must stay outside served paths on an actual persistent mount.
See UPDATE-HANDOVER.md for configuration, retention, recovery and limitations.
