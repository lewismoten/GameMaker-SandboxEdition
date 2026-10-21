// A dialog showing a scene's map, block by block, to click the cell a link arrives at.
import { h, modal } from '../../core/ui';
import { blockImages } from '../../core/draw';
import type { Project } from '../../core/project';
import type { Game, Point } from '../../../formats/game';
import { BACKBL, newBlockSet, parseBlocks } from '../../../formats/blocks';
import { MLEN, MWID, parseMap } from '../../../formats/map';
import { defaultPalette, parsePalette } from '../../../formats/palette';

/** Lets the user click a map cell of a scene. */
export async function pickOnMap(project: Project, game: Game, scene: number, current: Point, title: string): Promise<Point | undefined> {
  const s = game.scenes[scene];
  const mapBytes = s?.files[1] && project.files.get(s.files[1]);
  if (!mapBytes)
    return modal<Point>(title, (close) => [
      h('p', null, 'That scene has no map yet.'),
      h('div', { class: 'buttons' }, h('button', { onclick: () => close(undefined) }, 'OK')),
    ]);
  const map = parseMap(mapBytes);
  const bbl = s.files[2] && project.files.get(s.files[2]);
  const blocks = bbl ? parseBlocks(bbl, BACKBL) : newBlockSet('bbl');
  const pal = s.files[0] && project.files.get(s.files[0]) ? parsePalette(project.files.get(s.files[0])!) : defaultPalette();
  const imgs = blockImages(blocks, pal);
  const cell = 8;
  const canvas = h('canvas', { width: MLEN * cell, height: MWID * cell, class: 'pixel', style: 'max-width:100%;cursor:crosshair' });
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  for (let y = 0; y < MWID; y++) for (let x = 0; x < MLEN; x++) ctx.drawImage(imgs[map.blocks[y * MLEN + x]] ?? imgs[0], x * cell, y * cell, cell, cell);
  ctx.strokeStyle = '#ffd400';
  ctx.lineWidth = 2;
  ctx.strokeRect(current.x * cell, current.y * cell, cell, cell);
  const label = h('div', { class: 'meta' }, `Current: (${current.x}, ${current.y})`);
  return modal<Point>(title, (close) => {
    canvas.addEventListener('mousemove', (e) => {
      const r = canvas.getBoundingClientRect();
      label.textContent = `(${Math.floor(((e.clientX - r.left) / r.width) * MLEN)}, ${Math.floor(((e.clientY - r.top) / r.height) * MWID)})`;
    });
    canvas.addEventListener('click', (e) => {
      const r = canvas.getBoundingClientRect();
      close({ x: Math.floor(((e.clientX - r.left) / r.width) * MLEN), y: Math.floor(((e.clientY - r.top) / r.height) * MWID) });
    });
    return [
      h('div', { style: 'max-height:70vh;overflow:auto' }, canvas),
      label,
      h('div', { class: 'buttons' }, h('button', { onclick: () => close(undefined) }, 'Cancel')),
    ];
  });
}
