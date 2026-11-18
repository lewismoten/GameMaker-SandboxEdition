// Search helpers for timed terrain, place priority and carried supplies.
import { BACKBL, type Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import type { CharInfo } from '@lewismoten/gamemaker-sandbox-engine/engine/world';

/** Block numbers whose animation changes how they hold, push or hurt the hero (timed doors, lifts). */
export function timedBlocks(bg: Block[]): Set<number> {
  const out = new Set<number>();
  for (let n = 0; n < BACKBL; n++) {
    const b = bg[n];
    if (!b || b.ntime <= 0 || b.nextBl === n) continue;
    let k = b.nextBl;
    for (let i = 0; i < 20 && k !== n && k < BACKBL; i++) {
      const c = bg[k];
      if (c.solid !== b.solid || c.grav !== b.grav || Math.sign(c.chHitPt) !== Math.sign(b.chHitPt)) {
        out.add(n);
        break;
      }
      k = c.nextBl;
    }
  }
  return out;
}

/** Places by priority, lowest first (a binary heap). */
export class PlaceHeap {
  private ids: number[] = [];
  private keys: number[] = [];
  get size(): number {
    return this.ids.length;
  }
  push(id: number, key: number): void {
    let i = this.ids.length;
    this.ids.push(id);
    this.keys.push(key);
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.keys[p] <= key) break;
      this.ids[i] = this.ids[p];
      this.keys[i] = this.keys[p];
      i = p;
    }
    this.ids[i] = id;
    this.keys[i] = key;
  }
  pop(): number {
    if (!this.ids.length) return -1;
    const top = this.ids[0];
    const id = this.ids.pop()!;
    const key = this.keys.pop()!;
    if (this.ids.length) {
      let i = 0;
      for (;;) {
        const l = i * 2 + 1;
        if (l >= this.ids.length) break;
        const c = l + 1 < this.ids.length && this.keys[l + 1] < this.keys[l] ? l + 1 : l;
        if (this.keys[c] >= key) break;
        this.ids[i] = this.ids[c];
        this.keys[i] = this.keys[c];
        i = c;
      }
      this.ids[i] = id;
      this.keys[i] = key;
    }
    return top;
  }
}

/** Things carried count most, then counters (money and the ten special ones), then score. */
export function worthOf(ci: CharInfo): number {
  let counters = 0;
  for (let i = 20; i < 30; i++) counters += Math.max(0, ci.meter[i] ?? 0);
  for (let i = 5; i < 20; i++) if (ci.meter[i] > 0 && ci.meter[i] < 32767) counters += ci.meter[i];
  return ci.inv.filter((b) => b < BACKBL).length * 1e6 + (counters + Math.max(0, ci.meter[3] ?? 0)) * 1e3 + ci.score;
}
