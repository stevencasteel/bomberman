import type { Effects } from './feedback';
import { CONFIG as C, LABELS, DIRECTIONS, type Direction } from './config';
import type { Game } from './game';
import type { Input } from './input';
import { RIVAL } from './rivals';
export function render(ctx: CanvasRenderingContext2D, game: Game, input: Input, alpha: number, suspended: boolean, effects: Effects) {
  const rect = (x: number, y: number, w: number, h: number, color: string, radius = 0) => { ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(x, y, w, h, radius); ctx.fill(); };
  const text = (label: string, x: number, y: number, size: number, color: string, align: CanvasTextAlign = 'left') => { ctx.fillStyle = color; ctx.font = `600 ${size}px ui-monospace, SFMono-Regular, monospace`; ctx.textAlign = align; ctx.fillText(label, x, y); };
  const bossStage = game.stage === 2;
  const metal = bossStage ? '#554748' : '#435a63';
  const remaining = game.minions.filter(m => !m.dead).length + game.rivals.filter(r => r.hp > 0).length;
  const available = game.capacity - game.bombs.filter(b => b.owner === 0).length;
  rect(0, 0, 720, 720, '#101820');
  rect(0, 0, 720, 48, '#111d27');
  rect(0, 46, 720, 2, bossStage ? '#a84b2d' : '#47616a');
  text(bossStage ? 'BOILER KING' : 'BOILERWORKS', 18, 24, 17, '#eef5ef');
  text(bossStage ? '02 / THE FURNACE' : '01 / CLEAR THE FLOOR', 19, 38, 9, bossStage ? '#ffad78' : '#a9bfc3');
  if (game.boss) {
    text('KING', 285, 21, 10, '#ffbc89');
    for (let i = 0; i < 12; i++) {
      rect(284 + i * 15, 26, 12, 11, '#273038', 2);
      if (i < game.boss.hp) rect(285 + i * 15, 27, 10, 9, game.boss.hp <= 4 ? '#ff644b' : '#ffad58', 2);
    }
  } else {
    text(`${remaining} / 8`, 360, 25, 19, '#ffe0b2', 'center');
    text('ENEMIES', 360, 39, 9, '#a9bfc3', 'center');
  }
  text(`LIVES ${game.lives}`, 548, 23, 13, '#eaf2ee', 'right');
  text(`BOMBS ${available}/${game.capacity}`, 700, 23, 13, '#a8e8df', 'right');
  text(`FIRE ${game.range}`, 700, 38, 10, '#ffba80', 'right');
  ctx.save();ctx.beginPath();ctx.rect(0,C.hud,720,624);ctx.clip();
  const shake=effects.shake();ctx.translate(shake.x,C.hud+shake.y);
  for (let y = 0; y < C.rows; y++) for (let x = 0; x < C.columns; x++) {
    const px = x * C.tile, py = y * C.tile;
    rect(px, py, 48, 48, bossStage ? ((x+y)%2 ? '#332d31' : '#373035') : ((x+y)%2 ? '#24363d' : '#283b42'));
    rect(px + 1, py + 1, 46, 1, bossStage ? '#514047' : '#38505a');
    rect(px + 1, py + 47, 46, 1, '#17242d');
    if (x > 0 && x < 14 && y > 0 && y < 12) {
      rect(px + 5, py + 5, 2, 2, bossStage ? '#56484a' : '#405962', 1);
      rect(px + 41, py + 41, 2, 2, bossStage ? '#56484a' : '#405962', 1);
      if ((x * 7 + y * 11) % 17 === 0) {
        rect(px + 17, py + 19, 14, 9, bossStage ? '#1e252a' : '#1b2c33', 2);
        for (let n = 0; n < 3; n++) rect(px + 20 + n * 4, py + 20, 1, 7, bossStage ? '#784733' : '#48646a');
      }
      if (bossStage && (x + y * 3) % 13 === 0) rect(px + 8, py + 44, 32, 2, '#8d482e');
      if (bossStage && game.board[y][x] === 'floor' && (x === 4 || x === 10) && (y === 2 || y === 8)) {
        rect(px + 7, py + 15, 34, 18, '#1c2429', 4);
        rect(px + 9, py + 17, 30, 14, '#8d4a30', 3);
        for (let n = 0; n < 4; n++) rect(px + 12 + n * 7, py + 16, 3, 16, '#293036', 1);
      }
    }
    if (game.board[y][x] === 'soft') {
      rect(px + 3, py + 7, 42, 40, '#211f25', 5);
      rect(px + 3, py + 2, 42, 39, bossStage ? '#985541' : '#916044', 5);
      rect(px + 5, py + 4, 38, 6, bossStage ? '#d18458' : '#c69064', 3);
      rect(px + 7, py + 12, 34, 26, bossStage ? '#693b35' : '#694638', 3);
      ctx.strokeStyle = bossStage ? '#e3a474' : '#dab18a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(px + 10, py + 14); ctx.lineTo(px + 38, py + 35); ctx.moveTo(px + 38, py + 14); ctx.lineTo(px + 10, py + 35); ctx.stroke();
      rect(px + 6, py + 17, 3, 16, '#42454a', 1); rect(px + 39, py + 17, 3, 16, '#42454a', 1);
      rect(px + 11, py + 3, 4, 3, '#f5c48b', 1); rect(px + 33, py + 3, 4, 3, '#f5c48b', 1);
    }
    if (game.board[y][x] === 'hard') {
      rect(px + 2, py + 7, 44, 41, '#17232a', 5);
      rect(px + 2, py + 2, 44, 41, bossStage ? '#494047' : '#3e5863', 5);
      rect(px + 4, py + 3, 40, 29, bossStage ? '#69535a' : '#5f7e88', 4);
      rect(px + 6, py + 5, 36, 2, bossStage ? '#91716a' : '#8da4a7', 1);
      rect(px + 5, py + 31, 38, 4, metal, 1);
      rect(px + 8, py + 13, 4, 4, '#29383e', 2);
      rect(px + 36, py + 13, 4, 4, '#29383e', 2);
      rect(px + 9, py + 14, 2, 2, '#a4b0a8', 1);
      rect(px + 37, py + 14, 2, 2, '#a4b0a8', 1);
      if (bossStage && (x + y) % 2 === 0) rect(px + 9, py + 37, 30, 2, '#b6613a');
    }
  }
  if(game.boss){
    const b=game.boss,bx=b.previousX+(b.x-b.previousX)*alpha,by=b.previousY+(b.y-b.previousY)*alpha;
    const warning=b.state==='telegraph'||b.state==='flight';
    if(warning){
      const warningColor=b.attack==='forge'?'#ffd078':b.attack==='kick'?'#87e9df':'#ff8462';
      const duration=b.attack==='forge'?.55:b.attack==='kick'?.38:.62;
      const progress=b.state==='flight'?1:Math.max(0,Math.min(1,1-b.timer/duration));
      for(const mark of b.marks){const mx=(mark.col+.5)*48,my=(mark.row+.5)*48;
        rect(mx-22,my-22,44,44,b.attack==='forge'?'#b5653266':'#2f74766b',5);
        ctx.strokeStyle=warningColor;ctx.lineWidth=3;ctx.strokeRect(mx-20,my-20,40,40);
        ctx.beginPath();ctx.arc(mx,my,14,-Math.PI/2,-Math.PI/2+progress*Math.PI*2);ctx.stroke();
        if(b.state==='flight'){const t=1-b.timer/.28,x=bx+(mx-bx)*t,y=by+(my-by)*t-Math.sin(t*Math.PI)*70;ctx.fillStyle='#f9aa5e';ctx.beginPath();ctx.arc(x,y,12,0,Math.PI*2);ctx.fill();rect(x-5,y-5,10,4,'#ffdc91',2);}}
      if(b.attack!=='forge'){
        const [dx,dy]=DIRECTIONS[b.direction];
        for(let n=1;n<=(b.attack==='charge'?4:2);n++){const x=bx+dx*n*48,y=by+dy*n*48;if(game.board[Math.floor(y/48)]?.[Math.floor(x/48)]==='hard')break;
          rect(x-(dx?22:16),y-(dy?22:16),dx?44:32,dy?44:32,b.attack==='charge'?'#a9443855':'#438b8c55',5);
          ctx.strokeStyle=warningColor;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x-dx*10-dy*10,y-dy*10+dx*10);ctx.lineTo(x+dx*8,y+dy*8);ctx.lineTo(x-dx*10+dy*10,y-dy*10-dx*10);ctx.stroke();}
      }
    }
    if(b.hp>0){
      ctx.fillStyle='#09151d99';ctx.beginPath();ctx.ellipse(bx,by+15,36,17,0,0,Math.PI*2);ctx.fill();
      ctx.save();if(b.invulnerability>0)ctx.globalAlpha=Math.sin(game.time*40)>0?1:.5;
      rect(bx-29,by+14,19,16,'#62757a',4);rect(bx+10,by+14,19,16,'#62757a',4);
      rect(bx-40,by-32,13,29,'#536067',4);rect(bx+27,by-32,13,29,'#536067',4);
      rect(bx-42,by-36,17,7,'#a8a09a',3);rect(bx+25,by-36,17,7,'#a8a09a',3);
      rect(bx-43,by-10,16,25,'#b27a54',6);rect(bx+27,by-10,16,25,'#b27a54',6);
      rect(bx-35,by-38,70,63,'#643e3b',16);
      rect(bx-31,by-35,62,54,'#a36b4b',15);
      rect(bx-27,by-29,54,22,'#27323b',8);
      rect(bx-20,by-21,13,7,b.hp<=4?'#ffda8a':'#ffe5a2',2);rect(bx+7,by-21,13,7,b.hp<=4?'#ffda8a':'#ffe5a2',2);
      rect(bx-25,by+1,50,18,'#302e32',5);
      rect(bx-21,by+4,42,12,b.hp<=4?'#ff533b':'#ff9a48',3);
      for(let i=0;i<5;i++)rect(bx-17+i*8,by+4,3,12,'#40333a');
      rect(bx-33,by-3,5,18,'#c99365',2);rect(bx+28,by-3,5,18,'#c99365',2);
      ctx.fillStyle='#c8914f';ctx.beginPath();ctx.moveTo(bx-27,by-36);ctx.lineTo(bx-31,by-54);ctx.lineTo(bx-15,by-44);ctx.lineTo(bx,by-59);ctx.lineTo(bx+15,by-44);ctx.lineTo(bx+31,by-54);ctx.lineTo(bx+27,by-36);ctx.closePath();ctx.fill();
      rect(bx-27,by-39,54,6,'#ebad61',2);
      ctx.fillStyle='#ffcf7d';ctx.beginPath();ctx.arc(bx,by-43,6,0,Math.PI*2);ctx.fill();
      if(b.hp<=8){rect(bx-38,by-3,4,12,'#ffb157',2);rect(bx+34,by-3,4,12,'#ffb157',2);}
      ctx.restore();
      if(warning){rect(bx-63,by-80,126,18,'#17232de8',4);text(b.attack==='forge'?'FORGE DROP':b.attack==='kick'?'BOILER KICK':'PRESSURE CHARGE',bx,by-67,11,'#ffe0a0','center');}
      if(b.phaseFlash>0){ctx.strokeStyle='#ffb76e';ctx.lineWidth=3;ctx.beginPath();ctx.arc(bx,by,42+(1-b.phaseFlash/.35)*15,0,Math.PI*2);ctx.stroke();}
    }else if(game.clearAge<.6){
      const t=Math.max(0,game.clearAge);ctx.globalAlpha=1-t/.6;for(let i=0;i<12;i++){const a=i*Math.PI/6;rect(bx+Math.cos(a)*t*160-5,by+Math.sin(a)*t*160-5,10,10,i%2?'#d19868':'#8ab2bf',3);}ctx.globalAlpha=1;
    }
  }
  for (const bomb of game.bombs) {
    const { x: bx, y: by } = game.bombPosition(bomb);
    const placement=Math.max(0,1-(game.time-(bomb.placedAt??-10))/.12);
    const urgent=bomb.chained||bomb.fuse<.7;
    const pulse=1-placement*.12+Math.sin((bomb.remote&&!Number.isFinite(bomb.fuse)?game.time:C.bombFuse-bomb.fuse)*(urgent?30:12))*.035;
    const ownerColor=bomb.owner===0?'#91eee2':bomb.owner===1?'#ffc36f':bomb.owner===2?'#c59dff':'#ff955f';
    ctx.fillStyle='#07141b99';ctx.beginPath();ctx.ellipse(bx,by+13,19,8,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#0d1b25';ctx.beginPath();ctx.arc(bx,by,17*pulse,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=urgent?'#77423c':'#344350';ctx.beginPath();ctx.arc(bx-1,by-2,13*pulse,0,Math.PI*2);ctx.fill();
    rect(bx-11,by-4,22,6,ownerColor,3);
    rect(bx-8,by-11,7,3,'#c4d3cf',2);
    rect(bx+1,by-18,7,5,'#849696',2);
    ctx.strokeStyle='#ffbc69';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(bx+5,by-16);ctx.lineTo(bx+9,by-22);ctx.stroke();
    ctx.fillStyle=urgent?'#fff6c2':'#ffd078';ctx.beginPath();ctx.arc(bx+9,by-22,urgent?4:2.5,0,Math.PI*2);ctx.fill();
    if(bomb.remote){rect(bx-3,by-28,3,11,'#9ef0c4');rect(bx-5,by-30,7,5,'#9ef0c4',2);}
    ctx.strokeStyle='#14232d';ctx.lineWidth=6;ctx.beginPath();ctx.arc(bx,by,19,-Math.PI/2,Math.PI*1.5);ctx.stroke();
    ctx.strokeStyle=urgent?'#fff0bd':ownerColor;ctx.lineWidth=4;ctx.beginPath();ctx.arc(bx,by,19,-Math.PI/2,-Math.PI/2+Math.PI*2*(Number.isFinite(bomb.fuse)?Math.max(0,bomb.fuse/(bomb.initialFuse??C.bombFuse)):1));ctx.stroke();
  }
  for (const pickup of game.pickups) if (pickup.visible) {
    const px = (pickup.col + 0.5) * C.tile, py = (pickup.row + 0.5) * C.tile - Math.sin(Math.min(1,(game.time-(pickup.revealedAt??0))/.18)*Math.PI)*6;
    rect(px - 17, py - 16, 34, 34, '#122630', 7);
    rect(px - 16, py - 17, 32, 31, '#b78a5f', 7);
    rect(px - 13, py - 14, 26, 25, '#1a333b', 5);
    rect(px - 12, py + 11, 24, 3, '#f5bc75', 2);
    const color = { bomb: '#91d6ff', fire: '#ffab69', speed: '#e7e684', heart: '#ff8b9d', remote: '#9ef0c4' }[pickup.kind];
    if (pickup.kind === 'bomb') { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(px, py, 9, 0, Math.PI * 2); ctx.fill(); rect(px + 4, py - 12, 3, 5, color); }
    if (pickup.kind === 'fire') { ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(px, py - 12); ctx.lineTo(px + 10, py + 8); ctx.lineTo(px - 10, py + 8); ctx.closePath(); ctx.fill(); }
    if (pickup.kind === 'speed') text('»', px, py + 7, 25, color, 'center');
    if (pickup.kind === 'heart') text('♥', px, py + 7, 23, color, 'center');
    if (pickup.kind === 'remote') { rect(px - 7, py - 6, 14, 17, color, 3); rect(px + 3, py - 13, 2, 8, color); rect(px - 3, py - 2, 6, 5, '#112835', 1); }
  }
  for (const flame of game.flames) {
    const lethal = flame.age < C.lethalLife;
    ctx.globalAlpha = lethal ? 0.96 : Math.max(0, (C.flameLife - flame.age) / (C.flameLife - C.lethalLife)) * 0.45;
    const cells=new Set(flame.cells.map(c=>`${c.col},${c.row}`));
    for (const cell of flame.cells) {
      const fx = cell.col * C.tile, fy = cell.row * C.tile;
      const left=cells.has(`${cell.col-1},${cell.row}`),right=cells.has(`${cell.col+1},${cell.row}`);
      const up=cells.has(`${cell.col},${cell.row-1}`),down=cells.has(`${cell.col},${cell.row+1}`);
      rect(fx,fy,48,48,lethal?'#d94f31':'#8a493e');
      rect(fx+(left?0:5),fy+(up?0:5),48-(left?0:5)-(right?0:5),48-(up?0:5)-(down?0:5),lethal?'#ff9e46':'#bd6944',6);
      const growth=Math.min(1,flame.age/.07);
      const width=10+9*growth;
      rect(fx+24-width/2,fy+24-width/2,width,width,lethal?'#fff1ad':'#efab6a',4);
      if(left)rect(fx,fy+20,24,8,lethal?'#ffe6a1':'#db9565',3);
      if(right)rect(fx+24,fy+20,24,8,lethal?'#ffe6a1':'#db9565',3);
      if(up)rect(fx+20,fy,8,24,lethal?'#ffe6a1':'#db9565',3);
      if(down)rect(fx+20,fy+24,8,24,lethal?'#ffe6a1':'#db9565',3);
      if(!left&&!right&&!up&&!down)rect(fx+19,fy+10,10,28,lethal?'#fff2bd':'#db9565',5);
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
      if(m.deathAge<.06){rect(mx-13,my-5,26,Math.max(2,16*(1-m.deathAge/.06)),'#ffae69',2);continue;}
      ctx.globalAlpha = Math.max(0,1-m.deathAge/.26);
      for(let i=0;i<6;i++){const a=i*Math.PI/3;rect(mx+Math.cos(a)*m.deathAge*110-3,my+Math.sin(a)*m.deathAge*110-3,6,6,i%2?'#ffae69':'#5f7778',2);}
      ctx.globalAlpha=1; continue;
    }
    const bob=Math.sin(game.time*7+m.id)*2;
    ctx.fillStyle='#0a172b77';ctx.beginPath();ctx.ellipse(mx,my+8,17,7,0,0,Math.PI*2);ctx.fill();
    rect(mx-14,my-10+bob,28,25,'#14232c',9);
    rect(mx-12,my-10+bob,24,21,m.id%2?'#748e89':'#7b9690',8);
    rect(mx-12,my-19+bob,8,11,'#a9b8a8',3);rect(mx+4,my-19+bob,8,11,'#a9b8a8',3);
    rect(mx-14,my-22+bob,10,5,'#ddbc92',2);rect(mx+4,my-22+bob,10,5,'#ddbc92',2);
    rect(mx-10,my-2+bob,20,9,'#26353b',3);
    rect(mx-8,my+bob,6,5,'#ffe2a0',2);rect(mx+2,my+bob,6,5,'#ffe2a0',2);
    rect(mx-5,my+9+bob,10,3,'#ffad69',2);
    rect(mx-9,my+12,6,4,'#c7bbab',2);rect(mx+3,my+12,6,4,'#c7bbab',2);
    if(Math.sin(game.time*4+m.id)>0.6){rect(mx-2,my-27+bob,4,4,'#a7babb77',2);rect(mx+3,my-33+bob,5,5,'#a7babb55',3);}
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
    rect(rx-13,ry-23+bob,26,4,'#f5e1b9',2);
    rect(rx-14,ry-1+bob,28,3,'#172b35',2);
    rect(rx-12,ry-18+bob,24,12,'#182837',3);
    const look=active?(r.facing==='left'?-2:r.facing==='right'?2:0):Math.sign(game.player.x-rx)*2;
    rect(rx-7+look,ry-14+bob,5,3,'#f1f0d4',1);rect(rx+2+look,ry-14+bob,5,3,'#f1f0d4',1);
    rect(rx-4,ry-30+bob,8,7,'#e4edf1',2);ctx.restore();
    rect(rx-(RIVAL.hp*9+3)/2,ry-44,RIVAL.hp*9+3,8,'#17232c',3);
    for(let i=0;i<RIVAL.hp;i++)rect(rx-(RIVAL.hp*9-2)/2+i*9,ry-42,7,4,i<r.hp?color:'#354550',1);
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
  rect(0, 672, 720, 48, '#111d27');
  rect(0, 672, 720, 2, bossStage ? '#a84b2d' : '#47616a');
  const age = game.time - game.hintStarted;
  ctx.globalAlpha = Math.max(0, Math.min(1, (game.moved && game.placed ? 5 : 10) - age));
  const dirs: Direction[] = ['left', 'up', 'down', 'right'];
  dirs.forEach((d, i) => { const pressed = input.down(d); rect(16 + i * 31, 683, 27, 27, pressed ? '#8de5cf' : '#30444f', 5); text(LABELS[d], 29.5 + i * 31, 702, 17, pressed ? '#102b33' : '#e1edf4', 'center'); });
  text('MOVE', 148, 702, 12, '#d5e4ed'); rect(217, 683, 27, 27, input.down('bomb') ? '#8de5cf' : '#30444f', 5); text(LABELS.bomb, 230.5, 702, 17, '#e1edf4', 'center'); text('BOMB', 255, 702, 12, '#d5e4ed'); ctx.globalAlpha = 1;
  rect(348,681,119,31,game.remote?'#244b49':'#3d322e',5);
  text(game.remote?'C  DETONATE':`FIRE RANGE  ${game.range}`,407.5,701,12,game.remote?'#adf0dd':'#ffd29b','center');
  text('H  HELP', 487, 701, 11, '#aabdc3');text(game.soundEnabled?'M  SOUND':'M  MUTED',567,701,11,game.soundEnabled?'#aabdc3':'#ffb76e');text('R  RESTART',702,701,11,'#aabdc3','right');
  if(age<10){
    ctx.globalAlpha=Math.max(0,Math.min(1,(game.moved&&game.placed?5:10)-age));
    const demoX=305+Math.sin(Math.min(age%3,1.5)/1.5*Math.PI)*9;
    rect(demoX,686,10,10,'#e5ede9',3);rect(demoX+2,696,6,7,'#27b8b8',2);
    if(age%3>1.5){ctx.fillStyle='#ffc16f';ctx.beginPath();ctx.arc(326,702,4,0,Math.PI*2);ctx.fill();}
    ctx.globalAlpha=1;
  }
  if (game.time < game.noticeUntil) { rect(150, 626, 420, 34, '#101927ee', 7); text(game.notice, 360, 649, 14, '#9ef0c4', 'center'); }
  if (game.dead) {rect(252,8,216,32,'#101927',4);text(game.lives ? 'RESPAWNING' : 'NEW RUN',360,30,13,'#ffb76e','center');}
  if (suspended) { rect(230, 328, 260, 58, '#101927ed', 10); text('RETURN TO THE ARENA', 360, 363, 15, '#e1edf4', 'center'); }
}
