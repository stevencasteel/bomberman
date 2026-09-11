import type { Effects } from './feedback';
import { CONFIG as C, LABELS, DIRECTIONS, type Direction } from './config';
import type { Game } from './game';
import type { Input } from './input';
export function render(ctx: CanvasRenderingContext2D, game: Game, input: Input, alpha: number, suspended: boolean, effects: Effects) {
  const rect = (x: number, y: number, w: number, h: number, color: string, radius = 0) => { ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(x, y, w, h, radius); ctx.fill(); };
  const text = (label: string, x: number, y: number, size: number, color: string, align: CanvasTextAlign = 'left') => { ctx.fillStyle = color; ctx.font = `600 ${size}px ui-monospace, SFMono-Regular, monospace`; ctx.textAlign = align; ctx.fillText(label, x, y); };
  rect(0, 0, 720, 720, '#101927');
  text(game.stage===1?'BOMBER / 01':'BOILER / 02', 20, 30, 18, '#e8f3f5');
  if(game.stage===1)text(`ENEMIES ${game.minions.filter(m => !m.dead).length + game.rivals.filter(r=>r.hp>0).length}/8`, 360, 30, 14, '#8aa0b5', 'center');
  text(`LIVES ${game.lives}  ·  BOMBS ${game.capacity - game.bombs.filter(b=>b.owner===0).length}/${game.capacity}`, 700, 30, 12, '#8de5cf', 'right');
  if(game.boss){
    for(let i=0;i<12;i++)rect(278+i*14,16,11,14,i<game.boss.hp?(game.boss.hp<=4?'#ff715f':'#ffc16f'):'#263746',2);
  }
  ctx.save();ctx.beginPath();ctx.rect(0,C.hud,720,624);ctx.clip();
  const shake=effects.shake();ctx.translate(shake.x,C.hud+shake.y);
  for (let y = 0; y < C.rows; y++) for (let x = 0; x < C.columns; x++) {
    const px = x * C.tile, py = y * C.tile;
    rect(px, py, 48, 48, (x + y) % 2 ? '#233641' : '#263b46');
    rect(px + 2, py + 2, 44, 1, '#304752');
    if (game.board[y][x] === 'soft') {
      rect(px + 3, py + 6, 42, 41, '#3c2b28', 5);
      rect(px + 3, py + 2, 42, 38, '#b9784e', 5);
      rect(px + 6, py + 5, 36, 5, '#dfaa74', 2);
      rect(px + 8, py + 13, 32, 23, '#965836', 2);
      ctx.strokeStyle = '#e0a371'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(px + 10, py + 14); ctx.lineTo(px + 38, py + 34); ctx.moveTo(px + 38, py + 14); ctx.lineTo(px + 10, py + 34); ctx.stroke();
    }
    if (game.board[y][x] === 'hard') {
      rect(px + 3, py + 6, 44, 42, '#111f2b', 5);
      rect(px + 2, py + 2, 44, 41, '#385368', 5);
      rect(px + 3, py + 2, 42, 32, '#597789', 4);
      rect(px + 6, py + 5, 36, 2, '#7895a5', 1);
      rect(px + 7, py + 29, 34, 2, '#496779');
      rect(px + 9, py + 12, 4, 4, '#405d72', 1);
      rect(px + 35, py + 12, 4, 4, '#405d72', 1);
    }
  }
  if(game.boss){
    const b=game.boss,bx=b.previousX+(b.x-b.previousX)*alpha,by=b.previousY+(b.y-b.previousY)*alpha;
    const warning=b.state==='telegraph'||b.state==='flight';
    if(warning){
      ctx.strokeStyle=b.attack==='forge'?'#ffd385':b.attack==='kick'?'#81e8dc':'#ff8c70';ctx.lineWidth=3;
      for(const mark of b.marks){const mx=(mark.col+.5)*48,my=(mark.row+.5)*48;ctx.beginPath();ctx.arc(mx,my,19+Math.sin(game.time*12)*2,0,Math.PI*2);ctx.stroke();
        if(b.state==='flight'){const t=1-b.timer/.28,x=bx+(mx-bx)*t,y=by+(my-by)*t-Math.sin(t*Math.PI)*70;ctx.fillStyle='#d79559';ctx.beginPath();ctx.arc(x,y,12,0,Math.PI*2);ctx.fill();}}
      if(b.attack!=='forge'){
        const [dx,dy]=DIRECTIONS[b.direction];
        for(let n=1;n<=(b.attack==='charge'?4:2);n++){const x=bx+dx*n*48,y=by+dy*n*48;if(game.board[Math.floor(y/48)]?.[Math.floor(x/48)]==='hard')break;ctx.beginPath();ctx.moveTo(x-dx*8-dy*9,y-dy*8+dx*9);ctx.lineTo(x+dx*6,y+dy*6);ctx.lineTo(x-dx*8+dy*9,y-dy*8-dx*9);ctx.stroke();}
      }
    }
    if(b.hp>0){
      ctx.fillStyle='#07131d88';ctx.beginPath();ctx.ellipse(bx,by+10,30,18,0,0,Math.PI*2);ctx.fill();
      ctx.save();if(b.invulnerability>0)ctx.globalAlpha=Math.sin(game.time*40)>0?1:.5;
      rect(bx-28,by+17,20,15,'#697f88',5);rect(bx+8,by+17,20,15,'#697f88',5);
      rect(bx-45,by-13,18,24,'#dba56c',6);rect(bx+27,by-13,18,24,'#dba56c',6);
      rect(bx-34,by-38,68,61,'#925643',18);rect(bx-29,by-35,58,48,'#d19868',15);
      rect(bx-25,by-20,50,23,'#283643',7);
      rect(bx-18,by-13,11,5,'#ffe0a0',2);rect(bx+7,by-13,11,5,'#ffe0a0',2);
      rect(bx-20,by+6,40,9,b.hp<=4?'#ff604b':'#ffb357',3);
      for(let i=0;i<5;i++)rect(bx-17+i*8,by+6,3,9,'#754c42');
      ctx.fillStyle='#142a39';ctx.beginPath();ctx.arc(bx,by-36,14,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='#ffdd93';ctx.lineWidth=2;const angle=-Math.PI+(12-b.hp)/12*Math.PI+(warning?.6:0);ctx.beginPath();ctx.moveTo(bx,by-36);ctx.lineTo(bx+Math.cos(angle)*10,by-36+Math.sin(angle)*10);ctx.stroke();
      ctx.restore();
      if(warning)text(b.attack==='forge'?'FORGE DROP':b.attack==='kick'?'BOILER KICK':'PRESSURE CHARGE',bx,by-61,12,'#ffd385','center');
      if(b.phaseFlash>0){ctx.strokeStyle='#ffb76e';ctx.lineWidth=3;ctx.beginPath();ctx.arc(bx,by,42+(1-b.phaseFlash/.35)*15,0,Math.PI*2);ctx.stroke();}
    }else if(game.clearAge<.6){
      const t=Math.max(0,game.clearAge);ctx.globalAlpha=1-t/.6;for(let i=0;i<12;i++){const a=i*Math.PI/6;rect(bx+Math.cos(a)*t*160-5,by+Math.sin(a)*t*160-5,10,10,i%2?'#d19868':'#8ab2bf',3);}ctx.globalAlpha=1;
    }
  }
  for (const bomb of game.bombs) {
    const { x: bx, y: by } = game.bombPosition(bomb);
    const placement=Math.max(0,1-(game.time-(bomb.placedAt??-10))/.12);
    const pulse = 1-placement*.12 + Math.sin((bomb.remote && !Number.isFinite(bomb.fuse) ? game.time : C.bombFuse - bomb.fuse) * (bomb.fuse < 0.7 ? 32 : 12)) * 0.05;
    ctx.fillStyle = '#0a132999'; ctx.beginPath(); ctx.ellipse(bx, by + 12, 18, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = bomb.fuse < 0.7 ? '#683848' : bomb.owner === 1 ? '#675130' : bomb.owner === 2 ? '#553f70' : bomb.owner===3?'#875136':'#243349'; ctx.beginPath(); ctx.arc(bx, by, 15 * pulse, 0, Math.PI * 2); ctx.fill();
    rect(bx - 8, by - 10, 7, 4, bomb.chained?'#ffffff':'#8ea9bd', 2);
    ctx.strokeStyle = '#ffb76e'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(bx + 3, by - 13); ctx.lineTo(bx + 7, by - 20); ctx.stroke();
    ctx.fillStyle = '#fff3b0'; ctx.beginPath(); ctx.arc(bx + 7, by - 20, bomb.fuse < 0.7 ? 4 : 2.5, 0, Math.PI * 2); ctx.fill();
    if (bomb.remote) { rect(bx - 3, by - 24, 2, 12, '#9ef0c4'); rect(bx - 5, by - 26, 6, 4, '#9ef0c4', 2); }
    ctx.strokeStyle = bomb.remote ? '#9ef0c4' : '#ffb76e'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(bx, by, 15 * pulse - 1, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (Number.isFinite(bomb.fuse) ? Math.max(0, bomb.fuse / (bomb.initialFuse??C.bombFuse)) : 1)); ctx.stroke();
  }
  for (const pickup of game.pickups) if (pickup.visible) {
    const px = (pickup.col + 0.5) * C.tile, py = (pickup.row + 0.5) * C.tile - Math.sin(Math.min(1,(game.time-(pickup.revealedAt??0))/.18)*Math.PI)*6;
    rect(px - 16, py - 17, 32, 32, '#112835', 7);
    const color = { bomb: '#91d6ff', fire: '#ffab69', speed: '#e7e684', heart: '#ff8b9d', remote: '#9ef0c4' }[pickup.kind];
    if (pickup.kind === 'bomb') { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(px, py, 9, 0, Math.PI * 2); ctx.fill(); rect(px + 4, py - 12, 3, 5, color); }
    if (pickup.kind === 'fire') { ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(px, py - 12); ctx.lineTo(px + 10, py + 8); ctx.lineTo(px - 10, py + 8); ctx.closePath(); ctx.fill(); }
    if (pickup.kind === 'speed') text('»', px, py + 7, 25, color, 'center');
    if (pickup.kind === 'heart') text('♥', px, py + 7, 23, color, 'center');
    if (pickup.kind === 'remote') { rect(px - 7, py - 6, 14, 17, color, 3); rect(px + 3, py - 13, 2, 8, color); rect(px - 3, py - 2, 6, 5, '#112835', 1); }
  }
  for (const flame of game.flames) {
    const lethal = flame.age < C.lethalLife;
    ctx.globalAlpha = lethal ? 0.95 : Math.max(0, (C.flameLife - flame.age) / (C.flameLife - C.lethalLife)) * 0.35;
    for (const cell of flame.cells) {
      const fx = cell.col * C.tile, fy = cell.row * C.tile;
      rect(fx + 1, fy + 1, 46, 46, lethal ? '#fa723e' : '#bb634d', 7);
      const core=12+20*Math.min(1,flame.age/.07);rect(fx+24-core/2,fy+24-core/2,core,core,'#ffc96c',Math.min(9,core/2));
      rect(fx + 17, fy + 11, 14, 26, '#fff2ba', 6);
    }
    ctx.globalAlpha = 1;
  }
  for (const d of game.debris) {
    ctx.globalAlpha = Math.max(0, 1 - d.age / 0.32);
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4, distance = d.age * (65 + i % 3 * 15);
      rect((d.col + 0.5) * C.tile + Math.cos(a) * distance - 3, (d.row + 0.5) * C.tile + Math.sin(a) * distance - 3, 6, 6, i % 2 ? '#dfaa74' : '#965836', 1);
    }
    ctx.globalAlpha = 1;
  }
  for (const m of game.minions) {
    if (m.dead && m.deathAge >= .26) continue;
    const mx = m.previousX + (m.x-m.previousX)*alpha, my = m.previousY + (m.y-m.previousY)*alpha;
    if (m.dead) {
      if(m.deathAge<.06){rect(mx-13,my-5,26,Math.max(2,16*(1-m.deathAge/.06)),'#d9a5e3',2);continue;}
      ctx.globalAlpha = Math.max(0,1-m.deathAge/.26);
      for(let i=0;i<6;i++){const a=i*Math.PI/3;rect(mx+Math.cos(a)*m.deathAge*110-3,my+Math.sin(a)*m.deathAge*110-3,6,6,'#d9a5e3',2);}
      ctx.globalAlpha=1; continue;
    }
    const bob=Math.sin(game.time*7+m.id)*2;
    ctx.fillStyle='#0a172b77';ctx.beginPath();ctx.ellipse(mx,my+8,17,7,0,0,Math.PI*2);ctx.fill();
    rect(mx-13,my-12+bob,26,23,m.id%2?'#b581cd':'#c58bb0',8);
    ctx.fillStyle='#e0b2eb';ctx.beginPath();ctx.moveTo(mx-11,my-8+bob);ctx.lineTo(mx-15,my-20+bob);ctx.lineTo(mx-3,my-12+bob);ctx.moveTo(mx+11,my-8+bob);ctx.lineTo(mx+15,my-20+bob);ctx.lineTo(mx+3,my-12+bob);ctx.fill();
    rect(mx-8,my-5+bob,6,7,'#192637',2);rect(mx+2,my-5+bob,6,7,'#192637',2);
    rect(mx-8,my+8,5,5,'#e0b2eb',2);rect(mx+3,my+8,5,5,'#e0b2eb',2);
  }
  for (const r of game.rivals) {
    const rx=r.previousX+(r.x-r.previousX)*alpha, ry=r.previousY+(r.y-r.previousY)*alpha;
    const color=r.id===1?'#ffc16f':'#c39bff';
    if(r.hp===0){
      if(r.deathAge<.35){ctx.globalAlpha=1-r.deathAge/.35;for(let i=0;i<8;i++){const a=i*Math.PI/4;rect(rx+Math.cos(a)*r.deathAge*110-3,ry+Math.sin(a)*r.deathAge*110-3,7,7,color,2);}ctx.globalAlpha=1;}
      continue;
    }
    const active=game.rivalPockets[r.id-1].active;
    const bob=Math.sin(game.time*(active?8:2)+r.id)*1.2;
    ctx.fillStyle='#0a172b77';ctx.beginPath();ctx.ellipse(rx,ry+8,18,8,0,0,Math.PI*2);ctx.fill();
    ctx.save();if(r.invulnerability>0)ctx.globalAlpha=Math.sin(game.time*35)>0?1:.4;
    rect(rx-11,ry+6,9,7,color,3);rect(rx+2,ry+6,9,7,color,3);
    rect(rx-11,ry-7+bob,22,18,'#34465a',5);
    rect(rx-16,ry-6+bob,7,10,color,3);rect(rx+9,ry-6+bob,7,10,color,3);
    rect(rx-16,ry-25+bob,32,25,color,7);
    rect(rx-12,ry-18+bob,24,12,'#182837',3);
    const look=active?(r.facing==='left'?-2:r.facing==='right'?2:0):Math.sign(game.player.x-rx)*2;
    rect(rx-7+look,ry-14+bob,5,3,'#f1f0d4',1);rect(rx+2+look,ry-14+bob,5,3,'#f1f0d4',1);
    rect(rx-4,ry-29+bob,8,6,'#e4edf1',2);ctx.restore();
    for(let i=0;i<4;i++)rect(rx-17+i*9,ry-39,7,4,i<r.hp?color:'#26313f',1);
  }
  const p = game.player;
  const x = p.previousX + (p.x - p.previousX) * alpha, y = p.previousY + (p.y - p.previousY) * alpha;
  const bob = p.moving ? Math.sin(p.walk * 2) * 1.2 : Math.sin(game.time * 2.5) * 0.5;
  ctx.save();
  if (game.dead) ctx.globalAlpha = 0;
  else if (game.protection > 0) ctx.globalAlpha = Math.sin(game.time * 25) > 0 ? 1 : 0.45;
  ctx.fillStyle = '#0a172b77'; ctx.beginPath(); ctx.ellipse(x, y + 8, 17, 8, 0, 0, Math.PI * 2); ctx.fill();
  const stride = p.moving ? Math.sin(p.walk) * 3 : 0;
  rect(x - 11, y + 6 + stride, 9, 7, '#ffaf6f', 3); rect(x + 2, y + 6 - stride, 9, game.kickAge<.06?7.56:7, '#ffaf6f', 3);
  rect(x - 10, y - 6 + bob, 20, 18, '#27b8b8', 6);
  const reach=game.placementAge<.17?Math.sin(game.placementAge/.17*Math.PI)*3:0;
  rect(x - 15 - reach, y - 4 + bob - stride * 0.5, 7, 10, '#edf3ee', 3);
  rect(x + 8 + reach, y - 4 + bob + stride * 0.5, 7, 10, '#edf3ee', 3);
  rect(x - 15, y - 23 + bob, 30, 24, '#a8c7d0', 9);
  rect(x - 14, y - 24 + bob, 28, 22, '#f0f4e9', 8);
  const eyeOffset = p.facing === 'left' ? -3 : p.facing === 'right' ? 3 : 0;
  rect(x - 10 + eyeOffset, y - 16 + bob, 20, 10, p.facing === 'up' ? '#cedddc' : '#162d3f', 4);
  if (p.facing !== 'up') { rect(x - 5 + eyeOffset, y - 14 + bob, 2, 5, '#a0f6ec', 1); rect(x + 3 + eyeOffset, y - 14 + bob, 2, 5, '#a0f6ec', 1); }
  rect(x - 4, y - 30 + bob, 8, 8, '#ffad6f', 4);
  ctx.restore();
  if (game.protection > 0 && !game.dead) { ctx.strokeStyle = '#8de5cf'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x, y + 5, 21, 12, 0, 0, Math.PI * 2); ctx.stroke(); }
  if (game.dead) {
    const progress = game.deathAge / C.respawnDelay;
    ctx.globalAlpha = 1 - progress;
    for (let i = 0; i < 12; i++) { const angle = i * Math.PI / 6; const distance = progress * 64; rect(x + Math.cos(angle) * distance - 3, y + Math.sin(angle) * distance - 3, 6, 6, i % 2 ? '#8de5cf' : '#ffb76e', 2); }
    ctx.globalAlpha = 1;
  }
  effects.draw(ctx);
  ctx.restore();
  rect(0, 672, 720, 48, '#101927');
  const age = game.time - game.hintStarted;
  ctx.globalAlpha = Math.max(0, Math.min(1, (game.moved && game.placed ? 5 : 10) - age));
  const dirs: Direction[] = ['left', 'up', 'down', 'right'];
  dirs.forEach((d, i) => { const pressed = input.down(d); rect(18 + i * 32, 683, 27, 27, pressed ? '#8de5cf' : '#2d4255', 5); text(LABELS[d], 31.5 + i * 32, 702, 17, pressed ? '#102b33' : '#e1edf4', 'center'); });
  text('Move', 156, 702, 14, '#d5e4ed'); rect(230, 683, 27, 27, input.down('bomb') ? '#8de5cf' : '#2d4255', 5); text(LABELS.bomb, 244, 702, 17, '#e1edf4', 'center'); text('Bomb', 268, 702, 14, '#d5e4ed'); ctx.globalAlpha = 1;
  text(game.remote ? 'C Detonate' : `FIRE ${game.range}`, 360, 702, 11, input.down('detonate')?'#fff2be':'#9ef0c4');
  text('H Help', 464, 702, 11, '#91a7ba');text(game.soundEnabled?'M Sound':'M Muted',540,702,11,game.soundEnabled?'#91a7ba':'#ffb76e');text('R Restart',697,702,11,'#91a7ba','right');
  if(age<10){
    ctx.globalAlpha=Math.max(0,Math.min(1,(game.moved&&game.placed?5:10)-age));
    const demoX=315+Math.sin(Math.min(age%3,1.5)/1.5*Math.PI)*9;
    rect(demoX,686,10,10,'#e5ede9',3);rect(demoX+2,696,6,7,'#27b8b8',2);
    if(age%3>1.5){ctx.fillStyle='#ffc16f';ctx.beginPath();ctx.arc(331,702,4,0,Math.PI*2);ctx.fill();}
    ctx.globalAlpha=1;
  }
  if (game.time < game.noticeUntil) { rect(150, 626, 420, 34, '#101927ee', 7); text(game.notice, 360, 649, 14, '#9ef0c4', 'center'); }
  if (game.dead) {rect(252,8,216,32,'#101927',4);text(game.lives ? 'RESPAWNING' : 'NEW RUN',360,30,13,'#ffb76e','center');}
  if (suspended) { rect(230, 328, 260, 58, '#101927ed', 10); text('RETURN TO THE ARENA', 360, 363, 15, '#e1edf4', 'center'); }
}
