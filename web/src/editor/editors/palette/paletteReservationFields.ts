// Shared palette reservations are changed here; the palette editor records them in its undo stack.
import type { Project } from '../../core/project';
import { h, selectField, toast } from '../../core/ui';
import { PALETTE_RESERVATIONS, paletteReservations, reserveColors, type PaletteReservation, type PaletteRole } from './paletteReservations';

export const ROLE_LABELS = { character: 'Characters', background: 'Backgrounds', monster: 'Monsters', menu: 'Background color', transparent: 'Transparency' };

export function paletteReservationFields(
  project: Project,
  span: () => [number, number],
  remember: () => void,
  changed: () => void,
  detect?: () => PaletteReservation[],
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
      toast('Choose colors 1–254. Color 0 is the background color, and 255 for transparency.', 'error');
    }
  };
  const el = h(
    'details',
    { class: 'pal-reservations' },
    h('summary', null, 'Reserved color ranges'),
    h(
      'p',
      { class: 'meta' },
      'Optional, and shared by all palettes in this project. Choose any ranges you like for each kind. Colors in no range are global: any kind may use them. Color 0 is the background color (menus and screens clear to it) and color 255 is transparency. The Level check suggests a look when a block uses a color reserved for another kind. Shift-click colors to choose a range.',
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
      detect
        ? h(
            'button',
            {
              type: 'button',
              title: 'Find colors used only by character, monster or background block sets drawn with this palette',
              onclick: () => {
                const next = detect();
                if (JSON.stringify(next) === JSON.stringify(paletteReservations(project))) return;
                remember();
                project.setExtras(project.gam, PALETTE_RESERVATIONS, next.length ? next : undefined);
                changed();
              },
            },
            'Detect dedicated areas',
          )
        : null,
    ),
    list,
  );
  const refresh = () => {
    const ranges = paletteReservations(project);
    list.textContent = ranges.length
      ? ranges.map((range) => `${ROLE_LABELS[range.role]}: ${range.first}–${range.last}`).join('; ')
      : 'No reservations: every color is global.';
  };
  refresh();
  return { el, refresh };
}
