# Release migration

Executable migration: `src/storage.js`, `Storage` constructor.
Fixed ID/epoch: `ratlife-2026-11-accounts-chat-reset-1`.

SQLite Node 24, WAL + FULL synchronous writes + busy timeout. `BEGIN IMMEDIATE`
serialises migration and every redemption, transfer, save and administration change.
The `migrations` table has a PRIMARY KEY on the fixed ID. The code re-checks it
inside the transaction, and commits gameplay reset, entitlement revocation, new
salted access-code verifier and completion marker together. Rollback leaves no
completion marker. Another startup re-checks before making any changes.

`state` contains the versioned transactional domain document. Account usernames
are normalised keys; identity and session indexes are private server-owned maps.
Uniqueness, revision and cap checks occur under the same database write lock.
This is intentionally a small single-process deployment, not a distributed SQL
service. Public HTTP exposes only `/healthz`; identity and admin operations use
Origin-checked WebSockets with expiring bearer sessions.

Before first migration, a private SQLite checkpoint is created in DATA_DIR.
The legacy `profiles.json`, if supplied in DATA_DIR, remains as the legacy backup.
Do not put DATA_DIR under a static web directory. Import legacy JSON BEFORE the
first start; it is not imported after the marker exists.

Inspect with owner access:
```
node --input-type=module -e "import {DatabaseSync} from 'node:sqlite'; const d=new DatabaseSync(process.env.DATA_DIR+'/ratlife.sqlite'); console.log(d.prepare('SELECT * FROM migrations').all())"
```
One row for the fixed ID confirms completion. The dashboard Overview also shows
this epoch. Restart, redeploy and code rotation never remove this marker.

Browser migration: `frontend/src/release.js`, before `game.js`. It preserves
identity keys, nicknames, local mute/block lists and control/accessibility settings;
resets old adventure/garage/console/premium data; writes the epoch immediately.
New adventure snapshots include this epoch. The server rejects stale epochs.
A fully offline old cached build cannot be remotely changed until updated.

The release reset is intentionally not a repeatable dashboard button. A future
reset requires a separately reviewed migration with a new fixed ID. Do not delete
`migrations` or manually edit the epoch to rotate a code or revoke membership.
