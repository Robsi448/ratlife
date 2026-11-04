# Install the complete combined Ratlife game

This ZIP combines your attached original Ratlife-Online.zip with your reviewed Ratlife UPD.zip. It contains the game source, models, textures, world map, styles, RatDeck module, package files, backend, tests and update instructions. It is a complete source replacement, not an update-only patch. Dependencies install with npm; the frontend build regenerates frontend/dist.

## 1. Prepare the repository and backup

1. Make a private backup of your existing project and any existing backend player data.
2. If automatic deployments are enabled, pause them while preparing the hosting settings so uploading files does not start the update prematurely.
3. Extract this ZIP. In GitHub keep the existing repository and use Ratlife/Ratlife-Online as the game folder. Open the extracted Ratlife/Ratlife-Online folder on your computer, then upload the CONTENTS into the matching GitHub folder. Do not upload its enclosing Ratlife-Online folder into itself. This complete package can replace the game folder contents after your private backup; it does not require the old files to supply missing assets. If your repository root is already the game folder, upload the contents there instead.
4. The two retired generators have already been omitted from this combined package. Do not delete backend data, databases or migration records.
5. Configure hosting below before deploying. The first configured start applies the previously requested gameplay and membership reset. Accounts, nicknames, identity and moderation records are retained. Keep the fixed migration ID unchanged: these review fixes do not introduce another reset.

## 2. Configure Render first

This SQLite implementation needs a **paid web service with a persistent disk**, one backend instance and Node 24. Render Free does not support the required durable disk. An external Postgres database alone will not make this package work: it has no Postgres adapter.

In the existing Render service:

- Attach a persistent disk with mount path `/var/data`.
- Set the root directory to the actual repository-relative game folder (normally `Ratlife/Ratlife-Online`).
- Build command: `npm --prefix server ci --omit=dev --ignore-scripts`
- Start command: `node server/src/index.js`
- Health check path: `/healthz`
- Keep the instance count at one.

Set these in Render's private Environment settings:

| Variable | Value |
| --- | --- |
| NODE_VERSION | 24 |
| DATA_DIR | /var/data/ratlife |
| PERSISTENT_STORAGE_CONFIRMED | 1, after attaching the actual disk |
| ALLOWED_ORIGINS | https://ratlife.vercel.app |
| TRUST_PROXY | 1 |
| INITIAL_RAT_PACK_CODE | ratpackunlock, for first migration only |

Leave PORT under Render's control. Optional moderation settings are in server/.env.example. Never upload a real .env file. If you use another game domain, update ALLOWED_ORIGINS to its exact origin; preview deployments need their own explicit origin if used.

Restore any available legacy profiles.json to the new DATA_DIR before the first start if preserving those guest identities matters; see UPDATE-HANDOVER.md. Do not put private player data into GitHub.

Deploy the backend. Check `https://ratlife.onrender.com/healthz` for `ok: true` and `protocol: 2`. A healthy endpoint alone does not prove the disk is persistent: confirm the mount in Render.

## 3. Create BobAdmin privately

1. Choose your own new password of 12–128 characters. Do not send it in chat or commit it.
2. Set `BOBADMIN_PASSWORD` privately in the Render service environment. Let the environment update take effect.
3. In that running service's Shell, run from the configured game root:

   ```sh
   npm --prefix server run admin:setup
   ```

4. Remove `BOBADMIN_PASSWORD` from the service environment immediately afterward.
5. After migration success, also remove `INITIAL_RAT_PACK_CODE`. Removing it will not remove the active code: the verifier is already stored in SQLite.

Use the running service's Shell, not a one-off job: Render one-off jobs cannot access the service's persistent disk. Bootstrap must use the same DATA_DIR and disk as the actual server. It refuses to replace an existing BobAdmin. If owner recovery is needed later, use `npm --prefix server run admin:recover` with a privately supplied replacement password.

## 4. Configure and redeploy Vercel

Keep the current project and domain. In its build settings use:

| Setting | Value |
| --- | --- |
| Framework | Other |
| Root Directory | Actual game folder, normally Ratlife/Ratlife-Online |
| Install Command | npm --prefix frontend ci --ignore-scripts |
| Build Command | npm --prefix frontend run build |
| Output Directory | frontend/dist |

Set the **production** environment variable `MULTIPLAYER_SERVER_URL` to `wss://ratlife.onrender.com/ws`. If your backend domain differs, use its actual WSS address. Leave RAT_ROYALE_URL empty for this update.

Rebuild/redeploy Vercel after the backend is healthy. Do not upload the server folder as a static website or deploy only replacement HTML. The frontend build needs the unchanged existing assets and modules.

## 5. Verify the reset and administrator access

Open the updated game and choose a nickname. Log in through Login / Account using the unique username `BobAdmin` and your private password. The Admin Panel button appears after server confirmation.

Confirm the dashboard reports epoch `ratlife-2026-11-accounts-chat-reset-1`. For an exact completion-marker check, in the running Render service Shell run:

```sh
node --input-type=module -e 'import {Storage,RELEASE} from "./server/src/storage.js"; const s=new Storage({dataDir:process.env.DATA_DIR}); try { console.log(s.db.prepare("SELECT id, applied_at FROM migrations WHERE id=?").get(RELEASE)); } finally { s.close(); }'
```

There should be one row for that fixed ID. Earn some new progress, restart the backend and confirm it survives without another reset. The browser also resets pre-release local gameplay once; an old cached offline copy cannot be changed until it updates.

## 6. Use the admin controls

- **Players → Details:** grant/revoke Rat Pack for a guest or account, set an optional expiry, moderate or allow code redemption again.
- **Rat Pack code:** enter a new code twice and confirm with the administrator password. Rotation invalidates the old code. Leave “Also revoke all current Rat Pack memberships” off unless you intend to revoke existing grants.
- **Promo codes:** create a code, choose a real reward/item, set caps/expiry and enable it. Guests can redeem unless you explicitly select accounts only.
- **Chat Moderation:** review persisted reports and moderate players. Ordinary conversation history is transient.

The initial code ratpackunlock is case-insensitive. It is specified in your brief and is not an undisclosed secret. You can replace it privately in the dashboard.

## 7. Do the final playtest

Use two separate browser profiles or devices. Test guests, accounts, public/private rooms, chat privacy, mobile typing, car driving/dismounting, grant/revoke while playing, promo limits and saving after a restart. Automated tests passed, but rendered desktop/mobile/WebGL behavior and live hosting remain unverified.

Only re-enable automatic deployments after both services use the correct settings. No changes were pushed or deployed by this review.

Provider references checked 4 November 2026:
- https://render.com/docs/disks
- https://render.com/docs/free
- https://render.com/docs/ssh
- https://render.com/docs/one-off-jobs
- https://vercel.com/docs/builds/configure-a-build
