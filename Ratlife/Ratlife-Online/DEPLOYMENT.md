# Connect Ratlife on Vercel to its multiplayer server

**You keep https://ratlife.vercel.app.** The Node backend has its own address.
The game connects to that address; players do not need to visit it themselves.
I have not changed your Vercel deployment or created a paid hosting service.

## 1. Put the files in your repository

1. Unzip the download. Open the `Ratlife-Online` folder.
2. Keep `frontend/`, `server/` and `shared/` alongside each other. Do not flatten
   everything into one folder and do not paste server code into the HTML.
3. Copy this folder's contents into the repository you use for Ratlife, keeping
   a backup of your previous version. Include both `package-lock.json` files.
4. Commit and push to your Git provider. Do **not** upload `.env`, server data or
   `node_modules`. The included `.gitignore` covers those paths.

## 2. Host the multiplayer backend (example: Render)

Use a Node Web Service with a persistent disk. This implementation uses a
long-running Node process; the frontend stays on Vercel. Render supports public
WebSocket endpoints and persistent disks on eligible services. Pick an appropriate
plan in your own account; this package does not subscribe you to one.

1. In Render choose **New → Web Service** and connect the repository.
2. Leave **Root Directory blank** (repository root). Choose Node runtime.
3. **Build command:**
   `npm --prefix server ci --omit=dev --ignore-scripts`
4. **Start command:**
   `node server/src/index.js`
5. Use Node **22.9+** or Node 24. Set `NODE_VERSION=24` or an installed
   compatible version if your host asks you to select the runtime.
6. Set health check path to **`/healthz`**. Let the provider supply `PORT`.
   The server binds `0.0.0.0` and uses that port.
7. Attach a persistent disk mounted at **`/var/data`**. Set:

   ```text
   DATA_DIR=/var/data/ratlife
   ALLOWED_ORIGINS=https://ratlife.vercel.app
   TRUST_PROXY=1
   RAT_PACK_ACCESS_CODES=
   ```

   `TRUST_PROXY=1` is for the hosting provider's trusted reverse proxy; leave it
   `0` for a directly exposed local server. Origin matching is exact: add other
   real frontend origins separated by commas, with no trailing slash. Preview
   deployments need their exact origin added if you want online play there.

8. Leave `RAT_PACK_ACCESS_CODES` blank if you do not want online Rat Pack codes
   yet. Otherwise set it privately to Bob's chosen code(s), comma-separated.
   Never copy it to Vercel frontend settings or commit it. The offline prototype
   still uses the supplied prototype code. Its presence in browser source means
   it is not a secure online secret; a long new server code is preferable.
9. Keep **one instance**. Do not enable multiple replicas/autoscaling/cluster.
10. Deploy. The log should say `Ratlife multiplayer listening on …; /healthz; /ws`.
11. Open the service's HTTPS address plus `/healthz`. It must show `"ok":true`.
12. Copy the actual service hostname. The frontend socket address is:

    ```text
    wss://YOUR-ACTUAL-SERVICE-HOSTNAME/ws
    ```

    Replace the placeholder with the hostname the host actually gave you. Use
    `wss://` on the public internet. Do not use an HTTP page URL or omit `/ws`.

Alternative: use the included `server/Dockerfile` with the **repository root as
Docker build context**, a persistent `/data` volume, the same environment
variables and TLS termination at your host. Its command is already included.

## 3. Connect the existing Vercel frontend

Open the existing Vercel project that owns `ratlife.vercel.app`.

1. Use the repository containing the extracted project. Keep **Root Directory
   at the repository root**, not `server` and not a folder containing only HTML.
2. Framework preset: **Other** (the included root `vercel.json` configures it).
3. Install command: **`npm --prefix frontend ci --ignore-scripts`**.
4. Build command: **`npm --prefix frontend run build`**.
5. Output directory: **`frontend/dist`**.
6. Add this public environment variable to **Production**:

   ```text
   MULTIPLAYER_SERVER_URL=wss://YOUR-ACTUAL-SERVICE-HOSTNAME/ws
   ```

   Use the real backend address from step 2. This is the clearly labelled
   multiplayer-server setting. It is a public URL, not a credential.
7. Leave **`RAT_ROYALE_URL` empty**. Later you can set it to the separate game's
   valid HTTPS URL. Until then, Rat Royale honestly displays Coming Soon.
8. Redeploy. Environment variables are compiled into `config.js` **at build
   time**, so changing a variable without rebuilding does not change the game.
9. Keep your existing `ratlife.vercel.app` project/domain assignment. There is
   no need to rename the player website to the backend address.

Only `frontend/dist` is served to players. `server/`, profile databases and
server-only environment variables must not be copied into that static output.
There is also a frontend-level `vercel.json` for advanced alternate roots, but
these instructions use the supplied **root** configuration to include `shared/`.

## 4. Check it with two devices

1. Visit **ratlife.vercel.app** on your computer and another device/browser.
2. Click **Multiplayer** on each. Set two names (names may be the same, IDs differ).
3. On one device create a **public Free roam** room. Find it with Refresh on the
   other, or use Quick Join. Both devices should show the same roster.
4. Guests select Ready; the host presses Start activity. Move, jump and verify
   that each device sees the other rat and its name tag.
5. Test Garage → unlock/spawn a free vehicle → approach it → E/Ride. A second
   rat must not control an already occupied vehicle.
6. Leave, then create a **private** room. Confirm it is absent from Public rooms.
   Copy its code or invitation link and join from the second device.
7. Create a foot race. Ready, start, follow every checkpoint and compare results.
8. Test a brief network interruption. The client attempts reconnects with
   backoff. A backend restart loses active rooms but keeps disk-backed profiles.
9. Test touch controls and RatDeck on a phone before announcing a public update.

## Local test on Windows PowerShell

Install Node 22.9+ or Node 24 from its official source. Unzip the files first.

**Terminal 1 — server:**

```powershell
cd PATH\TO\Ratlife-Online\server
npm ci
Copy-Item .env.example .env
npm start
```

**Terminal 2 — game frontend:**

```powershell
cd PATH\TO\Ratlife-Online\frontend
npm ci
$env:MULTIPLAYER_SERVER_URL="ws://localhost:8080/ws"
npm run build
npm start
```

Then open `http://localhost:3000` in two different browser profiles. Separate
profiles create separate guest identities. Two tabs in the same profile share
an identity, so the server intentionally disconnects the older connection.

For a second device on your home network, rebuild using the computer's LAN IP
instead of `localhost` and add the actual frontend origin to `ALLOWED_ORIGINS`.
Do not turn off firewall/security protections; allow the server/frontend ports
only through your normal trusted local-network setup if necessary. Internet
play should use the hosted WSS backend, not port-forwarding this dev server.

## Common problems

- **Server not configured:** set `MULTIPLAYER_SERVER_URL` on Vercel and redeploy.
- **Connection refused / timeout:** backend is asleep, unavailable or address is
  wrong. Check its `/healthz`, logs, `/ws` path and TLS/WSS URL.
- **403 handshake:** `ALLOWED_ORIGINS` does not exactly include the frontend's
  scheme and hostname. Add that exact origin and restart the backend.
- **Room missing:** private rooms require their invitation code; empty rooms
  expire after 30 seconds; restarting the backend closes in-memory rooms.
- **Saved identity invalid:** you may have changed backend/disk. The Multiplayer
  identity reset is explicit and affects only this browser's online identity.
- **Profiles lost on restart:** `DATA_DIR` was not on a persistent disk, or the
  service has a different volume. Stop and restore the disk/backup; do not erase
  the database to make the error go away.
- **Database corrupt:** the server refuses to overwrite it. With the server
  stopped, preserve the damaged file and restore a known-good `profiles.json.bak`
  or disk snapshot. Keep a separate backup of the persistent volume.
- **3D unavailable:** the browser does not provide WebGL. Menus and RatDeck may
  work, but the rat world needs a graphics-capable browser/device.

References checked for hosting guidance:
[Render WebSockets](https://render.com/docs/websocket),
[Render Web Services](https://render.com/docs/web-services),
[Render Persistent Disks](https://render.com/docs/disks).
