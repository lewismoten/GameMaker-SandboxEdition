// One value of a saved game in the Saves & scores panel: a number box (with Unlimited where the
// engine allows it), a carried item's block, or a line of information, with its plain warnings.
import { h, clear, modal } from '../editor/core/ui';
import { blockCanvas } from '../editor/core/draw';
import { chooseBlock } from '../editor/widgets/blockChooser';
import { fieldWarnings, getField, setField, UNLIMITED, type GameLabels, type SavedGame, type SaveField } from '../project/saveData';
import { BACKBL } from '../formats/blocks';
import { tip } from './tip';
import { rangeText } from './panelText';

/** The ⓘ beside a field (its note and limits), or `groupTip` for a group whose fields share one. */
export function fieldRow(
  labels: GameLabels | undefined,
  slot: number,
  save: SavedGame,
  f: SaveField,
  refresh: (rebuild?: boolean) => void,
  groupTip?: string,
): HTMLElement {
  const id = `sv-${slot}-${f.id.replace(':', '-')}`;
  const v = getField(save, f.id);
  const unused = f.group === 'counters' && /unused/.test(f.label);
  const warn = h('p', { class: 'sv-warn', id: `${id}-warn` });
  const showWarn = () => {
    // the limits are in the ⓘ beside the field
    // a counter no block uses can't block the way
    const w = unused ? [] : fieldWarnings(save, f, labels).map((x) => x.replace(/ \(see the note on its limit\)/, ''));
    // one line each (all of it on focus, and in the title)
    clear(warn, ...w.map((x) => h('span', { title: x }, '⚠ ', x)));
    warn.hidden = !w.length;
  };
  if (f.type === 'info')
    return h(
      'div',
      { class: 'sv-field info' },
      h('span', { class: 'sv-label' }, f.label),
      h('span', { class: 'sv-info' }, f.id === 'scene' ? f.note : String(v ?? '—')),
    );
  if (f.type === 'item') {
    const row = h('div', { class: 'sv-field item' }, h('span', { class: 'sv-label' }, f.label), itemButton(labels, save, f, v, id, refresh, groupTip), warn);
    showWarn();
    return row;
  }
  const unlimited = v === UNLIMITED;
  const own = groupTip ? undefined : tip(f.label, h('p', null, f.note), h('p', null, rangeText(f)));
  const input = h('input', {
    type: 'number',
    id,
    inputmode: 'numeric',
    min: f.min,
    max: f.max,
    step: 1,
    value: typeof v === 'number' ? String(v) : '',
    placeholder: v === null ? 'not set yet' : unlimited ? '∞' : '',
    disabled: unlimited,
    'aria-describedby': `${own?.id ?? groupTip ?? ''} ${id}-warn`.trim(),
    onchange: () => {
      const n = Number(input.value);
      if (input.value === '' || Number.isNaN(n)) return;
      setField(save, f.id, n, labels);
      const now = getField(save, f.id);
      if (typeof now === 'number' && now !== n) input.value = String(now);
      showWarn();
      refresh();
    },
  });
  const box = f.canBeUnlimited
    ? h(
        'label',
        { class: 'sv-inf', title: 'Never counts down and never runs out' },
        h('input', {
          type: 'checkbox',
          checked: unlimited,
          onchange: (e: Event) => {
            const on = (e.target as HTMLInputElement).checked;
            // back to counting: start from the safe top (the engine's own unlimited is gone)
            setField(save, f.id, on ? UNLIMITED : Math.min(f.safeMax, 99), labels);
            refresh(true);
          },
        }),
        'Unlimited',
      )
    : null;
  const row = h(
    'div',
    { class: `sv-field${unused ? ' unused' : ''}` },
    h('span', { class: 'sv-label-row' }, h('label', { class: 'sv-label', for: id }, f.label), own?.el),
    h('div', { class: 'sv-input' }, input, box),
    warn,
  );
  showWarn();
  return row;
}

/** A carried item: its block's picture, and a click to choose another (or type its number). */
function itemButton(
  labels: GameLabels | undefined,
  save: SavedGame,
  f: SaveField,
  v: ReturnType<typeof getField>,
  id: string,
  refresh: () => void,
  groupTip?: string,
): HTMLElement {
  const blocks = labels?.blocks(save.doscene);
  const pal = labels?.palette(save.doscene);
  const n = typeof v === 'number' ? v : BACKBL;
  const pic =
    blocks?.[n] && pal && n !== BACKBL
      ? blockCanvas(blocks[n].pixels, pal, { className: 'sv-pic' })
      : h('span', { class: 'sv-pic empty', 'aria-hidden': 'true' }, '·');
  return h(
    'button',
    {
      type: 'button',
      class: 'sv-item',
      id,
      'aria-label': `${f.label}: ${n === BACKBL ? 'empty' : `block ${n}`}. Change`,
      'aria-describedby': [groupTip, `${id}-warn`].filter(Boolean).join(' '),
      onclick: async () => {
        let next: number | undefined;
        if (blocks && pal)
          next = await chooseBlock(
            `${f.label}: what the hero carries`,
            blocks,
            pal,
            n,
            [{ value: BACKBL, label: 'empty', icon: '·' }],
            false,
            (b, i) => !!b.obj || i === n,
          );
        else {
          const s = await modal<string>(f.label, (close) => {
            const input = h('input', {
              type: 'number',
              min: 0,
              max: BACKBL,
              value: String(n),
              'aria-label': 'Block number (150 = empty)',
            });
            return [input, h('div', { class: 'buttons' }, h('button', { class: 'primary', onclick: () => close(input.value) }, 'OK'))];
          });
          next = s === undefined ? undefined : Number(s);
        }
        if (next === undefined || Number.isNaN(next)) return;
        setField(save, f.id, next, labels);
        refresh();
      },
    },
    pic,
    h('small', null, n === BACKBL ? 'empty' : `#${n}`),
  );
}
