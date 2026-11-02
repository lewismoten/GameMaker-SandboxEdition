// A countdown you can read, made of blocks: a row of `cells` lamps that go dark one by one, the
// right end first, over each span of ticks; at the end of a span the row lights up again for the
// next. Each lamp is its own chain of timed blocks (lit, then dark), started together when the
// scene loads, so the row runs in step with any other block timetable of the same spans (Oil's
// Well's waves). After the last span the lamps stay dark.
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { AIR, type Kit } from '../blocks/common';

/** Block names of the row's lamps, left to right: `${name}${i}`. */
export function fuseBlocks(k: Kit, name: string, cells: number, spans: number[], lamp: (lit: boolean, i: number) => Pixels): void {
  for (let i = 0; i < cells; i++) {
    spans.forEach((span, s) => {
      // the right end goes out first: lamp i stays lit (cells - i) / cells of the span
      const lit = Math.max(1, Math.round((span * (cells - i)) / cells));
      const id = (n: number) => (n ? `${name}${i}.${n}` : `${name}${i}`);
      const last = s === spans.length - 1;
      // (the left end, lit the whole span, goes straight on to the next span)
      const full = lit >= span && !last;
      k.book.add(id(s * 2), lamp(true, i), { ...AIR, ntime: Math.min(lit, span), next: id(s * 2 + (full ? 2 : 1)) });
      if (full) return;
      if (last) k.book.add(id(s * 2 + 1), lamp(false, i), AIR);
      else k.book.add(id(s * 2 + 1), lamp(false, i), { ...AIR, ntime: span - lit, next: id(s * 2 + 2) });
    });
  }
}
