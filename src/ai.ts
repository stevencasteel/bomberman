import { CONFIG as C, DIRECTIONS, type Direction } from './config';
import { sweep, type Tile, type Blocker } from './collision';
export type Minion = { id: number; x: number; y: number; previousX: number; previousY: number; direction: Direction; targetX: number; targetY: number; speed: number; dead: boolean; deathAge: number; wait: number };
export function createMinions(): Minion[] {
  return [[5, 3], [7, 3], [9, 5], [3, 5], [7, 5], [11, 7]].map(([col, row], i) => ({ id: i + 1, x: (col + .5) * C.tile, y: (row + .5) * C.tile, previousX: (col + .5) * C.tile, previousY: (row + .5) * C.tile, targetX: (col + .5) * C.tile, targetY: (row + .5) * C.tile, direction: 'down', speed: 92 + i * 3.2, dead: false, deathAge: 0, wait: 0 }));
}
export function updateMinion(m: Minion, board: Tile[][], blockers: Blocker[], player: { x: number; y: number }, danger: Set<string>, time: number, random: () => number) {
  m.previousX = m.x; m.previousY = m.y;
  if (m.dead) { m.deathAge += C.step; return; }
  m.wait = Math.max(0, m.wait - C.step);
  if (Math.hypot(m.targetX - m.x, m.targetY - m.y) < .01) {
    if (m.wait > 0) return;
    const col = Math.floor(m.x / C.tile), row = Math.floor(m.y / C.tile);
    const [oldX, oldY] = DIRECTIONS[m.direction];
    let choices = (Object.keys(DIRECTIONS) as Direction[]).flatMap(direction => {
      const [dx, dy] = DIRECTIONS[direction], c = col + dx, r = row + dy;
      if (board[r]?.[c] !== 'floor' || blockers.some(b => b.col === c && b.row === r)) return [];
      return [{ direction, x: (c + .5) * C.tile, y: (r + .5) * C.tile, reverse: dx === -oldX && dy === -oldY, unsafe: danger.has(`${c},${r}`), rank: Math.abs(c - Math.floor(player.x / C.tile)) + Math.abs(r - Math.floor(player.y / C.tile)) + random() * 4 }];
    });
    if (choices.some(c => !c.unsafe)) choices = choices.filter(c => !c.unsafe);
    const playerBehind = Math.floor(player.x / C.tile) === col - oldX && Math.floor(player.y / C.tile) === row - oldY;
    if (!playerBehind && choices.some(c => !c.reverse)) choices = choices.filter(c => !c.reverse);
    choices.sort((a, b) => a.rank - b.rank);
    if (!choices.length) { m.wait = .14; return; }
    const chosen = choices[0]; m.direction = chosen.direction; m.targetX = chosen.x; m.targetY = chosen.y;
  }
  const [dx, dy] = DIRECTIONS[m.direction];
  const step = Math.min(m.speed * (time < 4 ? .45 : time < 8 ? .75 : 1) * C.step, Math.hypot(m.targetX - m.x, m.targetY - m.y));
  const next = sweep(board, m.x, m.y, dx * step, dy * step, blockers);
  const progress = Math.hypot(next.x - m.x, next.y - m.y);
  m.x = next.x; m.y = next.y;
  if (progress < step - .01) {
    // Retreat to the last center when a new bomb invalidates the committed lane.
    m.targetX = (Math.floor(m.previousX / C.tile) + .5) * C.tile;
    m.targetY = (Math.floor(m.previousY / C.tile) + .5) * C.tile;
    const tx = m.targetX - m.x, ty = m.targetY - m.y;
    m.direction = Math.abs(tx) > .01 ? tx > 0 ? 'right' : 'left' : ty > 0 ? 'down' : 'up';
  }
}
