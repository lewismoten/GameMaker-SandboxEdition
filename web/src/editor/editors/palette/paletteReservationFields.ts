// Shared palette reservations are changed here; the palette editor records them in its undo stack.
import type { Project } from '../../core/project';
import { h, selectField, toast } from '../../core/ui';
import { PALETTE_RESERVATIONS, paletteReservations, reserveColors, type PaletteRole } from './paletteReservations';

export const ROLE_LABELS = { character: 'Characters', background: 'Backgrounds', monster: 'Monsters', menu: 'Menu backgrounds', transparent: 'Transparency' };

export function paletteReservationFields(
  project: Project,
  span: () => [number, number],
  remember: () => void,
  changed: () => void,
): { el: HTMLElement; refresh: () => void } {
  let role: PaletteRole = 'character';
  const list = h('p', { class: 'meta', role: 'status' });
  const apply = (kind?: PaletteRole) => {
    const [first, last] = span();
    try {
      const previous = paletteReservations(project);
      const next = reserveColors(previous, first, last, kind);
      if (JSON.stringify(previous) === JSON.stringify(next)) return;
      remember();
      project.setExtras(project.gam, PALETTE_RESERVATIONS, next.length ? next : undefined);
      changed();
    } catch {
      toast('Choose colors 1–254. Color 0 is reserved for menus, and 255 for transparency.', 'error');
    }
  };
  const el = h(
    'details',
    { class: 'pal-reservations' },
    h('summary', null, 'Reserved color ranges'),
    h(
      'p',
      { class: 'meta' },
      'Shared by all palettes in this project. Color 0: menu backgrounds. Color 255: sprite transparency. Shift-click colors to choose a range.',
    ),
    selectField(
      'Reserve for',
      [
        ['character', 'Characters'],
        ['background', 'Backgrounds'],
        ['monster', 'Monsters'],
      ],
      () => role,
      (value) => {
        role = value;
      },
    ),
    h(
      'div',
      { class: 'toolbar' },
      h('button', { type: 'button', onclick: () => apply(role) }, 'Reserve selected colors'),
      h('button', { type: 'button', onclick: () => apply() }, 'Clear selected reservation'),
    ),
    list,
  );
  const refresh = () => {
    const ranges = paletteReservations(project);
    list.textContent = ranges.length ? ranges.map((range) => `${ROLE_LABELS[range.role]}: ${range.first}–${range.last}`).join('; ') : 'No custom reservations.';
  };
  refresh();
  return { el, refresh };
}
