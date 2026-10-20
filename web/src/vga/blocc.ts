// Block routines the block, monster and character designers share, ported from
// code/GM/BLOCC.C (Andy Stone, 1991) and the drawblk/getblk routines of BLOCA.ASM:
// choosing a block set type, loading and saving block sets, and the scrolling block
// bars ("lists") drawn along the bottom of the designers' screens.
import type { RetroHost } from '../retro/host';
import { attr } from '../retro/textScreen';
import { MENUATTR, SHADATTR, vertMenu } from '../retro/textUi';
import type { WorkArea } from '../retro/workArea';
import { BACKBL, BLEN, CHARBL, MONBL, parseBlocks, serializeBlocks, type Block } from '../formats/blocks';
import type { Vga } from './vga';

/** BlkExtensions: background, monster and character block sets (btype 1..3). */
export const BLK_EXT = ['bbl', 'mbl', 'cbl'];
/** lastbl for each btype 1..3. */
export const BLK_COUNT = [BACKBL, MONBL, CHARBL];

const EMPTY = new Uint8Array(BLEN * BLEN);

/** A block's picture, or a blank one for numbers past the end of the set. */
export const pixelsOf = (blk: Block[], n: number): Uint8Array => blk[n]?.pixels ?? EMPTY;

/** drawblk (BLOCA.ASM): copies a 20x20 picture to the screen, every pixel. */
export function drawblk(v: Vga, x: number, y: number, p: Uint8Array): void {
  for (let ly = 0; ly < BLEN; ly++) for (let lx = 0; lx < BLEN; lx++) v.point(x + lx, y + ly, p[ly * BLEN + lx]);
}

/** getblk (BLOCA.ASM): copies 20x20 pixels of the screen into a picture. */
export function getblk(v: Vga, x: number, y: number, p: Uint8Array): void {
  for (let ly = 0; ly < BLEN; ly++) for (let lx = 0; lx < BLEN; lx++) p[ly * BLEN + lx] = v.getCol(x + lx, y + ly);
}

/** drawblocpiece: part of a block, wrapping inside it, for the scroll animation. */
export function drawblocpiece(v: Vga, blk: Block[], x: number, y: number, bx: number, by: number, len: number, wid: number, bloc: number): void {
  const p = pixelsOf(blk, bloc);
  for (let ly = 0; ly < wid; ly++) for (let lx = 0; lx < len; lx++) v.point(lx + x, ly + y, p[((ly + by) % BLEN) * BLEN + ((lx + bx) % BLEN)]);
}

/** Which block to show for list position n (blocnum for blocks, monnum for monsters). */
export type ListPick = (n: number) => number;
export const blocnum: ListPick = (n) => n;

export function drawlist(v: Vga, blk: Block[], x: number, y: number, listlen: number, totalen: number, current: number, dra: ListPick = blocnum): void {
  for (let i = 0; i < listlen; i++) drawblk(v, x + i * BLEN, y, pixelsOf(blk, dra((current + i) % totalen)));
}

export function vdrawlist(v: Vga, blk: Block[], x: number, y: number, listlen: number, totalen: number, current: number, dra: ListPick = blocnum): void {
  for (let i = 0; i < listlen; i++) drawblk(v, x, y + i * BLEN, pixelsOf(blk, dra((current + i) % totalen)));
}

const sign = (n: number) => (n > 0 ? 1 : n < 0 ? -1 : 0);
/** Turbo C's %, which keeps the sign of the dividend. */
const cmod = (a: number, b: number) => a % b;

/** wrap: lists go round from the last block to the first. */
const WRAP = true;
let rate = 0;
let vrate = 0;

/** A click moves one block; holding waits 1/5 second, then scrolls until the mouse moves or lets go. */
async function holdStart(v: Vga): Promise<number> {
  let i = 0;
  let button: number;
  do {
    await v.delay(50);
    button = v.moustats().but;
  } while (i++ < 4 && button > 0);
  return i;
}

/**
 * scroll_list: slides the list `dir` pixels a frame (positive scrolls toward the start)
 * while the button is held. Returns the new first block (*current).
 */
export async function scrollList(
  v: Vga,
  blk: Block[],
  dir: number,
  x: number,
  y: number,
  listlen: number,
  totalen: number,
  current: number,
  dra: ListPick = blocnum,
): Promise<number> {
  const x1 = x + listlen * BLEN;
  const i = await holdStart(v);
  while (cmod(BLEN, sign(dir) * dir) !== 0) dir += sign(dir); // an even part of BLEN
  let { x: movx, y: movy, but: button } = v.moustats();
  let oldx = movx;
  const oldy = movy;
  if (i < 4) oldx = 0;
  let oldClock = v.clock;
  let rotCnt = 0;
  do {
    let l1 = cmod(BLEN - dir, BLEN);
    if (dir > 0) {
      current = (current - 1 + totalen) % totalen;
      if (current === 0 && !WRAP) oldx = 0;
    }
    while (l1 <= BLEN && l1 >= 0) {
      drawblocpiece(v, blk, x, y, l1, 0, BLEN - l1, BLEN, dra(current));
      for (let k = 1; k < listlen; k++) drawblk(v, x + k * BLEN - l1, y, pixelsOf(blk, dra((current + k) % totalen)));
      drawblocpiece(v, blk, x1 - l1, y, 0, 0, l1, BLEN, dra((current + listlen) % totalen));
      l1 -= dir;
      if (rate) await v.delay(rate);
      else await v.tick();
    }
    if (dir < 0) {
      current = (current + 1) % totalen;
      if (current === totalen - listlen && !WRAP) oldx = 0;
    }
    // Speed checker - slow down if the scroll is too fast.
    if (++rotCnt > 10) {
      if (v.clock - oldClock < 7) rate++;
      rotCnt = 0;
      oldClock = v.clock;
    }
    ({ x: movx, y: movy, but: button } = v.moustats());
  } while (button > 0 && movx === oldx && movy === oldy);
  return current;
}

/** vscroll_list: scroll_list for a list standing on end. */
export async function vscrollList(
  v: Vga,
  blk: Block[],
  dir: number,
  x: number,
  y: number,
  listlen: number,
  totalen: number,
  current: number,
  dra: ListPick = blocnum,
): Promise<number> {
  const y1 = y + listlen * BLEN;
  const i = await holdStart(v);
  if (dir > BLEN || dir < -BLEN) dir = sign(dir) * BLEN;
  while (cmod(BLEN, sign(dir) * dir) !== 0) dir += sign(dir);
  let { x: movx, y: movy, but: button } = v.moustats();
  let oldx = movx;
  const oldy = movy;
  if (i < 4) oldx = 0;
  let oldClock = v.clock;
  let rotCnt = 0;
  do {
    let l1 = cmod(BLEN - dir, BLEN);
    if (dir > 0) {
      current = (current - 1 + totalen) % totalen;
      if (current === 0 && !WRAP) oldx = 0;
    }
    while (l1 <= BLEN && l1 >= 0) {
      drawblocpiece(v, blk, x, y, 0, l1, BLEN, BLEN - l1, dra(current));
      for (let k = 1; k < listlen; k++) drawblk(v, x, y + k * BLEN - l1, pixelsOf(blk, dra((current + k) % totalen)));
      drawblocpiece(v, blk, x, y1 - l1, 0, 0, BLEN, l1, dra((current + listlen) % totalen));
      l1 -= dir;
      if (vrate) await v.delay(vrate);
      else await v.tick();
    }
    if (dir < 0) {
      current = (current + 1) % totalen;
      if (current === totalen - listlen && !WRAP) oldx = 0;
    }
    if (++rotCnt > 5) {
      if (v.clock - oldClock < 3) vrate++;
      rotCnt = 0;
      oldClock = v.clock;
    }
    ({ x: movx, y: movy, but: button } = v.moustats());
  } while (button > 0 && movx === oldx && movy === oldy);
  return current;
}

/** getblktype: 1 background, 2 monster, 3 character, or 0 for Menu/Esc. */
export async function getblktype(h: RetroHost): Promise<number> {
  const s = h.screen;
  const w = s.window(10, 10, 20, 4, MENUATTR, SHADATTR);
  const col = attr(15, 1);
  s.write(10, 10, col, 'Background Block');
  s.write(10, 11, col, 'Monster Block   ');
  s.write(10, 12, col, 'Character Block ');
  s.write(10, 13, col, 'Menu            ');
  let btype = await vertMenu(h, 10, 10, 20, 4, 1);
  s.restore(w);
  if (btype === 4 || btype === 0) btype = 0;
  return btype;
}

/**
 * loadblks: asks for a block set of type btype and reads its blocks over the start of
 * `into` (which keeps any blocks past the end of a smaller set). False if none was chosen.
 */
export async function loadblks(work: WorkArea, btype: number, into: Block[]): Promise<boolean> {
  if (btype < 1 || btype > 3) return false;
  const bytes = await work.load('Enter block file to load:', BLK_EXT[btype - 1]);
  if (!bytes) return false;
  const count = BLK_COUNT[btype - 1];
  const padded = new Uint8Array(count * 420);
  padded.set(bytes.subarray(0, padded.length));
  parseBlocks(padded, count).forEach((b, i) => (into[i] = b));
  return true;
}

/** saveblks: writes the first lastbl blocks as a set of type btype. */
export async function saveblks(work: WorkArea, btype: number, blk: Block[]): Promise<boolean> {
  if (btype < 1 || btype > 3) return false;
  return work.save('Save blocks as:', BLK_EXT[btype - 1], serializeBlocks(blk.slice(0, BLK_COUNT[btype - 1])));
}
