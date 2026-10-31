// Small pictures of Game-Maker files, so pickers and file lists show what a file is:
// palettes as color grids, block sets as mosaics, maps as mini maps, monsters and
// characters as their first frame, pictures and animations as themselves, sounds as
// waveforms, music as a little score.
import { kindOf, type FileKind } from '../core/project';
import { paintIndexed } from '../core/draw';
import { drawSpeakerPitch, drawWave } from './waveform';
import { BACKBL, BLEN, MONBL, TRANSPARENT, parseBlocks, type Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { parsePalette, defaultPalette, type Palette } from '@lewismoten/gamemaker-sandbox-engine/formats/palette';
import { parseMap, MLEN, MWID } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { parseMonsters } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { characterPicture } from './characterPicture';
import { characterBlockPicture } from './characterSets';
import { decodeGif, isGif } from '@lewismoten/gamemaker-sandbox-engine/formats/gif';
import { applyFliFrame, isFli, newFliCanvas, parseFli } from '@lewismoten/gamemaker-sandbox-engine/formats/fli';
import { parseSoundSet } from '@lewismoten/gamemaker-sandbox-engine/formats/sound';
import { decodeVoc, isVoc } from '@lewismoten/gamemaker-sandbox-engine/formats/voc';
import { readSong } from '@lewismoten/gamemaker-sandbox-engine/formats/cmfSong';
import { paintMusicTimeline } from './musicTimeline';
import { isCmf } from '@lewismoten/gamemaker-sandbox-engine/formats/cmf';
import { parseGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { parseRecording } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';
import { Screen } from '@lewismoten/gamemaker-sandbox-engine/gfx/screen';
import { parseHighScores } from '@lewismoten/gamemaker-sandbox-engine/formats/highscore';
import { textColors, textPicture } from './textPicture';
import type { PlayerPatches } from '@lewismoten/gamemaker-sandbox-engine/player/patchRules';
import { parseBackdrop, parseSlideList } from '@lewismoten/gamemaker-sandbox-engine/formats/graphicScripts';
import type { GameFiles } from '../../project/files';

/** Everything a thumbnail may need: the file and its neighbors (for palettes and blocks). */
export interface ThumbSource {
  files: GameFiles;
  /** The palette the file is shown with. */
  palette?: Palette;
  /** The DOS player's patches (companion), for the text color and the high-score screen. */
  patches?: PlayerPatches;
}

/** A fallback icon for each kind, drawn when there is no picture to show. */
export const KIND_ICON: Record<FileKind, string> = {
  gam: '🎮',
  pal: '🎨',
  bbl: '🧱',
  mbl: '👾',
  cbl: '🧍',
  mon: '👹',
  chr: '🦸',
  map: '🗺️',
  snd: '🔊',
  gif: '🖼️',
  fli: '🎞️',
  bkd: '🌄',
  txt: '📝',
  lst: '📽️',
  cmf: '🎵',
  voc: '🎤',
  rec: '⏺️',
  his: '🏆',
  other: '📄',
};

const SIZE = 96;

function canvas(w = SIZE, h = SIZE): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  c.className = 'thumb pixel';
  return [c, c.getContext('2d')!];
}

function blocksMosaic(blocks: Block[], pal: Palette, count: number, cols: number, transparent = false): HTMLCanvasElement {
  const used = blocks.filter((b) => b.pixels.some((p) => p !== (transparent ? TRANSPARENT : 0))).slice(0, count);
  const list = used.length ? used : blocks.slice(0, count);
  const rows = Math.ceil(list.length / cols) || 1;
  const px = new Uint8Array(cols * BLEN * rows * BLEN).fill(transparent ? TRANSPARENT : 0);
  list.forEach((b, i) => {
    const bx = (i % cols) * BLEN;
    const by = Math.floor(i / cols) * BLEN;
    for (let y = 0; y < BLEN; y++) px.set(b.pixels.subarray(y * BLEN, y * BLEN + BLEN), (by + y) * cols * BLEN + bx);
  });
  const [c] = canvas();
  paintIndexed(c, px, cols * BLEN, rows * BLEN, pal, transparent);
  return c;
}

/** The block a monster set is shown by: the first frame of the first monster a .mon uses, else the fullest block. */
function monsterBlockChoice(blocks: Block[], files: GameFiles): Block[] {
  const opaque = (b: Block) => b.pixels.reduce((n, p) => n + (p === TRANSPARENT ? 0 : 1), 0);
  for (const monFile of files.byExtension('mon')) {
    try {
      const first = parseMonsters(files.get(monFile)!).find((m) => m.used && blocks[m.pic[0][0]] && opaque(blocks[m.pic[0][0]]));
      if (first) return [blocks[first.pic[0][0]]];
    } catch {
      // an unreadable monster file: fall back to the fullest block
    }
  }
  const best = blocks.reduce<Block | undefined>((a, b) => (!a || opaque(b) > opaque(a) ? b : a), undefined);
  return best ? [best] : blocks;
}

/** The first frame of a 20x20 or 20x40 sprite, centered. */
function sprite(top: Block | undefined, bottom: Block | undefined, pal: Palette): HTMLCanvasElement {
  const px = new Uint8Array(BLEN * BLEN * 2).fill(TRANSPARENT);
  if (top) px.set(top.pixels, 0);
  if (bottom) px.set(bottom.pixels, BLEN * BLEN);
  const [c] = canvas();
  paintIndexed(c, px, BLEN, bottom ? BLEN * 2 : BLEN, pal, true);
  return c;
}

function iconFor(kind: FileKind, label?: string): HTMLElement {
  const span = document.createElement('span');
  span.className = label ? 'thumb icon problem' : 'thumb icon';
  span.textContent = label ? 'Preview unavailable' : KIND_ICON[kind];
  if (label) {
    span.title = label;
    span.setAttribute('role', 'img');
    span.setAttribute('aria-label', label);
  }
  return span;
}

/** A thumbnail for the file, or a kind icon when it can't be drawn. */
export function fileThumb(name: string, bytes: Uint8Array | undefined, src: ThumbSource, depth = 0): HTMLElement {
  const kind = kindOf(name);
  if (depth > 4) return iconFor(kind, 'This slideshow links too deeply or loops back to itself.');
  if (!bytes) return iconFor(kind);
  const pal = src.palette ?? defaultPalette();
  try {
    switch (kind) {
      case 'pal': {
        const p = parsePalette(bytes);
        const px = Uint8Array.from({ length: 256 }, (_, i) => i);
        const [c] = canvas();
        paintIndexed(c, px, 16, 16, p);
        return c;
      }
      case 'bbl':
        return blocksMosaic(parseBlocks(bytes, BACKBL), pal, 16, 4);
      case 'mbl':
        return blocksMosaic(monsterBlockChoice(parseBlocks(bytes, MONBL), src.files), pal, 1, 1, true);
      case 'cbl': {
        const picture = characterBlockPicture(src.files, name, bytes);
        const [c] = canvas();
        paintIndexed(c, picture.pixels, picture.width, picture.height, pal, true);
        c.setAttribute('role', 'img');
        c.setAttribute('aria-label', `Representative character pose from ${name.toUpperCase()}`);
        return c;
      }
      case 'map': {
        const m = parseMap(bytes);
        // the block set of the scene that uses this map, else the first one
        let bbl = src.files.byExtension('bbl')[0];
        const gam = src.files.byExtension('gam')[0];
        if (gam) {
          const scene = parseGame(src.files.get(gam)!).scenes.find((sc) => sc.files[1]?.toLowerCase() === name.toLowerCase());
          if (scene?.files[2] && src.files.has(scene.files[2])) bbl = scene.files[2].toLowerCase();
        }
        const blocks = bbl ? parseBlocks(src.files.get(bbl)!, BACKBL) : undefined;
        // one pixel per block: the block's most common color
        const color = blocks?.map((b) => {
          const n = new Uint16Array(256);
          let best = 0;
          for (const c of b.pixels) if (++n[c] > n[best]) best = c;
          return best;
        });
        const px = new Uint8Array(MLEN * MWID);
        for (let i = 0; i < px.length; i++) px[i] = color ? (color[m.blocks[i]] ?? 0) : m.blocks[i];
        const [c] = canvas(MLEN, MWID);
        paintIndexed(c, px, MLEN, MWID, pal);
        return c;
      }
      case 'mon': {
        const mons = parseMonsters(bytes);
        const mbl = src.files.byExtension('mbl')[0];
        const blocks = mbl ? parseBlocks(src.files.get(mbl)!, MONBL) : [];
        const first = mons.find((m) => m.used && blocks[m.pic[0][0]]);
        return first ? sprite(blocks[first.pic[0][0]], undefined, pal) : iconFor(kind);
      }
      case 'chr': {
        const picture = characterPicture(src.files, name, bytes);
        if (!picture) return iconFor(kind);
        const [c] = canvas();
        paintIndexed(c, picture.pixels, picture.width, picture.height, pal, true);
        return c;
      }
      case 'gif': {
        if (!isGif(bytes)) return iconFor(kind, `${name.toUpperCase()} is not a GIF image.`);
        const g = decodeGif(bytes);
        const [c] = canvas(g.width, g.height);
        paintIndexed(c, g.pixels, g.width, g.height, g.palette);
        return c;
      }
      case 'bkd': {
        // the 320x200 window of its GIF that the game shows
        const b = parseBackdrop(bytes);
        const gif = src.files.get(b.gif);
        if (!gif) return iconFor(kind, `${b.gif.toUpperCase()} is missing.`);
        if (!isGif(gif)) return iconFor(kind, `${b.gif.toUpperCase()} is not a GIF image.`);
        const g = decodeGif(gif);
        const w = Math.min(320, g.width);
        const hgt = Math.min(200, g.height);
        const x0 = Math.max(0, Math.min(b.x, g.width - w));
        const y0 = Math.max(0, Math.min(b.y, g.height - hgt));
        const px = new Uint8Array(w * hgt);
        for (let y = 0; y < hgt; y++) px.set(g.pixels.subarray((y0 + y) * g.width + x0, (y0 + y) * g.width + x0 + w), y * w);
        const [c] = canvas(w, hgt);
        paintIndexed(c, px, w, hgt, g.palette);
        return c;
      }
      case 'txt': {
        const [c] = canvas(320, 200);
        const paint = (preferred?: number[]) => {
          const text = textColors(pal, preferred);
          paintIndexed(c, textPicture(bytes, text.ink), 320, 200, text.palette);
        };
        paint();
        // then the player's text-pages color if it reads on this palette, else the nearest that does
        // (the player's look is in the engine chunk, so it loads after the first paint)
        const patches = src.patches;
        if (patches)
          void import('@lewismoten/gamemaker-sandbox-engine/engine/playerLook')
            .then(({ playerLook }) => {
              const i = playerLook(patches).color(pal, 'color.select.textPages');
              paint(Array.from(pal.subarray(i * 3, i * 3 + 3)));
            })
            .catch(() => undefined);
        c.title = 'First text page, on a blank background';
        return c;
      }
      case 'lst': {
        for (const slide of parseSlideList(bytes)) {
          const data = src.files.get(slide.name);
          if (!data) continue;
          const picture = fileThumb(slide.name, data, src, depth + 1);
          if (picture instanceof HTMLCanvasElement) return picture;
        }
        return iconFor(kind, 'This slideshow has no readable slides.');
      }
      case 'fli': {
        if (!isFli(bytes)) return iconFor(kind);
        const anim = parseFli(bytes);
        const fc = newFliCanvas(anim);
        applyFliFrame(anim, 0, fc);
        const [c] = canvas(anim.width, anim.height);
        paintIndexed(c, fc.pixels, anim.width, anim.height, fc.palette);
        return c;
      }
      case 'snd': {
        const s = parseSoundSet(bytes);
        const f = s.freqs.find((x) => x.some(Boolean)) ?? s.freqs[0];
        const [c] = canvas(SIZE, SIZE * 0.6);
        drawSpeakerPitch(c, f);
        return c;
      }
      case 'voc': {
        if (!isVoc(bytes)) return iconFor(kind);
        // the whole sound, as an oscilloscope would draw it
        const [c] = canvas(SIZE, SIZE * 0.6);
        drawWave(c, decodeVoc(bytes).samples);
        return c;
      }
      case 'cmf': {
        if (!isCmf(bytes)) return iconFor(kind);
        const [c] = canvas(SIZE, SIZE * 0.6);
        paintMusicTimeline(c, readSong(bytes));
        return c;
      }
      case 'his': {
        // the game's own high-score screen, drawn by the DOS player preview over its picture
        const list = parseHighScores(bytes);
        const [c] = canvas(320, 200);
        c.setAttribute('role', 'img');
        c.setAttribute('aria-label', `High scores: ${list.filter((e) => e.score).length} of ${list.length} places filled`);
        const gam = src.files.byExtension('gam')[0];
        void Promise.all([import('../editors/integrator/dosPlayer/playerPreview'), import('@lewismoten/gamemaker-sandbox-engine/engine/playerLook')])
          .then(([{ drawPreview }, { playerLook }]) => {
            const game = parseGame(src.files.get(gam)!);
            const stem = name.replace(/\.[^.]*$/, '');
            drawPreview(new Screen(c), src.files, game, stem, playerLook(src.patches), 'hiscores');
          })
          .catch(() => undefined);
        return c;
      }
      case 'rec': {
        // a recording holds key presses, not pictures: draw them as ticks along its length
        const keys = parseRecording(bytes);
        const [c, ctx] = canvas(SIZE, SIZE * 0.6);
        ctx.fillStyle = '#10142a';
        ctx.fillRect(0, 0, c.width, c.height);
        const total = keys.reduce((t, k) => t + k.delta, 0) || 1;
        let at = 0;
        ctx.fillStyle = '#6cf28a';
        for (const k of keys) {
          at += k.delta;
          const x = Math.min(c.width - 2, Math.round((at / total) * (c.width - 4)) + 1);
          if (k.key & 0x80) ctx.fillRect(x, 28, 1, 6);
          else ctx.fillRect(x, 8, 1, 20);
        }
        ctx.fillStyle = '#c8d0ff';
        ctx.fillRect(1, 40, c.width - 2, 1);
        c.setAttribute('role', 'img');
        c.setAttribute('aria-label', `Recording of ${keys.length} key events, about ${Math.round(total / 18.2)} seconds`);
        return c;
      }
      case 'gam': {
        const g = parseGame(bytes);
        const [c, ctx] = canvas();
        ctx.fillStyle = '#10142a';
        ctx.fillRect(0, 0, SIZE, SIZE);
        const xs = g.scenes.map((s) => s.pos.x);
        const ys = g.scenes.map((s) => s.pos.y);
        const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs) + 1, Math.min(...ys), Math.max(...ys) + 1];
        const sx = (x: number) => 8 + ((x - x0) / Math.max(1, x1 - x0)) * (SIZE - 16);
        const sy = (y: number) => 8 + ((y - y0) / Math.max(1, y1 - y0)) * (SIZE - 16);
        ctx.strokeStyle = '#7f9cff';
        g.scenes.forEach((s) =>
          s.links.forEach((l) => {
            const t = g.scenes[l.toScene];
            if (!t) return;
            ctx.beginPath();
            ctx.moveTo(sx(s.pos.x), sy(s.pos.y));
            ctx.lineTo(sx(t.pos.x), sy(t.pos.y));
            ctx.stroke();
          }),
        );
        g.scenes.forEach((s, i) => {
          ctx.fillStyle = i === 0 ? '#ffd400' : s.gametype === 2 ? '#ff6b61' : '#6cf28a';
          ctx.fillRect(sx(s.pos.x) - 4, sy(s.pos.y) - 4, 8, 8);
        });
        return c;
      }
    }
  } catch {
    if (['gif', 'bkd', 'txt', 'lst', 'his', 'rec'].includes(kind)) return iconFor(kind, `${name.toUpperCase()} could not be decoded.`);
  }
  return iconFor(kind);
}
