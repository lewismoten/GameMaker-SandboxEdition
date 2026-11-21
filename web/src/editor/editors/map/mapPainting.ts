// Map cell painting and incremental redraws.
import { BLEN } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { MLEN, MWID, type parseMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { drawTile } from './mapTile';
import { nativeCell } from './mapWrap';

interface Context {
  readonly map: ReturnType<typeof parseMap>;
  readonly brush: number;
  readonly wrapping: boolean;
  readonly ctx: CanvasRenderingContext2D;
  readonly onScreen: () => { bg: HTMLCanvasElement[]; mon: HTMLCanvasElement[] };
  readonly scale: () => number;
  readonly draw: () => void;
  readonly redrawOverlay: () => void;
  readonly save: () => void;
}

export function createMapPainting(editor: Context) {
  function paintCell(x: number, y: number, v = editor.brush): void {
    if (editor.wrapping) ({ x, y } = nativeCell({ x, y }));
    if (x < 0 || y < 0 || x >= MLEN || y >= MWID) return;
    editor.map.blocks[y * MLEN + x] = v;
    drawTile(editor.ctx, editor.onScreen().bg[v], x, y, BLEN * editor.scale());
  }

  /** Cells the tools changed: draw just them (with the links over them) and save. */
  function changedCells(cells: number[]): void {
    if (!cells.length) return;
    const s = BLEN * editor.scale();
    const bgI = editor.onScreen().bg;
    for (const i of cells) drawTile(editor.ctx, bgI[editor.map.blocks[i]] ?? bgI[0], i % MLEN, Math.floor(i / MLEN), s);
    if (cells.length > 400) editor.draw();
    else editor.redrawOverlay();
    editor.save();
  }

  return { paintCell, changedCells };
}
