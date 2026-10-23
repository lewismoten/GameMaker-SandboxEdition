// The dialog that sets up a smart building from its parts, with a preview at a size of your choosing.
import { h, modal, numberField } from '../../../core/ui';
import { newId } from '../../../../project/storage';
import { BUILDING_PARTS, assembleBuilding, newBuilding, type Building, type BuildingPart } from './building';
import { drawPreview, slotButton, type SetupCtx } from './setupKit';

// the parts laid out the way they sit on a house
const LAYOUT: (BuildingPart | null)[][] = [
  ['roofTopLeft', 'roofTop', 'roofTopRight'],
  ['roofLeft', 'roof', 'roofRight'],
  ['wallLeft', 'window', 'wallRight'],
  [null, 'wall', 'door'],
];

/** The setup dialog. Resolves with the building to keep, or undefined. */
export function editBuilding(ctx: SetupCtx, start: Building | undefined, ground: number): Promise<Building | undefined> {
  const b: Building = start ? structuredClone(start) : newBuilding(newId(), 'House');
  let pw = 6;
  let ph = 4;
  return modal<Building>(start ? `Building: ${start.name}` : 'New building', (close) => {
    const name = h('input', { type: 'text', value: b.name, maxLength: 40, required: true });
    const preview = h('canvas', { class: 'pixel mt-preview', role: 'img', 'aria-label': 'Preview of the building' });
    const save = h('button', { type: 'submit', class: 'primary' }, 'Save building');
    const note = h('p', { class: 'meta', 'aria-live': 'polite' });
    const refresh = () => {
      drawPreview(preview, ctx, assembleBuilding(b, pw, ph), ground);
      const ok = b.parts.wall >= 0 && (b.parts.roofTop >= 0 || b.parts.roof >= 0);
      save.disabled = !ok;
      note.textContent = ok ? 'Drag out a rectangle on the map to build one this way, any size.' : 'Choose at least the roof edge (or roof fill) and the wall fill.';
    };
    const label = (p: BuildingPart) => BUILDING_PARTS.find((x) => x.part === p)!.label;
    const grid = h(
      'div',
      { class: 'mt-grid', style: '--cols:3' },
      ...LAYOUT.flat().map((p) => (p ? slotButton(ctx, label(p), undefined, () => b.parts[p], (v) => ((b.parts[p] = v), refresh())) : h('span', { 'aria-hidden': 'true' }))),
    );
    refresh();
    return h(
      'form',
      {
        class: 'stack mt-setup',
        onsubmit: (e: Event) => {
          e.preventDefault();
          if (!name.value.trim()) return name.reportValidity();
          close({ ...b, name: name.value.trim() });
        },
      },
      h('p', { class: 'hint' }, 'Choose a block for each part, laid out as on a house. Parts left empty borrow a near one: a missing left wall uses the wall fill.'),
      h('div', { class: 'toolbar' }, h('label', { class: 'field' }, h('span', null, 'Name'), name)),
      h(
        'div',
        { class: 'mt-body' },
        h('div', { class: 'stack' }, grid),
        h(
          'div',
          { class: 'stack mt-side' },
          h('strong', null, 'Preview'),
          preview,
          h(
            'div',
            { class: 'toolbar' },
            numberField('Width', () => pw, (v) => ((pw = v), refresh()), { min: 1, max: 16 }),
            numberField('Height', () => ph, (v) => ((ph = v), refresh()), { min: 1, max: 12 }),
            numberField('Roof rows', () => b.roofRows, (v) => ((b.roofRows = v), refresh()), { min: 1, max: 8 }),
            numberField('Window every', () => b.windowEvery, (v) => ((b.windowEvery = v), refresh()), { min: 1, max: 6, title: 'Columns from one window to the next' }),
          ),
          note,
        ),
      ),
      h('div', { class: 'buttons' }, h('button', { type: 'button', onclick: () => close(undefined) }, 'Cancel'), save),
    );
  });
}
