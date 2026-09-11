import { FX, type Cue, type Feedback } from './feedback';
type Voice={source:AudioScheduledSourceNode;gain:GainNode;filter?:BiquadFilterNode;priority:number;end:number};
export class Sound {
  private context:AudioContext|null=null;
  private master:GainNode|null=null;
  private compressor:DynamicsCompressorNode|null=null;
  private noise:AudioBuffer|null=null;
  private voices:Voice[]=[];
  private last=new Map<Cue,number>();
  enabled=true;
  private active=true;
  private disposed=false;
  async unlock(){if(this.disposed)return;try{if(!this.context){const ctx=new AudioContext();this.context=ctx;this.master=ctx.createGain();this.compressor=ctx.createDynamicsCompressor();this.compressor.threshold.value=-18;this.compressor.ratio.value=5;this.master.connect(this.compressor);this.compressor.connect(ctx.destination);this.master.gain.value=this.enabled&&this.active?.28:0;const buffer=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate),data=buffer.getChannelData(0);let seed=14;for(let i=0;i<data.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;data[i]=seed/2147483648-1;}this.noise=buffer;}if(this.context.state==='suspended')await this.context.resume();}catch{ /* A later input gesture retries; game logic never depends on audio. */ }}
  state(enabled:boolean,active:boolean){if(this.enabled===enabled&&this.active===active)return;this.enabled=enabled;this.active=active;if(!this.context||!this.master)return;const t=this.context.currentTime;this.master.gain.cancelScheduledValues(t);this.master.gain.setTargetAtTime(enabled&&active?.28:0,t,.015);if(!active||!enabled)this.stopVoices();}
  private tone(frequency:number,endFrequency:number,duration:number,volume:number,priority:number,noise=false,delay=0){
    const ctx=this.context;if(!ctx||!this.master||ctx.state!=='running'||!this.enabled||!this.active)return;
    this.voices=this.voices.filter(v=>v.end>ctx.currentTime);
    if(this.voices.length>=FX.voices){const low=this.voices.reduce((a,b)=>a.priority<b.priority?a:b);if(low.priority>=priority)return;low.source.stop();this.voices=this.voices.filter(v=>v!==low);}
    const start=ctx.currentTime+delay,gain=ctx.createGain();gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(volume,start+.006);gain.gain.exponentialRampToValueAtTime(.0001,start+duration);gain.connect(this.master);
    let source:AudioScheduledSourceNode;let filter:BiquadFilterNode|undefined;
    if(noise){const n=ctx.createBufferSource();n.buffer=this.noise;filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.setValueAtTime(frequency,start);filter.frequency.exponentialRampToValueAtTime(Math.max(30,endFrequency),start+duration);n.connect(filter);filter.connect(gain);source=n;}
    else{const o=ctx.createOscillator();o.type=priority>=3?'triangle':'sine';o.frequency.setValueAtTime(frequency,start);o.frequency.exponentialRampToValueAtTime(Math.max(30,endFrequency),start+duration);o.connect(gain);source=o;}
    const voice={source,gain,filter,priority,end:start+duration};this.voices.push(voice);source.onended=()=>{source.disconnect();filter?.disconnect();gain.disconnect();this.voices=this.voices.filter(v=>v!==voice);};source.start(start);source.stop(start+duration+.01);
  }
  accept(events:Feedback[]){for(const e of [...events].sort((a,b)=>this.priority(b.cue)-this.priority(a.cue))){const t=this.context?.currentTime??0;if(t-(this.last.get(e.cue)??-100)<(e.cue==='step'?.12:e.cue==='block'?.035:.015))continue;this.last.set(e.cue,t);this.play(e);}}
  private priority(c:Cue){return ['death','forge','charge','bossKick','bossDefeat'].includes(c)?4:['explode','rivalHit','bossHit','clear'].includes(c)?3:c==='step'?0:1;}
  private play(e:Feedback){const p=this.priority(e.cue);switch(e.cue){
    case 'step':this.tone(170,90,.035,.04,p);break;
    case 'place':this.tone(260,110,.08,.3,p);break;
    case 'kick':this.tone(180,70,.07,.23,p,true);break;
    case 'chain':this.tone(600,1400,.055,.17,p);break;
    case 'explode':this.tone(170+(e.variant??0)*7,38,.22,.45,p);this.tone(2000,140,.22,.32,p,true);break;
    case 'block':this.tone(1100,200,.12,.14,p,true);break;
    case 'reveal':this.tone(640,820,.12,.12,p);break;
    case 'collect':{const f=440+(e.variant??0)*80;this.tone(f,f,.1,.25,p);this.tone(f*1.5,f*1.5,.16,.2,p,false,.09);break;}
    case 'minion':this.tone(390,70,.16,.25,p);break;
    case 'rivalHit':case 'bossHit':this.tone(e.cue==='bossHit'?110:240,65,.14,.35,p);this.tone(1800,300,.07,.2,p,true);break;
    case 'rivalDefeat':this.tone(280,50,.3,.3,p);this.tone(130,40,.2,.2,p,false,.12);break;
    case 'death':this.tone(350,40,.4,.4,p);this.tone(1600,160,.22,.25,p,true);break;
    case 'forge':this.tone(150,500,.5,.3,p);break;
    case 'charge':this.tone(90,300,.6,.35,p);this.tone(600,2000,.55,.15,p,true);break;
    case 'bossKick':this.tone(330,660,.15,.25,p);this.tone(330,660,.15,.25,p,false,.18);break;
    case 'phase':this.tone(1800,100,.3,.25,p,true);break;
    case 'bossDefeat':this.tone(180,30,.6,.5,p);this.tone(2500,80,.55,.4,p,true);break;
    case 'clear':for(let i=0;i<3;i++)this.tone([440,550,660][i],[440,550,660][i],.2,.22,3,false,i*.13);break;
  }}
  private fuseAt=0;
  fuse(imminent:boolean,hasTimedBomb:boolean){const t=this.context?.currentTime??0;if(hasTimedBomb&&t>=this.fuseAt){this.fuseAt=t+(imminent?.1:.28);this.tone(1000,1200,.025,.025,0,true);}}
  private stopVoices(){for(const v of this.voices){try{v.source.stop((this.context?.currentTime??0)+.04);}catch{}}this.last.clear();}
  reset(){this.stopVoices();this.fuseAt=0;}
  dispose(){this.disposed=true;this.stopVoices();void this.context?.close().catch(()=>{});this.master?.disconnect();this.compressor?.disconnect();this.context=null;}
}
