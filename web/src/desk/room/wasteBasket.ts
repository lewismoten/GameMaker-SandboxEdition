// A black wire-mesh waste basket on the floor under the wall clock, with a few crumpled sheets
// of notebook paper (failed level designs, probably) in it.
import './wasteBasket.css';
import { h } from '../../editor/core/ui';

export function wasteBasket(): HTMLElement {
  // the mesh: wires running down the tapering sides, crossed by rings
  const top = { l: 4, r: 96, y: 14 };
  const bottom = { l: 16, r: 84, y: 104 };
  const down = Array.from({ length: 13 }, (_, i) => {
    const f = i / 12;
    const x1 = top.l + (top.r - top.l) * f;
    const x2 = bottom.l + (bottom.r - bottom.l) * f;
    return `<line x1="${x1.toFixed(1)}" y1="${top.y}" x2="${x2.toFixed(1)}" y2="${bottom.y}"/>`;
  }).join('');
  const rings = Array.from({ length: 8 }, (_, i) => {
    const f = (i + 1) / 9;
    const y = top.y + (bottom.y - top.y) * f;
    const l = top.l + (bottom.l - top.l) * f;
    const r = top.r + (bottom.r - top.r) * f;
    return `<path d="M${l.toFixed(1)} ${y.toFixed(1)} Q50 ${(y + 6).toFixed(1)} ${r.toFixed(1)} ${y.toFixed(1)}"/>`;
  }).join('');
  const paper = (x: number, y: number, r: number, fill: string) =>
    `<path d="M${x - r} ${y} q${r * 0.3} ${-r * 1.1} ${r} ${-r} q${r * 0.9} ${-r * 0.2} ${r} ${r * 0.9} q${-r * 0.2} ${r * 0.8} ${-r} ${r * 0.7} q${-r * 0.8} ${-r * 0.1} ${-r} ${-r * 0.6} z" fill="${fill}" stroke="#b9b39f" stroke-width="0.8"/>
     <path d="M${x - r * 0.5} ${y - r * 0.2} l${r * 0.5} ${r * 0.3} l${r * 0.4} ${-r * 0.4}" fill="none" stroke="#9fb4cc" stroke-width="0.7"/>`;
  const el = h('div', { class: 'waste-basket', 'aria-hidden': 'true' });
  el.innerHTML = `<svg viewBox="0 0 100 112">
    <!-- the inside, then the crumpled paper heaped in it -->
    <ellipse cx="50" cy="${top.y}" rx="46" ry="8" fill="#141414"/>
    ${paper(36, 14, 12, '#f6f3e8')}
    ${paper(60, 12, 10, '#fbf8ee')}
    ${paper(50, 6, 9, '#f1ecda')}
    <!-- the mesh, the solid band at the bottom, and the rolled rim -->
    <g stroke="#5b5d61" stroke-width="1.1" fill="none">${down}${rings}</g>
    <path d="M${bottom.l - 1} ${bottom.y - 6} Q50 ${bottom.y} ${bottom.r + 1} ${bottom.y - 6} L${bottom.r} ${bottom.y} Q50 ${bottom.y + 6} ${bottom.l} ${bottom.y} z" fill="#3a3c40"/>
    <ellipse cx="50" cy="${top.y}" rx="46" ry="8" fill="none" stroke="#6a6c70" stroke-width="3"/>
    <ellipse cx="50" cy="${top.y - 1}" rx="46" ry="8" fill="none" stroke="#9a9ca0" stroke-width="0.8"/>
  </svg>`;
  return el;
}
