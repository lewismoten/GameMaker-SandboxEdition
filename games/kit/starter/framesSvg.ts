// Pictures for a Starter's "How this level is made" page: blocks drawn as small inline SVGs (one rectangle for each
// run of one color), side by side with a caption under each, so a page can show a loop's frames as the game draws
// them. A page of manual.json holds `<figure data-frames="name"></figure>`; fillFigures() puts the pictures in, and
// can be run again on the same file (it replaces what the figure holds).
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Pal } from './palette';

/** One block as an SVG, `zoom` times its size; color 255 (clear) is left out. */
export function blockSvg(pal: Pal, pic: Pixels, zoom: number, label: string): string {
  const hex = (c: number) => '#' + [0, 1, 2].map((i) => ((pal.pal[c * 3 + i] << 2) | (pal.pal[c * 3 + i] >> 4)).toString(16).padStart(2, '0')).join('');
  const rects: string[] = [];
  for (let y = 0; y < pic.h; y++) {
    let x = 0;
    while (x < pic.w) {
      const c = pic.get(x, y);
      let run = 1;
      while (x + run < pic.w && pic.get(x + run, y) === c) run++;
      if (c !== 255) rects.push(`<rect x="${x}" y="${y}" width="${run}" height="${1}" fill="${hex(c)}"/>`);
      x += run;
    }
  }
  return (
    `<div style="text-align:center"><svg role="img" aria-label="${label}" width="${pic.w * zoom}" height="${pic.h * zoom}" viewBox="0 0 ${pic.w} ${pic.h}" ` +
    `shape-rendering="crispEdges" style="max-width:100%;height:auto">${rects.join('')}</svg><div><small>${label}</small></div></div>`
  );
}

/** A row of blocks with captions. */
export function framesFigure(pal: Pal, frames: { pic: Pixels; label: string }[], zoom = 3): string {
  const items = frames.map((f) => blockSvg(pal, f.pic, zoom, f.label)).join('');
  return `<figure data-frames="NAME" style="margin:8px 0;display:flex;flex-wrap:wrap;gap:8px">${items}</figure>`;
}

/** Fills each `<figure data-frames="name">…</figure>` of `html` with `figures[name]`. */
export function fillFigures(html: string, figures: Record<string, string>): string {
  return html.replace(/<figure data-frames="([\w-]+)"[^>]*>[\s\S]*?<\/figure>/g, (_whole, name: string) => {
    const f = figures[name];
    if (!f) throw new Error(`No pictures for figure ${name}`);
    return f.replace('data-frames="NAME"', `data-frames="${name}"`);
  });
}
