// Exact 20x20 public-game blocks; provenance and missing-art briefs are in docs/achievement-art.md.
import './badgeArt.css';
import { glyphRows } from '@lewismoten/gamemaker-sandbox-tools/text';
import data from './blockArt.json';
import type { Achievement } from './catalog';

const blocks: Record<string, { image: string }> = data.badges;
const dots = Array.from(glyphRows(63, 'micro-square'))
  .flatMap((row, y) => [0, 1, 2].flatMap((x) => (row & (1 << x) ? [`<rect x="${7 + x * 2}" y="${5 + y * 2}" width="2" height="2"/>`] : [])))
  .join('');
const question = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" shape-rendering="crispEdges"><path fill="#314854" d="M2 0h16v2h2v16h-2v2H2v-2H0V2h2z"/><path fill="#b5d8df" d="M2 2h16v1H2z"/><g fill="#e7f9fc">${dots}</g></svg>`)}`;

/** Hidden achievements never expose their art before they are unlocked. */
export function badgeSource(a: Achievement, unlocked: boolean): string {
  return a.hidden && !unlocked ? question : (blocks[a.id]?.image ?? question);
}

export function badgeIcon(a: Achievement, unlocked: boolean): HTMLImageElement {
  const image = document.createElement('img');
  image.className = 'ach-block-art';
  image.src = badgeSource(a, unlocked);
  image.width = image.height = 20;
  image.alt = '';
  image.setAttribute('aria-hidden', 'true');
  return image;
}
