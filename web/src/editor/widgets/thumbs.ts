// Small pictures of Game-Maker files, so pickers and file lists show what a file is:
// palettes as color grids, block sets as mosaics, maps as mini maps, monsters and
// characters as their first frame, pictures and animations as themselves, sounds as
// waveforms, music as a little score.
import { kindOf, type FileKind } from '../core/project';
import { paintIndexed } from '../core/draw';
import { drawWave } from './waveform';
import { BACKBL, BLEN, CHARBL, MONBL, TRANSPARENT, parseBlocks, type Block } from '../../formats/blocks';
import { parsePalette, defaultPalette, type Palette } from '../../formats/palette';
import { parseMap, MLEN, MWID } from '../../formats/map';
import { parseMonsters } from '../../formats/monster';
import { parseCharacter } from '../../formats/character';
import { decodeGif, isGif } from '../../formats/gif';
import { applyFliFrame, isFli, newFliCanvas, parseFli } from '../../formats/fli';
import { parseSoundSet } from '../../formats/sound';
import { decodeVoc, isVoc } from '../../formats/voc';
import { isCmf, parseCmf } from '../../formats/cmf';
import { parseGame } from '../../formats/game';
import { parseBackdrop } from '../../formats/graphicScripts';
import type { GameFiles } from '../../project/files';

/** Everything a thumbnail may need: the file and its neighbors (for palettes and blocks). */
export interface ThumbSource {
  files: GameFiles;
  /** The palette the file is shown with. */
  palette?: Palette;
}

/** An emoji-free icon for each kind, drawn when there's nothing to show. */
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

/** The first frame of a 20x20 or 20x40 sprite, centered. */
function sprite(top: Block | undefined, bottom: Block | undefined, pal: Palette): HTMLCanvasElement {
  const px = new Uint8Array(BLEN * BLEN * 2).fill(TRANSPARENT);
  if (top) px.set(top.pixels, 0);
  if (bottom) px.set(bottom.pixels, BLEN * BLEN);
  const [c] = canvas();
  paintIndexed(c, px, BLEN, bottom ? BLEN * 2 : BLEN, pal, true);
  return c;
}

function bars(values: ArrayLike<number>, max: number, color: string): HTMLCanvasElement {
  const [c, ctx] = canvas(SIZE, SIZE * 0.6);
  ctx.fillStyle = '#0d1a10';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.fillStyle = color;
  const w = c.width / values.length;
  for (let i = 0; i < values.length; i++) {
    const v = Math.min(1, values[i] / max);
    ctx.fillRect(i * w, c.height * (1 - v), Math.max(1, w - 1), c.height * v);
  }
  return c;
}

function iconFor(kind: FileKind, label?: string): HTMLElement {
  const span = document.createElement('span');
  span.className = 'thumb icon';
  span.textContent = KIND_ICON[kind];
  if (label) span.title = label;
  return span;
}

/** A thumbnail for the file, or a kind icon when it can't be drawn. */
export function fileThumb(name: string, bytes: Uint8Array | undefined, src: ThumbSource): HTMLElement {
  const kind = kindOf(name);
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
        return blocksMosaic(parseBlocks(bytes, MONBL), pal, 9, 3, true);
      case 'cbl':
        return blocksMosaic(parseBlocks(bytes, CHARBL), pal, 9, 3, true);
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
        const chr = parseCharacter(bytes);
        const cbl = src.files.byExtension('cbl')[0];
        const blocks = cbl ? parseBlocks(src.files.get(cbl)!, CHARBL) : [];
        const f = chr.sequences[0]?.frames[0];
        return f && blocks[f.pic1] ? sprite(blocks[f.pic1], blocks[f.pic2], pal) : iconFor(kind);
      }
      case 'gif': {
        if (!isGif(bytes)) return iconFor(kind);
        const g = decodeGif(bytes);
        const [c] = canvas(g.width, g.height);
        paintIndexed(c, g.pixels, g.width, g.height, g.palette);
        return c;
      }
      case 'bkd': {
        // the 320x200 window of its GIF that the game shows
        const b = parseBackdrop(bytes);
        const gif = src.files.get(b.gif);
        if (!gif || !isGif(gif)) return iconFor(kind, `${b.gif} is missing`);
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
        return bars(f, 4000, '#6cf28a');
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
        const music = parseCmf(bytes).music;
        const notes: number[] = [];
        for (let i = 0; i < music.length - 2 && notes.length < 40; i++) if ((music[i] & 0xf0) === 0x90 && music[i + 2] > 0) notes.push(music[i + 1]);
        return notes.length
          ? bars(
              notes.map((n) => n - 30),
              70,
              '#8fb4ff',
            )
          : iconFor(kind);
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
    /* fall through to the icon */
  }
  return iconFor(kind);
}
