# Follow-up review — 4 November 2026

Reviewed the attached accounts/chat replacement ZIP, assembled it over the saved full multiplayer project and ran the actual automated suite and frontend build. The live repository, Vercel account and Render service were not modified. This is a focused code review and repair, not a claim of a complete security audit or rendered playtest.

## Fixed

- Malformed JSON values such as null: the rejection response previously dereferenced the invalid message and could throw outside the handler. Invalid primitives now receive an error without crashing the server.
- Authentication on movement: input now validates the current session, including revocation, without waiting for the heartbeat.
- Replaced connections: superseded sockets are explicitly rejected and excluded from profile synchronization. A delayed close cannot remove the new connection's room membership. The displaced player's UI shows the connection explanation and room panel.
- Action limiting: chat history, saves, account/admin and other authenticated non-movement commands now pass through the common action limiter instead of returning before it.
- Guest wallet transfer: profile flushes now write current connected identities only. They no longer replay cached, offline guest profiles over the database after transfer.
- Guest renewal: recognised guest keys renew their sessions consistently before or after cleanup; renewal keeps the durable key rather than replacing it with a credential that cannot renew again.
- Membership transfer: eligibility uses currently active membership, including expiry. An expired account grant no longer prevents an active guest grant moving to it.
- Browser release reset: a corrupt primary save no longer prevents the fixed reset from running. Valid backup settings can be retained while old gameplay is cleared.
- Failed login restores the previous synchronization gate; failed or unresolved account saves prevent logout from silently leaving unsynced progress behind.
- Health response reports protocol 2, matching the authentication handshake.

## Verification

44 server tests/subtests passed, using independent real loopback WebSocket clients, real SQLite files and migration child processes. Four interface/RatDeck tests passed using DOM doubles. Twenty-four retained game checks passed using DOM/WebGL doubles. The frontend build passed with the intended production WSS endpoint. Served JavaScript/HTML was scanned for the supplied initial code, administrator-password environment name and stored verifier markers; none were present.

No rendered browser binary was available. Physical mobile controls, mobile keyboard layout, WebGL/audio behavior and the live cross-host deployment still require the smoke test in TESTING.md. Test assembly used the saved full multiplayer ZIP, not a fresh checkout of the live GitHub branch. If your current source differs, merge against it and rerun the suite before rollout.

The fixed release migration ID and reset epoch are unchanged. Installing these repairs after this release has already migrated does not intentionally reset new progress again. SQLite still requires one backend instance with a genuine persistent disk; no Postgres adapter was added.
