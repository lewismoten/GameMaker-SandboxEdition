// Paper-and-pencil level openings and the palette-animated won street. Art made in code with OpenAI Codex (GPT-6.1 Sol).
import { encodeFli } from '@lewismoten/gamemaker-sandbox-engine/formats/fli';
import { scaleBlit } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { Pixels, rng } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Book } from '../../kit/starter/book';
import type { Pal } from '../../kit/starter/palette';
import { scene } from '../../kit/starter/screens';
import { wrap } from '../../kit/starter/text';
import { outlined, text, textWidth } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import { paletteFor } from './moods';

/** A notebook level card, penciled in from left to right. The opening uses the same palette as the still. */
export function paperCard(pal: Pal, hero: Pixels, n: number, of: number, name: string, hint: string, progress = 1): Pixels {
  const { c } = pal;
  const p = new Pixels(320, 200, c('sky', 3));
  for (let y = 15; y < 200; y += 20) p.rect(0, y, 320, 1, c('paper', 0));
  p.rect(35, 0, 1, 200, c('red', 3));
  for (const y of [35, 95, 155]) p.disc(14, y, 5, c('paper', 2)).disc(15, y + 1, 4, c('white', 3));
  text(p, 49, 26, `LEVEL ${n} OF ${of}`, c('stone', 1));
  const title = name.toUpperCase();
  const scale = textWidth(title, 2) <= 258 ? 2 : 1;
  const width = textWidth(title, scale);
  const writing = new Pixels(320, 200, 255);
  text(writing, 49, 58, title, c('stone', 0), scale);
  const edge = 49 + Math.round(width * progress);
  for (let y = 58; y < 74; y++) for (let x = 49; x < edge; x++) if (writing.get(x, y) !== 255) p.set(x, y, writing.get(x, y));
  // A faint eraser rub and a few crumbs; the final underline is a wobbly pencil stroke.
  p.line(51, 83, 91, 84, c('stone', 4)).line(55, 85, 86, 85, c('stone', 4));
  p.set(94, 84, c('stone', 3)).set(97, 86, c('stone', 3));
  if (progress === 1) {
    p.line(49, 78, 49 + width / 2, 79, c('stone', 2)).line(49 + width / 2, 79, 49 + width, 78, c('stone', 2));
  }
  // Keep the hint readable throughout the animation, with two ruled lines available.
  wrap(hint)
    .trim()
    .split('\n')
    .forEach((line, i) => text(p, 49, 106 + i * 20, line, c('stone', 0)));
  scaleBlit(p, hero, 61, 144, 1);
  p.line(48, 185, 105, 186, c('stone', 2));
  if (progress < 1) {
    // Graphite tip at the writing edge, wood, yellow barrel, silver ferrule and pink eraser.
    const y = 69 + Math.round(Math.sin(progress * 35));
    p.line(edge, y, edge + 6, y - 7, c('stone', 0));
    for (let k = 0; k < 5; k++) p.line(edge + 4 + k, y - 5, edge + 23 + k, y - 24, c('gold', k < 2 ? 4 : 2));
    p.line(edge + 4, y - 5, edge + 7, y - 11, c('wood', 4));
    for (let k = 0; k < 5; k++) p.line(edge + 24 + k, y - 25, edge + 27 + k, y - 28, c('stone', 3));
    for (let k = 0; k < 5; k++) p.line(edge + 28 + k, y - 29, edge + 31 + k, y - 32, c('pink', 3));
  }
  return p;
}

/** Every level opens in two seconds, including a readable final hold; no added voice or gameplay wait. */
export function paperOpening(pal: Pal, hero: Pixels, n: number, of: number, name: string, hint: string): Uint8Array {
  const frames = Array.from({ length: 48 }, (_, f) => Uint8Array.from(paperCard(pal, hero, n, of, name, hint, Math.min(1, f / 29)).px));
  return encodeFli(frames, pal.pal, { speed: 3, runs: true, noLoopFrame: true });
}

/** The won street at nightfall: warm windows, the hero cheering, and stars coming out.
 * Only palette entries change; the final twelve frames hold, and the cartoon plays once.
 */
export function endingFli(pal: Pal, book: Book, mb: Book, hero: Pixels): Uint8Array {
  const picture = scene(pal, book, 160);
  scaleBlit(picture, hero, 32, 80, 2);
  for (const [name, x] of [
    ['litcottage0', 106],
    ['littower0', 178],
    ['litshed0', 250],
  ] as const)
    scaleBlit(picture, mb.pics.get(name)!, x, 120, 2);
  const heading = 'ALL LIT UP!';
  // A dark caption plate separates the white heading from the clouds behind it.
  picture.rect(56, 8, 208, 34, pal.c('ink', 0)).rect(58, 10, 204, 30, pal.c('sky', 0));
  outlined(picture, Math.round((320 - textWidth(heading, 2)) / 2), 18, heading, pal.c('white', 3), pal.c('ink', 0), 2);
  const sky = new Set(pal.r('sky'));
  const star = pal.c('gold', 5);
  const rand = rng(67);
  for (let i = 0; i < 44; i++) {
    const x = Math.floor(rand() * 318);
    const y = 52 + Math.floor(rand() * 54);
    if (sky.has(picture.get(x, y))) picture.rect(x, y, 2, 2, star);
  }
  const from = paletteFor(pal, 'dusk').pal;
  const to = paletteFor(pal, 'night').pal;
  const frames: Uint8Array[] = [];
  const palettes: Uint8Array[] = [];
  for (let f = 0; f < 48; f++) {
    const t = Math.min(1, f / 35);
    const colors = from.map((v, i) => Math.round(v + (to[i] - v) * t));
    const darkSky = pal.c('sky', 1) * 3;
    for (let c = 0; c < 3; c++) colors[star * 3 + c] = Math.round(colors[darkSky + c] + (60 - colors[darkSky + c]) * t);
    // A gentle brightening, not a flashing light; no new gameplay state or text.
    for (const idx of [pal.c('gold', 3), pal.c('gold', 4)]) for (let c = 0; c < 3; c++) colors[idx * 3 + c] = Math.round(to[idx * 3 + c] * (0.7 + 0.3 * t));
    frames.push(Uint8Array.from(picture.px));
    palettes.push(colors);
  }
  return encodeFli(frames, palettes[0], { speed: 4, palettes, runs: true, noLoopFrame: true });
}
