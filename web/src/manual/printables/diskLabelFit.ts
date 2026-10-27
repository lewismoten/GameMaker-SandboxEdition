// "How it goes on": a small drawing of a 3.5" disk front and back with the label in place, from
// the disk's measurements (labelSheets.ts DISK_CASE), for the disk label sheet's instructions.
import { DISK_CASE, DISK_LABEL } from './labelSheets';

const n = (v: number) => String(Math.round(v * 1000) / 1000);

/** One side of the disk at `x0`, with the label's part on that side. */
function side(x0: number, front: boolean): string {
  const { w, h, recess, window: win, shutter, hub } = DISK_CASE;
  const lx = x0 + (w - DISK_LABEL.w) / 2;
  const labelH = front ? DISK_LABEL.h - DISK_LABEL.back - DISK_LABEL.edge : DISK_LABEL.back;
  const corner = 0.12;
  const body = `M ${n(x0)} 0 H ${n(x0 + w)} V ${n(h)} H ${n(x0 + corner)} L ${n(x0)} ${n(h - corner)} Z`;
  const parts = [
    `<path d="${body}" fill="#3b3f46" stroke="#1d1f23" stroke-width="0.02"/>`,
    front ? `<rect x="${n(x0 + recess.x)}" y="0" width="${n(recess.w)}" height="${n(recess.h)}" rx="0.08" fill="#2f3238"/>` : '',
    ...[win.inset, w - win.inset - win.w].map((x) => `<rect x="${n(x0 + x)}" y="${n(win.y)}" width="${n(win.w)}" height="${n(win.h)}" fill="#111"/>`),
    !front ? `<circle cx="${n(x0 + hub.x)}" cy="${n(hub.y)}" r="${n(hub.r)}" fill="#9aa1a9" stroke="#6b7078" stroke-width="0.02"/>` : '',
    `<rect x="${n(x0 + shutter.x)}" y="${n(shutter.y)}" width="${n(shutter.w)}" height="${n(h - shutter.y)}" fill="#c4c9cf" stroke="#8d939a" stroke-width="0.02"/>`,
    `<rect x="${n(lx)}" y="0" width="${n(DISK_LABEL.w)}" height="${n(labelH)}" fill="#fff4c8" stroke="#e4002b" stroke-width="0.03"/>`,
    `<text x="${n(lx + DISK_LABEL.w / 2)}" y="${n(labelH / 2 + 0.07)}" text-anchor="middle" font-size="0.2" font-family="Arial, sans-serif" font-weight="700" fill="#222">${front ? 'front: 2 in' : 'back: 5/8 in'}</text>`,
    `<text x="${n(x0 + w / 2)}" y="${n(h + 0.32)}" text-anchor="middle" font-size="0.24" font-family="Arial, sans-serif" font-weight="700" fill="currentColor">${front ? 'Front' : 'Back (turned over)'}</text>`,
  ];
  return parts.join('');
}

/** The drawing, as an <svg> element, about 22em wide. */
export function diskLabelFit(): SVGSVGElement {
  const gap = 0.7;
  const w = DISK_CASE.w * 2 + gap;
  const h = DISK_CASE.h + 0.45;
  const wrap = document.createElement('div');
  wrap.innerHTML = `<svg viewBox="-0.05 -0.05 ${n(w + 0.1)} ${n(h + 0.1)}" width="352" style="max-width:100%;height:auto" role="img" aria-label="How the label goes on: its 2 inch front fills the recess on the disk's front, its top on the disk's top edge; it folds over that edge, and its 5/8 inch strip lies across the top of the back, above the metal hub">${side(0, true)}${side(DISK_CASE.w + gap, false)}</svg>`;
  return wrap.firstElementChild as SVGSVGElement;
}
