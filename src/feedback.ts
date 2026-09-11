export type Cue = 'step'|'place'|'kick'|'chain'|'explode'|'block'|'reveal'|'collect'|'minion'|'rivalHit'|'rivalDefeat'|'death'|'forge'|'charge'|'bossKick'|'bossHit'|'phase'|'bossDefeat'|'clear';
export type Feedback = { cue:Cue; x:number; y:number; variant?:number };
export const FX = { particles:500, voices:20, shake:5 } as const;
type Particle={x:number;y:number;vx:number;vy:number;age:number;life:number;size:number;color:string};
export class Effects {
  particles:Particle[]=[];
  rings:{x:number;y:number;age:number;life:number;radius:number;color:string}[]=[];
  impulses:{age:number;life:number;strength:number}[]=[];
  time=0;
  private seed=77;
  private random(){this.seed=(Math.imul(this.seed,1664525)+1013904223)>>>0;return this.seed/4294967296;}
  accept(events:Feedback[]){for(const e of events){
    const strength=e.cue==='bossDefeat'?5:e.cue==='death'?3:e.cue==='rivalDefeat'?1.5:e.cue==='explode'||e.cue==='bossHit'?1:e.cue==='rivalHit'?.6:e.cue==='block'?.4:0;
    if(strength&&this.impulses.length<24)this.impulses.push({age:0,life:e.cue==='bossDefeat'?.35:e.cue==='death'?.24:.16,strength});
    const count=e.cue==='bossDefeat'?30:e.cue==='phase'?16:e.cue==='rivalHit'?5:e.cue==='collect'?12:e.cue==='explode'?10:e.cue==='kick'?3:0;
    const color=e.cue==='collect'?'#9ef0c4':e.cue==='phase'?'#b4d8df':'#ffc287';
    for(let i=0;i<count&&this.particles.length<FX.particles;i++){const angle=this.random()*Math.PI*2,speed=30+this.random()*100;this.particles.push({x:e.x,y:e.y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,age:0,life:e.cue==='rivalHit'?.18:.2+this.random()*.25,size:2+this.random()*3,color});}
    if(['place','death','bossDefeat','collect','phase'].includes(e.cue)&&this.rings.length<32)this.rings.push({x:e.x,y:e.y,age:0,life:e.cue==='place'?.12:e.cue==='collect'?.16:.5,radius:e.cue==='place'?7:e.cue==='collect'?18:65,color});
  }}
  update(dt:number){this.time+=dt;for(const p of this.particles){p.age+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=90*dt;}this.particles=this.particles.filter(p=>p.age<p.life);for(const r of this.rings)r.age+=dt;this.rings=this.rings.filter(r=>r.age<r.life);for(const i of this.impulses)i.age+=dt;this.impulses=this.impulses.filter(i=>i.age<i.life);}
  shake(){const a=Math.min(FX.shake,this.impulses.reduce((v,i)=>v+i.strength*(1-i.age/i.life),0));return{x:Math.sin(this.time*109)*a,y:Math.cos(this.time*137)*a*.65};}
  draw(ctx:CanvasRenderingContext2D){for(const p of this.particles){ctx.globalAlpha=1-p.age/p.life;ctx.fillStyle=p.color;ctx.fillRect(p.x-p.size/2,p.y-p.size/2,p.size,p.size);}for(const r of this.rings){ctx.globalAlpha=(1-r.age/r.life)*.65;ctx.strokeStyle=r.color;ctx.lineWidth=2;ctx.beginPath();ctx.arc(r.x,r.y,Math.max(.1,r.radius*r.age/r.life),0,Math.PI*2);ctx.stroke();}ctx.globalAlpha=1;}
  reset(){this.particles=[];this.rings=[];this.impulses=[];this.time=0;this.seed=77;}
}
