# Bomberman · Boiler King

A two-stage, single-player browser game: clear six monsters and two rival bombers, then defeat the Boiler King. Grid combat, destructible crates, kicked bombs, chain reactions, stolen power-ups, and three boss attacks use procedural Canvas 2D art and synthesized Web Audio. Boots directly into play. No scores, menus, imported assets, or reduced-motion support.

[Play the published build](https://stevencasteel.github.io/bomberman/)

## Run

```sh
npm install
npm run dev -- --port 5174
```

Open the URL printed by Vite. `npm run typecheck` checks TypeScript; `npm run build` checks types and builds `dist`; `npm run preview` serves the production build.

| Key | Action |
| --- | --- |
| Arrows | Move; walk into a stationary bomb to kick |
| X | Place one bomb per press |
| C | After Remote pickup, detonate oldest owned remote bomb |
| R | Restart the complete run |
| M | Toggle all sound |
| H | Replay the animated control hint |

Audio unlocks on a key or canvas pointer gesture. Browser audio failure leaves gameplay available and a later gesture retries. Changing tabs clears held inputs and suspends simulation and sound; returning does not advance hidden-time fuses. Muting persists across run restarts.

## Current build

Version **0.6.0**, tuning **8**, gameplay seed **1994**. All six phases/twelve checkpoints are implemented. Gameplay choices use a seeded RNG separate from cosmetic particles and audio. Historical checkpoint notes are retained in CHECKPOINT-HISTORY.md; this README describes the current build.

| System | Selected constants |
| --- | --- |
| Board | 15 × 13 tiles, 48 units; 720 × 624 arena inside 720 × 720 composition |
| Loop | 60 Hz fixed step; five catch-up ticks; DPR capped at 2 |
| Player | Radius 13; speed 165, +12 upgrades, cap 201 |
| Corner assistance | Blocked-input lane search within 30 units; 180 units/s lateral correction; no diagonal speed gain |
| Bombs | Initial capacity 2, cap 4; initial range 2, cap 5; 2.35-second fuse |
| Flame | 0.055-second chain delay; 0.34 seconds lethal + 0.09-second visual tail |
| Kick | 360 units/s; boss kicks 430; moving bombs reserve current/next cells |
| Lives | 3; 0.78-second respawn beat; 1.25-second protection |
| Minions | 6; 92–108 units/s; 45% speed initially, 75% at 4 seconds, full at 8 |
| Rivals | 3 HP; initial capacity 2/range 3; speed 160/174; activation 4/10 seconds or early approach |
| Rival hit | 0.68-second immunity; 0.18-second stun; 0.45-second placement lock |
| Rival planning | 0.14-second reaction floor, 3-second horizon, 0.05-second time bins, 0.15-second escape margin |
| Boss | 12 HP, radius 30, 0.36-second immunity; speeds 112/126/142 at HP 12–9/8–5/4–1 |
| Forge | 0.55-second warning, 0.28-second arc, 1.75-second fuse, 0.35-second recovery; range 3 then 4 |
| Boiler Kick | 0.38-second warning, 240-unit/s rush, 0.30-second recovery |
| Charge | 0.62-second warning, 288 units/s up to four tiles, 1.35-second dropped-bomb fuse, 0.50-second recovery |
| Boss cadence | 1.35–1.65 / 1.15–1.45 / 0.95–1.25 seconds after recovery, selected at a movement anchor |
| Boss attack weights | Forge/kick/charge: 60/40/0, 45/30/25, 35/30/35; at most two repeats when another attack is eligible |
| Transitions | Arena clear 1.1 seconds; slice clear 1.8 seconds then fresh run |
| Hit stop | Player death 0.05 seconds; boss defeat 0.07 seconds; all gameplay timers freeze together |

Eight authored Stage 1 pickups: two Bomb Up, two Fire Up, two Speed Up, Heart and Remote. Pickups emerge after covering flames finish; later lethal flames destroy them. Remote affects newly placed bombs only; they have no automatic fuse but remain chain-triggerable. Powers and defeated enemies persist through a lost life. Hearts remain uncollected when they cannot heal.

Rivals prioritize safety, pursuit, useful visible pickups, and crates that advance those goals. They cannot see hidden pickups. Their capacity/range/speed caps match the player, Heart heals one HP up to three, and Remote grants oldest-first manual detonation. Player has priority on a simultaneous eligible pickup; enemy ties use stable ids. Upgrades do not retroactively change already placed bombs.

## Presentation and bounds

Native oscillators and filtered reusable noise provide footsteps, placement, kick, fuse accents, chain ticks, blasts, block breaks, reveal/collection variants, enemy hits/deaths, player death, boss warnings/phases and clear cues. Master gain ramps, compression and a 20-voice cap limit density; high-priority warnings/deaths can replace lower-priority voices. Fuse accents are rate-limited, not allocated per frame. No music is included.

Typed simulation events drive audio and effects once. Effects include placement pulses, arm/foot accents, flame-core growth, pickup rise and collection rings, enemy fragments, boss vent/defeat particles, and bounded world shake. Fatal flames remain visible during death. HUD stays unshaken; effects are clipped to the arena. Audio/particles cannot modify gameplay state. Restart resets effects; hot reload cleans listeners, animation frames and AudioContext.

Limits: 500 particles, 32 effect rings, 24 shake impulses, 32 debris groups, 128 pending feedback events, 20 audio voices, and 24 combined live bombs/explosion events. At maximum range this bounds stored flame cells at 504. The original suggested 160-cell budget was raised so upgraded rival/player chains never lose damaging cells; new placements are rejected when the shared event budget is full. Cosmetic randomness is separate from gameplay RNG.

## Validation and known approximations

Strict TypeScript checking and production build passed for this checkpoint. No browser driving, automated gameplay simulations, runtime profiling or tuning sweeps were performed, following the handoff. **Feel, sound balance, AI fairness and sustained performance await human playtest.**

- Moving-bomb prediction conservatively includes possible lane origins; rivals may reject otherwise viable kicks or escapes.
- Rival body blocking reserves the anchor tile, which is stricter than the drawn body. Routes use the shared circle sweep but tile-center targets rather than player input correction.
- The boss uses one state machine with a separate attack field rather than a separate state name for every telegraph/recovery. Warnings and hurt feedback remain separate from attack completion.
- Boss recovery may return to the last safe movement anchor before its next attack. Body clearance can delay the next attack beyond its nominal cadence.
- Simultaneous blasts resolve in stable bomb-id/insertion order. A block destroyed earlier in the tick can expose a path to a later blast.
- Collection feedback uses an expanding colored ring/particles rather than retaining and shrinking the specific pickup icon. Audio is procedural effects only.
- There is no save system or boss-selection shortcut. R always returns to Stage 1.

See PLAYTEST.md for the final human checklist, PHASES.md for implementation checkpoints, and HANDOFF.md for the specification and user overrides.
