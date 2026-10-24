// The text-bounds audit: the games' text helpers report the ink box of every string they
// draw, and with TEXT_BOUNDS=<file> set a build writes the strings whose ink runs past their
// picture (or past a clip area the helper was given) to that file as JSON when it exits.
// Off (the usual case) it records nothing and costs one check per string; it never changes a
// pixel. textBoundsCheck.ts runs the builds and reads the files.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

/** A rectangle as [x0, y0, x1, y1], x1 and y1 exclusive. */
export type Box = [number, number, number, number];

/** One string that ran past its picture or clip area. */
export interface TextOverflow {
  s: string;
  /** The picture's size. */
  w: number;
  h: number;
  /** Where the ink was, and the area it had to stay inside. */
  ink: Box;
  area: Box;
  /** The drawing call's source: the game code that drew it, and the code that called that. */
  at: string;
  /** Every call from the game code down to the helper (an outline and its fill differ). */
  via: string;
}

export interface TextBoundsReport {
  overflows: TextOverflow[];
  /**
   * Where each string (`${w}x${h} ${at} ${s}`) was drawn wholly inside, as the ink's top-left
   * corners: a scroll or a drop-in shows its words whole in other frames.
   */
  shown: Record<string, [number, number][]>;
}

const file = typeof process !== 'undefined' ? process.env.TEXT_BOUNDS : undefined;
const overflows: TextOverflow[] = [];
const shown = new Map<string, Set<string>>();
/** A string from one drawing call (down through the helpers) on pictures of one size. */
const key = (w: number, h: number, via: string, s: string) => `${w}x${h} ${via} ${s}`;

const HELPER = /\/art\/(font|draw|canvas)\.ts|screens\/(draw|screen)\.ts/;

/** Where a string was drawn: the first two frames of game code, and the helper calls under them. */
function caller(): { at: string; via: string } {
  const frames = (new Error().stack ?? '')
    .split('\n')
    .slice(1)
    .map((l) => /\(?((?:\/|file:)[^():]+):(\d+):\d+\)?\s*$/.exec(l))
    .filter((m): m is RegExpExecArray => !!m)
    .map((m) => ({ path: m[1].replace(/^file:\/\//, '').replace(/^.*\/games\//, ''), line: m[2] }))
    .filter((f) => !/node_modules|kit\/textBounds\.ts/.test(f.path))
    .map((f) => ({ ...f, helper: HELPER.test(f.path), name: `${f.path}:${f.line}` }));
  const game = frames.findIndex((f) => !f.helper);
  const at = frames.filter((f) => !f.helper).slice(0, 2);
  return {
    at: at.map((f) => f.name).join(' < '),
    via: frames
      .slice(0, game + 1)
      .map((f) => f.name)
      .join(' > '),
  };
}

if (file)
  process.on('exit', () => {
    const report: TextBoundsReport = {
      overflows,
      shown: Object.fromEntries([...shown].map(([k, at]) => [k, [...at].map((xy) => xy.split(',').map(Number) as [number, number])])),
    };
    writeFileSync(file, JSON.stringify(report));
  });

/** Collects one string's ink as a helper draws it; `end()` checks it against the area. */
export class TextInk {
  private x0 = Infinity;
  private y0 = Infinity;
  private x1 = -Infinity;
  private y1 = -Infinity;
  constructor(
    private readonly w: number,
    private readonly h: number,
    private readonly s: string,
    private readonly area: Box,
  ) {}

  /** A lit rectangle of the string (a font pixel, scaled). */
  add(x: number, y: number, w = 1, h = 1): void {
    if (x < this.x0) this.x0 = x;
    if (y < this.y0) this.y0 = y;
    if (x + w > this.x1) this.x1 = x + w;
    if (y + h > this.y1) this.y1 = y + h;
  }

  end(): void {
    if (this.x1 < this.x0) return;
    const [ax0, ay0, ax1, ay1] = this.area;
    // Half a pixel of slack: scaled fonts land on fractional positions that round inside.
    const out = this.x0 < ax0 - 0.5 || this.y0 < ay0 - 0.5 || this.x1 > ax1 + 0.5 || this.y1 > ay1 + 0.5;
    const { at, via } = caller();
    if (!out) {
      const k = key(this.w, this.h, via, this.s);
      if (!shown.has(k)) shown.set(k, new Set());
      shown.get(k)!.add(`${Math.round(this.x0)},${Math.round(this.y0)}`);
    } else
      overflows.push({ s: this.s, w: this.w, h: this.h, ink: [this.x0, this.y0, this.x1, this.y1].map((v) => Math.round(v)) as Box, area: this.area, at, via });
  }
}

/**
 * A recorder for one string drawn on picture `p`, or undefined when the audit is off. `clip`
 * is an area inside the picture the text must keep to (a frame, a sign's face).
 */
export function textInk(p: { readonly w: number; readonly h: number }, s: string, clip?: Box): TextInk | undefined {
  if (!file || !s.trim()) return undefined;
  return new TextInk(p.w, p.h, s, clip ?? [0, 0, p.w, p.h]);
}

/**
 * Splits a report's overflows into cut text (never drawn wholly inside, from that call at that
 * picture size, through the same helper lines) and moving text (a scroll or drop-in wholly shown in
 * another frame, more than two pixels away). A shadow, an outline and a fill come from different
 * helper lines, so an outline clipped round a fill that just fits is cut, not moving.
 * Cut text drawn more than once (an outline, a frame of a cartoon) is one entry, its ink the
 * union of every drawing.
 */
function judge(r: TextBoundsReport): { cut: TextOverflow[]; moving: TextOverflow[] } {
  const far = (o: TextOverflow) => (r.shown[key(o.w, o.h, o.via, o.s)] ?? []).some(([x, y]) => Math.abs(x - o.ink[0]) > 2 || Math.abs(y - o.ink[1]) > 2);
  const cut = new Map<string, TextOverflow>();
  const moving: TextOverflow[] = [];
  for (const o of r.overflows) {
    const k = key(o.w, o.h, o.via, o.s);
    if (far(o)) {
      moving.push(o);
      continue;
    }
    const was = cut.get(k);
    if (!was) cut.set(k, { ...o, ink: [...o.ink] });
    else was.ink = [Math.min(was.ink[0], o.ink[0]), Math.min(was.ink[1], o.ink[1]), Math.max(was.ink[2], o.ink[2]), Math.max(was.ink[3], o.ink[3])];
  }
  return { cut: [...cut.values()], moving };
}

/** One line about an overflow: the string, its ink box, the area and where it was drawn. */
export function describe(o: TextOverflow): string {
  return `"${o.s}" ink ${o.ink.join(',')} outside ${o.area.join(',')} (${o.w}x${o.h}) at ${o.at}`;
}

/** Reads a build's TEXT_BOUNDS file: the cut strings, and how many moved. */
export function readBounds(file: string): { cut: TextOverflow[]; moving: TextOverflow[] } {
  if (!existsSync(file)) throw new Error(`${file}: the build wrote no text-bounds report`);
  return judge(JSON.parse(readFileSync(file, 'utf8')) as TextBoundsReport);
}
