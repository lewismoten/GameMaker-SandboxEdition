// The 320x200 screens: title, menu, story/help/credits pages, a card before every leg,
// and the endings.
import { encodeGif } from '../../web/src/formats/gif';
import { serializeSlideList } from '../../web/src/formats/graphicScripts';
import { Pixels } from '../kit/pixels';
import { dosText } from '../kit/disk';
import { centered, outlined, text } from './art';
import { X0 } from './mapkit';
import { renderRegion } from './render';
import { buildLeg, type Stage } from './stage';

const W = 320;
const H = 200;

export function gif(p: Pixels, pal: Uint8Array): Uint8Array {
  return encodeGif({ width: p.w, height: p.h, pixels: Uint8Array.from(p.px), palette: pal });
}

/** The card before a leg: a framed look at it, its name and a few words. */
export function card(s: Stage, legIndex: number): Pixels {
  const l = s.legs[legIndex];
  const pal = s.pal;
  const c = (n: string, k: number) => pal.c(n, k);
  const p = new Pixels(W, H, c('ink', 0));
  const b = buildLeg(l);
  const y0 = l.kind === 'boss' ? l.grid.y(0) : l.grid.y(l.grid.cardAt ?? 40) - 4;
  const view = renderRegion(b.map, b.bbl, b.mbl, b.mon, X0, y0, 16, 5);
  p.rect(0, 0, W, 104, c('deep', 0));
  p.rect(0, 102, W, 2, c('trim', 3));
  p.blit(view, 0, 0);
  const tag = l.kind === 'boss' ? 'WARNING!' : `STAGE ${s.n}-${'AB'[legIndex]}`;
  outlined(p, 12, 112, tag, l.kind === 'boss' ? c('red', 3) : c('gold', 4), c('ink', 0), 1);
  outlined(p, 12, 124, s.title.toUpperCase(), c('steel', 5), c('ink', 0), 1);
  outlined(p, 12, 138, l.title.toUpperCase(), c('cyan', 4), c('ink', 0), 2);
  l.card.forEach((line, i) => text(p, 12, 160 + i * 10, line, c('grey', 6)));
  centered(p, 191, 'GET READY!', c('gold', 3));
  return p;
}

export function buildScreens(stages: Stage[]): Record<string, Uint8Array> {
  const out: Record<string, Uint8Array> = {};
  const put = (name: string, bytes: Uint8Array | string) => (out[name] = typeof bytes === 'string' ? dosText(bytes) : bytes);
  const lst = (name: string, entries: [string, number?][]) => put(name, serializeSlideList(entries.map(([n, pause]) => ({ name: n, pause }))));
  for (const s of stages) {
    s.legs.forEach((l, i) => {
      put(`${l.file}.gif`, gif(card(s, i), s.pal.pal));
      lst(`${l.file}.lst`, [[`${l.file}.gif`, 4]]);
    });
  }
  return out;
}
