# Architecture and operating boundaries

## Protocol

The backend exposes HTTP `/healthz` and WebSocket `/ws`. Protocol version 1 uses
small JSON commands with request IDs and structured success/error responses.
The browser authenticates with a random bearer key, then lists/creates/joins a
room. Public room IDs and private 96-bit invitation codes are separate from
Rat Pack codes. Private rooms do not appear in public listings or Quick Join.
Duplicate create requests on an already-joined connection are rejected.

Client input is sent at most 20 times/second: normalised axes, camera yaw, run,
jump, brake, boost and jet-toggle intent. There are no client position, currency
or finishing-result fields accepted as authority. The server runs shared physics
at 30 Hz and publishes room snapshots at 15 Hz. The browser predicts locally,
reconciles against server state and interpolates remote state. Authoritative
corrections can be visible with high latency; this has not been internet-tuned.

`shared/world.json` is collision geometry exported from the supplied game. It
includes terrain prop bounds, bins and door definitions. Both server and client
use it. The original client renderer and single-player collisions are retained.
Changing the world requires regenerating/testing collision data with the visuals;
do not modify only one side. New vehicles use radius checks and safe dismount
searches. The server never trusts an occupancy claim in an input message.

Each connected player has a stable server ID, display name and profile. Display
names are constrained and rendered as text, not executable HTML. Remote tags
are keyed by ID, interpolated with their rat, projected using the current camera,
hidden behind the camera/outside a reasonable distance and tested against the
existing wall visibility function where practical. Duplicate names do not merge
players. Leaving removes the remote mesh entry and tag.

## Authority

Online balances and owned vehicle styles live in the profile database. Purchases
check item definitions, ownership, membership and affordability before mutation.
Race completion requires ordered proximity checks during server simulation;
there is no `finish` command. Rewards are issued once per round. Co-op cheese
and parcel actions require valid phase, player participation, layer and proximity.
Online Pack access comes from configured server codes, never a browser flag.
The legacy short code is retained for offline prototyping, not represented as a
production security mechanism or purchased subscription.

Ground races disable flight. Bike/car races assign one standard vehicle per
participant and check class/ownership; styles share class performance and boost.
Vehicle creation/ownership and the single driver field are handled synchronously
on the server. Disconnects release occupancy and remove owned vehicles. Host
controls transfer to the next connected player; the host does not own simulation.
Guests joining an active race wait for the next round.

Rooms are isolated in Maps. Only their members receive their state/signals.
Public browser updates contain public metadata only. Empty rooms expire after
30 seconds. Pings clean up dead sockets. Inputs older than 400 ms become idle.
The client attempts five reconnects with exponential backoff. Profiles remember
the last room, allowing a secret-identity reconnect to a still-existing room;
restart does not persist rooms and therefore returns players to a new lobby.

## Persistence and limits

Profiles are versioned JSON written atomically to the configured persistent
`DATA_DIR`, with a previous-file backup. Database write failures are logged;
invalid databases fail startup rather than being overwritten. The bearer key
is stored only in the browser; its SHA-256 hash is the server lookup key. It is
not password-based account recovery or cross-device login. Treat the key as a
credential; browser compromise can steal it. Identity reset explicitly warns
that access to the existing guest profile will be lost on that browser.

One server process/replica only. For horizontal scaling, replace in-memory rooms
and file persistence with a shared authoritative room coordinator/database. This
is intentionally not hidden behind a claim that stateless instances magically
share a world. Profiles are retained until the operator removes/archives them;
there is no automated account deletion UI in this version.

Origin allowlisting, connection/action/join/social/membership attempt limits,
authentication timeout, finite-value input normalisation, an 8 KiB payload limit,
heartbeat cleanup and bounded outbound buffers are implemented. Allowed origins
are a browser access constraint, not authentication against non-browser clients.
Host kicks ban the profile and its observed IP for that room. A trusted-proxy
configuration is needed to distinguish public clients; shared-NAT players may
be affected by the same room's IP ban. This is not a full public-service ban-
evasion/reporting/moderation platform. Communication is presets and emotes only;
no unmoderated free chat, fake report endpoint or voice service is provided.

## Frontend integration

`tools/extract.py` separated the supplied HTML's actual assets/styles/logic.
`game-base.js` preserves that starting logic. `tools/integrate.py` makes the
explicit multiplayer adapter and input/render hooks in `game.js`. No sections
are omitted and no external asset CDN is required. Keep these build steps when
changing the baseline. `frontend/build.mjs` writes public config and copies the
runtime files. `frontend/dist` is the only Vercel output.

The bridge suppresses local story simulation/saving online, applies validated
shared objects, snapshots/restores the single-player position/world values and
keeps online money separate. Original story quests and NPC combat are not shared
online. Online gameplay is free-roam plus the implemented activity modes. Local
music is not network-broadcast. The phone remains available; the added Garage,
Multiplayer and RatDeck launchers open actual systems, not decorative apps.

RatDeck owns a single animation loop, cancels it when closed/home, and produces
short procedural sound nodes only after user input. Both games and their high
scores are local even while the rat is online. The server receives only the
console idle flag. Rat Pack shells are cosmetic.

## Deliberate remaining limits

No multiplayer story/NPC combat sync, passengers, rigid-body vehicle rollovers,
vehicle damage, player trading, voice/free chat, guest recovery/cloud login,
multiple server replicas, bike-specific trick/pedalling animation, weather or
new day/night lighting. Existing omitted photo poses/angles and save slots stay
omitted. Public hosting, internet latency, physical multitouch, actual 3D remote
rendering and audio playback require the operator's deployment/device checks.
