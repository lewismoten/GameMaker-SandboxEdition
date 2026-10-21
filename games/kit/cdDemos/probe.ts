// A look-ahead copy of a level being played: the live world from the real engine is cloned
// and stepped with the same calls, in the same order, as one game tick of playscene
// (web/src/engine/scene.ts), so the bot can try a few key presses and see what happens
// before it presses anything in the real game.
import { moveChars } from '../../../web/src/engine/character';
import { simKeyPress } from '../../../web/src/engine/keys';
import { blockBirthMonsters, moveAllMonsters } from '../../../web/src/engine/monsters';
import { updateCharDrawState } from '../../../web/src/engine/render';
import { changeBlocks } from '../../../web/src/engine/scene';
import { changeScroll, drawScroll } from '../../../web/src/engine/scroll';
import { getTouchBlocks } from '../../../web/src/engine/touch';
import { LASTMM, type World } from '../../../web/src/engine/world';
import { NOSCENE, type Link } from '../../../web/src/formats/game';

/** A copy of the live world that can be played ahead; the read-only level data is shared. */
export function cloneWorld(w: World, rand: () => number): World {
  const { bg, mblk, cblk, mon, palette, sound, joystick, chr, ...live } = w;
  void sound;
  void joystick;
  const copy = structuredClone({ ...live, rand: undefined }) as unknown as World;
  return Object.assign(copy, {
    bg,
    mblk,
    cblk,
    mon,
    palette,
    chr: { ...chr, x: [...chr.x], y: [...chr.y] },
    sound: { play: () => true },
    rand,
    joystick: undefined,
    jstickOn: false,
  });
}

export class Probe {
  dead = false;
  /** The scene link the character reached, or -1. */
  link = -1;
  private pending: number[] = [];
  private doScroll: boolean;

  constructor(
    readonly w: World,
    private links: Link[],
    doScroll = false,
  ) {
    this.doScroll = doScroll;
  }

  key(scan: number): void {
    this.pending.push(scan);
  }

  async tick(): Promise<void> {
    const w = this.w;
    // the 8 timer interrupts of one game tick each draw a step of the scroll
    for (let i = 0; i < 8; i++) if (this.doScroll) drawScroll(w);
    w.clock++;
    if (!w.noMons) {
      blockBirthMonsters(w);
      moveAllMonsters(w);
    }
    const pending = this.pending.splice(0);
    if (pending.length && (!w.chr.sequences[w.chr.cseq].ground || w.chr.cframe === 0)) for (const k of pending) simKeyPress(w, k);
    else this.pending.unshift(...pending);
    let guard = 0;
    do {
      if (await moveChars(w, async () => -1)) this.dead = true;
    } while (w.chr.cframe === -1 && !this.dead && guard++ < 50);
    changeBlocks(w);
    updateCharDrawState(w);
    this.doScroll = changeScroll(w) !== 0;
    w.monsolid = 0;
    w.mmSolid = LASTMM;
    if (this.link < 0) {
      const t = getTouchBlocks(w);
      this.links.forEach((l, i) => {
        if (this.link < 0 && l && l.toScene !== NOSCENE && t.blks.slice(0, 6).some(([x, y]) => x === l.from.x && y === l.from.y)) this.link = i;
      });
    }
  }
}
