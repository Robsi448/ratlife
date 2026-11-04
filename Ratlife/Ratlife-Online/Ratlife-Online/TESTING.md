# Testing — reviewed accounts/admin/chat release

Current review environment: Node 24.22.1. The replacement patch was assembled over
the saved Ratlife-Multiplayer-Complete.zip, not a fresh checkout of the live branch.

## Executed automated checks

- `npm --prefix server test`: 44 passing tests/subtests using independent actual
  WebSocket clients on loopback, plus real on-disk SQLite and child processes.
- `node --test tools/client-tests.mjs tools/community-client-tests.mjs`: 4 passing
  tests using interface/Canvas DOM doubles. Includes RatDeck loop behaviour,
  literal text chat rendering, local mute, keyboard focus/typing isolation,
  room switch/disconnection state and browser release reset exactly once, including
  a corrupt primary save with a valid backup.
- `node tools/base-regression.cjs`: 24 retained game-logic checks using DOM/WebGL
  doubles: free mission chains, pickups/rewards, purchases, saves, phone apps,
  nest limits, flight restrictions and server-adapter requirement for membership.
- Node syntax checks on changed JavaScript/modules.
- Frontend build completed; built served files scanned for legacy prototype code
  and accidental private credential/verifier markers.

Server coverage includes real public/private rooms, Quick Join, eight-player cap,
room isolation, host transfer/kick, authoritative movement and races, vehicle
occupancy, affordability, cooperative rewards, drains, malformed/oversized frames,
origin rejection, guest identity protection, optional registration/login, reserved
BobAdmin, password verifier storage, session expiry/password revocation, revision
conflicts, server-only online wallet, membership normalization/rotation/revocation,
revocation safe vehicle exit, atomic promo retries/caps, chat identities/badges,
script-like literal text, ordering/ack retry, private history isolation, report
persistence/context verification, local-vs-room/global moderation permissions,
message deletion fanout, rate limits, guest transfer without duplicate membership,
restart persistence, rollback and three concurrent migration initialisers leaving
exactly one completion marker/audit entry. Vehicle simulation tests exercise
forward, brake, reverse, steering, wheel progress and wall clearance.

Review regression coverage also includes null/primitive JSON, immediate movement
session revocation, superseded connections, common action limits on history/saves,
post-transfer guest wallet persistence, expired guest renewal and membership expiry
during transfer. See docs/REVIEW-FIXES.md for the repair details.

## Not verified — do not treat the automated checks as rendered playtesting

No rendered browser/WebGL, real desktop input, physical touch/mobile keyboard,
audio playback or live Vercel-to-Render test completed. No Chromium/Chrome browser
binary was available for this review.
DOM/Canvas/WebGL doubles cannot validate visual layout or audio comfort.
No production credentials/database/disk were supplied or used. No push/deploy.

## Required manual smoke pass before rollout

Use two independent browser profiles/devices (separate guest keys).

1. Provision persistent storage, perform migration/admin setup, restart twice;
   confirm one migration row and newly earned progress/changed codes survive.
2. New nickname, New Game/Continue, all menus, phone/RatDeck, ordinary missions,
   sewers with solid floors/ceiling, camera and audio regression pass.
3. Register/login/logout/password change. Login on a second device; confirm saved
   missions, items, garage, nest, notes and RatDeck records load without mixing.
   Test conflict UI and a failed save/reconnect. Verify guest-transfer choices.
4. Create/join public and private rooms/code/link/Quick Join. Check remote models,
   names, jumping and vehicle motion. Test join ongoing race, leave and reconnect.
5. Cars: spawn, mount, forward/reverse/brake/turn/dismount, collision, Recover,
   two devices seeing one driver, premium revocation while riding/flying.
6. Chat: Enter/type/send/Escape, no gameplay shortcut activation, mobile keyboard
   and portrait/landscape placement, scroll/history/unread/hide/local mute, report
   and real admin review, message deletion, room/global mute, room switch privacy,
   reconnection history without duplicates, verified badges and duplicate names.
7. Admin: spoofed nickname grants nothing, non-admin endpoints reject requests,
   directory/filter/pagination, grant/revoke/expiry/code rotation, promo management,
   suspension, announcements/banner, close room, owner recovery.
8. Turn network off/backend unavailable: ordinary local guest play still works,
   premium check is not claimed current; no false reward/save/report success.
9. Test sleep/wake, corrupt local save, blocked localStorage, expired identity,
   backup recovery and old offline build upgrading to the fixed epoch.

Limits and retention/deployment policies: docs/UPDATE-HANDOVER.md.
