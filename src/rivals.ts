import { CONFIG as C, DIRECTIONS, type Direction } from './config';
import { overlapsTile, sweep, type Tile } from './collision';
import type { Bomb, Flame } from './game';
export type Cell = { col: number; row: number; wait?: number };
export type Rival = { capacity:number; range:number; remote:boolean; id: number; x: number; y: number; previousX: number; previousY: number; hp: number; invulnerability: number; stun: number; bombLock: number; decision: number; speed: number; facing: Direction; route: Cell[]; recent: string[]; goal: Cell | null; goalUntil: number; stall: number; deathAge: number; escapeUntil: number; wait: number; hitIds: Set<number> };
export const RIVAL = { hp: 4, reaction: .14, stun: .18, invulnerability: .68, bombLock: .45, horizon: 3, margin: .15, goalHold: .42, stall: .5 } as const;
export const key = (c: Cell) => `${c.col},${c.row}`;
export function createRivals(): Rival[] { return [1,13].map((col,i) => ({ capacity:2,range:3,remote:false,id:i+1,x:(col+.5)*C.tile,y:72,previousX:(col+.5)*C.tile,previousY:72,hp:4,invulnerability:0,stun:0,bombLock:0,decision:0,speed:i?174:160,facing:'down',route:[],recent:[],goal:null,goalUntil:0,stall:0,deathAge:0,escapeUntil:0,wait:0,hitIds:new Set<number>() })); }
export function occupied(b: Bomb): Cell[] {
  const cells=[{col:b.col,row:b.row}];
  if(b.direction){const [dx,dy]=DIRECTIONS[b.direction];cells.push({col:b.col+dx,row:b.row+dy});}
  return cells;
}
export function footprint(board: Tile[][], bombs: Bomb[], origin: Cell, range: number, ownId=-1): Cell[] {
  const cells=[origin];
  for(const [dx,dy] of Object.values(DIRECTIONS)) for(let n=1;n<=range;n++){
    const c={col:origin.col+dx*n,row:origin.row+dy*n};
    if(!board[c.row]?.[c.col]||board[c.row][c.col]==='hard')break;
    cells.push(c);
    if(board[c.row][c.col]==='soft'||bombs.some(b=>b.id!==ownId&&occupied(b).some(p=>key(p)===key(c))))break;
  }
  return cells;
}
type Interval = { start:number; end:number };
export type Danger = { intervals:Map<string,Interval[]>; remote:Set<string>; blocked:Set<string> };
// Conservative moving-bomb projection: include every possible lane origin through its fuse.
// This favors declining uncertain attacks over relying on an optimistic predicted stop.
export function dangerMap(board:Tile[][], bombs:Bomb[], flames:Flame[]):Danger {
  const intervals=new Map<string,Interval[]>(), remote=new Set<string>(), blocked=new Set<string>();
  const add=(c:Cell,start:number,end:number)=>{const k=key(c); const list=intervals.get(k)??[];list.push({start,end});intervals.set(k,list);};
  const origins=bombs.map(b=>{
    const cells=occupied(b);for(const c of cells)blocked.add(key(c));
    if(b.direction){const [dx,dy]=DIRECTIONS[b.direction];const max=Math.min(15,Math.ceil((Math.min(b.fuse,3)*C.kickSpeed+b.travel)/C.tile));
      for(let n=2;n<=max;n++){const c={col:b.col+dx*n,row:b.row+dy*n};if(board[c.row]?.[c.col]!=='floor'||bombs.some(o=>o!==b&&occupied(o).some(p=>key(p)===key(c))))break;cells.push(c);blocked.add(key(c));}}
    return cells;
  });
  const blasts=bombs.map((b,i)=>origins[i].flatMap(o=>footprint(board,bombs,o,b.range,b.id)));
  const times=bombs.map(b=>b.fuse);
  for(const f of flames)if(f.age<C.lethalLife){for(const c of f.cells)add(c,0,C.lethalLife-f.age);bombs.forEach((b,i)=>{if(origins[i].some(o=>f.cells.some(c=>key(o)===key(c))))times[i]=Math.min(times[i],C.chainDelay);});}
  for(let pass=0;pass<bombs.length;pass++){let changed=false;for(let i=0;i<bombs.length;i++)for(let j=0;j<bombs.length;j++)if(i!==j&&times[i]+C.chainDelay<times[j]&&origins[j].some(o=>blasts[i].some(c=>key(c)===key(o)))){times[j]=times[i]+C.chainDelay;changed=true;}if(!changed)break;}
  bombs.forEach((b,i)=>{for(const c of blasts[i]){if(!Number.isFinite(times[i]))remote.add(key(c));else if(times[i]<=3)add(c,Math.max(0,times[i]),times[i]+C.lethalLife);}});
  for(const [k,list] of intervals){list.sort((a,b)=>a.start-b.start);const merged:Interval[]=[];for(const item of list){const last=merged.at(-1);if(last&&item.start<=last.end)last.end=Math.max(last.end,item.end);else merged.push({...item});}intervals.set(k,merged);}
  return {intervals,remote,blocked};
}
function safe(d:Danger,c:Cell,start:number,end:number,allowRemote=false){return (allowRemote||!d.remote.has(key(c)))&&!(d.intervals.get(key(c))??[]).some(i=>i.start<end&&i.end>start);}
export function timedRoutes(r:Rival, board:Tile[][], d:Danger, others:Cell[], refugeUntil=0, allowRemote=false):{cell:Cell; route:Cell[]; time:number}[] {
  const start={col:Math.floor(r.x/C.tile),row:Math.floor(r.y/C.tile)};
  const duration=Math.ceil(C.tile/r.speed/.05)*.05;
  const queue=[{cell:start,time:0,route:[] as Cell[]}], seen=new Set<string>([`${key(start)}:0`]);
  const results:typeof queue=[];
  for(let head=0;head<queue.length&&head<4000;head++){
    const state=queue[head];
    if(safe(d,state.cell,state.time,Math.max(state.time+.2,refugeUntil),allowRemote))results.push(state);
    for(const [dx,dy] of [[0,0],...Object.values(DIRECTIONS)]){
      const cell={col:state.cell.col+dx,row:state.cell.row+dy};const waiting=dx===0&&dy===0;
      const end=state.time+(waiting?.15:duration); if(end>RIVAL.horizon)continue;
      if(board[cell.row]?.[cell.col]!=='floor'||others.some(o=>key(o)===key(cell)))continue;
      // Only the starting overlapping bomb may be exited; no route may re-enter it.
      if(d.blocked.has(key(cell))&&(!waiting||key(cell)!==key(start)||state.route.some(c=>key(c)!==key(start))))continue;
      if(!safe(d,state.cell,state.time,end,allowRemote)||!safe(d,cell,state.time,end+RIVAL.margin,allowRemote))continue;
      const stamp=`${key(cell)}:${Math.round(end/.05)}`;if(seen.has(stamp))continue;seen.add(stamp);
      queue.push({cell,time:end,route:[...state.route,{...cell,wait:waiting?.15:undefined}]});
    }
  }
  return results;
}
export function travelRival(r:Rival,board:Tile[][],bombs:Bomb[],others:Cell[]):void {
  if(r.wait>0){r.wait=Math.max(0,r.wait-C.step);return;}
  if(!r.route.length)return;
  const cell=r.route[0],tx=(cell.col+.5)*C.tile,ty=(cell.row+.5)*C.tile;
  const dx=tx-r.x,dy=ty-r.y;
  if(Math.hypot(dx,dy)<.01){r.wait=cell.wait??0;r.route.shift();return;}
  const horizontal=Math.abs(dx)>.01;r.facing=horizontal?(dx>0?'right':'left'):(dy>0?'down':'up');
  const distance=Math.min(r.speed*C.step,horizontal?Math.abs(dx):Math.abs(dy));
  const blockers=[...bombs.filter(b=>!b.escape.includes(r.id)).flatMap(occupied),...others];
  const next=sweep(board,r.x,r.y,horizontal?Math.sign(dx)*distance:0,horizontal?0:Math.sign(dy)*distance,blockers);
  const progress=Math.hypot(next.x-r.x,next.y-r.y);r.stall=progress<.01?r.stall+C.step:0;r.x=next.x;r.y=next.y;
  if(r.stall>=RIVAL.stall){r.route=[{col:Math.floor(r.x/C.tile),row:Math.floor(r.y/C.tile)}];r.goal=null;r.stall=0;}
  if(Math.hypot(tx-r.x,ty-r.y)<.01){r.route.shift();r.recent.push(key(cell));if(r.recent.length>2)r.recent.shift();}
}
export function rivalOverlaps(r:Rival,c:Cell){return overlapsTile(r.x,r.y,c.col,c.row,C.radius+.5);}
