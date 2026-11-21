// Map block and monster palette rendering.
import { MONBL, type parseBlocks } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { type Monster } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { blockCanvas } from '../../core/draw';
import type { Project } from '../../core/project';
import { clear, h } from '../../core/ui';
import { type paletteChooser } from '../../widgets/paletteChooser';
import { blockLabel } from '../blocks/blockNames';
import { monsterName } from '../monsters/monsterNames';
import type { Mode } from './mapToolModes';
import { type roleFilter } from './roleFilter';

interface Context {
  readonly picker: HTMLElement;
  readonly bg: ReturnType<typeof parseBlocks>;
  readonly filter: ReturnType<typeof roleFilter>;
  brush: number;
  readonly project: Project;
  readonly bblName: string;
  readonly mode: Mode;
  readonly setMode: (mode: Mode) => void;
  readonly redrawOverlay: () => void;
  readonly chooser: ReturnType<typeof paletteChooser>;
  readonly monPicker: HTMLElement;
  readonly mons: Monster[];
  readonly monName: string;
  monBrush: number;
  readonly mblk: ReturnType<typeof parseBlocks>;
}

export function createMapPickers(editor: Context) {
  /** The block palette: every block, or only those the role filter shows. */
  function renderPicker(): void {
    clear(
      editor.picker,
      ...editor.bg.flatMap((b, i) =>
        editor.filter.shows(i) || i === editor.brush
          ? [
              h(
                'button',
                {
                  class: i === editor.brush ? 'selected' : '',
                  'data-block': String(i),
                  title: blockLabel(editor.project, editor.bblName, i),
                  'aria-label': blockLabel(editor.project, editor.bblName, i),
                  onclick: () => (
                    (editor.brush = i),
                    editor.setMode(['paint', 'line', 'rect', 'fill', 'select'].includes(editor.mode) ? editor.mode : 'paint'),
                    rebuildPickers(),
                    editor.redrawOverlay()
                  ),
                },
                blockCanvas(b.pixels, editor.chooser.palette),
                h('small', null, i),
              ),
            ]
          : [],
      ),
    );
  }

  function rebuildPickers(): void {
    [...editor.picker.children].forEach((b) => b.classList.toggle('selected', (b as HTMLElement).dataset.block === String(editor.brush)));
  }

  function firstPic(m: Monster | undefined): number {
    const p = m?.pic[0]?.[0] ?? MONBL;
    return p >= 0 && p < MONBL ? p : -1;
  }

  function rebuildMonsters(): void {
    clear(
      editor.monPicker,
      ...editor.mons.map((m, i) => {
        const pic = firstPic(m);
        const name = monsterName(editor.project, editor.monName, i);
        return h(
          'button',
          {
            class: editor.mode === 'monster' && i === editor.monBrush ? 'selected' : '',
            title: name ? `Monster ${i}: ${name}` : `Monster ${i}`,
            onclick: () => ((editor.monBrush = i), editor.setMode('monster'), rebuildMonsters()),
          },
          pic >= 0 ? blockCanvas(editor.mblk[pic].pixels, editor.chooser.palette, { transparent: true, className: 'checker' }) : h('span', null, '—'),
          h('small', null, i),
        );
      }),
    );
  }

  return { renderPicker, rebuildPickers, firstPic, rebuildMonsters };
}
