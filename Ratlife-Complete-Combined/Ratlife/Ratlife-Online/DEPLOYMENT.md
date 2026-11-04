# Deployment for the current release

The previous JSON-file/free-ephemeral-storage setup is superseded.
Follow **docs/UPDATE-HANDOVER.md** for complete current deployment and private
administrator setup. Do not follow old instructions that set RAT_PACK_ACCESS_CODES
or use temporary Render storage for account data.

Repository working directory: `Ratlife/Ratlife-Online`
Backend: Node 24, one instance, real mounted persistent disk, SQLite.
Render build: `npm --prefix server ci --omit=dev --ignore-scripts`
Render start: `node server/src/index.js`
Vercel build: `npm --prefix frontend run build`
Vercel output: `frontend/dist`
Vercel public variable: `MULTIPLAYER_SERVER_URL=wss://ratlife.onrender.com/ws`

Both services require redeployment. Preserve the existing Vercel domain.
Do not upload node_modules, real .env files, private database backups or credentials.
