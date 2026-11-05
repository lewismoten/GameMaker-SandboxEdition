// "As others might see it": a picture of palette indexes drawn once as it is and once for each
// simulated color difference the person chose to preview (colorHelpPrefs.ts `preview`), side by
// side. Real renders of the same pixels, not stand-ins.
import { simulatePalette } from '@lewismoten/gamemaker-sandbox-engine/gfx/colorVision';
import type { Palette } from '@lewismoten/gamemaker-sandbox-engine/formats/palette';
import { h, clear } from '../core/ui';
import { previewViews } from './alike';
import { getColorHelp } from './colorHelpPrefs';

const MAX = 160;

function draw(canvas: HTMLCanvasElement, px: Uint8Array, w: number, hh: number, pal: Palette, transparent: number | undefined): void {
  canvas.width = w;
  canvas.height = hh;
  const img = new ImageData(w, hh);
  for (let i = 0; i < w * hh; i++) {
    const v = px[i];
    if (v === transparent) continue;
    for (let k = 0; k < 3; k++) img.data[i * 4 + k] = Math.round((pal[v * 3 + k] * 255) / 63);
    img.data[i * 4 + 3] = 255;
  }
  canvas.getContext('2d')!.putImageData(img, 0, 0);
}

/** The preview area: hidden while the choice is "As drawn". `set` redraws it. */
export function seenPreview(): { el: HTMLElement; set(px: Uint8Array, w: number, h: number, pal: Palette, transparent?: number): void } {
  const el = h('div', { class: 'seen-row', role: 'group', 'aria-label': 'Preview as others might see it' });
  el.hidden = true;
  return {
    el,
    set(px, w, hh, pal, transparent) {
      const views = previewViews(getColorHelp().preview);
      el.hidden = views.length < 2;
      if (el.hidden) return clear(el);
      const scale = Math.max(1, Math.floor(MAX / Math.max(w, hh)));
      clear(
        el,
        ...views.map((v) => {
          const c = h('canvas', { role: 'img', 'aria-label': `${v.label} view of the picture`, style: `width:${w * scale}px` });
          draw(c, px, w, hh, v.vision ? simulatePalette(pal, v.vision) : pal, transparent);
          return h('figure', { class: 'seen-view' }, c, h('figcaption', null, v.label));
        }),
      );
    },
  };
}
