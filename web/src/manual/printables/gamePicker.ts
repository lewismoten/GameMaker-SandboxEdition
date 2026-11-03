// The "Game" picker in the box viewer's bar: change which game's box is open without going
// back to the retail box. A labeled select plus ◀ ▶ (the [ and ] keys do the same); the games
// are the shelf's boxes, in shelf order (gameManual.ts picks them).
import { h } from '../../editor/core/ui';

export interface PickerGame {
  id: string;
  title: string;
}

/** The game `dir` steps from `id`, wrapping round the list; undefined when there is nowhere else to go. */
export function neighbor(games: PickerGame[], id: string, dir: 1 | -1): PickerGame | undefined {
  const at = games.findIndex((g) => g.id === id);
  if (at < 0 || games.length < 2) return undefined;
  return games[(at + dir + games.length) % games.length];
}

/** The picker, or nothing when the open game is the only one (or isn't on the list). */
export function gamePicker(games: PickerGame[], id: string, pick: (id: string) => void): { el: HTMLElement; step: (dir: 1 | -1) => void } | undefined {
  if (games.length < 2 || !games.some((g) => g.id === id)) return undefined;
  const select = h<'select'>('select', {
    id: 'gmb-game',
    title: 'Look at another game’s box ([ and ] step through them)',
    onchange: () => pick(select.value),
  });
  for (const g of games) select.append(h('option', { value: g.id, selected: g.id === id }, g.title));
  const step = (dir: 1 | -1) => {
    const next = neighbor(games, id, dir);
    if (next) pick(next.id);
  };
  const button = (dir: 1 | -1) =>
    h(
      'button',
      {
        class: 'gmb-game-step',
        'aria-label': dir > 0 ? 'Next game' : 'Previous game',
        title: dir > 0 ? 'Next game (])' : 'Previous game ([)',
        onclick: () => step(dir),
      },
      dir > 0 ? '▶' : '◀',
    );
  return { el: h('div', { class: 'gmb-game' }, h('label', { for: 'gmb-game' }, 'Game'), button(-1), select, button(1)), step };
}
