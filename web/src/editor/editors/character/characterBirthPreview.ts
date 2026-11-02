// Character birth commands preview their native monster ID using a remembered scene MON/MBL pair.
import type { Project } from '../../core/project';
import { h, numberField, selectField } from '../../core/ui';
import type { Palette } from '@lewismoten/gamemaker-sandbox-engine/formats/palette';
import { LASTMON } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { blockButton } from '../../widgets/blockChooser';
import { monsterBirthPictures, monsterBirthSources } from '../../widgets/monsterBirthSource';
import { monsterName } from '../monsters/monsterNames';

const SECTION = 'monsterBirthPreview';

export function characterBirthPreview(project: Project, file: string, palette: () => Palette, redraw: () => void) {
  const sources = monsterBirthSources(project, file, 5);
  const source = () => sources.find((item) => item.id === project.extras<unknown>(file, SECTION, undefined)) ?? sources[0];
  const sourceField = () => {
    const field = sources.length
      ? selectField(
          'Preview monsters from',
          sources.map((item) => [item.id, item.label]),
          () => source().id,
          (id) => {
            project.setExtras(file, SECTION, id);
            redraw();
          },
          'Chooses pictures for this editor preview. Each game scene still uses its own monster files.',
        )
      : h('p', { class: 'chr-help' }, 'Link a monster file and picture set to this character’s scene to preview births.');
    field.style.maxWidth = '100%';
    const select = field.querySelector('select');
    if (select) select.style.maxWidth = '100%';
    return field;
  };
  const frameField = (get: () => number, set: (value: number) => void) => {
    const selected = source(),
      data = selected && monsterBirthPictures(project.files, selected);
    const number = numberField('Monster #', get, set, { min: 0, max: LASTMON - 1, title: 'Native monster number born by this frame' });
    if (!data) return number;
    const name = (index: number) => {
      const label = monsterName(project, selected.mon, index);
      return `Monster ${index}${label ? `: ${label}` : ''}${data.used[index] ? '' : ' (not enabled)'}`;
    };
    const picture = blockButton(() => data.pictures, palette, get, set, {
      title: 'Choose the monster born by this frame',
      only: (_, index) => data.used[index],
      name,
    });
    picture.style.maxWidth = '100%';
    return h('div', { class: 'stack', style: 'min-width:0;max-width:100%;overflow-wrap:anywhere' }, picture, number);
  };
  return { sourceField, frameField };
}
