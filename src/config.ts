export const CONFIG = { size: 720, tile: 48, columns: 15, rows: 13, hud: 48, step: 1 / 60, maxTicks: 5, speed: 165, radius: 13, cornerTolerance: 30, centerSpeed: 180, dprCap: 2, kickSpeed: 360, bombFuse: 2.35, blastLength: 2, bombCapacity: 2, chainDelay: 0.055, flameLife: 0.43, lethalLife: 0.34, respawnDelay: 0.78, protection: 1.25, seed: 1994, tuning: 8 } as const;
export const DIRECTIONS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] } as const;
export type Direction = keyof typeof DIRECTIONS;
export const BINDINGS = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', mute: 'KeyM', detonate: 'KeyC', bomb: 'KeyX', restart: 'KeyR', hint: 'KeyH' } as const;
export type Action = keyof typeof BINDINGS;
export const LABELS: Record<Action, string> = { up: '↑', down: '↓', left: '←', right: '→', mute: 'M', detonate: 'C', bomb: 'X', restart: 'R', hint: 'H' };
