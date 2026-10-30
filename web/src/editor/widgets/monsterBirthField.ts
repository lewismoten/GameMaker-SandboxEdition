// A background block's birth index stays numeric, with a scene-aware picture chooser beside it.
import { h, clear, numberField, selectField } from '../core/ui';
import type { Project } from '../core/project';
import type { Palette } from '@lewismoten/gamemaker-sandbox-engine/formats/palette';
import { LASTMON } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { blockButton } from './blockChooser';
import { monsterBirthPictures, monsterBirthSources } from './monsterBirthSource';
import { monsterName } from '../editors/monsters/monsterNames';

export function monsterBirthField(project: Project, bbl: string, get: () => number, set: (value: number) => void, palette: () => Palette): HTMLElement {
  const sources = monsterBirthSources(project, bbl);
  let source = sources[0];
  const picture = h('div', { class: 'row' });
  const caption = h('small', { class: 'meta', style: 'overflow-wrap:anywhere' });
  const choose = (value: number) => {
    set(value);
    refresh();
  };
  const number = numberField('Gives birth to monster', get, choose, { min: 0, max: LASTMON });
  const name = (index: number) => {
    if (index === LASTMON) return 'None';
    const friendly = source ? monsterName(project, source.mon, index) : '';
    return `Monster ${index}${friendly ? `: ${friendly}` : ''}`;
  };
  function refresh(): void {
    number.querySelector('input')!.value = String(get());
    const data = source && monsterBirthPictures(project.files, source);
    if (!data) {
      clear(picture, h('small', { class: 'meta' }, 'Link a monster file and its picture set to this scene to preview births.'));
      caption.textContent = '';
      return;
    }
    const button = blockButton(() => data.pictures, palette, get, choose, {
      title: 'Choose the monster to be born',
      extras: [{ value: LASTMON, label: 'None', icon: '∅' }],
      only: (_, i) => data.used[i],
      name,
    });
    button.setAttribute('aria-label', `${get()} — Choose monster to be born: ${name(get())}`);
    clear(picture, button, h('small', { class: 'meta' }, name(get())));
    caption.textContent = source.label;
  }
  const sourceChoice =
    sources.length > 1
      ? selectField(
          'Preview monsters from',
          sources.map((item) => [item.id, item.label]),
          () => source.id,
          (id) => {
            source = sources.find((item) => item.id === id)!;
            refresh();
          },
        )
      : null;
  refresh();
  return h('div', { class: 'stack monster-birth-field', style: 'gap:4px' }, number, sourceChoice, picture, caption);
}
