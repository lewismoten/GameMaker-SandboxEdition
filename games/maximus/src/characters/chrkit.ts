// Building character files: a block list that deduplicates identical pictures, and a
// small vocabulary for sequences (frames that move, frames that fire a monster).
import { Pixels } from '../../../kit/pixels';
import { CHARBL, emptyBlock, type Block } from '../../../../web/src/formats/blocks';
import { MONBL } from '../../../../web/src/formats/blocks';
import { MAXFRAME, emptyFrame, newCharacter, type Character, type Frame, type Sequence } from '../../../../web/src/formats/character';
import { keyOf, SCAN } from '../ids';

export const NONE = CHARBL;

/** Collects 20x20 pictures into a block set, reusing identical ones. */
export class BlockList {
  readonly blocks: Block[] = [];
  private seen = new Map<string, number>();
  constructor(
    readonly max: number,
    readonly transparent = true,
  ) {}
  add(p: Pixels, props: Partial<Block> = {}): number {
    const key = Buffer.from(p.px).toString('base64') + JSON.stringify(props);
    const had = this.seen.get(key);
    if (had !== undefined) return had;
    const i = this.blocks.length;
    if (i >= this.max) throw new Error(`Block set full (${this.max})`);
    const b = emptyBlock(i, this.transparent);
    b.pixels.set(p.px);
    Object.assign(b, props);
    this.blocks.push(b);
    this.seen.set(key, i);
    return i;
  }
  /** Pads to the full count with empty blocks. */
  full(): Block[] {
    const out = this.blocks.slice();
    while (out.length < this.max) out.push(emptyBlock(out.length, this.transparent));
    return out;
  }
}

export interface F {
  x?: number;
  y?: number;
  top?: number;
  bottom?: number;
  /** Orientation of both blocks (0 normal, 4 mirrored left/right...). */
  o?: number;
  pause?: number;
  /** Fire this monster instead of drawing (f.y / 20 = row offset). */
  birth?: number;
}

function frame(f: F): Frame {
  if (f.birth !== undefined) return { ...emptyFrame(), x: f.x ?? 0, y: f.y ?? 0, pic1: f.birth, pic2: MONBL, pause: f.pause ?? 0 };
  const o = f.o ?? 0;
  return { ...emptyFrame(), x: f.x ?? 0, y: f.y ?? 0, orient: (o & 15) | ((o & 15) << 4), pic1: f.top ?? NONE, pic2: f.bottom ?? NONE, pause: f.pause ?? 1 };
}

interface SeqSpec {
  key?: keyof typeof SCAN;
  frames: F[];
  sound?: number;
  /** Background block required in inventory (150 = none). */
  bloc?: number;
  momentum?: boolean;
  norepeat?: boolean;
  ground?: boolean;
  /** Joystick direction 1..8 (clockwise from up), 9 any; button 0 any, 1/2, 4 none. */
  joy?: [number, number];
  /** Starting count of uses (meter); undefined = unlimited. */
  uses?: number;
}

/**
 * Sequences a key starts and that must finish even if the key is already up: a quick tap
 * delivers press and release in the same game tick, and PLAYGAME would pop the sequence
 * again before its first frame. Marking a sequence "ground" (uninterruptible) makes taps
 * count - but while it runs, a direction key pressed in the same tick is swallowed. So
 * only the stand-still actions are ground; moving and shooting stay responsive.
 */
const TAPS = new Set([3, 4, 11, 14, 16, 17, 19]);

export function setSeq(c: Character, i: number, s: SeqSpec): void {
  if (s.ground === undefined && TAPS.has(i)) s = { ...s, ground: true };
  if (s.frames.length > MAXFRAME) throw new Error(`Sequence ${i} has ${s.frames.length} frames`);
  const frames = Array.from({ length: MAXFRAME }, (_, k) => (k < s.frames.length ? frame(s.frames[k]) : emptyFrame(true)));
  const seq: Sequence = {
    frames,
    key: s.key ? keyOf(s.key) : 0,
    sound: s.sound ?? 30,
    on: 0,
    bloc: s.bloc ?? 150,
    ground: s.ground ? 1 : 0,
    jstkBut: s.joy ? s.joy[1] : 0,
    jstkMov: s.joy ? s.joy[0] : 0,
    norepeat: s.norepeat ? 1 : 0,
    momentum: s.momentum ? 1 : 0,
    xtra: new Uint8Array(5),
  };
  c.sequences[i] = seq;
  if (s.uses !== undefined) c.meter[i] = s.uses;
}

export function character(): Character {
  return newCharacter();
}
