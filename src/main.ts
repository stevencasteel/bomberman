import { Sound } from './audio';
import { Effects } from './feedback';
import './style.css';
import { CONFIG as C } from './config';
import { Input } from './input';
import { Game } from './game';
import { render } from './render';
const canvas = document.querySelector<HTMLCanvasElement>('#game')!;
const ctx = canvas.getContext('2d');
if (!ctx) throw new Error('Canvas 2D is required.');
const context = ctx;
const input = new Input(), game = new Game(), sound=new Sound(), effects=new Effects();
let epoch=game.epoch;
const unlock=(event:Event)=>{if(event instanceof KeyboardEvent&&(event.repeat||event.ctrlKey||event.metaKey||event.altKey))return;void sound.unlock();};
window.addEventListener('keydown',unlock);canvas.addEventListener('pointerdown',unlock);
let frame = 0, last = 0, accumulator = 0;
let suspended = document.hidden || !document.hasFocus();
function resize() {
  const side = Math.min(window.innerWidth, window.innerHeight);
  const pixels = Math.round(side * Math.min(window.devicePixelRatio || 1, C.dprCap));
  canvas.width = pixels; canvas.height = pixels;
  context.setTransform(pixels / C.size, 0, 0, pixels / C.size, 0, 0);
}
function focusChanged() { suspended = document.hidden || !document.hasFocus(); input.clear(); last = 0; accumulator = 0; game.sync();sound.state(game.soundEnabled,!suspended); }
function loop(now: number) {
  if (last === 0) last = now;
  if (!suspended) {
    accumulator += Math.min((now - last) / 1000, C.step * C.maxTicks);
    let ticks = 0;
    while (accumulator >= C.step && ticks < C.maxTicks) { game.update(input);
      if(epoch!==game.epoch){effects.reset();sound.reset();epoch=game.epoch;}
      sound.state(game.soundEnabled,true);effects.update(C.step);effects.accept(game.events);sound.accept(game.events);game.events=[];
      sound.fuse(game.bombs.some(b=>b.fuse<.7),!game.dead&&game.bombs.some(b=>Number.isFinite(b.fuse)));
      accumulator -= C.step; ticks++; }
  }
  last = now;
  render(context, game, input, suspended ? 1 : accumulator / C.step, suspended, effects);
  frame = requestAnimationFrame(loop);
}
window.addEventListener('resize', resize);
window.addEventListener('blur', focusChanged);
window.addEventListener('focus', focusChanged);
document.addEventListener('visibilitychange', focusChanged);
resize(); frame = requestAnimationFrame(loop);
if (import.meta.hot) import.meta.hot.dispose(() => {
  cancelAnimationFrame(frame); input.dispose();sound.dispose();effects.reset();window.removeEventListener('keydown',unlock);canvas.removeEventListener('pointerdown',unlock);
  window.removeEventListener('resize', resize); window.removeEventListener('blur', focusChanged); window.removeEventListener('focus', focusChanged); document.removeEventListener('visibilitychange', focusChanged);
});
