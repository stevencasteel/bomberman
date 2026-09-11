# Final human playtest

Build 0.6.0 · tuning 8 · seed 1994. The following are checks for the human, not claims of runtime verification.

1. **First impression:** boot straight into Stage 1; read the animated arrows/X hint; check character, hard blocks, crates, pickups and enemy silhouettes.
2. **Movement:** all four corner approaches, including previously stuck corners; multiple held directions; base and upgraded speed; no wall phasing or unwanted diagonal movement.
3. **Bomb truth:** place/leave/re-enter; capacity limits; exact blocked flame tiles; timer ring on the bomb circumference.
4. **Chains:** two/three bombs; sound/flash for chain delay; no damage leaking through hard blocks; later blasts using destroyed-crate openings.
5. **Kicks:** off-center contact, walls, crates, opposing/moving bombs and enemy bodies; sensible stopping centers; unchanged fuse.
6. **Pickups:** reveal only after flames finish; later flames destroy; caps; Heart at full health; powers persist after death. Rivals pursue and consume useful visible pickups.
7. **Remote:** C before/after collection; oldest-first, one per press; no auto-fuse; pre-existing timed bombs unchanged; remote chain reactions and rival remote usage.
8. **Minions:** opening grace, pressure after 8 seconds, local danger avoidance, contact damage, no oscillation/phasing around bombs.
9. **Rival A:** amber HP pips, attacks, escape planning, hit-stun and self-damage; does it pursue you enough?
10. **Rival B:** violet flanking pressure, combined enemies, pickup competition and fair bomb warnings; note excessive caution or trapped movement.
11. **Arena clear:** all eight enemies required; no surprise post-clear damage; automatic boss transition preserving lives/powers.
12. **Boss warnings:** forge circles/flight, kick chevrons, fixed charge direction; compare sound on/off. Can you identify commitments and exploit recoveries?
13. **Boss bombs:** kick and chain boss bombs; offer player bombs to kick; verify body blocks bombs and charge crushes crates but not hard blocks.
14. **Boss phases:** 8/4 HP transitions; warnings retain duration; speed/cadence increase without obscuring safe routes.
15. **Death:** fatal explosion remains visible, sound is clear, only one life consumed, old danger neutralized; no trapped lower-right respawn; progress preserved.
16. **Mutual destruction:** if encountered, player death plus final enemy/boss defeat respects life count and only transitions once.
17. **Victory:** SLICE CLEAR then automatic fresh run; reset all enemies/powers and restore authored crates.
18. **Audio:** placement, fuse, kick, chain, pickups, hits/deaths and boss warnings distinguishable. M mutes everything without lingering sound; warnings remain audible in busy fights.
19. **Lifecycle:** resize/letterboxing, hide or alt-tab while moving, return without time jumps or stuck input; H/M/R repeated; no duplicate audio/loops.
20. **Sustained play:** repeat the full slice; report lingering debris, rising volume, stutter, stuck AI, or broken transitions. No reduced-motion mode is intended.

Report each issue with browser/window size, stage/action, expected versus observed, frequency/reproduction, and priority (blocks play / fairness / polish). Also note what feels good and should remain unchanged.
