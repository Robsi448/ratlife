# Complete combined Ratlife project

Start with **START-HERE.txt**, then **docs/INSTALL-FIRST.md**. This archive contains
the full original game plus the reviewed update, including required source and assets.

# Ratlife — accounts, administration and room chat release

Player site: https://ratlife.vercel.app
Backend: https://ratlife.onrender.com (WSS `/ws`)

Read `docs/UPDATE-HANDOVER.md` before deployment. This release requires Node 24
and a real persistent disk for transactional SQLite storage. The existing free
Render temporary filesystem is unsuitable. No live deployment was changed.

`REPLACEMENT-CHECKLIST.txt` lists exact changed/new paths and retired generators.
`TESTING.md` distinguishes connected tests from unverified rendered browser play.

The existing game, free missions, phone, nest, public/private rooms, vehicles,
RatDeck and procedural music remain. Added optional accounts and cross-device
adventure snapshots, server-authorised BobAdmin tools, configurable Rat Pack
verifiers, promo codes, durable moderation/reporting and live same-room text chat.

Both guests and accounts can play normal gameplay, join multiplayer and redeem
Rat Pack/promos. Membership is optional. No payments or email recovery exist.

A fixed transactional release migration resets pre-release gameplay and Rat Pack
once while retaining recognised identities, account security, nicknames and
moderation data. Back up legacy profiles privately before first deployment.

Build: `npm run build`
Tests: `npm test`
Backend: `npm --prefix server ci` then `npm --prefix server start`
Use the server `.env.example` and private hosting settings; do not commit `.env`.
