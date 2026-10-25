// The level check's checks for every player, from the files: a hero step that a quick tap plays
// twice (PLAYGAME starts a sequence again while its key is down: engine/character.ts moveChars),
// scenery drawn like one of the scene's prizes that does nothing, and keys needed to grab or
// fight that nothing near the start names (the first level's card, the menu's story and
// instructions; words drawn on sign blocks can't be read).
import { BACKBL, BLEN, MONBL, type Block } from '../../../formats/blocks';
import { MLEN } from '../../../formats/map';
import { frameCount } from '../../../formats/character';
import type { Game } from '../../../formats/game';
import { parseSlideList } from '../../../formats/graphicScripts';
import { scanName } from '../../../input/scancodes';
import type { GameFiles } from '../../../project/files';
import { characterActions } from '../../keymap/keyMap';
import { at, type Finding } from '../findings';
import { blockUse, type SceneData } from '../sceneData';
import { mentions } from './gameChecks';
import { hostile } from './monsterChecks';
import { isPickup } from './playChecks';
import { TICK_S } from './blockChecks';

/** How long a quick tap of a key lasts, in seconds: a sequence shorter than this plays twice. */
const QUICK_TAP_S = 0.3;

/**
 * Hero moves a quick tap plays twice: "Always finish" (ground) sequences that repeat while held
 * and take a whole step (a block or more, as a grid walker does). PLAYGAME holds back key
 * events during a ground sequence except while its first frame shows (PLAYGAME.C's
 * KeysPending), so a key let go after that frame is read only once the step has begun again:
 * a first frame shorter than a quick tap walks twice. A sequence that can be interrupted stops
 * the moment its key is let go (a tap walks as far as it is held), and a jump held a little
 * longer only goes higher, so those are left alone.
 */
export function tapTwice(d: SceneData): Finding[] {
  const groups = new Map<string, { keys: string[]; what: string; ticks: number }>();
  const gravity = d.bbl.some((b) => b.grav);
  for (const { scan, action } of characterActions(d.chr, gravity)) {
    if (!scan || action.seq < 5) continue;
    const s = d.chr.sequences[action.seq];
    if (s.norepeat || s.momentum || !s.ground) continue;
    const frames = s.frames.slice(0, frameCount(s));
    const dx = frames.reduce((t, f) => t + (f.pic2 === MONBL ? 0 : f.x), 0);
    const dy = frames.reduce((t, f) => t + (f.pic2 === MONBL ? 0 : f.y), 0);
    const step = Math.max(Math.abs(dx), Math.abs(dy));
    const what = action.kind === 'move' && step >= BLEN && step % BLEN === 0 ? `${step / BLEN === 1 ? 'a block' : `${step / BLEN} blocks`}` : '';
    if (!what) continue;
    // a release is read while frame 0 shows: its pause, and up to a tick before it starts
    const ticks = Math.max(1, frames[0].pause);
    if ((ticks + 1) * TICK_S >= QUICK_TAP_S) continue;
    const k = `${what}|${ticks}`;
    const g = groups.get(k) ?? { keys: [], what, ticks };
    g.keys.push(scanName(scan));
    groups.set(k, g);
  }
  return [...groups.values()].map((g) => ({
    check: 'tap-twice',
    severity: 'warning',
    title: `A quick tap of ${g.keys.join(' ')} can take two steps, not one: each step (${g.what}) reads a key let go only in its first ${(g.ticks * TICK_S).toFixed(2)} s`,
    detail: `PLAYGAME plays a sequence again while its key is down, and an “Always finish the sequence” step reads a key let go only while its first frame shows; a quick tap lasts about ${QUICK_TAP_S} s. Unless that is meant, hold the first frame longer (${Math.ceil(QUICK_TAP_S / TICK_S) - 1} ticks or more) and make the rest of the step quick strides, so one tap walks once and a held key still walks on.`,
    where: { scene: d.scene, file: d.names.chr },
  }));
}

/** A block that does nothing to the hero who touches it: no prize, no hurt, no counter, no change. */
function inert(b: Block, n: number): boolean {
  return !b.obj && !b.scorePts && !b.chHitPt && !(b.effect && b.eamt) && (b.touchBl === n || b.touchBl >= BACKBL) && !b.birthMon;
}

/**
 * The pixels that make a prize look like a prize, not the floor it lies on: those that differ
 * from the block most often beside it on the map, leaving out its own most common color (its
 * background). `beside` is that block, if any.
 */
function prizeMask(bbl: Block[], n: number, beside?: number): Uint8Array {
  const px = bbl[n].pixels;
  const count = new Uint32Array(256);
  for (const p of px) count[p]++;
  let bg = 0;
  for (let c = 1; c < 256; c++) if (count[c] > count[bg]) bg = c;
  const floor = beside !== undefined ? bbl[beside].pixels : undefined;
  return px.map((p, i) => (p !== bg && (!floor || p !== floor[i]) ? 1 : 0));
}

/** The block most often next to block `n` on the map (other than `skip`), or undefined. */
function besideOf(blocks: Uint8Array, n: number, skip: (k: number) => boolean): number | undefined {
  const count = new Map<number, number>();
  blocks.forEach((v, i) => {
    if (v !== n) return;
    for (const j of [i - 1, i + 1, i - MLEN, i + MLEN]) {
      const k = blocks[j];
      if (k === undefined || skip(k)) continue;
      count.set(k, (count.get(k) ?? 0) + 1);
    }
  });
  let best: number | undefined;
  for (const [k, c] of count) if (best === undefined || c > count.get(best)!) best = k;
  return best;
}

/** How much of a prize's own drawing (its mask) another block has, pixel for pixel (1 = all). */
function prizeLikeness(prize: Uint8Array, mask: Uint8Array, other: Uint8Array): number {
  let n = 0;
  let same = 0;
  for (let i = 0; i < mask.length; i++) {
    if (!mask[i]) continue;
    n++;
    if (prize[i] === other[i]) same++;
  }
  return n ? same / n : 0;
}

/** A block with this much of a prize's drawing looks the same to a player. */
const LOOKS_SAME = 0.85;
/** Prizes drawn in fewer pixels than this (a sparkle) are too small to compare. */
const MIN_PIXELS = 12;

/** Blocks reached from `n` by its animation (nextBl) and its touch (touchBl): the prize's own looks. */
function ownLooks(bbl: Block[], n: number): Set<number> {
  const out = new Set<number>([n]);
  const todo = [n];
  while (todo.length) {
    const b = bbl[todo.pop()!];
    for (const k of [b.nextBl, b.touchBl]) if (k < BACKBL && !out.has(k)) (out.add(k), todo.push(k));
  }
  return out;
}

const prizeWord = (b: Block) =>
  b.obj
    ? 'something to carry'
    : b.effect === 1 && b.eamt > 0
      ? 'a life'
      : b.effect === 3
        ? 'money'
        : b.chHitPt > 0
          ? 'health'
          : b.scorePts > 0
            ? 'points'
            : 'a counter';

/**
 * Background blocks that do nothing but are drawn the same as, or nearly as, one of the scene's
 * prizes. A copy on a link of any scene played on the same map leads somewhere (a way out
 * drawn like the usual exit), so it is left alone; `all` is every scene.
 */
export function lookalike(d: SceneData, all: SceneData[] = [d]): Finding[] {
  const use = blockUse(d.map);
  const placed = [...Array(BACKBL).keys()].filter((n) => use[n]);
  const prizes = placed.filter((n) => isPickup(d, n));
  if (!prizes.length) return [];
  const masks = new Map(
    prizes.map((n) => [
      n,
      prizeMask(
        d.bbl,
        n,
        besideOf(d.map.blocks, n, (k) => prizes.includes(k)),
      ),
    ]),
  );
  const size = (m: Uint8Array) => m.reduce((t, v) => t + v, 0);
  const out: Finding[] = [];
  for (const m of placed) {
    if (!inert(d.bbl[m], m) || prizes.includes(m)) continue;
    const match = prizes.find(
      (n) => !ownLooks(d.bbl, n).has(m) && size(masks.get(n)!) >= MIN_PIXELS && prizeLikeness(d.bbl[n].pixels, masks.get(n)!, d.bbl[m].pixels) >= LOOKS_SAME,
    );
    if (match === undefined) continue;
    const links = new Set(all.filter((o) => o.names.map === d.names.map).flatMap((o) => o.links));
    const cells: number[] = [];
    d.map.blocks.forEach((v, i) => v === m && !links.has(i) && cells.length < 200 && cells.push(i));
    if (!cells.length) continue;
    out.push({
      check: 'lookalike',
      severity: 'warning',
      title: `Block ${m} looks like prize block ${match} (${prizeWord(d.bbl[match])}) but does nothing, first at ${at(cells[0])}`,
      detail: `Players will try to grab it. Unless it is a decoy on purpose, draw it so it can’t be mistaken (another color, a frame round it), or make it give something.`,
      where: { scene: d.scene, map: d.names.map, cell: cells[0], cells, block: { file: d.names.bbl ?? '', n: m } },
    });
  }
  return out;
}

/** The words a graphic slot shows: a .txt, or the .txt files a slide list plays. */
function textOf(files: GameFiles, name: string | undefined, depth = 0): string {
  const real = name && files.resolve(name);
  const bytes = real ? files.get(real) : undefined;
  if (!real || !bytes || depth > 2) return '';
  const ext = real.toLowerCase().split('.').pop();
  if (ext === 'txt') return new TextDecoder('latin1').decode(bytes).replace(/\x1a[\s\S]*$/, '');
  if (ext !== 'lst') return '';
  try {
    return parseSlideList(bytes)
      .map((e) => textOf(files, e.name, depth + 1))
      .join('\n');
  } catch {
    return '';
  }
}

/** The arrow keys and the keypad's corners: every player tries them. */
const ARROWS = new Set([72, 75, 77, 80, 71, 73, 79, 81]);

/** Slots of the title scene with the story and the instructions, and of a level with its intro card. */
const STORY = 4;
const HELP = 6;
const INTRO = 9;

/**
 * Keys the first level needs to grab (objects lie on its map) or fight (foes are placed there)
 * that its card and the menu's story and instructions never name. Keys that only work once
 * something is carried are taught where it is found, so they are left out.
 */
export function teachFirst(game: Game, files: GameFiles, scenes: SceneData[]): Finding[] {
  const first = game.scenes[0]?.links[0]?.toScene;
  const d = scenes.find((s) => s.scene === first);
  if (!d) return [];
  const title = game.scenes[0];
  const card = textOf(files, game.scenes[d.scene].files[INTRO]);
  const text = [card, textOf(files, title.files[STORY]), textOf(files, title.files[HELP])].join('\n');
  const use = blockUse(d.map);
  const objects = [...Array(BACKBL).keys()].some((n) => use[n] && d.bbl[n].obj);
  const foes = d.map.monsters.some((p) => hostile(d.mon[p.monnum], d.mbl));
  const out: Finding[] = [];
  const seen = new Set<number>();
  for (const { scan, action } of characterActions(
    d.chr,
    d.bbl.some((b) => b.grav),
  )) {
    if (!scan || ARROWS.has(scan) || seen.has(scan) || action.needsBlock !== undefined || action.uses === 0) continue;
    const needed = action.kind === 'pickup' ? objects : action.kind === 'fire' ? foes : false;
    if (!needed) continue;
    seen.add(scan);
    if (mentions(text, scan)) continue;
    out.push({
      check: 'teach-first',
      severity: 'warning',
      title: `${scanName(scan)} (${action.title.toLowerCase()}) isn’t named at the start of the game`,
      detail: `The first level (${d.name}) needs it to ${action.kind === 'pickup' ? 'pick things up' : 'fight'}, but neither its card nor the menu’s story or instructions name it. A sign by the first ${action.kind === 'pickup' ? 'thing to pick up' : 'foe'}, or a line on the card, teaches it where it is needed. If a sign block already does, mark this as on purpose.`,
      where: { scene: d.scene, map: d.names.map, file: d.names.chr },
      fix: 'key-sign',
    });
  }
  return out;
}
