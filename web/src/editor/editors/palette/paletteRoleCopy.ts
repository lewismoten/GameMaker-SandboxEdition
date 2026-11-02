// Stage another local project's reserved areas and optional colors; the caller owns saving and Undo.
import { parsePalette, paletteCss } from '@lewismoten/gamemaker-sandbox-engine/formats/palette';
import type { Project } from '../../core/project';
import { clear, h, modal } from '../../core/ui';
import { listProjects, loadProject } from '../../../project/storage';
import { getSection } from '../../../project/companion';
import {
  copyReservedRanges,
  PALETTE_RESERVATIONS,
  paletteReservations,
  readReservations,
  type PaletteReservation,
  type PaletteRole,
} from './paletteReservations';
import { ROLE_LABELS } from './paletteReservationFields';

type CopyResult = ReturnType<typeof copyReservedRanges>;

export async function paletteRoleCopy(project: Project, pal: Uint8Array): Promise<CopyResult | undefined> {
  const sources = (await listProjects()).filter(
    (p) => p.id !== project.id && p.companion && readReservations(getSection(p.companion, p.gam, PALETTE_RESERVATIONS, [])).length,
  );
  return modal<CopyResult>('Copy reserved color areas', (close) => {
    const source = h('select', { 'aria-label': 'Source game' }, ...sources.map((p) => h('option', { value: p.id }, p.name)));
    const palettes = h('select', { 'aria-label': 'Source palette', disabled: true });
    const includeColors = h('input', { type: 'checkbox', checked: true });
    const roles = (['character', 'monster', 'background'] as const).map((role) => ({ role, input: h('input', { type: 'checkbox', checked: true }) }));
    const areas = h('div', { class: 'stack' });
    const message = h('p', { class: 'meta', role: 'status' });
    const apply = h('button', { type: 'button', class: 'primary', disabled: true }, 'Copy selected areas');
    let loaded: Awaited<ReturnType<typeof loadProject>>;
    let ranges: PaletteReservation[] = [];
    let generation = 0;
    const selected = (): PaletteRole[] => roles.filter(({ input }) => input.checked && !input.disabled).map(({ role }) => role);
    const refresh = () => {
      palettes.disabled = !includeColors.checked || !palettes.options.length;
      const chosen = selected();
      const active = ranges.filter((range) => chosen.includes(range.role));
      apply.disabled = !loaded || !active.length || (includeColors.checked && !palettes.value);
      clear(
        areas,
        ...active.map((range) => {
          const bytes = loaded?.files.get(palettes.value);
          return h(
            'p',
            { class: 'meta', style: 'margin:0' },
            bytes
              ? h('span', {
                  'aria-hidden': 'true',
                  style: `display:inline-block;width:16px;height:16px;margin-right:6px;background:${paletteCss(bytes, range.first)}`,
                })
              : null,
            `${ROLE_LABELS[range.role]}: ${range.first}–${range.last}`,
          );
        }),
      );
      message.textContent = !sources.length
        ? 'No other saved game has reserved color areas yet. Open a palette in another project and reserve its ranges first.'
        : !loaded
          ? 'Loading the source game…'
          : !active.length
            ? 'Select at least one area present in the source game.'
            : `${active.reduce((total, range) => total + range.last - range.first + 1, 0)} colors at the same indices. ${includeColors.checked ? 'Copy colors into this palette and merge the reservations.' : 'Merge the reservations only; palette colors stay unchanged.'} Overlapping reservations are reassigned. Menu color 0 and transparency color 255 stay unchanged.`;
    };
    const load = async () => {
      const request = ++generation;
      loaded = undefined;
      ranges = [];
      clear(palettes);
      roles.forEach(({ input }) => (input.disabled = true));
      refresh();
      if (!source.value) return;
      try {
        const result = await loadProject(source.value);
        if (request !== generation || !source.isConnected) return;
        loaded = result;
        if (!loaded) {
          message.textContent = 'That source game is no longer saved in this browser.';
          return;
        }
        ranges = loaded.record.companion ? readReservations(getSection(loaded.record.companion, loaded.record.gam, PALETTE_RESERVATIONS, [])) : [];
        clear(
          palettes,
          ...loaded.files
            .byExtension('pal')
            .filter((name) => loaded!.files.get(name)!.length === 768)
            .map((name) => h('option', { value: name }, name.toUpperCase())),
        );
        includeColors.disabled = !palettes.options.length;
        if (includeColors.disabled) includeColors.checked = false;
        roles.forEach(({ role, input }) => (input.disabled = !ranges.some((range) => range.role === role)));
        refresh();
      } catch {
        if (request === generation && source.isConnected) message.textContent = 'Could not open that saved game. Close this dialog and try again.';
      }
    };
    source.addEventListener('change', () => void load());
    palettes.addEventListener('change', refresh);
    includeColors.addEventListener('change', refresh);
    roles.forEach(({ input }) => input.addEventListener('change', refresh));
    apply.addEventListener('click', () => {
      if (apply.disabled || !loaded) return;
      close(
        copyReservedRanges(
          pal,
          paletteReservations(project),
          includeColors.checked ? parsePalette(loaded.files.get(palettes.value)!) : undefined,
          ranges,
          selected(),
        ),
      );
    });
    void load();
    return h(
      'div',
      { class: 'stack', style: 'width:min(520px,calc(100vw - 72px))' },
      h(
        'p',
        { class: 'meta' },
        'Use another saved game’s character, monster or background areas. Reservations are shared by all palettes in this project; copied colors affect only the open palette.',
      ),
      h('label', null, 'Source game', source),
      h('label', null, 'Source palette', palettes),
      h('div', { class: 'toolbar' }, ...roles.map(({ role, input }) => h('label', null, input, ROLE_LABELS[role]))),
      h('label', null, includeColors, 'Also copy palette colors'),
      areas,
      message,
      h('div', { class: 'toolbar' }, h('button', { type: 'button', onclick: () => close(undefined) }, 'Cancel'), apply),
    );
  });
}
