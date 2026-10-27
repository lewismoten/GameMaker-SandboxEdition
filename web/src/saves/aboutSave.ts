// "About this save": every note of a save's fields, the map's keys and what saving does, in one
// dialog of the Saves & scores panel.
import { h, modal } from '../editor/core/ui';
import { GROUP_LABELS, type FieldGroup, type SaveField } from '../project/saveData';
import { rangeText } from './panelText';
import { LEVEL_HELP, MAP_HELP } from './slotWhere';

export const aboutSave = (slot: number, fields: SaveField[]) =>
  modal<void>(`About slot ${slot + 1}`, (close) => {
    const byGroup = new Map<FieldGroup, SaveField[]>();
    for (const f of fields) if (f.group !== 'where') byGroup.set(f.group, [...(byGroup.get(f.group) ?? []), f]);
    const shared = (g: FieldGroup) => g === 'uses' || g === 'counters' || g === 'inventory';
    return [
      h(
        'div',
        { class: 'sv-about', tabindex: 0, role: 'region', 'aria-label': 'About this save' },
        h('h3', null, 'Saving'),
        h(
          'p',
          null,
          'Changes stay here until Save changes; Undo changes drops them. The first change of a visit backs every save up first (see Backups). In the game, F6 loads the save. Download .sav gives the file with any changes; Import .sav… puts a file in this slot.',
        ),
        h('p', null, '★ Max all raises every counting value to the most the game handles well; the items stay as they are.'),
        h('h3', null, GROUP_LABELS.where),
        h('p', null, LEVEL_HELP),
        h('p', null, MAP_HELP),
        ...[...byGroup].flatMap(([g, list]) => [
          h('h3', null, GROUP_LABELS[g]),
          shared(g)
            ? h('p', null, list[0].note, g === 'inventory' ? '' : ` Each ${rangeText(list[0], true)}`)
            : h(
                'dl',
                null,
                list.flatMap((f) => [h('dt', null, f.label), h('dd', null, `${f.note} ${rangeText(f)}`)]),
              ),
        ]),
      ),
      h('div', { class: 'buttons' }, h('button', { type: 'button', class: 'primary', autofocus: true, onclick: () => close(undefined) }, 'Close')),
    ];
  });
