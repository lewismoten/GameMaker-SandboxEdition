// The front cover of a game's printed manual: its own design, not the box front. A shareware
// publisher printed these in two or three inks on card stock: the company band, the title in
// the box's colors, what kind of manual it is, one framed screenshot (a different one from the
// box front) with the hero standing on its frame, and the small print. Sized in cqw, so the
// same element fits the booklet page and the little manual beside the box in the box viewer.
import './paper.css'; // first: this piece's own styles build on the paper's
import './manualCover.css';
import { h } from '../../editor/core/ui';
import type { CatalogEntry } from '../../project/files';
import { boxShot } from '../../gfx/frameShot';
import { portrait, sandboxLogo, splitTitle } from './kit';
import { gameVersion } from '../../project/gameVersion';

/** What the manual is called on its cover: "Courier Manual" from "Maximus - Courier Manual". */
function manualKind(entry: CatalogEntry): string {
  const t = entry.original?.manual?.title ?? '';
  const i = t.lastIndexOf(' - ');
  return i >= 0 ? t.slice(i + 3).trim() : 'Player’s Manual';
}

/** The cover's art, cached per game: a screenshot the box front doesn't use, and the hero. */
const art = new Map<string, Promise<{ shot?: string; hero?: string }>>();

function coverArt(entry: CatalogEntry): Promise<{ shot?: string; hero?: string }> {
  let hit = art.get(entry.id);
  if (!hit) {
    hit = (async () => {
      const shots = entry.original?.box?.shots ?? [];
      const s = shots[2] ?? shots[1] ?? shots[0];
      const hero =
        entry.original?.printables?.stickers?.find((x) => x.hero)?.hero ??
        entry.original?.printables?.items?.flatMap((i) => (i.kind === 'idcard' && i.portrait ? [i.portrait] : []))[0];
      const [pic, face] = await Promise.all([
        s ? boxShot(entry, s).catch(() => undefined) : undefined,
        hero ? portrait(entry, hero).catch(() => undefined) : undefined,
      ]);
      return { shot: pic?.toDataURL(), hero: face };
    })();
    art.set(entry.id, hit);
  }
  return hit;
}

let ruler: CanvasRenderingContext2D | null | undefined;

/** How many lines `title` wraps to at `cqw` across the 86 cqw between the cover's margins, measured in its font. */
function titleLines(title: string, cqw: number): number {
  ruler ??= document.createElement('canvas').getContext('2d');
  if (!ruler) return 1;
  ruler.font = "italic 900 100px 'Arial Black', Impact, sans-serif";
  const width = (s: string) => ((ruler!.measureText(s).width - 2 * s.length) * cqw) / 100; // letter-spacing -0.02em
  let lines = 1;
  let line = '';
  for (const w of title.split(/\s+/).filter(Boolean)) {
    const next = line ? `${line} ${w}` : w;
    if (line && width(next) > 86) (lines++, (line = w));
    else line = next;
  }
  return lines;
}

/**
 * The title's size in cqw: as big as fits, its longest word on one line, and no taller than
 * 36 cqw in all, so the screenshot and the small print below it stay on the cover.
 */
function titleSize(title: string): number {
  const longest = Math.max(...title.split(/\s+/).map((w) => w.length), 1);
  const lines = title.length > 14 ? 0.8 : 1;
  let size = Math.round(Math.min(15 * lines, 84 / (longest * 0.74)) * 10) / 10;
  while (size > 6 && titleLines(title, size) * size * 0.95 > 36) size = Math.round((size - 0.5) * 10) / 10;
  return size;
}

/** The cover; its pictures fill in when ready (`ready` resolves then). */
export function manualCover(entry: CatalogEntry): { el: HTMLElement; ready: Promise<void> } {
  const box = entry.original?.box;
  const [main, sub] = splitTitle(entry.title);
  const shot = h('div', { class: 'mc-shot' });
  const el = h(
    'div',
    {
      class: 'manual-cover',
      style: `--mc-bg:${box?.background ?? '#14182a'};--mc-acc:${box?.accent ?? '#f2b632'};--mc-ink:${box?.ink ?? '#fff'}`,
    },
    h('div', { class: 'mc-band' }, sandboxLogo('mc-logo'), h('span', { class: 'mc-ver' }, `Version ${gameVersion(entry) ?? '1.0'}`)),
    h(
      'div',
      { class: 'mc-head' },
      h('div', { class: 'mc-title', style: `font-size:${titleSize(main)}cqw` }, main),
      sub ? h('div', { class: 'mc-sub' }, sub) : null,
    ),
    h('div', { class: 'mc-kind' }, manualKind(entry)),
    shot,
    h(
      'div',
      { class: 'mc-foot' },
      h('span', null, 'For IBM PC/AT & compatibles'),
      h('span', null, `Shareware${entry.price ? ` · ${entry.price} Registration` : ''}`),
    ),
  );
  const ready = coverArt(entry).then(({ shot: src, hero }) => {
    if (src) shot.append(h('img', { class: 'mc-pic', src, alt: '' }));
    else shot.classList.add('empty');
    if (hero) shot.append(h('img', { class: 'mc-hero', src: hero, alt: '' }));
  });
  return { el, ready };
}
