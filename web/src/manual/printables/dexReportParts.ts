// Taped-in pieces for Dex Dynamo's report (dexReport.ts): graph paper with a sketch on its squares, a photo of
// the board with pencil labels, and the teacher's red pen.
import { sk } from './dexReportArt';

/** One page of the report: the paper it is on and its HTML (see dexReport.ts). */
export interface DrPage {
  paper: 'lined' | 'graph' | 'cover';
  body: string;
}

interface InsOpts {
  /** Width on the page, in % of the sheet. */
  width: number;
  /** Tilt in degrees. */
  rot?: number;
  caption?: string;
  /** Extra inline style (float, margins). */
  style?: string;
  /** No graph squares behind it (a plain sheet). */
  plain?: boolean;
}

/** A piece of graph paper taped in, with a sketch drawn on its squares (w x h cells). */
export function ins(w: number, h: number, label: string, body: string, o: InsOpts): string {
  return (
    `<figure class="dr-ins${o.plain ? ' plain' : ''}" style="width:${o.width}%;--gw:${w};--gh:${h};transform:rotate(${o.rot ?? 0}deg);${o.style ?? ''}">` +
    `<i class="dr-tape a"></i><i class="dr-tape b"></i>${sk(w, h, label, body)}` +
    (o.caption ? `<figcaption>${o.caption}</figcaption>` : '') +
    '</figure>'
  );
}

/** A photo of the board taped in; `marks` are pencil labels: [text, x%, y%]. */
export function photo(src: string, alt: string, o: InsOpts, marks: [string, number, number][] = []): string {
  return (
    `<figure class="dr-photo" style="width:${o.width}%;transform:rotate(${o.rot ?? 0}deg);${o.style ?? ''}">` +
    `<i class="dr-tape a"></i><i class="dr-tape b"></i><img src="${src}" alt="${alt.replace(/"/g, '&quot;')}">` +
    marks.map(([t, x, y]) => `<span class="dr-mark" style="left:${x}%;top:${y}%">${t}</span>`).join('') +
    (o.caption ? `<figcaption>${o.caption}</figcaption>` : '') +
    '</figure>'
  );
}

/** A sketch drawn straight onto a graph-paper page: 28 cells wide, `h` tall, on the page's own squares. */
export function gsk(h: number, label: string, body: string, style = ''): string {
  return `<div style="width:calc(28 * var(--cell));height:calc(${h} * var(--cell));${style}">${sk(28, h, label, body)}</div>`;
}

/** A teacher's comment in red pen. */
export const red = (s: string, style = ''): string => `<p class="dr-red" style="${style}">${s}</p>`;
