// The level check's facing check: a hero or monster should face the way it walks. A hero whose
// left and right walks show a face-on picture looks like it is sliding sideways; a hero who
// walks up and down the map (no gravity) needs a back view and a front view as well, four ways
// in all, and one who climbs (a ladder: a block with no gravity in a scene with it) shows his
// back going up. A monster pacing back and forth with a side view must turn round at each end,
// and one walking up and down a map seen from above needs a front and a back (a chain of
// monsters, one per leg, each becoming the next). Things meant to look the same from every
// side (a ball, a ship that always flies nose first) are marked so by the designer: the
// project's "same every side" list (sameKey), which the check leaves alone.
import { BLEN, CHARBL, TRANSPARENT, orientIndex, type Block } from '../../../formats/blocks';
import { MAXSEQ, frameCount, type Frame } from '../../../formats/character';
import { MAXMARCH, type March, type Monster } from '../../../formats/monster';
import type { Finding } from '../findings';
import type { SceneData } from '../sceneData';
import { pictures } from './monsterChecks';

/** A head this mirror-alike or more is a face-on (front or back) view, not a side view. */
const FACE_ON = 0.75;
/** Two pictures this alike or more are the same picture. */
const SAME = 0.9;

/** The block's pixels as drawn in an orientation (0 as stored, 4 mirrored left to right…). */
function oriented(b: Block | undefined, orient: number): Uint8Array {
  const out = new Uint8Array(BLEN * BLEN).fill(TRANSPARENT);
  if (!b) return out;
  for (let y = 0; y < BLEN; y++) for (let x = 0; x < BLEN; x++) out[y * BLEN + x] = b.pixels[orientIndex(orient, x, y)];
  return out;
}

/** How alike two pictures are where either is drawn (1 = the same). */
function alike(a: Uint8Array, b: Uint8Array): number {
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
function mirrorAlike(a: Uint8Array): number {
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
function walkHeads(d: Pick<SceneData, 'chr' | 'cbl'>): Record<Way, Uint8Array[]> {
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

/** The idle picture's head: the hero standing, facing the player. */
function frontHead(d: Pick<SceneData, 'chr' | 'cbl'>): Uint8Array | undefined {
  const f = d.chr.sequences[0].frames[0];
  return f ? head(f, d.cbl) : undefined;
}

/** The heads of every keyed sequence that goes up (a hop or a climb: on a ladder they are one). */
function upHeads(d: Pick<SceneData, 'chr' | 'cbl'>): Uint8Array[] {
  const out: Uint8Array[] = [];
  for (let i = 5; i < MAXSEQ; i++) {
    const s = d.chr.sequences[i];
    if (!s.key && !s.jstkMov) continue;
    const frames = s.frames.slice(0, frameCount(s));
    const dx = frames.reduce((t, f) => t + f.x, 0);
    const dy = frames.reduce((t, f) => t + f.y, 0);
    if (dy >= 0 || Math.abs(dx) > 0) continue;
    for (const f of frames) {
      const h = head(f, d.cbl);
      if (h) out.push(h);
    }
  }
  return out;
}

/**
 * Does the scene have something to climb: open cells with no gravity (a ladder) in a scene
 * where most open cells have it? (A map seen from above with a few moving walkways has none.)
 */
function climbable(d: SceneData): boolean {
  let grav = 0;
  let still = 0;
  for (const n of d.map.blocks) {
    const b = d.bbl[n];
    if (!b || b.solid) continue;
    if (b.grav) grav++;
    else still++;
  }
  return still > 0 && grav > still;
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
        'A face-on picture sliding sideways can look unfinished; a side view for the walks (mirror one side for the other) usually reads better. Something that looks the same from every side, like a ball, can keep one picture: mark it so.',
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
        detail: 'A hero who walks all over the map usually reads best with four views: a back walking up, a front walking down and a side each way.',
        where,
      });
  }
  return out;
}

/**
 * Climbing a ladder is the up key with no gravity: it should show his back. Pixels can't tell
 * a back from a front drawn anew (both share the hat, hair and outline), so only a climb that
 * reuses the front or a side picture is found.
 */
function heroClimb(d: SceneData): Finding[] {
  const out: Finding[] = [];
  const where = { scene: d.scene, file: d.names.chr };
  const w = walkHeads(d);
  const sides = [...w.left, ...w.right];
  const front = frontHead(d);
  const ups = upHeads(d);
  if (ups.length) {
    const like = (heads: Uint8Array[]) => ups.some((h) => heads.some((g) => alike(h, g) >= SAME));
    const sideOn = like(sides);
    const facing = !sideOn && !!front && like([front]);
    if (sideOn || facing)
      out.push({
        check: 'facing',
        severity: 'warning',
        title: sideOn ? 'The hero climbs side on' : 'The hero climbs facing the player',
        detail:
          'On a ladder the up key climbs, so its frames usually show his back (arms up, the back of his head). The same frames show when he hops, which reads fine as a jump away.',
        where,
      });
  }
  return out;
}

/** The legs of a march: the move toward each corner and the orientation it is drawn in. */
function legs(path: March[]): { dx: number; dy: number; orient: number }[] {
  const out: { dx: number; dy: number; orient: number }[] = [];
  const n = path.findIndex((c) => !c.pic);
  const count = n < 0 ? MAXMARCH : n;
  for (let i = 0; i < count; i++) {
    // Corners are stored from where the round starts, and each round starts where the monster
    // stands (MonEndPath aims corner 0 from its place now): a path only comes back if its
    // corners bring it back, and one that doesn't drifts the same way every round.
    const prev = i ? path[i - 1] : { x: 0, y: 0 };
    out.push({ dx: path[i].x - prev.x, dy: path[i].y - prev.y, orient: path[i].orient });
  }
  return out;
}

function monsterFacing(d: SceneData, same: Set<string>): Finding[] {
  const out: Finding[] = [];
  const fine = 'If it is meant to look the same from every side (a word, a ball), mark it so.';
  const topDown = !d.bbl.some((b) => b.grav);
  d.mon.forEach((m: Monster, n) => {
    if (!m.used || m.towards !== 0) return; // chasers and wanderers turn on their own
    if (same.has(sameKey(d.names.mon ?? '', n))) return;
    const pics = pictures(m);
    // a lift or a moving platform (solid) carries the hero; it has no face to turn
    if (!pics.length || pics.some((p) => d.mbl[p]?.solid)) return;
    const ls = legs(m.march[0]);
    const across = ls.filter((l) => Math.abs(l.dx) >= Math.abs(l.dy));
    const lefts = across.filter((l) => l.dx < 0);
    const rights = across.filter((l) => l.dx > 0);
    const ups = ls.filter((l) => l.dy < 0 && Math.abs(l.dy) > Math.abs(l.dx));
    const downs = ls.filter((l) => l.dy > 0 && Math.abs(l.dy) > Math.abs(l.dx));
    const first = d.mbl[pics[0]];
    const where = { scene: d.scene, monster: { file: d.names.mon ?? '', n } };
    if (lefts.length && rights.length) {
      const a = oriented(first, lefts[0].orient);
      const b = oriented(first, rights[0].orient);
      if (mirrorAlike(a) >= FACE_ON)
        out.push({
          check: 'facing',
          severity: 'warning',
          title: `Monster ${n} paces left and right facing the player`,
          detail: `Draw it side on and mirror the legs that go the other way (orientation 4). ${fine}`,
          where,
        });
      else if (alike(a, b) >= SAME)
        out.push({
          check: 'facing',
          severity: 'warning',
          title: `Monster ${n} paces back and forth without turning round`,
          detail: `Its side view faces one way on both legs. Give the legs that go the other way orientation 4 (mirrored). ${fine}`,
          where,
        });
    }
    // Seen from above, walking up and down the map: a back going up, a front coming down.
    if (topDown && ups.length && downs.length && alike(oriented(first, ups[0].orient), oriented(first, downs[0].orient)) >= SAME)
      out.push({
        check: 'facing',
        severity: 'warning',
        title: `Monster ${n} walks up and down the map showing the same side`,
        detail: `A monster has one picture for its whole path, so chain monsters that die after their path and “become” the next, each drawn the way one leg goes (the guide shows how: the one it becomes walks the old one’s first leg). Only for a monster the hero can’t kill: a killed one becomes the next too. ${fine}`,
        where,
      });
  });
  return out;
}

/** The key a hero's .chr or one monster of a .mon has on the "same every side" list. */
export const sameKey = (file: string, monster?: number) => `${file.toLowerCase()}${monster === undefined ? '' : `#${monster}`}`;

/**
 * The facing check for a scene; a file an earlier scene already used is checked there. `same`
 * holds the sameKey of every hero and monster the designer marked "looks the same from every side".
 */
export function facing(d: SceneData, all: SceneData[], same: Set<string> = new Set()): Finding[] {
  const before = all.filter((s) => s.scene < d.scene);
  const out: Finding[] = [];
  const heroSame = same.has(sameKey(d.names.chr ?? ''));
  const sameHero = (s: SceneData) => s.names.chr === d.names.chr && s.names.cbl === d.names.cbl;
  if (!heroSame && !before.some(sameHero)) out.push(...heroFacing(d));
  // the climb is checked in the first scene with a ladder that the hero plays
  if (!heroSame && climbable(d) && !before.some((s) => sameHero(s) && climbable(s))) out.push(...heroClimb(d));
  if (!before.some((s) => s.names.mon === d.names.mon && s.names.mbl === d.names.mbl)) out.push(...monsterFacing(d, same));
  return out;
}
