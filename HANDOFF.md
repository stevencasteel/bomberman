## Latest user revision — September 24, 2026

Both rival bombers start with 3 HP. Heart restores one HP up to 3, and the HUD shows three HP pips. This supersedes the older 4 HP values below.

## Prior user revision — September 11, 2026

This revision overrides conflicting original rules below: rival bombers prioritize safe pursuit of the player, collect useful visible power-ups for themselves, and destroy crates to advance those goals. They cannot know hidden pickup locations. Bomb/Fire/Speed caps match the player; Heart restores rival HP up to 4; Remote grants oldest-first manual detonation with escape and chain-safety checks. All corner spawn pockets must provide a bomb escape around a hard-block corner, including the lower-right pocket. Respawn selection must check escape geometry as well as enemy distance. No reduced-motion support or scoring.

Bomberman game slice — next-session implementation handoff

Build a compact, immediately playable single-player browser Bomberman clone inspired by the strongest qualities of Saturn Bomberman, Bomberman '94, and Super Bomberman 5. This is not a full game. It is one polished enemy stage followed immediately by one boss stage. The slice should emphasize crisp grid movement, readable bombs and chain reactions, destructible terrain, satisfying power growth, aggressive Bomberman-like rivals, a memorable boss, strong procedural animation/audio, and fast restartability.

The game is a true 2D simulation with faux-depth 2.5D presentation. Use procedural Canvas 2D drawing rather than spritesheets, external art, WebGL, or 3D collision. The board logic remains flat, exact, and tile-based even when blocks, characters, bombs, shadows, explosions, and the boss are drawn with dimensional styling.

## User requirements and current state

- The user wants a Bomberman clone game slice taking inspiration from Saturn Bomberman, Bomberman '94, and Super Bomberman 5.
- Single-player only. Do not implement multiplayer, networking, player-two controls, character select, versus rules, bots intended to simulate multiplayer, or multiplayer menu code.
- Exactly two playable encounters for the first build: one enemy stage, then one boss stage.
- The enemy stage must contain ordinary minions plus two strong Bomberman-like mini-boss rivals. The rivals actively hunt the player, use the same core bomb verbs as the player, and have multiple HP.
- No menus. Boot directly into the enemy stage. No title screen, start button, settings screen, level select, pause menu, game-over menu, or victory menu.
- Use procedural art and synthesized audio. Do not depend on downloaded sprites, fonts, music, sound files, textures, 3D models, or external asset packs.
- The current work is a handoff/design specification, not an implementation. Runtime feel and difficulty are awaiting human playtest.
- Assume the next AI session is opened with the user's new desktop Bomberman folder as the workspace root. Build directly in that workspace rather than creating an unnecessary second project directory.
- This document is self-contained. The implementation should not require the Star Castle project or any external source export.

## Execution contract: AI builds, human playtests

Implement the complete two-stage slice described here, including gameplay, enemy AI, boss behavior, HUD, procedural presentation, synthesized audio, transitions, restart behavior, and action feedback. No menus. Follow the explicit first-build decisions below; resolve unspecified details autonomously with conservative choices and record meaningful deviations in README.md.

The implementation AI performs source review, TypeScript typechecking, and the production build, fixing errors from those steps. It must not play the game, drive a browser, run automated gameplay simulations, create a test harness, recruit players, profile runtime performance, or conduct tuning sweeps during the initial implementation session. Do not build debug overlays, AI visualization modes, map editors, replay systems, collision viewers, or practice fixtures. Collision queries and runtime safety logic that are part of the game are required; running a test campaign is not.

Deliver the fully implemented slice, launch instructions, actual selected constants, any necessary deviations, build/typecheck results, and the human playtest checklist at the end of this handoff. Describe runtime behavior and feel as awaiting human playtest rather than claiming calibration from code inspection.

## Intended experience and mastery

The repeatable Bomberman rhythm is:

create space -> place a bomb with an escape plan -> reshape the maze -> read chain reactions -> pressure an enemy -> exploit the opening -> reposition before the next fuse matures.

The first stage should move from familiar block-clearing into a dangerous bomber duel. The boss stage should preserve the same bomb grammar while changing the spatial problem enough to feel like a finale rather than a larger normal enemy.

Observable skill targets:

- Beginner: move through corridors, place a bomb without trapping themselves, survive a simple explosion, and understand that soft blocks can hide power-ups.
- Improving player: use bomb range intentionally, anticipate chain reactions, route around placed bombs, and use kick movement without losing control of the board.
- Skilled player: create escape pockets before attacking, bait the rival bombers into bad placements, use moving bombs to control lanes, and damage a rival without trading a life.
- Expert: manipulate several fuse timings at once, trap a rival between danger zones, convert stage geometry into safe pressure, and exploit the boss's attack commitments while preserving a safe route.

The critical acceptance maneuver is: enter a corridor, place a bomb, retreat around a corner, use the resulting opening to kick or redirect a later bomb down a lane, then cross the newly cleared space without being caught by the chain. Movement, blast geometry, and fuse readability must make that sequence feel predictable rather than lucky.

## Design reference targets

Use the named Bomberman games as inspiration, not as an instruction to reproduce copyrighted sprites, maps, characters, music, or exact boss designs.

- Saturn Bomberman: target lively character animation, big readable reactions, abundant game-feel feedback, and a sense that the arena is playful even while dangerous.
- Bomberman '94: target clean maze readability, simple rules that create tactical depth, strong destructive-block pacing, and an immediately legible overhead battlefield.
- Super Bomberman 5: target brisk movement, quick bomb-chain satisfaction, expressive impacts, and a slightly more aggressive action-game feel.

The implementation should feel recognizably Bomberman without tracing any source art or copying exact stage layouts. All procedural character designs, block motifs, rival costumes, and the boss should be original.

## Game to build

### Launch and overall flow

Draw and run Stage 1 immediately on page load. Spawn the player in the lower-left start pocket with brief protection. Show a nonblocking controls strip in the reserved bottom HUD band. Audio unlocks on the first gameplay key or pointer gesture without delaying play.

Flow is fixed:

1. Stage 1 — enemy arena: destroy the ordinary minions and both multi-HP rival bombers.
2. Short automatic clear burst and transition, approximately 1.1 seconds.
3. Stage 2 — boss arena: defeat the boss.
4. Show a compact `SLICE CLEAR` celebration in the existing HUD for approximately 1.8 seconds, then automatically start a fresh run at Stage 1.

There is never a confirmation screen. R restarts the entire slice immediately from Stage 1.

### Controls

Use desktop keyboard as the first target.

- Arrow keys: move in four cardinal directions.
- X: place bomb on an accepted press.
- Bomb kick is passive: when kick is available, walking into a stationary bomb pushes it along the attempted movement direction if the next lane is legal.
- C: detonate the oldest active player-owned remote bomb after collecting Remote Control. Before that pickup, C does nothing.
- V is unassigned. Do not invent an extra mechanic for it.
- R: restart the full slice immediately.
- M: toggle sound.
- H: replay the controls hint without pausing play.
- Space is not a gameplay binding.

Centralize bindings in a small action map used by input handling and displayed key labels. Gameplay consumes actions rather than browser key events. Ignore keyboard repeat for X/C/R/M/H presses. Clear held keys on blur and suspend simulation while unfocused or hidden. Reset timing baselines on return so there is no fuse or movement time jump. Prevent browser scrolling for gameplay keys.

### Animated controls hint

Reserve a 48-unit bottom HUD band outside the playfield. Show:

Left/Right/Up/Down = Move     X = Bomb

Use small keycaps and a tiny procedural bomber figure demonstrating a short walk and bomb placement. The demo is cosmetic only, silent, and never places a real bomb. Actual key presses temporarily highlight matching keycaps.

Keep the strip visible for at least four seconds. Fade it after the player has moved and placed one bomb, otherwise fade by ten seconds. H replays it.

During the first eight seconds of a fresh run, Stage 1 enemy pressure must be gentle enough for the player to read the hint and place at least one bomb, but the stage does not wait indefinitely for input.

Show the short objective caption `Clear the arena` during the initial hint. On the boss transition, replace it briefly with `Bomb the boss`.

## Core Bomberman simulation

### Board geometry

Use a 15 x 13 tile arena with 48 logical units per tile, for a 720 x 624 playfield.

Use a 720 x 720 logical composition:

- top HUD: y = 0..48
- playfield: y = 48..672
- bottom hint/footer band: y = 672..720

Keep physics coordinates in 720 x 624 playfield space and translate world rendering by (0, 48). HUD and hint rendering never shake. Uniformly scale and letterbox the full 720 x 720 composition. Cap device pixel ratio at 2.

Hard blocks occupy the outer border and an interior checker-pillar structure similar to the classic Bomberman grammar: fixed solid pillars at every second interior coordinate, while corridors remain one tile wide. Stage 1 adds an authored soft-block mask on top of that structure. Stage 2 uses a different, more open hard-block arrangement.

Every gameplay tile has an explicit type/state. Do not infer walkability from pixels.

### Player movement

Movement is continuous within the tile grid, not discrete tile hopping. The player uses a circular collision body while respecting hard/soft blocks and solid bombs.

Start speed: 165 units/s.
Speed-up pickups increase speed by 12 units/s to a cap of 201 units/s.
Collision radius: 13 units around a visible approximately 30 x 34 character silhouette.

Provide forgiving corridor steering without breaking tile truth. When the player presses into a perpendicular corridor while within 0.20 tile of that corridor's centerline, gently center the character toward the legal lane over roughly 0.08-0.12 seconds. This is cornering assistance, not auto-navigation. It must never pull the player through a bomb or wall.

Diagonal movement is not allowed. If two directional inputs are held, prefer the most recently pressed legal direction; if it is blocked, allow the other held direction. This supports smooth cornering without diagonal speed gain.

### Bomb placement

X places one bomb in the player's current tile if:

- the tile does not already contain a bomb,
- the player owns fewer active bombs than their current bomb capacity,
- the player is in the playing state.

Placement snaps to the tile center and is immediate on the accepted press.

Initial player loadout:

- bomb capacity: 2
- blast length: 2 tiles
- movement speed: 165 units/s
- kick: enabled from the start

This is intentionally stronger than the most basic historical starting loadout so the slice demonstrates richer Bomberman play immediately.

A newly placed bomb does not block the placing player while their collision body still overlaps that bomb's tile. Once they fully clear the tile plus a small tolerance, that bomb becomes solid to them like any other bomb. Do not allow repeated re-entry through a solid bomb.

Bomb ownership determines capacity bookkeeping, not blast collision. Explosions are dangerous regardless of who caused them unless a target is specifically invulnerable.

### Bomb fuse and explosion

First-build bomb fuse: 2.35 seconds.
Bomb visible body radius: 15 units.

When a bomb detonates, create a center flame plus cardinal arms. Flames propagate one tile at a time in each direction up to the bomb's blast length.

Propagation rules:

- hard block: stop before the hard block; no flame occupies its tile.
- soft block: flame enters that tile, destroys the soft block, then stops in that direction.
- bomb: flame enters the bomb tile, triggers that bomb, then stops in that direction.
- empty floor / pickup: flame enters and may continue.

Triggered bombs detonate after a short 0.055-second visual chain delay rather than waiting for their remaining fuse. This delay exists only to make chain reactions legible; it must not create a safe gap where the triggered bomb ceases to be dangerous.

Flame lifetime: 0.43 seconds total.
Lethal flame window: the first 0.34 seconds.
Visual tail: final 0.09 seconds, visibly fading and nonlethal.

Build blast occupancy from exact tile cells. Do not use long rectangles whose collision can leak through blockers.

An actor may take at most one damage instance from a single explosion event, even if its collision body overlaps the center and an arm at once.

### Soft blocks and pickups

Soft blocks are one-hit destructible. Remove collision immediately when destroyed but retain debris/flash visually for a short bounded effect.

Use an authored deterministic pickup distribution hidden beneath selected Stage 1 soft blocks. Pickups appear only after the destroying flame has finished so they are not instantly consumed by the same explosion.

Stage 1 contains exactly:

- 2 Bomb Up pickups: +1 bomb capacity, cap 4.
- 2 Fire Up pickups: +1 blast length, cap 5.
- 2 Speed Up pickups: +12 units/s, cap 201.
- 1 Heart pickup: restores one lost life, capped at 3.
- 1 Remote Control pickup: enables manual detonation of newly placed player bombs using C.

### Remote Control rules

Remote Control persists through deaths and into Stage 2, and resets on a fresh run. Bombs already placed when collected keep their normal fuse. Subsequent player bombs are remote bombs with no automatic fuse; C detonates the oldest active remote bomb by placement id, one per accepted press. They still count toward bomb capacity, can be kicked, and can be chain-triggered with the same 0.055-second chain delay. C with no eligible bomb does nothing. Rivals and the boss never gain this ability. Remote bombs have a distinct antenna silhouette and steady armed light instead of a false countdown. Show `C = Detonate` and a remote icon in the hint/HUD after collection; H includes it thereafter.

Rivals know which visible bombs are remote, but cannot predict C input. Model their current blast footprint as possible danger at any time until removed; avoid it when a safe route exists. Do not treat that footprint as an actual wall or assume a particular detonation time. When no fully safe route exists, select the shortest exposure route to refuge instead of freezing, and never place another bomb without a verified escape. Minions treat nearby remote-bomb blast lanes as danger using the same local-turn rules; neither enemy type anticipates unissued input. Manual detonation enters the normal explosion-event pipeline.

Kick is already available, so do not include a kick pickup in this slice.

Pickups use distinct silhouettes as well as color. A later flame destroys an exposed pickup. Enemies do not collect pickups.

### Kicking bombs

Because kick is part of the starting loadout, walking into a stationary bomb attempts to kick it in the movement direction.

A kicked bomb travels tile-center to tile-center at 360 units/s along one cardinal axis. It continues until the next tile would be blocked by a hard block, soft block, solid bomb, arena border, boss body when solid, or another rule that explicitly blocks it. Stop the bomb centered in the last legal tile.

The moving bomb remains dangerous and keeps its existing fuse. A kicked bomb can be chain-triggered while moving. If it detonates between tile centers, snap the explosion origin to the nearest tile center it has actually reached rather than creating off-grid flames. Prefer deterministic tile-step movement so this situation is rare and reproducible.

A character touching the side of a moving kicked bomb does not get pushed through walls. Treat moving bombs as solid hazards for routing, but bomb contact itself is not lethal.

## Stage 1 — enemy arena

### Layout and pacing

Use the 15 x 13 classic pillar grid with a deterministic authored soft-block layout. The player's lower-left start pocket must have its current tile plus the immediate up and right tiles clear so the first bomb cannot create an unavoidable trap.

Place two visually distinct sealed rival pockets near the upper-left and upper-right regions. Each pocket starts with enough soft-block separation that the rival must bomb out or wait for corridors to open before directly reaching the player. This creates a readable escalation rather than spawning two expert bombers beside the player.

Place six ordinary minions in the upper and middle regions, initially separated from the start pocket by soft blocks and hard pillars.

Fresh-run pressure schedule:

- 0-4 s: minions move slowly; rivals remain in their pockets and do not place bombs.
- 4 s: Rival A becomes active.
- 10 s: Rival B becomes active.
- If the player reaches a rival's pocket earlier, that rival may activate immediately.

Do not freeze dormant rivals; they may use idle animations and visually track the player.

Stage clears only when all six minions and both rivals are defeated.

### Ordinary minions

Use one procedural minion family for scope control, with six instances and slight cosmetic variation.

Minion behavior:

- one hit from any lethal flame destroys it.
- movement speed: 92-108 units/s, assigned deterministically.
- moves in corridors and cannot pass through hard blocks, soft blocks, or bombs.
- at intersections, choose a legal direction with a mild bias toward reducing Manhattan distance to the player's tile.
- do not reverse direction unless blocked or the player is immediately behind them.
- re-evaluate at tile centers, not every frame.
- treat known imminent flames and bombs with fuses below 0.8 seconds as danger and prefer a safe legal turn when one exists.
- do not possess perfect future knowledge of chain reactions.

Minions should pressure routing but remain clearly less intelligent than the rival bombers. Their silhouette must be obviously non-Bomberman so the player reads them as disposable monsters rather than equal duelists.


### Rival bombers — shared player verbs

The two mini-boss rivals are bomber characters using the same foundational action rules as the player:

- four-direction corridor movement with the same collision/cornering model,
- bomb placement on tile centers,
- two simultaneous bombs,
- blast length 3,
- bomb fuse 2.35 seconds,
- passive bomb kicking,
- vulnerability to bomb explosions,
- inability to walk through hard blocks, soft blocks, or solid bombs.

They do not receive special teleporting, ghosting, projectile attacks, off-grid movement, hidden mines, or immunity to their own bad bomb placements.

Rival A movement speed: 160 units/s.
Rival B movement speed: 174 units/s.

Each rival has 4 HP.

On taking blast damage:

- lose exactly 1 HP,
- gain 0.68 seconds of damage invulnerability,
- enter a 0.18-second hit-stun in which movement stops but fuse timers continue,
- flash and emit readable helmet/armor fragments that are purely cosmetic,
- show four small HP pips above the rival, with empty pips remaining visible.

The same explosion event cannot damage a rival twice. Separate chain explosions may damage again only after invulnerability ends.


### Rival bomber AI contract

The rivals should feel like dangerous Bomberman opponents, not omniscient pathfinding machines.

Maintain a small tile danger map with expected lethal times from currently placed bombs, including obvious chain triggers. Recompute when bombs are added, moved, triggered, destroyed, or when the rival reaches a tile center. A 3.0-second prediction horizon is enough.

Use pathfinding over legal corridor tiles, with bombs treated as temporary obstacles unless already overlapping/escaping them. The AI may inspect authoritative bomb timers because those timers are visually conveyed to the player through fuse animation; it may not react to future random decisions or player input before it occurs.

Reaction floor: rivals may make a new tactical decision no more often than every 0.14 seconds. Preserve the previous plan between decisions unless a planned tile becomes immediately invalid.

Priority order:

1. Escape current or upcoming danger using routes whose traversal times avoid lethal intervals.
2. Avoid becoming trapped by its own proposed bomb.
3. If safe, kick a bomb down a clear lane when that creates pressure on the player or opens a needed block.
4. If safe and useful, place a bomb when the player, a soft block needed for routing, or a minion is within projected blast influence.
5. Move toward a tile that reduces safe-path distance to the player.
6. Reposition toward open space rather than oscillating at one intersection.

A rival may place a bomb only if its planner verifies the complete timed escape route and a refuge that stays safe until the proposed blast ends, with a 0.15-second safety margin. Add a small deterministic aggression imperfection: about one decision in eight may choose the second-best safe pressure tile rather than the absolute best. Do not make the AI intentionally suicidal.

The rivals may damage each other, minions, and themselves with explosions. Their planners try to avoid this but do not receive immunity. This supports emergent Bomberman chaos and rewards the player for manipulating their placements.

Do not let rival AI spam bombs immediately after damage. After losing HP, impose a 0.45-second minimum before that rival may intentionally place another bomb.

### Stage 1 completion

When the last enemy dies:

- stop accepting new enemy decisions,
- clear remaining hostile-owned bombs after their current flame visuals finish, without creating surprise post-clear deaths,
- keep the player visible and controllable during the first 0.25 seconds,
- then freeze gameplay for the compact transition burst,
- transition automatically to the boss arena in about 1.1 seconds.

Preserve the player's current power-ups and remaining lives into the boss stage.

## Stage 2 — boss arena

### Boss concept: The Boiler King

Create an original large mechanical bomber boss called the Boiler King for internal code/readme naming. Do not copy an existing Bomberman boss design.

The boss should read as a squat, round bomb-forging machine with a faceplate, heavy gloves/claws, a pressure gauge, a glowing furnace seam, and short stomping legs. It occupies roughly a 2 x 2 tile footprint visually but uses a circular collision body centered on a tile-aligned movement anchor.

The boss fight must remain about bombs and space control. Do not turn it into a shooter with conventional bullets.

Boss HP: 12.
Boss collision radius: 30 logical units. Arena corridors used by the boss must provide at least 60 units of clearance; validate circle clearance along entire routes, not just anchor tiles. The roughly 2 x 2 tile artwork may overhang the body, with a ground shadow clearly showing its collision footprint.
Boss contact with the player is lethal when the player is unprotected.
Boss takes 1 damage when the damaging tiles of a bomb explosion overlap its vulnerable body and damage invulnerability is not active.
Boss damage invulnerability after a hit: 0.36 seconds.
A single explosion event deals at most 1 damage.

Display a compact 12-segment boss HP bar in the top HUD during Stage 2 only.

### Boss arena layout

Use the same 15 x 13 board dimensions but a more open authored arrangement:

- hard border remains.
- remove the standard checkerboard field.
- use eight hard 1 x 1 pillar blocks in a symmetrical loose ring around the center.
- use twelve soft blocks, mostly near the sides, hiding no new power-up families.
- place one Bomb Up and one Fire Up under authored soft blocks only if the player has not already reached those respective caps.
- player begins in the lower-left safe pocket.
- boss begins near the upper-middle, never directly in the player's initial blast lane.

The boss may move through soft blocks by crushing them during specific movement attacks, but may never pass through hard blocks or the arena border.

### Boss movement

Base move speed: 112 units/s.
Phase 2 move speed: 126 units/s.
Phase 3 move speed: 142 units/s.

The boss moves on cardinal tile lanes and commits to its current lane until reaching the next tile center. It does not make tiny frame-by-frame corrections. Its large body means lane occupation is visually obvious.

The boss should prefer routes that approach the player while leaving at least one route around itself. Avoid cornering the player solely through body collision; the bombs and attacks should create the trap.

### Boss attacks

Use three attacks, all built from Bomberman grammar.

1. Forge Drop
- Telegraph for 0.55 seconds using the furnace/gauge animation.
- Toss two boss bombs onto legal floor tiles near the player's projected position.
- The landing tiles are marked by pulsing circular floor brackets throughout the telegraph.
- Bombs land after a 0.28-second arc and then use a 1.75-second fuse.
- Boss bombs have blast length 3 in Phase 1, 4 in Phases 2-3.
- They can be kicked by the player after landing.
- Lock landing targets at telegraph start; if a marked tile becomes blocked before landing, cancel that bomb rather than retargeting invisibly. Recover for 0.35 seconds after landing.

2. Boiler Kick
- Choose one existing stationary bomb in a clear cardinal lane, preferring a boss bomb and then a player bomb.
- Telegraph the chosen kick direction for 0.38 seconds with a body lean and floor chevrons.
- Rush one tile at 240 units/s and kick that bomb at 430 units/s. Recover for 0.30 seconds afterward.
- Validate the full boss body route before committing. If the selected bomb disappears or the route becomes blocked, cancel the rush and enter recovery; do not retarget during the warning.
- If no valid bomb exists, do not fake the move; choose another attack.
- The player can exploit this by presenting bombs in useful lanes.

3. Pressure Charge
- Telegraph 0.62 seconds with steam vents and a fixed cardinal direction.
- Charge at 288 units/s up to four tiles or until the boss collision body would touch a hard block/border. Check the full swept body, not only its center tile. Stationary bombs stop the charge at the last safe position; never phase through them.
- Crush soft blocks crossed by the boss, generating debris but no explosion.
- Drop one short-fuse boss bomb on the first and last traversed tiles that are legal bomb cells.
- Charge bombs use a 1.35-second fuse and blast length 3.
- After the charge, boss is movement-locked for 0.50 seconds. This is an important counterattack window.

Boss bombs follow the same chain-reaction and flame rules as player/rival bombs. They can trigger player bombs and be triggered by player explosions.

### Boss phases

Phase 1: 12-9 HP

- attack cadence: 1.35-1.65 seconds between completed attack recoveries.
- Forge Drop weight 60%, Boiler Kick 40% when valid.
- no Pressure Charge.

Phase 2: 8-5 HP

- boss movement speed rises to 126.
- attack cadence: 1.15-1.45 seconds.
- Forge Drop 45%, Boiler Kick 30%, Pressure Charge 25%.
- Forge Drop bombs have blast length 4.

Phase 3: 4-1 HP

- boss movement speed rises to 142.
- attack cadence: 0.95-1.25 seconds.
- Forge Drop 35%, Boiler Kick 30%, Pressure Charge 35%.
- pressure gauge glows hotter and idle steam becomes more urgent.
- preserve all named telegraph durations; difficulty comes from cadence and spatial combinations, not removing warnings.

Attack selection is seeded and must not choose the same attack more than twice consecutively when another valid attack exists. The cadence timer starts when recovery completes and determines time until the next telegraph begins. Taking damage does not cancel or reset a committed attack: `hurt` is a visual overlay with its own timer, not a replacement attack state. Phase changes update the next attack selection without shortening an active telegraph.

### Boss defeat

At 0 HP:

- immediately disable boss collision and attacks,
- neutralize outstanding boss bombs without creating new blast danger,
- allow already active player-owned flames to finish visually,
- break the boss into procedural plates, bolts, steam rings, and a compact expanding shockwave,
- show `SLICE CLEAR` in the existing top HUD for approximately 1.8 seconds,
- keep the player's final visible position during the celebration,
- then automatically start a fresh full run at Stage 1 with lives 3, and initial loadout.

No end screen, credits screen, or replay button.

## Damage, lives, and continuity

Start each fresh run with 3 lives.

Lethal hazards:

- any active flame tile,
- contact with an ordinary minion,
- unprotected contact with the Boiler King.

Contact with rival bombers is not lethal by itself; they threaten through bombs and body blocking. Bomb bodies are solid but nonlethal.

On player death:

- consume one life immediately,
- stop player movement/input effects,
- clear all currently active flame lethality and all bombs after a short visual collapse so respawn cannot be spawn-killed by an old chain,
- preserve destroyed soft blocks, exposed/remaining pickups, defeated minions, rival HP, boss HP, and collected power-ups,
- after a 0.78-second death beat, respawn at the safest eligible corner pocket in the current stage,
- grant 1.25 seconds of visible protection,
- protection prevents damage but does not permit walking through blocks or bombs.

Choose the respawn pocket by evaluating current enemy distance and immediate route occupancy, not randomly. During protection, rival AI and the boss should avoid intentionally placing an unavoidable bomb directly on the respawn tile, but the player is still responsible for moving before protection expires.

If lives reach zero:

- accent the empty life indicators during the death beat,
- then automatically start a fresh run from Stage 1,
- no game-over panel or confirmation.

Heart pickup restores one lost life up to the cap of 3. At full lives, leave the Heart on the board until it can restore a life or a later flame destroys it.

## Progress and HUD feedback

Do not implement scores, points, score attribution, or score bonuses. Progress is expressed through remaining enemies, rival HP, boss HP, lives, and collected abilities. Bomb ownership remains fixed through chains and serves capacity bookkeeping only; all lethal flames use the same damage rules.

## First-build tuning table

Store these values with units in config.ts rather than scattering them through code.

Composition
- logical composition: 720 x 720
- HUD: 48 high
- arena: 720 x 624
- footer/hint band: 48 high
- grid: 15 x 13
- tile: 48
- target simulation: 60 Hz fixed step
- maximum catch-up ticks: 5
- DPR cap: 2

Player
- body collision radius: 13
- visible silhouette: approximately 30 x 34
- start speed: 165 units/s
- speed-up: +12
- speed cap: 201
- start bombs: 2
- bomb cap: 4
- start flame length: 2
- flame cap: 5
- kick: enabled
- respawn delay: 0.78 s
- protection: 1.25 s

Bombs
- radius: 15
- fuse: 2.35 s
- chain delay: 0.055 s
- flame total lifetime: 0.43 s
- flame lethal duration: 0.34 s
- flame visual-only tail: 0.09 s
- kick speed: 360 units/s
- boss kick speed: 430 units/s

Rivals
- count: 2
- HP each: 4
- bomb capacity: 2
- flame length: 3
- Rival A speed: 160 units/s
- Rival B speed: 174 units/s
- damage invulnerability: 0.68 s
- hit-stun: 0.18 s
- decision reaction floor: 0.14 s
- post-hit bomb-placement lock: 0.45 s

Minions
- count: 6
- HP: 1
- speed range: 92-108 units/s deterministic per instance

Boss
- HP: 12
- damage invulnerability: 0.36 s
- move speed phases: 112 / 126 / 142 units/s
- body collision radius: 30 units
- charge speed: 288 units/s
- kick rush speed: 240 units/s
- Forge recovery: 0.35 s
- Boiler Kick recovery: 0.30 s
- Forge telegraph: 0.55 s
- Forge bomb arc: 0.28 s
- Forge bomb fuse: 1.75 s
- Boiler Kick telegraph: 0.38 s
- Pressure Charge telegraph: 0.62 s
- Pressure Charge recovery: 0.50 s
- Pressure Charge bomb fuse: 1.35 s

Limits / reproducibility
- max bombs: 24
- max concurrent flame cells: 160
- max particles: 500
- max audio voices: 20
- gameplay seed on fresh run: 1994
- tuning version: 2

## Procedural visual direction

### Overall style

Use crisp, colorful, chunky procedural 2D drawing with restrained faux depth. The playfield should resemble a toy-like battle board rather than a flat debug grid.

Use Canvas 2D paths, rounded rectangles, circles, arcs, simple gradients if inexpensive, and small shadow ellipses. Do not use external images.

Visual goals:

- gameplay geometry is readable at a glance,
- characters are charming and expressive,
- bombs are the highest-priority moving objects after the player,
- flames have unmistakable tile reach,
- soft blocks look destructible before damage,
- hard blocks look permanently solid,
- rival bombers read as peers rather than minions,
- boss attacks remain readable with sound muted.

Use faux-depth only in rendering. Suggested block treatment: draw a bright top face, a 5-7 unit darker front/side face, and a compact contact shadow. Collision remains the exact 48 x 48 tile footprint.

### Character language

Player bomber
- rounded helmet/head shape, dark face opening, two bright eye marks, small body, mitten hands, short boots.
- near-white body with a cyan accent.
- clear facing direction through head tilt, leading foot, and arm position.
- do not replicate an exact Hudson/Konami Bomberman sprite or proportion sheet.

Rival A
- same base procedural bomber grammar as player.
- warm magenta/red accent, angular brow/helmet crest.
- slightly heavier gloves.

Rival B
- same base grammar.
- amber/orange accent, taller crest or scarf-like rear shape.
- slightly quicker foot animation matching higher speed.

Ordinary minions
- squat one-eyed bouncing creatures or mask-like critters with no bomber helmet, no bomb hands, and a visibly simpler silhouette.

Boiler King
- 2 x 2-tile-scale mechanical bomber king with round boiler body, faceplate, gauge, heavy arms, stomping feet, furnace seam, and steam vents.
- communicate phases through hotter furnace light, faster gauge motion, and more active vents, not through a full palette replacement.

### Bombs and fuse language

Player bombs: dark body, cyan/white rim highlight, bright fuse spark.
Rival bombs: same silhouette and timing, but owner accent around the fuse collar.
Boss bombs: slightly larger-looking shell and warm metal band, while using the same tile collision footprint unless explicitly stated otherwise.

Fuse animation must communicate remaining time without requiring numbers. Use a fuse spark that circles/shortens and a subtle body pulse that accelerates over the final 0.55 seconds. Do not make the entire bomb blink invisible.

### Flame language

Build each flame cell from a bright central core plus two or three rounded lobe shapes that reach close to tile edges without visually entering blocked tiles. Center, middle-arm, and tip cells can use slightly different silhouettes while sharing collision rules.

Explosion expansion can animate outward over the first 0.07 seconds, but lethal occupancy is governed by simulation state. Do not visually show an arm through a block that simulation has already stopped at.

Use warm yellow/orange/white flame colors with a brief darker red edge. Keep smoke sparse and short-lived so open corridors become readable immediately.

### Blocks and pickups

Hard blocks
- chunky permanent stone/metal blocks with cool bluish top faces.
- stable silhouette with little animation.

Soft blocks
- warmer crate/brick construction with obvious seams and a small central stress mark.
- destruction: quick outward chunks, dust ring, immediate removal of solid interior.

Pickups
- Bomb Up: bomb icon plus `+` silhouette.
- Fire Up: small four-arm flame cross.
- Speed Up: wing/boot mark.
- Heart: simple heart silhouette.

All pickups bob by only 2-3 units cosmetically and remain centered in the tile.

## Palette and HUD

Define semantic palette tokens in config.ts. Suggested first-build values:

background = #171B2A
floorA = #2A3150
floorB = #252C48
hardTop = #7487B8
hardSide = #455579
softTop = #C7844D
softSide = #8B5137
player = #F4FBFF
playerAccent = #65D9FF
rivalA = #FF6B8B
rivalB = #FFB24D
hostile = #FF5B3F
flame = #FFD45C
warning = #FFF0A6
bossMetal = #697083
bossHot = #FF7248
text = #F4F1E8
textMuted = #AEB5C8
shadow = rgba-like token handled centrally

Do not hardcode color literals inside drawing functions.

Top HUD layout:

- left: Stage 1 remaining enemies (`ENEMIES 8` initially); Stage 2 objective (`BOMB THE BOSS`)
- center during Stage 1: `STAGE 1`
- center during Stage 2: `BOSS` plus compact segmented boss HP immediately beneath or adjacent
- right: `LIVES` plus up to three tiny player helmet icons

Use system monospace or a system rounded sans fallback; no downloaded font. Keep text outside shake and use tabular numerals where available.

Bottom band:

- teaching state: animated controls plus objective caption.
- after teaching: left `H controls · R restart`; right `M sound on/off`.

No minimap, inventory panel, timer, combo meter, quest tracker, menu button, or large tutorial box.

## Exact feedback envelopes

Use these as first-build presentation timings. Cosmetic effects never alter authoritative gameplay transforms.

Player movement
- foot cycle scales with actual speed.
- 2-unit body bob at most.
- directional turn/facing change responds immediately; no anticipation delay.

Bomb placement
- hands/arms snap outward for 0.07 s then recover over 0.10 s.
- bomb appears immediately on accepted placement.
- 7-unit ring pulse from the bomb center over 0.12 s.
- short dry `pop` sound, no shake.

Bomb kick
- foot accent stretches 8% for 0.06 s.
- bomb emits a tiny floor skid streak and low click.
- no camera shake.

Chain trigger
- triggered bomb collar flashes for the 0.055 s chain delay.
- use a short rising tick distinct from placement.

Explosion
- flame reaches full visual tile length in 0.07 s.
- local 1.0-unit camera impulse for a normal bomb, capped by the global shake combiner.
- short layered burst with pitch variation.

Soft block destruction
- 6-8 chunks with lifetimes 0.18-0.32 s.
- dust clears within 0.24 s.
- shake contribution at most 0.4 units.

Pickup reveal
- rise 6 units from debris over 0.18 s and settle.
- pickup itself does not become collectible until the flame leaves the tile.

Pickup collect
- icon compresses to 0.8 then expands/fades over 0.16 s.
- collected ability indicator accent 0.18 s.
- power-up-specific two-note cue.

Minion death
- squash inward 0.06 s then 6 radial pieces over 0.20 s.
- no hit stop.

Rival hit
- 0.18 s hit-stun is authoritative.
- white contact flash 0.06 s.
- HP pip drops immediately.
- 4-6 armor flecks 0.18 s.
- no camera shake larger than 0.6.

Rival defeat
- compact helmet/body breakup over 0.35 s.
- stronger two-part burst and 1.5-unit shake for 0.16 s.

Player death
- 0.05 s hit stop.
- body pops into 10-12 clean procedural pieces plus a smoke ring.
- 3-unit shake cap for 0.24 s.
- death effect clears within the 0.78 s respawn beat.

Boss damage
- local furnace/plate flash 0.10 s.
- gauge needle snaps 8 degrees and settles over 0.20 s.
- 1-unit shake, no hit stop.

Boss phase transition
- at 8 HP and 4 HP: 0.35 s vent burst and HUD HP accent.
- gameplay does not pause.

Boss defeat
- 0.07 s hit stop.
- strongest shake, capped at 5 units for 0.35 s.
- plates eject over 0.45 s; steam ring expands over 0.50 s.
- no full-screen white flash.

Global shake cap: 5 logical units.
Routine walking and bomb placement produce no shake.

Do not implement reduced-motion support, preference detection, alternate animation modes, or a motion toggle. Use the specified animation and effect envelopes for everyone. Keep hazards and warning marks readable within the existing effect caps. Hit stop is owned by the simulation loop: freeze all gameplay timers and movement together for its named duration, then resume without catch-up; rendering never freezes or advances gameplay independently.

## Audio

Use native Web Audio only. No music system is required for the first build, but a tiny low-volume procedural stage pulse/drone is acceptable if it is simple and does not delay completion. Core sound effects are required.

Required cue families:

- footstep taps, rate-limited and subtle
- bomb placement
- fuse spark loop/accent without creating one audio node per frame
- kick
- chain trigger
- explosion
- soft block break
- pickup reveal/collect
- minion death
- rival hit/defeat
- player death
- boss forge telegraph
- boss charge telegraph
- boss hit
- boss defeat
- stage clear / slice clear

Use oscillators, filtered noise, short envelopes, a master gain, dynamics compression, and a strict voice cap. Reuse continuous sources where appropriate. Muting silences all voices including loops and ramps them down to avoid clicks. Audio initialization failure must leave a fully playable silent game and allow a later gesture to retry.

Audio hierarchy: boss warnings and player death outrank routine footsteps, fuse texture, and block breaks when voice capacity is scarce.

## Technical plan

Suggested stack:

- TypeScript
- Vite
- one HTML Canvas 2D
- native Web Audio
- zero runtime dependencies

Development tooling is fine. Do not use React, a game engine, Phaser, Pixi, Three.js, ECS framework, physics library, worker architecture, shader pipeline, generic event bus, or asset loader for this scope.

Suggested focused modules:

- main.ts: canvas lifecycle, resize, input listeners, fixed-step loop, focus/visibility handling.
- game.ts: authoritative state, stage lifecycle, player, enemies, bombs, flames, pickups, deaths.
- ai.ts: minion routing, rival danger map/path planning, boss decision logic.
- collision.ts: tile occupancy, actor-vs-grid, bomb solidity/kicking, flame cell queries.
- render.ts: all procedural world/HUD drawing plus bounded particles/effects.
- audio.ts: Web Audio graph and cue helpers.
- config.ts: tuning values, palette tokens, effect limits, controls.

A smaller file count is acceptable if responsibilities remain clear. Do not build abstraction layers solely to match this list.

## Simulation and collision rules

Simulate gameplay at a fixed 60 Hz using an accumulator. Render with requestAnimationFrame. Cap catch-up work at five ticks and discard stale accumulated time after focus/visibility changes.

One owner controls gameplay state. Rendering never changes positions, HP, bomb timers, or stage transitions. Audio and particles consume a small typed event list emitted once by simulation updates.

Bomb/fuse timing is simulation time, not wall-clock timeout callbacks.

### Tile occupancy

Represent hard blocks, soft blocks, bombs, pickups, and flame cells explicitly. Collision and blast propagation use tile coordinates.

Actor movement is continuous and uses swept/axis-separated circle-vs-grid checks. Resolve X/Y movement without allowing diagonal corner cutting. Cornering assistance may alter desired movement inside a small legal tolerance but never occupancy rules.

### Bomb solidity

Track per-actor pass-through permission for a bomb only while that actor is already overlapping the bomb at placement/respawn transition. Once the actor leaves, clear permission permanently for that bomb.

Do not implement global `bombs are non-solid for 0.2 s`; solidity depends on overlap state.

### Kicked bomb movement

Use deterministic cardinal motion. Advance through tile boundaries and stop at the last legal tile center. Check blockers before entering each new tile. Avoid tunneling by processing every crossed tile boundary during the fixed step.

If two kicked bombs would attempt to enter the same tile in the same tick, resolve by earliest boundary-crossing time; tie-break by stable bomb id. Losing bomb stops in its prior tile.

### Flame damage

On detonation, build exact occupied flame cells after blocker resolution. Track an explosion event id. Each damageable actor stores the last explosion id that damaged it so one cross-shaped blast cannot multi-hit.

Chain-triggered bombs generate new explosion ids.

### Simultaneous outcomes

Collect valid damage/death/defeat events for the tick before lifecycle cleanup. Use stable ordering so iteration order cannot decide whether a rival survives or whether the boss dies.

If the player and final Stage 1 enemy die during the same tick:

- count the enemy defeat and stage clear,
- consume the player life,
- complete the death beat,
- if lives remain, transition to the boss with the surviving power-ups and reduced life count,
- if lives reach zero, restart the full run instead.

If the player and boss die during the same tick:

- count the boss defeat,
- consume the life,
- if lives remain, still show the slice-clear celebration before fresh-run restart,
- if the life was the last life, accent the empty life indicators during the death beat, then fresh-run restart; do not pretend the player survived.

Prevent duplicate rewards/transitions.

## Enemy AI engineering notes

### Minions

Use tile-center decisions and small deterministic state. No A* is needed for every minion every frame. A local legal-direction choice with a Manhattan bias is sufficient.

### Rival bombers

This is the primary AI quality target.

Represent predicted danger as `dangerIntervals[tile]`, a merged list of lethal start/end times within the prediction horizon, plus separately marked uncertain remote-bomb exposure. Include already active flame windows and successive blasts rather than retaining only the earliest time. Incorporate:

- current bomb fuse times,
- their flame lengths,
- blockers as they exist now,
- obvious chain triggers from currently placed bombs,
- kicked bomb current lanes if a deterministic arrival time can be computed cheaply.

Do not attempt a perfect game-theoretic solver. The rival needs to be legible, aggressive, and fallible.

For a proposed bomb placement, simulate the tile becoming a temporary blocker with the normal overlap-exit exception and verify a timed escape through the end of the proposed blast plus 0.15 seconds. Use a bounded search over (tile, arrival time), with move and wait actions; 0.05-second time bins and conservative traversal occupancy are sufficient. Check every traversed cell during entry, crossing, departure, and any wait, using actual movement speed and current hit-stun. A safe destination alone is insufficient. Include chain delays and lethal flame duration. Limit hypothetical planning to one proposed bomb beyond authoritative state. Keep current blockers conservative rather than assuming a soft block will disappear before it actually does.

Apply the same escape validation before intentional kicks, projecting the kicked bomb's lane, remaining fuse, and chain interactions. If that cannot be established within the short horizon, decline the kick. In immediate danger, survival overrides attack preferences. Replanning after invalidation may stop an unsafe move immediately, but does not grant a fresh offensive decision faster than the 0.14-second reaction floor.

Keep planner output as a short timed route plus optional intent such as `placeBomb` or `kickBomb`. Preserve it until invalidated or completed. Use stable tile/id tie-breaks and seeded choices.

Rival A favors clearing blocking soft blocks and controlling long lanes; Rival B favors safe flanking routes and pressuring the player's escape exits. These preferences affect ranking only, never safety validation or core bomb rules. Do not introduce extra abilities.

Retain a chosen safe goal for at least 0.42 seconds unless danger invalidates it. Penalize returning to either of the last two visited tiles unless necessary to escape. If movement advances less than 4 units over 0.50 seconds while a move is intended, discard the route and choose another reachable goal at the next tactical decision. Never recover by teleporting, phasing, or ignoring danger. Minions use stable direction tie-breaks and the same stalled-movement detection, selecting another legal local turn.

### Boss

Use an explicit state machine:

- move
- forgeTelegraph
- forgeRecover
- kickTelegraph
- kickRecover
- chargeTelegraph
- chargeMove
- chargeRecover
- defeated

Track hurt feedback independently so damage does not erase a committed telegraph, movement, or recovery.

Attack warnings and recoveries derive from simulation timers. Rendering reads the state; it never owns attack completion.

## Resource bounds and determinism

Use a seeded gameplay RNG independent of cosmetic randomness. Fresh-run seed: 1994. Record the tuning version and seed in README.md.

The same seed and input sequence should produce the same gameplay decisions even with particles disabled.

Suggested caps:

- 24 bombs
- 160 flame cells
- 500 particles
- 20 audio voices
- 32 block debris groups or equivalent bounded representation
- 5 fixed-step catch-up ticks

At capacity, drop cosmetics first. Never emit fake gameplay feedback for an action that was rejected.

## Lifecycle and focus handling

Own one animation loop and one AudioContext. Provide cleanup for listeners, animation frames, and audio nodes during development hot reload.

R performs a state reset inside the existing loop; it does not install another loop.

On blur/visibility loss:

- clear held movement keys,
- clear latched one-shot inputs,
- mute/stop continuous movement/fuse layers as appropriate,
- suspend simulation.

On resume:

- reset timing baseline,
- restore audio only if sound is enabled and context is available,
- do not advance bomb fuses for hidden time.

## Engineering quality standards

Quality means exact tile rules, responsive movement, predictable bomb timing, readable danger, competent rival AI, bounded effects, and code that remains easy to tune.

- TypeScript strict mode.
- Explicit units in config names/comments.
- No wall-clock timers for gameplay.
- Stable unique ids for bombs, actors, and explosion events where tie-breaking requires them.
- Separate authoritative state from interpolation/cosmetic state.
- Interpolation must never feed back into collision.
- Snap previous/current transforms together after respawn, stage transition, or teleports so interpolation does not streak across the board.
- Use safe deferred removals or stable backwards iteration.
- Avoid uncontrolled object allocation in the hot update path when straightforward reuse is possible.
- Keep palette/effect strengths centralized.
- Effects must terminate cleanly; no permanent smoke, ever-growing arrays, or fuse voices left alive after bombs resolve.
- No hidden gameplay rules that exist only to make the AI win.
- Do not tune by silently giving rivals shorter fuses, longer invisible blast reach, wall phasing, or reaction times unavailable to the player.

## Build order

1. Create the Vite/TypeScript canvas shell and boot straight into a fixed empty arena.
2. Implement four-direction movement, grid collision, cornering assistance, bomb placement, fuse timing, exact cross-shaped blast propagation, death, and restart.
3. Add hard/soft blocks, destruction, chain reactions, kick behavior, pickups, lives, HUD, and controls strip.
4. Build the complete authored Stage 1 layout and ordinary minions.
5. Implement rival bomber movement, danger map, bomb planning, kicking, HP/damage, activation schedule, and Stage 1 clear transition.
6. Build the Stage 2 arena and Boiler King state machine with all three attacks and three HP phases.
7. Add all procedural character/block/bomb/flame art, faux-depth treatment, animation envelopes, particles, shake, and synthesized audio. Polish is part of the requested first build; do not defer all juice to a later session.
8. Add focus handling, lifecycle cleanup, and deterministic seed/version reporting.
9. Review source against this document, run TypeScript typecheck and production build, and fix build errors. Do not run browser/gameplay tests in the initial implementation session.
10. Deliver source, README.md, honest build results, and the human playtest checklist below.

## README requirements

README.md must include:

- launch/install commands,
- controls,
- one-paragraph description of the two-stage slice,
- tuning version and gameplay seed,
- actual grid/timing/movement/bomb/rival/boss constants,
- any deviations from this handoff and why they were necessary,
- known implementation limitations,
- typecheck/build results,
- statement that runtime feel awaits human playtest.

Do not claim the game is balanced, bug-free, or historically accurate unless the human later verifies that.

## Scope boundary — do not add

Do not add any of the following in the first build:

- multiplayer of any kind
- title/menu/settings screens
- character select
- campaign/map screen
- more normal stages
- more bosses
- shops
- save system
- achievements
- unlocks
- costumes
- pets/mounts
- online leaderboard
- gamepad or touch controls
- controller remapping UI
- procedural level generator
- stage editor
- replay/ghost system
- cutscenes
- dialogue system
- external art/audio pipeline
- 3D rendering or WebGL
- shaders
- post-processing framework
- physics engine
- adaptive director

A tiny procedural background pulse or music-like drone is allowed, but a full soundtrack system is not required.

## Historical/reference boundary

The user named Saturn Bomberman, Bomberman '94, and Super Bomberman 5 as inspiration. Treat those games as high-level reference points for Bomberman's grid combat, destructible blocks, power-ups, bomb-chain play, lively presentation, and aggressive pacing. The concrete layouts, characters, boss, numerical tuning, rival behavior, telegraphs, procedural visual designs, and life/respawn rules in this handoff are original first-build proposals rather than claims of exact historical behavior.

Do not browse or copy sprite sheets during implementation. The goal is a fresh procedural homage, not asset reproduction.

## Human playtest checklist — deliver this at the end

Owner: the human after the complete slice is delivered. These are not tasks for the implementation AI to perform in the initial build session.

1. First impression
Open the game with no instructions beyond the on-screen hint. Is movement obvious? Is X = Bomb understood? Does the game begin immediately without feeling like a menu is missing? Can you tell hard blocks, soft blocks, bombs, flames, enemies, and the player apart instantly?

2. Movement
Run through several narrow corners at normal speed and after collecting Speed Up. Does cornering assistance help without feeling magnetic? Do you ever snag on block corners, move diagonally, or slip through solid geometry?

3. Basic bomb truth
Place a bomb, leave its tile, try to walk back through it, and test blasts against hard blocks, soft blocks, bombs, and open corridors. Report any flame entering a blocked tile, bombs being re-enterable after clearing them, or soft blocks failing to stop flame propagation.

4. Chain reactions
Create a two- and three-bomb chain. Does each trigger read clearly? Does danger remain continuous through the chain delay? Do chained blasts ever damage through a wall or disappear without feedback?

5. Kick behavior
Kick bombs down long and short lanes, toward other bombs, and into a blocked lane. Does the moving bomb stop on a sensible tile? Can it tunnel through a block/bomb? Does kicking create useful tactical options rather than chaos you cannot read?

6. Pickups
Break enough blocks to expose Bomb Up, Fire Up, Speed Up, Heart, and Remote Control. Verify C detonates the oldest remote bomb, existing timed bombs retain their fuse, remote bombs chain normally, and enemies do not anticipate C input. Do pickups appear after the flame clears? Do their silhouettes communicate function? Does a later flame destroy exposed pickups? Does power growth feel useful without making Stage 1 trivial?

7. Minions
Fight the six ordinary enemies. Are they active enough to matter but clearly less intelligent than the rivals? Do they get stuck oscillating at intersections or unexpectedly navigate through bombs/blocks?

8. Rival A
Fight the first multi-HP bomber. Does it feel like an opponent using the same rules? Can you read its bombs, kick behavior, HP loss, hit invulnerability, and escape choices? Does it ever survive by visibly cheating?

9. Rival B and combined pressure
Once both rivals are active, assess whether the stage becomes exciting or merely overcrowded. Can the two rivals hurt each other? Can you manipulate their bombs against them? Report unavoidable traps created faster than a human can respond.

10. Stage 1 pacing
Does the opening give enough time to learn before danger arrives? Does clearing soft blocks naturally escalate into bomber duels? Is there a long dull cleanup period after the interesting enemies are gone?

11. Stage transition
Defeat the last Stage 1 enemy. Does the transition happen automatically, preserve lives/power-ups, remove surprise danger, and reach the boss quickly without becoming a menu?

12. Boss readability
Watch each Boiler King attack at least twice, with sound on and muted. Can you identify Forge Drop, Boiler Kick, and Pressure Charge before they happen? Are target markers truthful? Does the charge direction remain committed after the telegraph?

13. Boss interaction with bombs
Kick boss bombs, chain them with player bombs, offer the boss a bomb to kick, and try to damage the boss during/after its committed attacks. Does the fight reward Bomberman reasoning rather than just running in circles?

14. Boss phases
Reach 8 HP and 4 HP. Does pressure rise without warnings becoming unreadable? Does the final phase feel urgent but still fair? Do effects obscure flame tiles or bomb fuses?

15. Death/respawn
Die in Stage 1 and on the boss. Are lives consumed correctly? Is current stage progress preserved? Are old bombs/flames neutralized enough to avoid an immediate unfair second death? Does protection expire clearly without allowing wall/bomb phasing?

16. Mutual destruction
If practical, arrange a same-tick death with the last rival or the boss. Report whether defeat handling, life loss, and transition behavior match the rules in this handoff. No special instrumentation is required.

17. UI/audio
Inspect remaining enemies, lives, stage label, boss HP, controls, mute status, and objective captions. Are sounds distinct enough to identify placement, chain trigger, explosions, rival hits, warnings, death, and boss defeat? Is routine audio too dense?

18. Focus and lifecycle
Resize the window, alt-tab while holding movement, return, mute/unmute, replay controls with H, and restart with R. Report stuck keys, fuse time jumps, duplicate loops, distorted scaling, or missing audio after a valid gesture.

19. Sustained play
Loop through the slice more than once if practical. Look for lingering particles, rising audio volume, increasing stutter, broken AI after a restart, duplicated listeners, or transitions that deteriorate over repeated runs.

20. Overall feel
What feels best and should not be changed? What single issue most harms the Bomberman feel: movement, fuse timing, explosion readability, kick behavior, rival intelligence, stage density, boss patterns, or feedback?

Return feedback in this compact form, one entry per issue:

- Build/tuning version; browser and approximate window size:
- Stage and action:
- Expected / observed:
- Feel: too fast/slow, weak/strong, clear/confusing, easy/hard, etc.
- Frequency: once, sometimes, reliably; reproduction steps if known.
- Priority: blocks play, fairness/readability, or polish preference.

Also report what felt good and should remain unchanged. After receiving human feedback, the next AI should identify likely causes, adjust the smallest relevant set of constants/behaviors, record the change, and return targeted rechecks. Do not invent playtest findings or describe unplayed behavior as calibrated.
