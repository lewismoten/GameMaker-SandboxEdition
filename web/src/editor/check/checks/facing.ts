// The level check's facing check: a hero or monster should face the way it walks. A hero whose
// left and right walks show a face-on picture looks like it is sliding sideways; a hero who
// walks up and down the map (no gravity) needs a back view and a front view as well, four ways
// in all. A monster pacing back and forth with a side view must turn round at each end. Things
// meant to look the same from every side (a ball, a ship that always flies nose first) are
// fine; the finding says so, and a game's baseline can keep them.
import { BLEN, CHARBL, TRANSPARENT, orientIndex, type Block } from '../../../formats/blocks';
import { MAXSEQ, frameCount, type Frame } from '../../../formats/character';
import { MAXMARCH, type March, type Monster } from '../../../formats/monster';
import type { Finding } from '../findings';
import type { SceneData } from '../sceneData';
import { pictures } from './monsterChecks';

/** A head this mirror-alike or more is a face-on (front or back) view, not a side view. */
export const FACE_ON = 0.75;
/** Two pictures this alike or more are the same picture. */
const SAME = 0.9;

/** The block's pixels as drawn in an orientation (0 as stored, 4 mirrored left to right…). */
export function oriented(b: Block | undefined, orient: number): Uint8Array {
  const out = new Uint8Array(BLEN * BLEN).fill(TRANSPARENT);
  if (!b) return out;
  for (let y = 0; y < BLEN; y++) for (let x = 0; x < BLEN; x++) out[y * BLEN + x] = b.pixels[orientIndex(orient, x, y)];
  return out;
}

/** How alike two pictures are where either is drawn (1 = the same). */
export function alike(a: Uint8Array, b: Uint8Array): number {
  let n = 0;
  let d = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i] === TRANSPARENT && b[i] === TRANSPARENT) continue;
    n++;
    if (a[i] !== b[i]) d++;
  }
  return n ? 1 - d / n : 1;
}

/** How alike a picture is to its own mirror image (1 = the same both ways). */
export function mirrorAlike(a: Uint8Array): number {
  const m = new Uint8Array(a.length);
  for (let y = 0; y < BLEN; y++) for (let x = 0; x < BLEN; x++) m[y * BLEN + x] = a[y * BLEN + BLEN - 1 - x];
  return alike(a, m);
}

/** The frame's head: its top block, or its only block. */
function head(f: Frame, cbl: Block[]): Uint8Array | undefined {
  if (f.pic1 < CHARBL) return oriented(cbl[f.pic1], f.orient & 15);
  if (f.pic2 < CHARBL) return oriented(cbl[f.pic2], f.orient >> 4);
  return undefined;
}

type Way = 'left' | 'right' | 'up' | 'down';

/** The heads the hero shows walking each way: sequences with a key that move mostly that way. */
export function walkHeads(d: Pick<SceneData, 'chr' | 'cbl'>): Record<Way, Uint8Array[]> {
  const out: Record<Way, Uint8Array[]> = { left: [], right: [], up: [], down: [] };
  for (let i = 5; i < MAXSEQ; i++) {
    const s = d.chr.sequences[i];
    if (!s.key && !s.jstkMov) continue;
    const frames = s.frames.slice(0, frameCount(s));
    // A walk takes a step every frame or two; a jump or a dig is one push.
    const moving = frames.filter((f) => f.x || f.y);
    if (moving.length < 2) continue;
    const dx = frames.reduce((t, f) => t + f.x, 0);
    const dy = frames.reduce((t, f) => t + f.y, 0);
    if (!dx && !dy) continue;
    const way: Way = Math.abs(dx) >= Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : dy < 0 ? 'up' : 'down';
    for (const f of frames) {
      const h = head(f, d.cbl);
      if (h) out[way].push(h);
    }
  }
  return out;
}

const faceOn = (heads: Uint8Array[]) => heads.length > 0 && heads.every((h) => mirrorAlike(h) >= FACE_ON);
const sameSet = (a: Uint8Array[], b: Uint8Array[]) => a.length > 0 && b.length > 0 && a.every((h) => b.some((g) => alike(h, g) >= SAME));

function heroFacing(d: SceneData): Finding[] {
  const out: Finding[] = [];
  const where = { scene: d.scene, file: d.names.chr };
  const w = walkHeads(d);
  const sides = [...w.left, ...w.right];
  if (faceOn(w.left) || faceOn(w.right)) {
    out.push({
      check: 'facing',
      severity: 'warning',
      title: 'The hero walks left and right facing the player',
      detail:
        'A face-on picture sliding sideways looks unfinished. Draw a side view for the walks (mirror one side for the other). Only something that looks the same from every side, like a ball, should keep one picture.',
      where,
    });
  } else if (sameSet(w.left, w.right) && w.left.every((h) => mirrorAlike(h) < FACE_ON)) {
    out.push({
      check: 'facing',
      severity: 'warning',
      title: 'The hero faces the same way walking left and right',
      detail: 'One of the walks goes backwards. Mirror its frames (orientation 4) so the hero faces where it goes.',
      where,
    });
  }
  // Walking up and down the map (no gravity to fall with) is walking too: a back and a front.
  const topDown = !d.bbl.some((b) => b.grav) && w.up.length > 0 && w.down.length > 0;
  if (topDown && sides.length) {
    const flat = sameSet(w.up, w.down) || sameSet(w.up, sides) || sameSet(w.down, sides);
    if (flat)
      out.push({
        check: 'facing',
        severity: 'warning',
        title: 'The hero shows the same picture walking up or down as another way',
        detail: 'A hero who walks all over the map needs four views: a back walking up, a front walking down and a side each way.',
        where,
      });
  }
  return out;
}

/** The legs of a march: the move toward each corner and the orientation it is drawn in. */
function legs(path: March[]): { dx: number; orient: number }[] {
  const out: { dx: number; orient: number }[] = [];
  const n = path.findIndex((c) => !c.pic);
  const count = n < 0 ? MAXMARCH : n;
  for (let i = 0; i < count; i++) {
    // Corners are stored from the start, and the first leg comes back from the last corner.
    const prev = i ? path[i - 1].x : count > 1 ? path[count - 1].x : 0;
    out.push({ dx: path[i].x - prev, orient: path[i].orient });
  }
  return out;
}

function monsterFacing(d: SceneData): Finding[] {
  const out: Finding[] = [];
  d.mon.forEach((m: Monster, n) => {
    if (!m.used || m.towards !== 0) return; // chasers and wanderers turn on their own
    const pics = pictures(m);
    // a lift or a moving platform (solid) carries the hero; it has no face to turn
    if (!pics.length || pics.some((p) => d.mbl[p]?.solid)) return;
    const ls = legs(m.march[0]);
    const lefts = ls.filter((l) => l.dx < 0);
    const rights = ls.filter((l) => l.dx > 0);
    if (!lefts.length || !rights.length) return;
    const first = d.mbl[pics[0]];
    const a = oriented(first, lefts[0].orient);
    const b = oriented(first, rights[0].orient);
    const where = { scene: d.scene, monster: { file: d.names.mon ?? '', n } };
    const fine = 'Words, balls and anything meant to look the same both ways are fine as they are.';
    if (mirrorAlike(a) >= FACE_ON)
      out.push({
        check: 'facing',
        severity: 'info',
        title: `Monster ${n} paces left and right facing the player`,
        detail: `If it is a creature, draw it side on and mirror the legs that go the other way (orientation 4). ${fine}`,
        where,
      });
    else if (alike(a, b) >= SAME)
      out.push({
        check: 'facing',
        severity: 'info',
        title: `Monster ${n} paces back and forth without turning round`,
        detail: `Its side view faces one way on both legs. Give the legs that go the other way orientation 4 (mirrored). ${fine}`,
        where,
      });
  });
  return out;
}

/** The facing check for a scene; a file an earlier scene already used is checked there. */
export function facing(d: SceneData, all: SceneData[]): Finding[] {
  const before = all.filter((s) => s.scene < d.scene);
  const out: Finding[] = [];
  if (!before.some((s) => s.names.chr === d.names.chr && s.names.cbl === d.names.cbl)) out.push(...heroFacing(d));
  if (!before.some((s) => s.names.mon === d.names.mon && s.names.mbl === d.names.mbl)) out.push(...monsterFacing(d));
  return out;
}
