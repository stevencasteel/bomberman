import { BINDINGS, type Action, type Direction } from './config';
export class Input {
  private held = new Map<Action, number>();
  private presses = new Set<Action>();
  private sequence = 0;
  private keydown = (event: KeyboardEvent) => {
    const action = (Object.keys(BINDINGS) as Action[]).find(key => BINDINGS[key] === event.code);
    if (!action || event.metaKey || event.ctrlKey || event.altKey) return;
    event.preventDefault();
    if (event.repeat || this.held.has(action)) return;
    this.held.set(action, ++this.sequence); this.presses.add(action);
  };
  private keyup = (event: KeyboardEvent) => {
    const action = (Object.keys(BINDINGS) as Action[]).find(key => BINDINGS[key] === event.code);
    if (action) { event.preventDefault(); this.held.delete(action); }
  };
  constructor() { window.addEventListener('keydown', this.keydown); window.addEventListener('keyup', this.keyup); }
  down(action: Action) { return this.held.has(action); }
  take(action: Action) { const pressed = this.presses.delete(action); return pressed; }
  directions(): Direction[] {
    return [...this.held.entries()].filter(([a]) => ['up', 'down', 'left', 'right'].includes(a)).sort((a, b) => b[1] - a[1]).map(([a]) => a as Direction);
  }
  clear() { this.held.clear(); this.presses.clear(); }
  endTick() { this.presses.clear(); }
  dispose() { window.removeEventListener('keydown', this.keydown); window.removeEventListener('keyup', this.keyup); this.clear(); }
}
