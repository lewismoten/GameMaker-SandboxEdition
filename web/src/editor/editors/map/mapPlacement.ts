// Monster placement and flood fill operations.
import { LASTMM, MLEN, MWID, type parseMap, reindexMonsters } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { LASTMON } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { toast } from '../../core/ui';
import { floodCells } from './tools/cellOps';

interface Context {
  readonly map: ReturnType<typeof parseMap>;
  readonly monBrush: number;
  readonly brush: number;
  readonly wrapping: boolean;
  readonly draw: () => void;
  readonly save: () => void;
  readonly changedCells: (cells: number[]) => void;
}

export function createMapPlacement(editor: Context) {
  function placeMonster(x: number, y: number, remove: boolean): void {
    const at = editor.map.monsters.findIndex((m) => m.monnum < LASTMON && m.curx === x && m.cury === y);
    if (at >= 0) editor.map.monsters[at].monnum = LASTMON;
    if (!remove) {
      const slot = editor.map.monsters.findIndex((m) => m.monnum >= LASTMON);
      if (slot < 0) {
        toast(`A map holds at most ${LASTMM} monsters.`, 'error');
        return;
      }
      Object.assign(editor.map.monsters[slot], { monnum: editor.monBrush, curx: x, cury: y });
    }
    reindexMonsters(editor.map);
    editor.draw();
    editor.save();
  }

  function floodFill(x: number, y: number): void {
    if (editor.map.blocks[y * MLEN + x] === editor.brush) return;
    const cells = floodCells(editor.map.blocks, { x, y }, MLEN, MWID, editor.wrapping).map((c) => c.y * MLEN + c.x);
    for (const i of cells) editor.map.blocks[i] = editor.brush;
    editor.changedCells(cells);
  }

  return { placeMonster, floodFill };
}
