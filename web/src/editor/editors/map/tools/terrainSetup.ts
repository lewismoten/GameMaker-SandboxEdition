// "Teach me your corners": the dialog that sets up a terrain from blocks the set already has, with a template, a live preview and a guess from the art.
import { h, modal, toast } from '../../../core/ui';
import { blockButton } from '../../../widgets/blockChooser';
import { newId } from '../../../../project/storage';
import { BLOB47, SLOTS, newTerrain, paintTerrain, requiredSlots, type Terrain, type TerrainKind } from './autotile';
import { autoDetect } from './autoDetect';
import { drawPreview, refreshSlot, slotButton, type SetupCtx } from './setupKit';

const KINDS: [TerrainKind, string, string][] = [
  ['edges', 'Edges & corners', 'A 3×3 of fill, edges and outer corners, plus 4 inner corners: grass, water, floors'],
  ['path', 'Path', 'A path or road one block wide: straights and corners (T and crossing optional)'],
  ['bits16', '16 tiles', 'One block for each way its four sides can join (4-bit), for walls and pipes'],
  ['blob47', '47 tiles', 'One block for every way the eight neighbors can meet, for the smoothest edges'],
];

const PW = 12;
const PH = 8;

/** The cells the preview paints, by kind: a field with a notch and a pond, or a looping path. */
function previewCells(kind: TerrainKind): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [];
  if (kind === 'path') {
    for (let x = 1; x <= 10; x++) out.push({ x, y: 1 }, { x, y: 6 });
    for (let y = 2; y <= 5; y++) out.push({ x: 1, y }, { x: 10, y }, { x: 6, y });
    return out;
  }
  for (let y = 1; y <= 6; y++) for (let x = 1; x <= 6; x++) if (!(x <= 2 && y <= 2)) out.push({ x, y });
  for (let y = 3; y <= 5; y++) for (let x = 7; x <= 10; x++) out.push({ x, y });
  return out;
}

/** The setup dialog. Resolves with the terrain to keep, or undefined. */
export function editTerrain(ctx: SetupCtx, start?: Terrain, guessOutside = 0): Promise<Terrain | undefined> {
  let t: Terrain = start ? structuredClone(start) : newTerrain(newId(), 'Terrain', 'edges', guessOutside);
  return modal<Terrain>(start ? `Terrain: ${start.name}` : 'New terrain', (close) => {
    const name = h('input', { type: 'text', value: t.name, maxLength: 40, required: true, oninput: () => (t.name = name.value) });
    const kindBar = h('div', { class: 'seg', role: 'group', 'aria-label': 'Kind of terrain' });
    const template = h('div', { class: 'mt-template' });
    const preview = h('canvas', { class: 'pixel mt-preview', role: 'img', 'aria-label': 'Preview of the terrain painted on a small map' });
    const note = h('p', { class: 'meta', 'aria-live': 'polite' });
    const slots: HTMLElement[] = [];

    const fillSlot = () => (t.kind === 'edges' ? 4 : t.kind === 'blob47' ? BLOB47.indexOf(0xff) : t.kind === 'bits16' ? 15 : -1);
    const refresh = () => {
      const scratch = new Uint8Array(PW * PH).fill(t.outside);
      paintTerrain(scratch, t, previewCells(t.kind), false, PW, PH);
      drawPreview(preview, ctx, Array.from({ length: PH }, (_, y) => [...scratch.slice(y * PW, y * PW + PW)]), t.outside);
      const missing = requiredSlots(t.kind).filter((i) => t.tiles[i] < 0).length;
      const clash = t.tiles.includes(t.outside);
      note.textContent = clash
        ? 'The ground block is also one of the terrain’s blocks: choose another ground, or erasing can’t tell them apart.'
        : missing
          ? `${missing} more block${missing === 1 ? '' : 's'} needed (the outlined slots). Empty optional slots use a near one.`
          : 'Ready to paint. Empty optional slots use a near one.';
      save.disabled = clash || missing > 0 || !t.tiles.some((b) => b >= 0);
    };

    const buildTemplate = () => {
      slots.length = 0;
      const need = new Set(requiredSlots(t.kind));
      const make = (i: number) => {
        const s = SLOTS[t.kind][i];
        const b = slotButton(ctx, s.label, s.mask, () => t.tiles[i], (v) => ((t.tiles[i] = v), refresh()));
        if (need.has(i)) b.classList.add('needed');
        slots[i] = b;
        return b;
      };
      if (t.kind === 'edges') {
        template.replaceChildren(
          h('div', { class: 'mt-group' }, h('span', { class: 'meta' }, 'Fill, edges and outer corners'), h('div', { class: 'mt-grid', style: '--cols:3' }, ...[0, 1, 2, 3, 4, 5, 6, 7, 8].map(make))),
          h('div', { class: 'mt-group' }, h('span', { class: 'meta' }, 'Inner corners (optional)'), h('div', { class: 'mt-grid', style: '--cols:2' }, ...[9, 10, 11, 12].map(make))),
        );
      } else {
        const cols = t.kind === 'bits16' ? 4 : t.kind === 'path' ? 6 : 8;
        template.replaceChildren(h('div', { class: 'mt-grid', style: `--cols:${cols}` }, ...SLOTS[t.kind].map((_, i) => make(i))));
      }
      guess.hidden = t.kind === 'path';
      [...kindBar.children].forEach((b) => b.setAttribute('aria-pressed', String((b as HTMLElement).dataset.kind === t.kind)));
      refresh();
    };

    const guess = h(
      'button',
      {
        type: 'button',
        title: 'Fill the slots with blocks whose edges look like the fill on one side and the ground on the other',
        onclick: () => {
          const f = fillSlot();
          const fill = t.tiles[f];
          if (fill < 0) return toast('Choose the fill (center) block first, and the ground block.', 'error');
          const found = autoDetect(ctx.blocks, t.kind, fill, t.outside);
          let n = 0;
          found.forEach((b, i) => {
            if (b >= 0 && i !== f && t.tiles[i] < 0) {
              t.tiles[i] = b;
              n++;
            }
          });
          slots.forEach(refreshSlot);
          refresh();
          toast(n ? `Found ${n} block${n === 1 ? '' : 's'} by their edges. Check the preview.` : 'No more blocks matched by their edges; drop them in by hand.');
        },
      },
      '✨ Guess the rest from the art',
    );
    for (const [k, label, title] of KINDS)
      kindBar.append(
        h(
          'button',
          {
            type: 'button',
            dataset: { kind: k },
            title,
            onclick: () => {
              if (k === t.kind) return;
              t = { ...newTerrain(t.id, t.name, k, t.outside) };
              buildTemplate();
            },
          },
          label,
        ),
      );
    const save = h('button', { type: 'submit', class: 'primary' }, 'Save terrain');
    const ground = blockButton(
      () => ctx.blocks,
      () => ctx.palette,
      () => t.outside,
      (v) => ((t.outside = v), refresh()),
      { title: 'Ground: the block erasing leaves', transparent: false },
    );
    ground.setAttribute('aria-label', 'Ground block (what erasing leaves)');
    buildTemplate();
    return h(
      'form',
      {
        class: 'stack mt-setup',
        onsubmit: (e: Event) => {
          e.preventDefault();
          if (!name.value.trim()) return name.reportValidity();
          close({ ...t, name: name.value.trim() });
        },
      },
      h('p', { class: 'hint' }, 'Drop your blocks into the template: click a slot and choose its block. The little drawings show where the terrain (green) meets the ground (brown).'),
      h('div', { class: 'toolbar' }, h('label', { class: 'field' }, h('span', null, 'Name'), name), h('div', { class: 'field' }, h('span', null, 'Ground'), ground)),
      kindBar,
      h('div', { class: 'mt-body' }, template, h('div', { class: 'stack mt-side' }, h('strong', null, 'Preview'), preview, note, guess)),
      h('div', { class: 'buttons' }, h('button', { type: 'button', onclick: () => close(undefined) }, 'Cancel'), save),
    );
  });
}
