# Bomberman slice

Phase 5 complete — two-stage slice and Boiler King finale.

The planned slice is a procedural single-player Bomberman-inspired arena with six minions and two rival bombers, followed by the Boiler King boss. This checkpoint contains the hard-block arena, movement, two-bomb placement, exact tile flames, lives, death and respawn. Authored destructible crates and passive bomb kicking are now included. Eight authored pickups and remote detonation are now included; six minions are now active. Both rival bombers now fight alongside the minions. The Boiler King encounter now follows the arena automatically.

## Run

```sh
npm install
npm run dev -- --port 5174
```

Open the local URL printed by Vite. Arrow keys move, X places a bomb, R resets the arena, H repeats the controls hint. Most recently pressed legal direction takes precedence. Unfocused or hidden windows suspend simulation and clear held input. No menus, scoring, or reduced-motion support.

## Constants and scope

Build 0.5.0; gameplay tuning 7; handoff tuning 2; reserved gameplay seed 1994 (this checkpoint has no random gameplay). Logical composition 720 × 720; playfield 15 × 13 tiles at 48 units; top and bottom HUD bands each 48 units. Player spawn tile (1,11), center (72,552). Movement 165 units/second; circular body radius 13. Corner tolerance 30 units, centering speed 180 units/second (maximum assistance approximately 0.10 seconds). Fixed simulation 60 Hz; catch-up cap five ticks; device-pixel-ratio cap 2.

Movement uses conservative substeps and collision-boundary refinement. Corner assistance centers on one axis before resuming forward movement. Bombs become solid to the player after fully leaving their tile plus 0.5 units of overlap tolerance. Capacity is 2, range is 2 tiles, fuse is 2.35 seconds, and chain delay is 0.055 seconds. Flames last 0.43 seconds, with the first 0.34 seconds lethal and a visibly faded 0.09-second tail. Basic chain triggering is included now because flames must stop at and trigger bombs consistently; terrain-chain interactions remain Phase 2.

Three lives; 0.78-second death beat; 1.25-second spawn protection. Death neutralizes bombs/flames immediately, then respawns at the lower-left pocket. With no enemies or soft blocks yet, that pocket is safe; ranked corner selection arrives with enemies. Losing the last life automatically resets the run. This checkpoint uses simple procedural death fragments; hit stop and the complete visual/audio effects arrive during polish. M and audio are deferred. C detonates the oldest remote bomb after the pickup. The hint stays for at least four seconds and fades after movement plus bomb placement, or ten seconds; H restores it.

See PHASES.md for all twelve checkpoints and HANDOFF.md for the complete target specification.

## Validation

Typecheck (`tsc --noEmit`) and production build passed. Vite built 13 modules; JavaScript 41.43 kB (14.48 kB gzip). No browser driving, automated gameplay simulation, or runtime tuning was performed. Runtime behavior and feel await human playtest.

## Human checkpoint

- Move along narrow corridors and take corners. Does steering feel responsive without snapping or dragging?
- Hold two directions, release one, and press into a wall. Verify no diagonal movement, wall penetration, or excessive snagging.
- Resize the window: the complete square arena and both HUD bands should remain visible.
- Alt-tab while holding a direction, return, and press R/H. Check for stuck movement, jumps, duplicate loops, and a clear reset to the lower-left pocket.
- Send a screenshot and note movement or readability issues before Phase 1, Part 2.

## Part 2 human checkpoint

- Press X, retreat around a corner, and watch the fuse ring and flame. Verify hard blocks stop every arm.
- Hold X: only one bomb should be placed. Press again on another tile: capacity should stop at two and return when bombs detonate.
- Leave a bomb tile fully, then try to return. It should block entry; walking into it now attempts a kick if the lane is clear.
- Stand in an explosion after protection expires. Verify one life is lost, danger clears, and respawn protection is visible. Lose all lives to verify automatic fresh-run restart.
- Place adjacent bombs at different times to observe the short chain delay. Alt-tab during a fuse: returning should not skip time.

Runtime checks above are for the human; no browser driving or gameplay simulation was performed.

## Part 3 human checkpoint (Phase 2, Part 1)

Crates stop a flame arm, break in one hit, and lose collision immediately. Cleared terrain survives a lost life; R or losing all lives restores it. Bombs kick passively at 360 units/s and stop at the last legal tile center. Moving bombs reserve their current and next tiles for conservative collision; they never push the player. Mid-lane detonation originates at the last reached center. Reserved destinations use earliest center arrival, then bomb id, for conflict ordering. Crate debris is capped at 32 groups and expires within 0.32 seconds. This is the foundation terrain mask; enemy placement and pocket tuning arrive in Phase 3.

- Break a crate: verify flames stop at it, and a later bomb can use the opened route.
- Kick down a corridor, into a crate or wall, and toward another bomb. Check stopping positions and no overlaps.
- Chain-trigger moving and stationary bombs. Check flame origins stay on the grid and walls continue to block blasts.
- Die after clearing terrain, then restart: verify life loss preserves openings and R restores the map.

Source review, typecheck and production build are the implementation checks; runtime movement/kick feel awaits human playtest.

## Phase 2, Part 2 feedback checklist

Corner assistance widened from 9.6 to 18 units and centering speed increased from 96 to 180 units/s following player feedback. Kick contact now accepts the bomb face rather than requiring near-center alignment. Collision still validates every correction; movement remains cardinal. These changes require human feel verification.

Eight authored pickups: two Bomb Up (cap 4), two Fire Up (cap 5), two Speed Up (+12, cap 201), one Heart (cap 3; remains at full health), one Remote. Hidden pickups wait for all covering flames to expire, while later lethal flames destroy exposed pickups. Abilities survive death and reset on a fresh run. Bomb range is captured at placement. Remote bombs have an antenna and steady armed ring; C triggers the oldest remote bomb, one per press. Existing timed bombs retain their fuse; remote bombs still chain and count toward capacity. No audio cues yet.

- Retest wall corners and off-center kick contact at base and upgraded speed.
- Clear crates along the bottom corridor to find capacity and Remote early. Check C does nothing before Remote, then detonates one oldest remote bomb per press.
- Verify remote bombs never auto-explode, but still chain-trigger; an older timed bomb should still expire normally.
- Collect powers, die, and confirm upgrades persist; R should restore the original loadout and hidden pickups.
- Check that a revealed pickup survives its revealing blast but is destroyed by a subsequent blast. A Heart at full health should remain available.

Typecheck and production build passed. No browser driving or automated gameplay simulation was performed; feel awaits human review.

## Corner feedback fix — 0.2.2

Blocked movement now searches the current and adjacent lane centers within 30 units instead of only the current tile center. It verifies the complete lateral correction and forward corridor with swept collision before nudging. Assistance only occurs when forward movement is blocked, avoiding unnecessary centering in open space. The 180 units/s nudge stops as soon as forward travel becomes legal. This addresses the screenshot position near a pillar edge; please recheck holding Up there, and analogous corners in all four directions. No browser/gameplay test was performed.

The two-unit timer stroke now follows radius `15 * pulse - 1`, placing its outside edge exactly on the pulsing bomb circumference. Typecheck and production build passed.

## Phase 3 — both parts

Six one-hit minions move at 92, 95.2, 98.4, 101.6, 104.8 and 108 units/s. During seconds 0–4 they use 45% speed; seconds 4–8 use 75%; then full speed. Tile-center turn selection uses seeded Manhattan-biased choices, avoids reversal unless blocked or the player is behind, and prefers safe turns around active flames, bombs below 0.8 seconds and visible remote threats. It does not predict chains. Contact is lethal outside protection; flames kill minions regardless of ownership. Defeats persist across player deaths. Respawn selects the available corner farthest from living minions. Bomb kicks stop before an occupied minion tile.

Authored Stage 1 geometry now reserves sealed A/B rival pockets and safe minion cells. The A/B floor markings show activation at 4/10 seconds (or early approach). These are staging markers, not combatants; rival characters, health and bomber AI arrive in Phase 4. The HUD therefore counts only the six implemented minions. Eliminating them does not prematurely clear the full stage or transition to the unimplemented boss. One Bomb Up moved from (3,5) to (6,5) to retain its hidden crate after reserving a minion spawn.

Human review: check opening pressure, corner turning, minions blocked by crates/bombs, remote-threat avoidance, contact deaths, flame kills, persistent enemy count after death, and fresh-run reset. Report stuck or oscillating enemies and any unfair spawn pressure. Typecheck/build passed; runtime behavior and difficulty await human playtest. No browser or automated gameplay tests were run.

## Phase 4 — both parts complete

The amber rival activates at 4 seconds (160 units/s), the violet rival at 10 seconds (174 units/s); close approach activates either early. Each has 4 HP, 2 owned bomb slots, range 3, a 2.35-second fuse, 0.68-second damage protection, 0.18-second hit-stun and a 0.45-second placement lock after damage. Bomb ownership now controls separate capacity counts; all blasts can damage either rival, including their own bombs. Remote control affects player bombs only. HP pips remain visible when empty. Rival contact blocks movement but does not damage the player.

Planner: lethal interval lists include existing flames, multiple future explosions and iterative chain triggers. A bounded search uses 0.05-second time bins, conservative whole-edge occupancy, wait actions and a 3-second horizon. Placement requires refuge through fuse + flame lethality + 0.15-second margin. Escape plans persist and are checked again against changed hazards at tactical decisions. Decisions occur no faster than 0.14 seconds. Moving bomb lanes are deliberately modeled as conservative possible blast origins, which may make rivals decline otherwise viable kicks; this is a documented approximation, not exact future knowledge. Remote footprints are uncertain danger; a last-resort route may cross them to reach refuge when no fully safe route exists. Intentional kicks also require escape validation.

Amber favors blocking-crate removal; violet favors approaching from a different row/column. Seeded one-in-eight second-choice pressure selection adds variation. Recent-tile penalties, goal preference and blocked-route recovery reduce oscillation. Rivals use the shared circular swept collision and cardinal movement; their routes target lane centers, so they do not require player-style perpendicular input correction. Their body blocking conservatively occupies their anchor tile.

Starting pockets now include an L-shaped escape nook so a rival can actually bomb out without trapping itself. One minion moved from (11,3) to (9,5) to preserve the right pocket seal. All hidden pickups remain under crates.

Stage 1 requires all eight defeats. Damage is resolved before clear detection; simultaneous player death still costs a life. Remaining bombs are neutralized, flames finish visually, movement remains available for 0.25 seconds, then the arena holds after a 1.1-second clear beat. **Checkpoint boundary:** there is no boss yet; the HUD says ARENA CLEAR / R TO REPLAY instead of pretending Stage 2 is implemented. Phase 5 will replace that hold with the automatic boss transition. R resets all enemies, ownership, planner state, seed, lives and powers.

Review requested: watch both rivals bomb out, escape their bombs, interact with player bombs, take separate hits and die. Check no wall/bomb phasing, stuck movement after hits, overcautious remote avoidance, or repeated same-corner indecision. Try defeating the final enemy while dying, and confirm the arena remains safe after clear. Audio and complete impact polish remain Phase 6. Typecheck/build passed; no browser driving, gameplay simulations or tuning sweeps were performed. Intelligence, runtime cost and fairness await human playtest.

## Rival priorities and respawn correction — 0.4.1

Latest user feedback supersedes the original player-only pickup rule. Rivals now collect visible useful pickups: capacity cap 4, range cap 5, speed +12 up to 201, Heart heals one HP up to 4, and Remote enables manually triggered bombs. They cannot see hidden pickups. Player gets priority on a simultaneous eligible collection; rival ties use stable id. Acquired stats persist through player death and reset on a new run. The HUD names stolen pickups.

Safe pursuit is the principal routing preference (distance weight 2); a useful reachable pickup gets a 6-point bonus, so a nearby detour can win without drawing the rival across the whole arena. Crate bombs must advance toward the player or a visible desired pickup; indiscriminate minion targeting is removed. Escape checks remain mandatory. Rival remote bombs use the same oldest-first rule and retain chain triggering; the rival triggers after escaping when the blast threatens the player or useful crate, checking chain danger to itself. Existing timed bombs are unchanged.

The lower-right pocket clears (13,11), (13,10), (13,9), (12,9), creating shelter around the (12,10) hard pillar. Respawn candidates must have a reachable tile outside a hypothetical player's blast before its fuse, in addition to being ranked by enemy distance. Cleared geometry is permanent for the current run. Press R to load the revised authored map.

Recheck: lower-right bomb escape, rivals pursuing instead of farming crates, pickup theft and rival power growth. Typecheck/build passed; these priorities are first-pass tuning awaiting human feedback.

## Phase 5 — both parts complete

Fatal flames now remain visible and age normally during the 0.78-second death beat. Only bombs are neutralized immediately; the suspended gameplay branch prevents further damage while the actual lethal explosion finishes its normal 0.43-second visual envelope. This fixes the previously missing fatal explosion without creating a new damaging blast on respawn.

Arena clear transitions automatically after 1.1 seconds, carrying lives and abilities into Stage 2. The new arena has eight hard pillars and twelve crates; it conditionally hides Bomb Up at (5,10) and Fire Up at (9,10) if below their caps. The boss starts at (360,168), player at (72,552). Boss death shows SLICE CLEAR for 1.8 seconds, then resets the full run. Same-tick defeats are resolved before lifecycle cleanup: a fatal player hit still consumes a life, and zero lives restart instead of advancing. R always restarts Stage 1.

Boiler King: 12 HP, 30-unit circular body, 0.36-second hit protection and per-explosion damage identity. Movement speeds are 112/126/142 units/s at HP 12–9 / 8–5 / 4–1. Phase changes accent the gauge and preserve active warnings. All flame ownership can damage the boss. Boss contact is lethal outside player protection. Full-body clearance is checked along cardinal movement, with recovery returning to the last traversed center if an attack stops between centers.

- Forge Drop: fixed marked targets near projected player position; 0.55-second warning, 0.28-second visible flight, 1.75-second fuse, range 3 then 4; 0.35-second recovery. Invalid occupied landing cells cancel rather than silently retarget.
- Boiler Kick: valid stationary bomb in a clear cardinal lane; 0.38-second direction warning, rush up to one tile at 240 units/s, kick on body contact at 430 units/s, 0.30-second recovery. Bombs retain ownership, range and remaining fuse. A vanished target cancels safely.
- Pressure Charge: introduced at 8 HP; fixed 0.62-second warning; up to four tiles at 288 units/s; crushes soft blocks but stops for hard geometry/bombs; first/last traversed legal center drops use 1.35-second fuse and range 3; 0.50-second recovery.

Attack cadence after recovery is 1.35–1.65 / 1.15–1.45 / 0.95–1.25 seconds, with selection deferred to a movement anchor. Weights are 60/40/0, 45/30/25 and 35/30/35 for forge/kick/charge. No attack repeats more than twice if another is eligible. Selection is seeded. Rendering displays twelve HP segments, attack labels, forge brackets, directional chevrons, thrown bomb arcs, hurt feedback and defeat fragments. Boss bomb timer rings use their actual initial fuse.

Phase 6 still owns synthesized audio and the final effect/presentation pass. No gameplay tests were run; typecheck and production build passed. Human rechecks: fatal explosion visibility; automatic arena-to-boss transition; all three warnings and their committed targets; kick interactions; charge wall/crate behavior; openings during recovery; phase pacing; boss HP persistence after death; same-tick deaths if encountered; victory reset. The fight is implemented, not yet human-calibrated.
