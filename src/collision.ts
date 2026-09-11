import { CONFIG as C } from './config';
export type Blocker = { col: number; row: number };
export function overlapsTile(x: number, y: number, col: number, row: number, radius: number = C.radius): boolean {
 const nx = Math.max(col * C.tile, Math.min(x, (col + 1) * C.tile));
 const ny = Math.max(row * C.tile, Math.min(y, (row + 1) * C.tile));
 return (x - nx) ** 2 + (y - ny) ** 2 < radius ** 2 - 0.0001;
}
export type Tile = 'floor' | 'hard' | 'soft';
export function createBoard(): Tile[][] {
  const board: Tile[][] = Array.from({ length: C.rows }, (_, y) => Array.from({ length: C.columns }, (_, x) => x === 0 || y === 0 || x === C.columns - 1 || y === C.rows - 1 || (x % 2 === 0 && y % 2 === 0) ? 'hard' : 'floor'));
  // Authored terrain; the lower-left pocket includes a corner escape route.
  const softRows: Record<number, number[]> = {
    1: [3, 5, 7, 9, 11], 2: [3, 7, 11], 3: [2, 4, 6, 9, 12],
    4: [1, 5, 9, 13], 5: [3, 6, 8, 11], 6: [3, 7, 11],
    7: [1, 4, 6, 9, 12], 8: [5, 9, 13], 9: [4, 7, 10, 12],
    10: [5, 9, 13], 11: [4, 6, 8, 10, 12],
  };
  for (const [row, columns] of Object.entries(softRows)) for (const col of columns) if (board[+row][col] === 'floor') board[+row][col] = 'soft';
  // Reserved rival pockets and minion spawn cells; all remain in the same authored board.
  for (const [col, row] of [[1,1],[1,2],[13,1],[13,2],[5,3],[7,3],[9,5],[3,5],[7,5],[11,7]]) board[row][col] = 'floor';
  for (const [col, row] of [[2,1],[3,3],[12,1],[11,3],[3,8]]) board[row][col] = 'soft';
  for(const [col,row] of [[1,3],[2,3],[13,3],[12,3]]) board[row][col]='floor';
  // Lower-right respawn has a mirrored L-shaped escape nook.
  for(const [col,row] of [[13,11],[13,10],[13,9],[12,9]]) board[row][col]='floor';
  return board;
}
export function clearCircle(board: Tile[][], x: number, y: number, radius: number = C.radius, blockers: Blocker[] = []): boolean {
  for (let row = Math.floor((y - radius) / C.tile); row <= Math.floor((y + radius) / C.tile); row++) {
    for (let col = Math.floor((x - radius) / C.tile); col <= Math.floor((x + radius) / C.tile); col++) {
      if (board[row]?.[col] === 'floor') continue;
      const nearX = Math.max(col * C.tile, Math.min(x, (col + 1) * C.tile));
      const nearY = Math.max(row * C.tile, Math.min(y, (row + 1) * C.tile));
      if ((x - nearX) ** 2 + (y - nearY) ** 2 < radius ** 2 - 0.0001) return false;
    }
  }
  return !blockers.some(b => overlapsTile(x, y, b.col, b.row, radius));
}
// Process short swept intervals along a single axis. Return the exact last legal position.
export function sweep(board: Tile[][], x: number, y: number, dx: number, dy: number, blockers: Blocker[] = []): { x: number; y: number } {
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 2));
  for (let i = 0; i < steps; i++) {
    const sx = dx / steps, sy = dy / steps;
    if (clearCircle(board, x + sx, y + sy, C.radius, blockers)) { x += sx; y += sy; continue; }
    let low = 0, high = 1;
    for (let j = 0; j < 12; j++) { const middle = (low + high) / 2; if (clearCircle(board, x + sx * middle, y + sy * middle, C.radius, blockers)) low = middle; else high = middle; }
    x += sx * low; y += sy * low; break;
  }
  return { x, y };
}
