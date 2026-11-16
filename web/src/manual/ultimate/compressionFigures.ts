// Chapter 17's compression diagrams, drawn from the same pixels whose BBL/FLI bytes are
// measured here. ZIP uses the project's writer, not an estimate or a claim about PKZIP's
// exact output. FLI layouts follow the original FLI.CPP/FLIDOC.TXT (existing NOTICE credits).
import { h } from '../../editor/core/ui';
import { createZip } from '@lewismoten/gamemaker-sandbox-archives/zip';
import { newBlockSet, serializeBlocks } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { encodeFli, parseFli } from '@lewismoten/gamemaker-sandbox-engine/formats/fli';

const INK = '#241d16';
const PAPER = '#fffdf4';
const COLORS = ['#392c20', '#765139', '#af8252', '#dfc28c'];

/** Same four-color palette, different arrangements, each in a full DOS background set. */
export function blockSamples(): { name: string; pixels: Uint8Array; bytes: Uint8Array }[] {
  let seed = 1994;
  return ['Noisy dirt', 'Stripes', 'Bands'].map((name, kind) => {
    const pixels = Uint8Array.from({ length: 400 }, (_, i) => {
      seed ^= seed << 13;
      seed ^= seed >>> 17;
      seed ^= seed << 5;
      return kind === 0 ? seed & 3 : kind === 1 ? (i % 20) % 4 : Math.floor(i / 100);
    });
    const blocks = newBlockSet('bbl');
    blocks[0].pixels.set(pixels);
    return { name, pixels, bytes: serializeBlocks(blocks) };
  });
}

/** A 12×12 square moves four pixels across a still 320×200 background. */
export function fliSample() {
  const first = Uint8Array.from({ length: 320 * 200 }, (_, i) => (i < 320 * 150 ? 0 : 1));
  const second = first.slice();
  for (let y = 110; y < 122; y++) {
    first.fill(3, y * 320 + 80, y * 320 + 92);
    second.fill(3, y * 320 + 84, y * 320 + 96);
  }
  const palette = new Uint8Array(768);
  for (let i = 0; i < 4; i++) palette.fill(i * 21, i * 3, i * 3 + 3);
  const bytes = encodeFli([first, second], palette, { speed: 6, runs: true, noLoopFrame: true });
  const anim = parseFli(bytes);
  const view = new DataView(bytes.buffer);
  const sizes = anim.frames.map((p) => view.getUint32(p, true));
  // The delta panel shows only actual changes; PAPER means skipped, not color zero.
  const changes = second.map((v, i) => (v === first[i] ? 255 : v));
  return { first, second, changes, bytes, sizes };
}

function drawing(height: number) {
  const canvas = document.createElement('canvas');
  canvas.width = 960;
  canvas.height = height * 2;
  const g = canvas.getContext('2d')!;
  g.scale(2, 2);
  g.fillStyle = PAPER;
  g.fillRect(0, 0, 480, height);
  g.font = '16px monospace';
  g.textBaseline = 'top';
  return { canvas, g, height };
}

function text(g: CanvasRenderingContext2D, words: string, x: number, y: number) {
  g.fillStyle = INK;
  g.fillText(words, x, y);
}

function figure(d: ReturnType<typeof drawing>, number: number, caption: string, alt: string): HTMLElement {
  return h(
    'figure',
    { class: 'ug-compression' },
    h('img', { src: d.canvas.toDataURL(), width: 480, height: d.height, alt }),
    h('figcaption', null, `Figure 17-${number}. ${caption}`),
  );
}

function runs(): HTMLElement {
  const d = drawing(88);
  const pixels = [...'AAAABBCCCCCA'];
  pixels.forEach((p, i) => {
    d.g.fillStyle = COLORS[p.charCodeAt(0) - 65 + 1];
    d.g.fillRect(10 + i * 38, 4, 36, 28);
    d.g.strokeStyle = INK;
    d.g.strokeRect(10 + i * 38, 4, 36, 28);
  });
  pixels.forEach((p, i) => text(d.g, p, 22 + i * 38, 36));
  text(d.g, 'Runs: 4 × A | 2 × B | 5 × C | 1 × A', 10, 64);
  return figure(d, 1, 'Read a row as runs. This is the run-length idea, not a GIF byte listing.', 'Twelve pixels: four A, two B, five C, one A.');
}

function lzw(): HTMLElement {
  const d = drawing(108);
  text(d.g, 'Input:  A B A B A B A', 10, 4);
  text(d.g, 'Read:   A | B | AB | ABA', 10, 30);
  text(d.g, 'Start: A=0, B=1; add AB=2, BA=3, ABA=4', 10, 56);
  text(d.g, 'Send:   0   1   2    4', 10, 82);
  return figure(
    d,
    2,
    'LZW learns longer strings as it goes. These small teaching codes leave out GIF’s clear/end codes and bit packing.',
    'ABABABA: start with A=0 and B=1, learn AB=2, BA=3, ABA=4, send codes 0, 1, 2, 4.',
  );
}

function deflate(): HTMLElement {
  const d = drawing(108);
  text(d.g, 'OPEN THE GATE! OPEN THE GATE! ', 10, 4);
  d.g.strokeStyle = INK;
  d.g.strokeRect(10, 30, 150, 29);
  d.g.strokeRect(230, 30, 234, 29);
  text(d.g, '15 literals', 18, 36);
  text(d.g, 'back 15, copy 15', 238, 36);
  d.g.beginPath();
  d.g.moveTo(320, 62);
  d.g.lineTo(320, 94);
  d.g.lineTo(85, 94);
  d.g.lineTo(85, 64);
  d.g.lineTo(80, 72);
  d.g.moveTo(85, 64);
  d.g.lineTo(90, 72);
  d.g.stroke();
  return figure(
    d,
    3,
    'A back-reference copies earlier bytes. Each phrase includes its trailing space; the second can point back 15 bytes and copy 15.',
    'OPEN THE GATE! and a space, twice: 15 literal bytes followed by a distance of 15 and length of 15. A possible match, not a packed bit listing.',
  );
}

function pixels(g: CanvasRenderingContext2D, px: Uint8Array, w: number, x: number, y: number, scale: number) {
  px.forEach((v, i) => {
    if (v === 255) return;
    g.fillStyle = COLORS[v];
    g.fillRect(x + (i % w) * scale, y + Math.floor(i / w) * scale, scale, scale);
  });
}

async function blocks(): Promise<HTMLElement> {
  const d = drawing(148);
  const samples = blockSamples();
  const totals: number[] = [];
  for (const [i, s] of samples.entries()) {
    const zip = await createZip([{ name: 'TEST.BBL', data: s.bytes }]);
    totals.push(zip.length);
    pixels(d.g, s.pixels, 20, 30 + i * 156, 4, 4);
    text(d.g, s.name, 4 + i * 156, 94);
    text(d.g, `${zip.length} bytes ZIP`, 4 + i * 156, 120);
  }
  return figure(
    d,
    4,
    `Same four colors, different order. Each 63,000-byte BBL contains one pictured block and 149 blank slots. Complete one-file ZIPs: ${totals.join(', ')} bytes, including headers. Results vary with the packer.`,
    samples.map((s, i) => `${s.name}: ${totals[i]} bytes in a ZIP`).join('; '),
  );
}

function fli(): HTMLElement {
  const d = drawing(172);
  const s = fliSample();
  pixels(d.g, s.first, 320, 8, 24, 0.65);
  pixels(d.g, s.changes, 320, 260, 24, 0.65);
  d.g.strokeStyle = INK;
  d.g.strokeRect(8, 24, 208, 130);
  d.g.strokeRect(260, 24, 208, 130);
  // Leaders identify the thin changed band when the figure is reduced for print.
  text(d.g, `Full: ${s.sizes[0]} bytes`, 8, 2);
  text(d.g, `Delta: ${s.sizes[1]} bytes`, 260, 2);
  text(d.g, '12 changed lines', 260, 156);
  d.g.beginPath();
  d.g.moveTo(420, 160);
  d.g.lineTo(440, 138);
  d.g.lineTo(326, 99);
  d.g.lineTo(332, 105);
  d.g.moveTo(326, 99);
  d.g.lineTo(335, 98);
  d.g.stroke();
  return figure(
    d,
    5,
    `A 320×200 picture, then a square moving four pixels. Full frame: ${s.sizes[0]} bytes with palette and BRUN; LC delta: ${s.sizes[1]} bytes. Both include frame/chunk headers. Pale space at right is skipped; the dark marks restore background. Two-frame FLI: ${s.bytes.length} bytes, including its 128-byte file header; no ring frame.`,
    `First frame is complete; second changes only 12 lines. Full ${s.sizes[0]} bytes, delta ${s.sizes[1]} bytes, total ${s.bytes.length} bytes. Skipped pixels retain the previous picture.`,
  );
}

export const COMPRESSION_FIGURES: Record<string, () => HTMLElement | Promise<HTMLElement>> = {
  'compression-runs': runs,
  'compression-lzw': lzw,
  'compression-deflate': deflate,
  'compression-blocks': blocks,
  'compression-fli': fli,
};
