import { CONFIG as C, DIRECTIONS, type Direction } from './config';
import { clearCircle, overlapsTile, type Tile } from './collision';
import type { Game, Bomb } from './game';
export type Attack='forge'|'kick'|'charge';
export const BOSS={radius:30,hp:12,invulnerability:.36,forgeWarning:.55,flight:.28,forgeRecovery:.35,kickWarning:.38,kickSpeed:430,kickRush:240,kickRecovery:.3,chargeWarning:.62,chargeSpeed:288,chargeRecovery:.5} as const;
export type Boss={anchorX:number;anchorY:number;x:number;y:number;previousX:number;previousY:number;hp:number;invulnerability:number;hitIds:Set<number>;state:'move'|'telegraph'|'flight'|'rush'|'recover'|'defeated';attack:Attack;timer:number;cadence:number;direction:Direction;target:{x:number;y:number}|null;marks:{col:number;row:number}[];kickId:number;distance:number;firstDrop:boolean;lastCell:{col:number;row:number}|null;lastAttack:Attack|null;repeats:number;phaseFlash:number};
export function createBoss():Boss{return{anchorX:360,anchorY:168,x:360,y:168,previousX:360,previousY:168,hp:12,invulnerability:0,hitIds:new Set(),state:'move',attack:'forge',timer:0,cadence:1.5,direction:'down',target:null,marks:[],kickId:-1,distance:0,firstDrop:false,lastCell:null,lastAttack:null,repeats:0,phaseFlash:0};}
export function bossBoard():Tile[][]{
 const board:Tile[][]=Array.from({length:13},(_,row)=>Array.from({length:15},(_,col)=>row===0||row===12||col===0||col===14?'hard':'floor'));
 for(const [col,row]of [[4,3],[10,3],[3,5],[11,5],[3,7],[11,7],[4,9],[10,9]])board[row][col]='hard';
 for(const [col,row]of [[2,3],[12,3],[1,5],[13,5],[2,7],[12,7],[1,8],[13,8],[5,10],[9,10],[6,11],[8,11]])board[row][col]='soft';
 return board;
}
function legal(g:Game,x:number,y:number,crush=false){
 // Circle clearance includes the full route; soft tiles are only ignored during the charge.
 const board=crush?g.board.map(row=>row.map(t=>t==='soft'?'floor':t)):g.board;
 return clearCircle(board,x,y,BOSS.radius)&&!g.bombs.some(b=>!overlapsTile(g.boss!.x,g.boss!.y,b.col,b.row,BOSS.radius)&&overlapsTile(x,y,b.col,b.row,BOSS.radius));
}
function pathClear(g:Game,x:number,y:number,crush=false){const b=g.boss!;const length=Math.hypot(x-b.x,y-b.y);for(let n=2;n<=length+2;n+=2){const f=Math.min(1,n/Math.max(1,length));if(!legal(g,b.x+(x-b.x)*f,b.y+(y-b.y)*f,crush))return false;}return true;}
function spawn(g:Game,col:number,row:number,fuse:number,range:number){
 if(g.board[row]?.[col]!=='floor'||g.bombs.some(b=>b.col===col&&b.row===row)||g.bombs.length+g.flames.length>=24)return;
 g.bombs.push({id:g.nextId++,owner:3,escape:[],col,row,fuse,initialFuse:fuse,remote:false,range,pass:overlapsTile(g.player.x,g.player.y,col,row),direction:null,travel:0,placedAt:g.time});g.emit('place',(col+.5)*48,(row+.5)*48);
}
function recovery(b:Boss,time:number){b.state='recover';b.timer=time;b.target={x:b.anchorX,y:b.anchorY};b.marks=[];}
export function updateBoss(g:Game,random:()=>number){
 const b=g.boss!;b.previousX=b.x;b.previousY=b.y;b.invulnerability=Math.max(0,b.invulnerability-C.step);b.phaseFlash=Math.max(0,b.phaseFlash-C.step);
 if(b.hp<=0)return;
 const phase=b.hp>8?1:b.hp>4?2:3;
 const recoverCharge=()=>{if(b.lastCell)spawn(g,b.lastCell.col,b.lastCell.row,1.35,3);recovery(b,.5);};
 if(b.state==='recover'){b.timer-=C.step;if(b.timer<=0){b.state='move';b.cadence=(phase===1?1.35:phase===2?1.15:.95)+random()*.3;}return;}
 if(b.state==='telegraph'){
  b.timer-=C.step;if(b.timer>0)return;
  if(b.attack==='forge'){b.state='flight';b.timer=.28;return;}
  if(b.attack==='kick'){
   const bomb=g.bombs.find(o=>o.id===b.kickId&&!o.direction);
   if(!bomb||bomb.col!==b.marks[0]?.col||bomb.row!==b.marks[0]?.row){recovery(b,.3);return;}
   b.state='rush';b.distance=48;return;
  }
  b.state='rush';b.distance=192;b.firstDrop=false;b.lastCell=null;return;
 }
 if(b.state==='flight'){b.timer-=C.step;if(b.timer<=0){for(const c of b.marks)spawn(g,c.col,c.row,1.75,phase===1?3:4);recovery(b,.35);}return;}
 if(b.state==='rush'){
  const [dx,dy]=DIRECTIONS[b.direction];
  if(b.attack==='kick'){
   const bomb=g.bombs.find(o=>o.id===b.kickId&&!o.direction);
   if(!bomb){recovery(b,.3);return;}
   const step=Math.min(240*C.step,b.distance);
   // Kick on contact, then keep the named recovery instead of passing through the bomb.
   if(overlapsTile(b.x+dx*step,b.y+dy*step,bomb.col,bomb.row,30)){
    const col=bomb.col+dx,row=bomb.row+dy;
    if(g.board[row]?.[col]==='floor'&&!g.bombs.some(o=>o!==bomb&&o.col===col&&o.row===row)&&!overlapsTile(g.player.x,g.player.y,col,row)){bomb.direction=b.direction;bomb.kickSpeed=430;bomb.pass=false;g.emit('kick',(bomb.col+.5)*48,(bomb.row+.5)*48);}
    recovery(b,.3);return;
   }
   if(!legal(g,b.x+dx*step,b.y+dy*step)){recovery(b,.3);return;}
   b.x+=dx*step;b.y+=dy*step;b.distance-=step;if(b.distance<=0)recovery(b,.3);return;
  }
  let remaining=Math.min(288*C.step,b.distance);
  while(remaining>0){const step=Math.min(2,remaining);const x=b.x+dx*step,y=b.y+dy*step;
   if(!legal(g,x,y,true)){recoverCharge();return;}
   b.x=x;b.y=y;remaining-=step;b.distance-=step;
   for(let row=Math.floor((y-30)/48);row<=Math.floor((y+30)/48);row++)for(let col=Math.floor((x-30)/48);col<=Math.floor((x+30)/48);col++)if(g.board[row]?.[col]==='soft'&&overlapsTile(x,y,col,row,30)){g.board[row][col]='floor';g.emit('block',(col+.5)*48,(row+.5)*48);if(g.debris.length<32)g.debris.push({col,row,age:0});}
   const col=Math.floor(x/48),row=Math.floor(y/48);
   if(Math.abs(x-(col+.5)*48)<2&&Math.abs(y-(row+.5)*48)<2){b.anchorX=(col+.5)*48;b.anchorY=(row+.5)*48;b.lastCell={col,row};if(!b.firstDrop){spawn(g,col,row,1.35,3);b.firstDrop=true;}}
  }
  if(b.distance<=.001)recoverCharge();return;
 }
 if(b.state==='move')b.cadence-=C.step;
 // Move along validated cardinal center-to-center lanes; select attacks only at centers.
 if(b.target){const dx=b.target.x-b.x,dy=b.target.y-b.y,step=Math.min(phase===1?112*C.step:phase===2?126*C.step:142*C.step,Math.hypot(dx,dy));const length=Math.hypot(dx,dy);
  if(length<.01){b.target=null;return;}
  const x=b.x+dx/length*step,y=b.y+dy/length*step;
  if(legal(g,x,y)){b.x=x;b.y=y;if(step>=length){b.anchorX=b.x;b.anchorY=b.y;b.target=null;}}else {b.target={x:b.anchorX,y:b.anchorY};}return;
 }
 if(b.cadence>0){
  const moves=(Object.keys(DIRECTIONS)as Direction[]).map(d=>{const [dx,dy]=DIRECTIONS[d];return{d,x:b.x+dx*48,y:b.y+dy*48};}).filter(p=>pathClear(g,p.x,p.y));
  moves.sort((a,c)=>Math.hypot(a.x-g.player.x,a.y-g.player.y)-Math.hypot(c.x-g.player.x,c.y-g.player.y));
  const move=moves[0];if(move){b.direction=move.d;b.target=move;}return;
 }
 const kicks=g.bombs.filter(o=>!o.direction&&Math.hypot((o.col+.5)*48-b.x,(o.row+.5)*48-b.y)>=54&&((Math.abs((o.col+.5)*48-b.x)<1&&Math.abs((o.row+.5)*48-b.y)<=96)||(Math.abs((o.row+.5)*48-b.y)<1&&Math.abs((o.col+.5)*48-b.x)<=96))).filter(o=>{const x=(o.col+.5)*48,y=(o.row+.5)*48,dx=Math.sign(x-b.x),dy=Math.sign(y-b.y);return pathClear(g,x-dx*54,y-dy*54);}).sort((a,c)=>(a.owner===3?-1:0)-(c.owner===3?-1:0)||a.id-c.id);
 let choices:Attack[]=['forge',...(kicks.length?['kick' as Attack]:[]),...(phase>1?['charge' as Attack]:[])];if(b.repeats>=2&&choices.length>1)choices=choices.filter(a=>a!==b.lastAttack);
 const weights={forge:phase===1?.6:phase===2?.45:.35,kick:phase===1?.4:.3,charge:phase===2?.25:.35};let roll=random()*choices.reduce((sum,a)=>sum+weights[a],0);let attack=choices[0];for(const a of choices){roll-=weights[a];if(roll<=0){attack=a;break;}}
 b.attack=attack;b.repeats=b.lastAttack===attack?b.repeats+1:1;b.lastAttack=attack;b.state='telegraph';b.target=null;b.marks=[];
 if(attack==='forge'){
  const vx=(g.player.x-g.player.previousX)/C.step,vy=(g.player.y-g.player.previousY)/C.step;
  const col=Math.max(1,Math.min(13,Math.floor((g.player.x+vx*.4)/48))),row=Math.max(1,Math.min(11,Math.floor((g.player.y+vy*.4)/48)));
  const candidates=[{col,row},...Object.values(DIRECTIONS).map(([dx,dy])=>({col:col+dx,row:row+dy}))].filter(c=>g.board[c.row]?.[c.col]==='floor'&&!g.bombs.some(o=>o.col===c.col&&o.row===c.row)&&!(g.protection>0&&overlapsTile(g.player.x,g.player.y,c.col,c.row)));
  b.marks=candidates.slice(0,2);b.timer=.55;
 }else if(attack==='kick'){const bomb=kicks[0];b.kickId=bomb.id;b.marks=[{col:bomb.col,row:bomb.row}];b.direction=Math.abs((bomb.col+.5)*48-b.x)>1?(bomb.col*48+24>b.x?'right':'left'):(bomb.row*48+24>b.y?'down':'up');b.timer=.38;}
 else {const dx=g.player.x-b.x,dy=g.player.y-b.y;b.direction=Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy>0?'down':'up';b.timer=.62;}
}
