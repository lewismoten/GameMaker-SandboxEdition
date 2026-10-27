// One slot of the Saves & scores panel: its name, level and size, the tools (Save, Undo, Max all,
// download, import, delete) and its values in groups, or what to do with a slot that is empty.
import { h, clear } from '../editor/core/ui';
import {
  changedFields,
  cloneSave,
  getField,
  GROUP_LABELS,
  maxAll,
  saveFields,
  serializeSave,
  SLOT_NAME_LENGTH,
  UNLIMITED,
  type FieldGroup,
  type SavedGame,
  type SaveField,
} from '../project/saveData';
import { tip } from './tip';
import type { Panel, WorkSlot } from './panelState';
import { kb, rangeText } from './panelText';
import { fieldRow } from './slotField';
import { whereGroup } from './slotWhere';
import { aboutSave } from './aboutSave';
import { commitSlot, exportSav, importSav, newSave, removeSlot } from './slotActions';

export function renderSlot(p: Panel, slot: number): void {
  const { main, labels } = p;
  const s = p.saves!.slots[slot];
  const title = h('h3', { class: 'sv-title', tabindex: -1 }, `Slot ${slot + 1}`);
  if (!s.save) {
    emptySlot(p, slot, title);
    return;
  }
  if (!p.work.has(slot)) p.work.set(slot, { save: cloneSave(s.save), name: s.name });
  const w = p.work.get(slot)!;
  const save = w.save;
  const status = h('p', { class: 'sv-status', role: 'status' });
  const saveBtn = h('button', { type: 'button', class: 'primary', onclick: () => void commitSlot(p, slot) }, 'Save changes');
  const undoBtn = h(
    'button',
    {
      type: 'button',
      onclick: () => {
        p.work.delete(slot);
        p.whereSay.delete(slot);
        p.render();
      },
    },
    'Undo changes',
  );
  const refreshState = (rebuild = false) => {
    const dirty = p.dirtySlot(slot);
    saveBtn.disabled = !dirty;
    undoBtn.disabled = !dirty;
    const n = changedFields(s.save!, save, labels).length;
    const what = [n ? `${n} value${n === 1 ? '' : 's'}` : null, w.name !== s.name ? 'the name' : null].filter(Boolean).join(' and ');
    status.textContent = dirty ? `Changed ${what || 'the save'}: not saved yet.` : 'Saved. In the game, F6 loads it.';
    p.renderNav();
    if (rebuild) p.render();
  };
  const nameInput = h('input', {
    type: 'text',
    id: `sv-name-${slot}`,
    value: w.name,
    maxlength: SLOT_NAME_LENGTH,
    placeholder: 'Unnamed',
    spellcheck: false,
    oninput: () => {
      w.name = nameInput.value.replace(/[^\x20-\x7e]/g, '');
      refreshState();
    },
  });

  const fields = saveFields(save, labels);
  const sets = fieldGroups(p, slot, w, fields, refreshState);

  clear(
    main,
    h(
      'header',
      { class: 'sv-head' },
      title,
      h('label', { class: 'sv-name', for: `sv-name-${slot}` }, h('span', null, 'Name'), nameInput),
      h(
        'p',
        { class: 'sv-where' },
        labels?.sceneName(save.doscene) ? `Level ${save.doscene}: ${labels.sceneName(save.doscene)}` : `Level ${save.doscene}`,
        ` · ${kb(s.bytes?.length ?? 0)}`,
      ),
      h(
        'button',
        { type: 'button', class: 'sv-about-btn', onclick: () => void aboutSave(slot, fields), 'aria-haspopup': 'dialog' },
        h('span', { class: 'sv-about-i', 'aria-hidden': 'true' }, 'i'),
        'About this save',
      ),
    ),
    h(
      'div',
      { class: 'sv-tools', role: 'toolbar', 'aria-label': `Slot ${slot + 1}` },
      saveBtn,
      undoBtn,
      h(
        'button',
        {
          type: 'button',
          title: 'Every counting value to the most the game handles well (items stay as they are)',
          onclick: () => {
            const changed = maxAll(save, labels);
            p.toast(
              changed.length
                ? `Raised ${changed.length} value${changed.length === 1 ? '' : 's'}. Save changes to keep them.`
                : 'Everything is already at its top.',
            );
            p.render();
          },
        },
        '★ Max all',
      ),
      h(
        'button',
        { type: 'button', onclick: () => exportSav(p, slot, serializeSave(save)), title: 'Download this save (with any changes) as a .sav file' },
        '⇩ Download .sav',
      ),
      h('button', { type: 'button', onclick: () => void importSav(p, slot) }, '⇪ Import .sav…'),
      h('button', { type: 'button', class: 'danger', onclick: () => void removeSlot(p, slot) }, 'Delete save'),
    ),
    status,
    h('div', { class: 'sv-groups' }, sets),
  );
  refreshState();
}

/** A slot with nothing saved (or a damaged file): start a new save, bring one in, or let it go. */
function emptySlot(p: Panel, slot: number, title: HTMLElement): void {
  const s = p.saves!.slots[slot];
  clear(
    p.main,
    h('header', { class: 'sv-head' }, title),
    s.error
      ? h('p', { class: 'sv-empty' }, `${s.error} `, 'You can download it as it is, or delete it.')
      : h(
          'p',
          { class: 'sv-empty' },
          'Nothing saved here yet. In the game, press F5 to save into this slot, start a new save here as the game begins, or bring in a .sav file.',
        ),
    h(
      'div',
      { class: 'sv-tools' },
      !s.bytes && p.disk && p.target.gam
        ? h(
            'button',
            {
              type: 'button',
              class: 'primary',
              onclick: () => void newSave(p, slot),
              title: 'A saved game at the very start: the first level, with the hero’s starting hit points, lives and items',
            },
            '＋ New save',
          )
        : null,
      h('button', { type: 'button', onclick: () => void importSav(p, slot) }, '⇪ Import .sav…'),
      s.bytes ? h('button', { type: 'button', onclick: () => exportSav(p, slot, s.bytes!) }, '⇩ Download .sav') : null,
      s.bytes ? h('button', { type: 'button', class: 'danger', onclick: () => void removeSlot(p, slot) }, 'Delete') : null,
    ),
  );
}

/** The slot's values in fieldsets: where the hero is first, then score and the rest by group. */
function fieldGroups(p: Panel, slot: number, w: WorkSlot, fields: SaveField[], refreshState: (rebuild?: boolean) => void): HTMLElement[] {
  const save: SavedGame = w.save;
  const groups = new Map<FieldGroup, SaveField[]>();
  // money sits with score, health and lives (one short group, not two)
  for (const f of fields) {
    const g = f.group === 'money' ? 'player' : f.group;
    groups.set(g, [...(groups.get(g) ?? []), f]);
  }
  // these groups' fields share one note (and limits): an ⓘ by the group's name
  const groupTips = new Map<FieldGroup, ReturnType<typeof tip>>();
  for (const g of ['uses', 'counters', 'inventory'] as FieldGroup[]) {
    const first = groups.get(g)?.[0];
    if (first) groupTips.set(g, tip(GROUP_LABELS[g], h('p', null, first.note), g === 'inventory' ? null : h('p', null, `Each ${rangeText(first, true)}`)));
  }
  // where the hero is comes first: the picture shows the save at a glance
  return [...groups]
    .sort(([a], [b]) => Number(b === 'where') - Number(a === 'where'))
    .map(([g, list]) =>
      g === 'where'
        ? whereGroup(p, slot, w, () => refreshState())
        : h(
            'fieldset',
            { class: `sv-group sv-g-${g}` },
            h('legend', null, GROUP_LABELS[g], groupTips.get(g)?.el),
            (() => {
              const row = (f: SaveField) => fieldRow(p.labels, slot, save, f, (rebuild) => refreshState(rebuild), groupTips.get(g)?.id);
              if (g !== 'uses') return h('div', { class: 'sv-fields' }, list.map(row));
              // the sequences that never count down are folded away
              const limited = list.filter((f) => getField(save, f.id) !== UNLIMITED);
              const free = list.filter((f) => getField(save, f.id) === UNLIMITED);
              return [
                limited.length
                  ? h('div', { class: 'sv-fields' }, limited.map(row))
                  : h('p', { class: 'sv-group-note' }, 'Every sequence of this character is unlimited.'),
                free.length
                  ? h(
                      'details',
                      {
                        class: 'sv-more',
                        open: p.openUnlimited.has(slot),
                        ontoggle: (e: Event) => ((e.target as HTMLDetailsElement).open ? p.openUnlimited.add(slot) : p.openUnlimited.delete(slot)),
                      },
                      h('summary', null, `${free.length} unlimited sequence${free.length === 1 ? '' : 's'}`),
                      h('div', { class: 'sv-fields' }, free.map(row)),
                    )
                  : null,
              ];
            })(),
          ),
    );
}
