import { type Feedback, type Cue } from './feedback';
import { BOSS, createBoss, bossBoard, updateBoss, type Boss } from './boss';
import { createRivals, dangerMap, timedRoutes, travelRival, footprint, occupied, key, RIVAL, type Rival } from './rivals';
import { createMinions, updateMinion } from './ai';
import { CONFIG as C, DIRECTIONS, type Direction } from './config';
import { createBoard, sweep, overlapsTile } from './collision';
import type { Input } from './input';
export type Bomb = { id: number; owner: number; escape: number[]; col: number; row: number; fuse: number; initialFuse?: number; kickSpeed?: number; pass: boolean; direction: Direction | null; travel: number; remote: boolean; range: number; minionEscape?: number[]; chained?: boolean; placedAt?: number };
export type Flame = { id: number; cells: { col: number; row: number }[]; age: number };
type PickupKind = 'bomb' | 'fire' | 'speed' | 'heart' | 'remote';
export type Pickup = { col: number; row: number; kind: PickupKind; visible: boolean; revealedAt?: number };
const pickupLayout = (): Pickup[] => [
  { col: 4, row: 11, kind: 'bomb' }, { col: 6, row: 5, kind: 'bomb' },
  { col: 4, row: 9, kind: 'fire' }, { col: 9, row: 3, kind: 'fire' },
  { col: 1, row: 7, kind: 'speed' }, { col: 11, row: 5, kind: 'speed' },
  { col: 7, row: 9, kind: 'heart' }, { col: 6, row: 11, kind: 'remote' },
].map(p => ({ ...p, kind: p.kind as PickupKind, visible: false }));
export class Game {
  events: Feedback[] = [];
  soundEnabled=true;
  hitStop=0;
  epoch=0;
  placementAge=1;
  kickAge=1;
  private stepDistance=0;
  emit(cue:Cue,x:number,y:number,variant?:number){if(this.events.length<128)this.events.push({cue,x,y,variant});}
  private trigger(b:Bomb){if(!b.chained){b.chained=true;const p=this.bombPosition(b);this.emit('chain',p.x,p.y);}b.fuse=Math.min(b.fuse,C.chainDelay);}

  board = createBoard();
  minions = createMinions();
  rivals = createRivals();
  clearAge = -1;
  stage: 1 | 2 = 1;
  boss: Boss | null = null;
  rng: number = C.seed;
  rivalPockets = [{ col: 1, row: 1, active: false, activation: 4 }, { col: 13, row: 1, active: false, activation: 10 }];
  private random = () => { this.rng = (Math.imul(1664525, this.rng) + 1013904223) >>> 0; return this.rng / 4294967296; };
  private dangerCells() {
    const cells = new Set<string>();
    for (const f of this.flames) if (f.age < C.lethalLife) for (const c of f.cells) cells.add(`${c.col},${c.row}`);
    for (const b of this.bombs) if (b.fuse < .8 || b.remote) {
      cells.add(`${b.col},${b.row}`);
      for (const [dx,dy] of Object.values(DIRECTIONS)) for (let n=1;n<=b.range;n++) {
        const col=b.col+dx*n,row=b.row+dy*n;
        if(this.board[row]?.[col] !== 'floor') break;
        cells.add(`${col},${row}`);
        if(this.bombs.some(other=>other!==b&&other.col===col&&other.row===row)) break;
      }
    }
    return cells;
  }
  player = { x: 72, y: 552, previousX: 72, previousY: 552, facing: 'up' as Direction, walk: 0, moving: false };
  bombs: Bomb[] = [];
  flames: Flame[] = [];
  debris: { col: number; row: number; age: number }[] = [];
  pickups = pickupLayout();
  capacity: number = C.bombCapacity;
  range: number = C.blastLength;
  speed: number = C.speed;
  remote = false;
  notice = '';
  noticeUntil = 0;
  lives = 3;
  dead = false;
  deathAge = 0;
  protection: number = C.protection;
  moved = false;
  placed = false;
  nextId = 1;
  time = 0;
  hintStarted = 0;
  update(input: Input) {
    if (input.take('restart')) { this.reset(); input.clear(); return; }
    if(input.take('mute'))this.soundEnabled=!this.soundEnabled;
    if(this.hitStop>0){this.hitStop=Math.max(0,this.hitStop-C.step);this.sync();return;}
    this.placementAge+=C.step;this.kickAge+=C.step;
    this.time += C.step;
    if (input.take('hint')) this.hintStarted = this.time;
    for (const d of this.debris) d.age += C.step;
    this.debris = this.debris.filter(d => d.age < 0.32);
    if (this.dead) {
      this.deathAge += C.step;
      for(const flame of this.flames)flame.age+=C.step;
      this.flames=this.flames.filter(f=>f.age<C.flameLife);
      if (this.deathAge >= C.respawnDelay) {
        if (this.lives === 0) this.reset();
        else { this.dead = false; this.protection = C.protection; this.respawn(); }
      }
      input.endTick(); return;
    }
    if (this.clearAge >= 0) {
      this.clearAge += C.step;
      if(this.clearAge>=.25)for (const f of this.flames) f.age += C.step;
      this.flames = this.flames.filter(f => f.age < C.flameLife);
      this.notice = this.stage===1 ? 'ARENA CLEAR' : 'SLICE CLEAR'; this.noticeUntil = this.time + 1;
      if(this.stage===1&&this.clearAge>=1.1){this.startBoss();input.clear();return;}
      if(this.stage===2&&this.clearAge>=1.8){this.reset();input.clear();return;}
      if (this.clearAge >= .25) { this.player.moving = false; this.sync(); input.endTick(); return; }
    }
    this.protection = Math.max(0, this.protection - C.step);
    if (input.take('bomb') && this.clearAge < 0) this.placeBomb();
    if (input.take('detonate') && this.remote) {
      const oldest = this.bombs.find(b => b.owner === 0 && b.remote);
      if (oldest) this.detonate(oldest);
    }
    this.advanceBombs();
    const blockers = [...this.bombBlockers(), ...this.rivals.filter(r => r.hp > 0).map(r => ({ col: Math.floor(r.x/C.tile), row: Math.floor(r.y/C.tile) }))];
    const p = this.player;
    p.previousX = p.x; p.previousY = p.y; p.moving = false;
    for (const direction of input.directions()) {
      const [dx, dy] = DIRECTIONS[direction];
      const perpendicular = dx ? p.y : p.x;
      const distance = this.speed * C.step;
      const direct = sweep(this.board, p.x, p.y, dx * distance, dy * distance, blockers);
      const obstructed = Math.hypot(direct.x - p.x, direct.y - p.y) < distance - 0.001;
      // Look in adjacent lanes too: at a tile edge the nearest center may belong to a pillar.
      // Only assist blocked movement, and sweep both the lateral route and forward clearance.
      if (obstructed) {
        const lane = Math.floor(perpendicular / C.tile);
        const candidates = [lane - 1, lane, lane + 1]
          .map(index => (index + 0.5) * C.tile)
          .filter(center => Math.abs(center - perpendicular) > 0.01 && Math.abs(center - perpendicular) <= C.cornerTolerance)
          .sort((a, b) => Math.abs(a - perpendicular) - Math.abs(b - perpendicular) || a - b);
        let assisted = false;
        for (const center of candidates) {
          const offset = center - perpendicular;
          const aligned = sweep(this.board, p.x, p.y, dx ? 0 : offset, dx ? offset : 0, blockers);
          const targetX = dx ? p.x : center, targetY = dx ? center : p.y;
          if (Math.hypot(aligned.x - targetX, aligned.y - targetY) > 0.01) continue;
          const probeDistance = C.radius + C.tile / 2;
          const forward = sweep(this.board, targetX, targetY, dx * probeDistance, dy * probeDistance, blockers);
          if (Math.hypot(forward.x - targetX, forward.y - targetY) < probeDistance - 0.01) continue;
          const shift = Math.sign(offset) * Math.min(Math.abs(offset), C.centerSpeed * C.step);
          const next = sweep(this.board, p.x, p.y, dx ? 0 : shift, dx ? shift : 0, blockers);
          if (Math.hypot(next.x - p.x, next.y - p.y) > 0.001) {
            this.move(next.x, next.y, direction); assisted = true; break;
          }
        }
        if (assisted) break;
      }
      const contacted = this.bombs.find(b => !b.pass && !b.direction && overlapsTile(p.x + dx * distance, p.y + dy * distance, b.col, b.row));
      if (contacted && Math.abs((dx ? p.y : p.x) - ((dx ? contacted.row : contacted.col) + 0.5) * C.tile) <= C.tile / 2 + C.radius) this.kick(contacted, direction);
      const next = sweep(this.board, p.x, p.y, dx * distance, dy * distance, blockers);
      if (Math.hypot(next.x - p.x, next.y - p.y) > 0.001) { this.move(next.x, next.y, direction); break; }
    }
    if (p.moving) this.moved = true;
    for (const pocket of this.rivalPockets) if (this.time >= pocket.activation || Math.abs(p.x / C.tile - pocket.col - .5) + Math.abs(p.y / C.tile - pocket.row - .5) < 2) pocket.active = true;
    if (this.clearAge < 0) { if(this.stage===1)this.updateRivals(); else if(this.boss){const state=this.boss.state;updateBoss(this,this.random);if(this.boss.state==='telegraph'&&state!=='telegraph')this.emit(this.boss.attack==='forge'?'forge':this.boss.attack==='kick'?'bossKick':'charge',this.boss.x,this.boss.y);} }
    const danger = this.dangerCells();
    for(const bomb of this.bombs){
      if(!bomb.minionEscape)bomb.minionEscape=this.minions.filter(m=>!m.dead&&overlapsTile(m.x,m.y,bomb.col,bomb.row,C.radius+.5)).map(m=>m.id);
      bomb.minionEscape=bomb.minionEscape.filter(id=>{const m=this.minions.find(m=>m.id===id);return m&&!m.dead&&overlapsTile(m.x,m.y,bomb.col,bomb.row,C.radius+.5);});
    }
    for (const minion of this.minions) updateMinion(minion, this.board, this.bombs.filter(b=>!b.minionEscape?.includes(minion.id)).flatMap(occupied), p, danger, this.time, this.random);
    for (const bomb of this.bombs) {
      if (bomb.pass && !overlapsTile(p.x, p.y, bomb.col, bomb.row, C.radius + 0.5)) bomb.pass = false;
      bomb.escape = bomb.escape.filter(id => { const r = this.rivals.find(r => r.id === id); return r && overlapsTile(r.x,r.y,bomb.col,bomb.row,C.radius+.5); });
      bomb.fuse -= C.step;
    }
    for (const flame of this.flames) flame.age += C.step;
    this.flames = this.flames.filter(f => f.age < C.flameLife);
    for (const bomb of [...this.bombs]) if (bomb.fuse <= 0) this.detonate(bomb);
    for (const minion of this.minions) if (!minion.dead && this.flames.some(f => f.age < C.lethalLife && f.cells.some(c => overlapsTile(minion.x, minion.y, c.col, c.row)))) { minion.dead = true; minion.deathAge = 0; this.emit('minion',minion.x,minion.y); }
    for (const r of this.rivals) if (r.hp > 0 && r.invulnerability <= 0) {
      const hit = this.flames.find(f => f.age < C.lethalLife && !r.hitIds.has(f.id) && f.cells.some(c => overlapsTile(r.x,r.y,c.col,c.row)));
      if(hit){r.hitIds.add(hit.id);r.hp--;this.emit(r.hp===0?'rivalDefeat':'rivalHit',r.x,r.y);r.invulnerability=RIVAL.invulnerability;r.stun=RIVAL.stun;r.bombLock=RIVAL.bombLock;r.route=[{col:Math.floor(r.x/C.tile),row:Math.floor(r.y/C.tile)}];r.wait=0;r.escapeUntil=0;r.goal=null;}
    }
    const bossContact=this.boss&&this.boss.hp>0&&Math.hypot(this.boss.x-p.x,this.boss.y-p.y)<BOSS.radius+C.radius;
    if(this.boss&&this.boss.hp>0&&this.boss.invulnerability<=0){
      const b=this.boss; b.hitIds=new Set([...b.hitIds].filter(id=>this.flames.some(f=>f.id===id)));
      const hit=this.flames.find(f=>f.age<C.lethalLife&&!b.hitIds.has(f.id)&&f.cells.some(c=>overlapsTile(b.x,b.y,c.col,c.row,BOSS.radius)));
      if(hit){b.hitIds.add(hit.id);b.hp--;this.emit(b.hp===0?'bossDefeat':'bossHit',b.x,b.y);if(b.hp===0)this.hitStop=.07;b.invulnerability=BOSS.invulnerability;if(b.hp===8||b.hp===4){b.phaseFlash=.35;this.emit('phase',b.x,b.y);}if(b.hp===0)b.state='defeated';}
    }
    if(this.protection===0&&bossContact)this.die();
    if (this.protection === 0 && this.minions.some(m => !m.dead && Math.hypot(m.x-p.x,m.y-p.y) < C.radius * 2)) this.die();
    for (const flame of this.flames) if (this.clearAge < 0 && flame.age < C.lethalLife) {
      for (const bomb of this.bombs) if (flame.cells.some(c => c.col === bomb.col && c.row === bomb.row)) this.trigger(bomb);
      if (this.protection === 0 && flame.cells.some(c => overlapsTile(p.x, p.y, c.col, c.row))) { this.die(); break; }
    }
    if (!this.dead) this.updatePickups();
    if (this.clearAge < 0 && (this.stage===1?this.minions.every(m => m.dead) && this.rivals.every(r => r.hp === 0):this.boss?.hp===0)) {
      this.clearAge = 0; this.emit('clear',360,312); this.bombs = []; // All remaining hazards become visual-only after the damage tick.
      this.notice = this.stage===1?'ARENA CLEAR':'SLICE CLEAR'; this.noticeUntil = this.time + 2;
    }
    input.endTick();
  }
  private startBoss() {
    this.stage=2;this.board=bossBoard();this.minions=[];this.rivals=[];this.bombs=[];this.flames=[];this.debris=[];this.boss=createBoss();this.clearAge=-1;
    this.pickups=[];
    if(this.capacity<4)this.pickups.push({col:5,row:10,kind:'bomb',visible:false});
    if(this.range<5)this.pickups.push({col:9,row:10,kind:'fire',visible:false});
    Object.assign(this.player,{x:72,y:552,moving:false});this.protection=C.protection;this.sync();this.hintStarted=this.time;this.notice='BOMB THE BOSS';this.noticeUntil=this.time+3;
  }
  private updateRivals() {
    for (const r of this.rivals) {
      r.previousX=r.x;r.previousY=r.y;
      r.invulnerability=Math.max(0,r.invulnerability-C.step);r.stun=Math.max(0,r.stun-C.step);r.bombLock=Math.max(0,r.bombLock-C.step);r.decision=Math.max(0,r.decision-C.step);
      r.hitIds = new Set([...r.hitIds].filter(id=>this.flames.some(f=>f.id===id)));
      if(r.hp<=0){r.deathAge+=C.step;continue;}
      if(!this.rivalPockets[r.id-1].active||r.stun>0)continue;
      const here={col:Math.floor(r.x/C.tile),row:Math.floor(r.y/C.tile)};
      const others=[...this.rivals.filter(o=>o!==r&&o.hp>0),this.player].map(o=>({col:Math.floor(o.x/C.tile),row:Math.floor(o.y/C.tile)}));
      const centered=Math.abs(r.x-(here.col+.5)*C.tile)<.01&&Math.abs(r.y-(here.row+.5)*C.tile)<.01;
      if(centered&&r.decision<=0&&r.wait<=0){
        r.decision=RIVAL.reaction;
        const oldest=this.bombs.find(b=>b.owner===r.id&&b.remote);
        if(oldest&&this.time>=r.escapeUntil){
          const blast=footprint(this.board,this.bombs,oldest,oldest.range,oldest.id);
          const projected=dangerMap(this.board,this.bombs.map(b=>b===oldest?{...b,fuse:0}:b),this.flames);
          const threatened=(projected.intervals.get(key(here))??[]).some(i=>i.start<.5);
          if(!threatened&&blast.some(c=>this.board[c.row]?.[c.col]==='soft'||this.protection<=0&&overlapsTile(this.player.x,this.player.y,c.col,c.row)))this.detonate(oldest);
        }
        const danger=dangerMap(this.board,this.bombs,this.flames);
        if(this.time<r.escapeUntil){
          let elapsed=0;let prior=here;let valid=true;
          for(const cell of r.route){const end=elapsed+(cell.wait??C.tile/r.speed);
            for(const c of [prior,cell])if(danger.remote.has(key(c))||(danger.intervals.get(key(c))??[]).some(i=>i.start<end+RIVAL.margin&&i.end>elapsed))valid=false;
            if(danger.blocked.has(key(cell))&&key(cell)!==key(here))valid=false;
            elapsed=end;prior=cell;
          }
          if((danger.intervals.get(key(prior))??[]).some(i=>i.start<r.escapeUntil-this.time&&i.end>elapsed)||danger.remote.has(key(prior)))valid=false;
          if(valid){travelRival(r,this.board,this.bombs,others);continue;}
          r.escapeUntil=0;r.route=[];
        }
        const urgent=(danger.intervals.get(key(here))??[]).some(i=>i.start<.9)||danger.remote.has(key(here));
        const routes=timedRoutes(r,this.board,danger,others,urgent?Math.min(3,Math.max(.9,...(danger.intervals.get(key(here))??[]).map(i=>i.end))):0);
        const viable=routes.filter(p=>p.route.length>0);
        // Strong safety priorities precede aggression. Unknown remote timing is never guessed.
        if(urgent){
          const escapes=viable.length?viable:timedRoutes(r,this.board,danger,others,0,true).filter(p=>p.route.length>0&&!danger.remote.has(key(p.cell)));
          escapes.sort((a,b)=>a.time-b.time||key(a.cell).localeCompare(key(b.cell)));
          r.route=escapes[0]?.route??[];r.goal=null;
        } else {
          let acted=false;
          if(r.bombLock<=0){
            for(const direction of Object.keys(DIRECTIONS) as Direction[]){
              const [dx,dy]=DIRECTIONS[direction];const bomb=this.bombs.find(b=>!b.direction&&b.col===here.col+dx&&b.row===here.row+dy);
              if(!bomb||!this.laneFree(bomb,direction)||bomb.fuse<.6)continue;
              const moved={...bomb,direction,pass:false,escape:[]};
              const possible=this.bombs.map(b=>b===bomb?moved:b);
              const escape=timedRoutes(r,this.board,dangerMap(this.board,possible,this.flames),others,Math.min(3,bomb.fuse+C.lethalLife+RIVAL.margin)).filter(p=>p.route.length>0).sort((a,b)=>a.time-b.time);
              const pressure=footprint(this.board,possible,{col:bomb.col+dx,row:bomb.row+dy},bomb.range,bomb.id).some(c=>this.board[c.row]?.[c.col]==='soft'||overlapsTile(this.player.x,this.player.y,c.col,c.row));
              if(pressure&&escape.length){this.kick(bomb,direction);r.route=escape[0].route;r.escapeUntil=this.time+Math.min(3,bomb.fuse+C.lethalLife+RIVAL.margin);r.bombLock=.45;acted=true;break;}
            }
            if(!acted&&this.bombs.filter(b=>b.owner===r.id).length<r.capacity&&!this.bombBlockers(true).some(c=>key(c)===key(here))&&this.bombs.length+this.flames.length<24){
              const proposed:Bomb={id:this.nextId,owner:r.id,escape:[r.id],...here,fuse:C.bombFuse,remote:false,range:r.range,pass:overlapsTile(this.player.x,this.player.y,here.col,here.row),direction:null,travel:0};
              const targets=footprint(this.board,this.bombs,here,r.range);
              const playerDistance=(c:{col:number;row:number})=>Math.abs(c.col-Math.floor(this.player.x/C.tile))+Math.abs(c.row-Math.floor(this.player.y/C.tile));
              const visibleGoals=this.pickups.filter(p=>p.visible&&this.rivalWants(r,p.kind));
              const useful=targets.some(c=>overlapsTile(this.player.x,this.player.y,c.col,c.row)||this.board[c.row]?.[c.col]==='soft'&&(playerDistance(c)<playerDistance(here)||visibleGoals.some(p=>Math.abs(c.col-p.col)+Math.abs(c.row-p.row)<Math.abs(here.col-p.col)+Math.abs(here.row-p.row))));
              const threatensProtected=this.protection>0&&targets.some(c=>overlapsTile(this.player.x,this.player.y,c.col,c.row));
              if(useful&&!threatensProtected){
                const escape=timedRoutes(r,this.board,dangerMap(this.board,[...this.bombs,proposed],this.flames),others,C.bombFuse+C.lethalLife+RIVAL.margin).filter(p=>p.route.length>0).sort((a,b)=>a.time-b.time);
                if(escape.length){this.nextId++;if(r.remote){proposed.remote=true;proposed.fuse=Infinity;}proposed.placedAt=this.time;this.bombs.push(proposed);this.emit('place',r.x,r.y);r.route=escape[0].route;r.escapeUntil=this.time+C.bombFuse+C.lethalLife+RIVAL.margin;r.bombLock=.45;acted=true;}
              }
            }
          }
          if(!acted){
            const playerCell={col:Math.floor(this.player.x/C.tile),row:Math.floor(this.player.y/C.tile)};
            const rank=(p:typeof viable[number])=>{
              const distance=Math.abs(p.cell.col-playerCell.col)+Math.abs(p.cell.row-playerCell.row);
              const pickup=this.pickups.some(item=>item.visible&&this.rivalWants(r,item.kind)&&key(item)===key(p.cell))?6:0;
              const recent=r.recent.includes(key(p.cell))?3:0;
              const held=r.goal&&key(r.goal)===key(p.cell)&&this.time<r.goalUntil?-6:0;
              return distance*2-pickup+(r.id===2&&p.cell.col!==playerCell.col&&p.cell.row!==playerCell.row?-1:0)+p.time+recent+held;
            };
            viable.sort((a,b)=>rank(a)-rank(b)||a.time-b.time||key(a.cell).localeCompare(key(b.cell)));
            const unique=viable.filter((p,i)=>viable.findIndex(o=>key(o.cell)===key(p.cell))===i);
            const choice=unique[this.random()<.125&&unique.length>1?1:0];
            if(choice){r.route=choice.route;r.goal=choice.cell;r.goalUntil=this.time+RIVAL.goalHold;}
            else r.route=[];
          }
        }
      }
      travelRival(r,this.board,this.bombs,others);
    }
  }
  private rivalWants(r:Rival, kind:PickupKind) {
    return kind==='bomb'?r.capacity<4:kind==='fire'?r.range<5:kind==='speed'?r.speed<201:kind==='heart'?r.hp<RIVAL.hp:!r.remote;
  }
  private updatePickups() {
    this.pickups = this.pickups.filter(pickup => {
      const flames = this.flames.filter(f => f.cells.some(c => c.col === pickup.col && c.row === pickup.row));
      if (!pickup.visible) {
        if (this.board[pickup.row][pickup.col] === 'floor' && flames.length === 0) {pickup.visible = true;pickup.revealedAt=this.time;this.emit('reveal',(pickup.col+.5)*48,(pickup.row+.5)*48);}
        return true;
      }
      if (flames.some(f => f.age < C.lethalLife)) return false;
      const playerEligible=overlapsTile(this.player.x,this.player.y,pickup.col,pickup.row)&&!(pickup.kind==='heart'&&this.lives===3);
      if(!playerEligible){
        const rival=this.rivals.find(r=>r.hp>0&&this.rivalWants(r,pickup.kind)&&overlapsTile(r.x,r.y,pickup.col,pickup.row));
        if(!rival)return true;
        if(pickup.kind==='bomb')rival.capacity=Math.min(4,rival.capacity+1);
        if(pickup.kind==='fire')rival.range=Math.min(5,rival.range+1);
        if(pickup.kind==='speed')rival.speed=Math.min(201,rival.speed+12);
        if(pickup.kind==='heart')rival.hp=Math.min(RIVAL.hp,rival.hp+1);
        if(pickup.kind==='remote')rival.remote=true;
        this.emit('collect',(pickup.col+.5)*48,(pickup.row+.5)*48,['bomb','fire','speed','heart','remote'].indexOf(pickup.kind));
        this.notice=`RIVAL ${rival.id===1?'A':'B'} TOOK ${pickup.kind.toUpperCase()}`;this.noticeUntil=this.time+2;
        return false;
      }
      if (pickup.kind === 'heart' && this.lives === 3) return true;
      if (pickup.kind === 'bomb') this.capacity = Math.min(4, this.capacity + 1);
      if (pickup.kind === 'fire') this.range = Math.min(5, this.range + 1);
      if (pickup.kind === 'speed') this.speed = Math.min(201, this.speed + 12);
      if (pickup.kind === 'heart') this.lives = Math.min(3, this.lives + 1);
      if (pickup.kind === 'remote') { this.remote = true; this.hintStarted = this.time; }
      this.emit('collect',(pickup.col+.5)*48,(pickup.row+.5)*48,['bomb','fire','speed','heart','remote'].indexOf(pickup.kind));
      this.notice = { bomb: 'BOMB CAPACITY UP', fire: 'FLAME RANGE UP', speed: 'SPEED UP', heart: 'LIFE RESTORED', remote: 'REMOTE READY · C DETONATES' }[pickup.kind];
      this.noticeUntil = this.time + 2;
      return false;
    });
  }
  bombPosition(b: Bomb) {
    const [dx, dy] = b.direction ? DIRECTIONS[b.direction] : [0, 0];
    return { x: (b.col + 0.5) * C.tile + dx * b.travel, y: (b.row + 0.5) * C.tile + dy * b.travel };
  }
  private bombBlockers(includePass = false) {
    return this.bombs.flatMap(b => {
      if (b.pass && !includePass) return [];
      const cells = [{ col: b.col, row: b.row }];
      if (b.direction) { const [dx, dy] = DIRECTIONS[b.direction]; cells.push({ col: b.col + dx, row: b.row + dy }); }
      return cells;
    });
  }
  private laneFree(b: Bomb, direction: Direction) {
    const [dx, dy] = DIRECTIONS[direction], col = b.col + dx, row = b.row + dy;
    return this.board[row]?.[col] === 'floor' && !this.bombs.some(other => {
      if (other === b) return false;
      if (other.col === col && other.row === row) return true;
      if (!other.direction) return false;
      const [ox, oy] = DIRECTIONS[other.direction];
      return other.col + ox === col && other.row + oy === row;
    }) && !overlapsTile(this.player.x, this.player.y, col, row) && !this.minions.some(m => !m.dead && overlapsTile(m.x, m.y, col, row)) && !this.rivals.some(r=>r.hp>0&&overlapsTile(r.x,r.y,col,row)) && !(this.boss&&this.boss.hp>0&&overlapsTile(this.boss.x,this.boss.y,col,row,BOSS.radius));
  }
  private kick(b: Bomb, direction: Direction) {
    if (this.laneFree(b, direction)) { b.direction = direction; b.pass = false; this.kickAge=0;const p=this.bombPosition(b);this.emit('kick',p.x,p.y); }
  }
  private advanceBombs() {
    // Stable time-to-center ordering; destination reservations prevent opposing bombs overlapping.
    const moving = this.bombs.filter(b => b.direction).sort((a, b) => (C.tile - a.travel) - (C.tile - b.travel) || a.id - b.id);
    for (const b of moving) {
      b.travel += (b.kickSpeed??C.kickSpeed) * C.step;
      if (b.travel >= C.tile && b.direction) {
        const [dx, dy] = DIRECTIONS[b.direction]; b.col += dx; b.row += dy; b.travel -= C.tile;
        if (!this.laneFree(b, b.direction)) { b.direction = null; b.travel = 0; }
      }
      // Trigger against every reserved tile so a moving bomb cannot cross a live flame unnoticed.
      if (this.flames.some(f => f.age < C.lethalLife && f.cells.some(c => c.col === b.col && c.row === b.row || b.direction && c.col === b.col + DIRECTIONS[b.direction][0] && c.row === b.row + DIRECTIONS[b.direction][1]))) this.trigger(b);
    }
  }
  private placeBomb() {
    const col = Math.floor(this.player.x / C.tile), row = Math.floor(this.player.y / C.tile);
    if (this.bombs.length + this.flames.length >= 24 || this.bombs.filter(b => b.owner === 0).length >= this.capacity || this.board[row]?.[col] !== 'floor' || this.bombBlockers(true).some(b => b.col === col && b.row === row)) return;
    this.bombs.push({ id: this.nextId++, owner: 0, placedAt:this.time, escape: this.rivals.filter(r=>r.hp>0&&overlapsTile(r.x,r.y,col,row)).map(r=>r.id), col, row, fuse: this.remote ? Infinity : C.bombFuse, remote: this.remote, range: this.range, pass: true, direction: null, travel: 0 }); this.placed = true;this.placementAge=0;this.emit('place',(col+.5)*48,(row+.5)*48);
  }
  private detonate(bomb: Bomb) {
    this.emit('explode',(bomb.col+.5)*48,(bomb.row+.5)*48,bomb.id%5);
    this.bombs = this.bombs.filter(b => b.id !== bomb.id);
    const cells = [{ col: bomb.col, row: bomb.row }];
    for (const [dx, dy] of Object.values(DIRECTIONS)) for (let n = 1; n <= bomb.range; n++) {
      const col = bomb.col + dx * n, row = bomb.row + dy * n;
      if (!this.board[row]?.[col] || this.board[row][col] === 'hard') break;
      cells.push({ col, row });
      if (this.board[row][col] === 'soft') {
        this.board[row][col] = 'floor';this.emit('block',(col+.5)*48,(row+.5)*48);
        if (this.debris.length < 32) this.debris.push({ col, row, age: 0 });
        break;
      }
      const hit = this.bombs.find(b => occupied(b).some(c=>c.col===col&&c.row===row));
      if (hit) { this.trigger(hit); break; }
    }
    this.flames.push({ id: this.nextId++, cells, age: 0 });
  }
  private respawn() {
    const pockets = [[1,11],[13,11],[1,1],[13,1]].filter(([col,row]) => {
      if(this.board[row][col]!=='floor')return false;
      const origin={col,row};const blast=new Set(footprint(this.board,[],origin,this.range).map(key));
      const queue=[{col,row,steps:0}],seen=new Set([key(origin)]);
      for(let i=0;i<queue.length;i++){
        const c=queue[i];if(!blast.has(key(c)))return true;
        if((c.steps+1)*C.tile/this.speed>C.bombFuse-RIVAL.margin)continue;
        for(const [dx,dy] of Object.values(DIRECTIONS)){
          const next={col:c.col+dx,row:c.row+dy,steps:c.steps+1};
          if(this.board[next.row]?.[next.col]==='floor'&&!seen.has(key(next))){seen.add(key(next));queue.push(next);}
        }
      }
      return false;
    });
    pockets.sort((a,b) => {
      const safety = ([col,row]: number[]) => Math.min(10000,...[...this.minions.filter(m=>!m.dead),...this.rivals.filter(r=>r.hp>0),...(this.boss&&this.boss.hp>0?[this.boss]:[])].map(m=>Math.hypot(m.x-(col+.5)*C.tile,m.y-(row+.5)*C.tile)));
      return safety(b)-safety(a);
    });
    const [col,row]=pockets[0] ?? [1,11];
    Object.assign(this.player,{x:(col+.5)*C.tile,y:(row+.5)*C.tile,moving:false});this.sync();
  }
  private die() { if (this.dead) return; this.lives--; this.dead = true;this.hitStop=Math.max(this.hitStop,.05);this.emit('death',this.player.x,this.player.y); this.deathAge = 0; this.player.moving = false; this.bombs = []; if(this.boss&&this.boss.hp>0){this.boss.state='recover';this.boss.timer=.5;this.boss.marks=[];this.boss.target={x:this.boss.anchorX,y:this.boss.anchorY};} }

  private move(x: number, y: number, facing: Direction) {
    const p = this.player;const distance=Math.hypot(x-p.x,y-p.y);this.stepDistance+=distance;if(this.stepDistance>=24){this.stepDistance%=24;this.emit('step',x,y);} p.walk += distance / 13; p.x = x; p.y = y; p.facing = facing; p.moving = true;
  }
  reset() { this.events=[];this.epoch++;this.hitStop=0;this.placementAge=1;this.kickAge=1;this.stepDistance=0;this.board = createBoard(); this.minions = createMinions(); this.rivals = createRivals(); this.clearAge = -1; this.stage=1; this.boss=null; this.rng = C.seed; for (const pocket of this.rivalPockets) pocket.active = false; Object.assign(this.player, { x: 72, y: 552, previousX: 72, previousY: 552, facing: 'up', walk: 0, moving: false }); this.time = 0; this.hintStarted = 0; this.bombs = []; this.flames = []; this.debris = []; this.lives = 3; this.dead = false; this.deathAge = 0; this.protection = C.protection; this.moved = false; this.placed = false; this.nextId = 1; this.pickups = pickupLayout(); this.capacity = C.bombCapacity; this.range = C.blastLength; this.speed = C.speed; this.remote = false; this.notice = ''; this.noticeUntil = 0; }
  sync() { this.player.previousX = this.player.x; this.player.previousY = this.player.y; if(this.boss){this.boss.previousX=this.boss.x;this.boss.previousY=this.boss.y;} for(const r of this.rivals){r.previousX=r.x;r.previousY=r.y;} for(const m of this.minions){m.previousX=m.x;m.previousY=m.y;} }
}
