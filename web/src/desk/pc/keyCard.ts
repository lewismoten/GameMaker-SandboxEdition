// The game's keyboard reference card, taped to the monitor while the game plays: the printed
// quick reference card from a Sandbox Software box (manual/printables), or for any other
// game an index card written out from its character files (editor/keymap/keyMap.ts). Click it to
// read it larger.
import './keyCard.css';
import '../../manual/printables/paper.css';
import { h, clear } from '../../editor/core/ui';
import { gameKeyMap, GLOBAL_KEYS, type GameKeyMap } from '../../editor/keymap/keyMap';
import { cardRows } from './keyCardRows';
import { loadCatalog, type CatalogEntry, type GameFiles } from '../../project/files';

export interface PlayingGame {
  files: GameFiles;
  gam: string;
  title: string;
}

/** The Sandbox Software game being played, if it is one (matched by its .gam and title). */
async function originalOf(game: PlayingGame): Promise<CatalogEntry | undefined> {
  const cat = await loadCatalog().catch(() => [] as CatalogEntry[]);
  const gam = game.gam.toLowerCase();
  return cat.find((g) => g.original?.manual && g.gam?.toLowerCase() === gam && g.title === game.title);
}

/** How many ruled lines a row's keys take when a line holds `room` letters (a key cap takes one more). */
const keyLines = (keys: string[], room: number) => Math.max(1, Math.ceil(keys.reduce((n, k) => n + k.length + 1, 0) / room));

/**
 * An index card with the keys written out, for games without a printed one. `compact` is the
 * small card taped to the monitor: fewer, larger lines, so it reads at a glance.
 */
export function indexCard(title: string, km: GameKeyMap, compact = false): HTMLElement {
  const rows = cardRows(km.keys, compact);
  const joy = km.joystick.length > 0;
  const always = GLOBAL_KEYS.filter((g) => g.scan <= 64);
  // The small card shows every key: on one column, two if needed, and when even that won't
  // fit, only the keys (click the card to read what they do).
  let two = !compact && rows.length + (joy ? 1 : 0) > 9;
  let keysOnly = false;
  let used = rows.length + (joy && !compact ? 1 : 0);
  if (compact) {
    used = rows.reduce((n, r) => n + keyLines(r.keys, 12), 0);
    if (used > 7) {
      two = true;
      used = Math.ceil(rows.reduce((n, r) => n + keyLines(r.keys, 6), 0) / 2);
    }
    if (used > 9) {
      keysOnly = true;
      used = Math.ceil(rows.reduce((n, r) => n + r.keys.length, 0) / 6) + 1;
    }
  } else if (two) used = Math.ceil(used / 2);
  // the writing gets smaller to fit every line on the card's ruled lines
  const line = Math.min(compact ? 9.5 : 6.4, 43 / Math.max(1, used + 1));
  return h(
    'div',
    { class: `idx-card${compact ? ' compact' : ''}`, style: `--line:${line.toFixed(2)}cqw` },
    h(
      'div',
      { class: 'idx-sheet' },
      h('div', { class: 'idx-head' }, h('b', null, title), h('span', null, 'KEYS')),
      keysOnly
        ? h(
            'div',
            { class: 'idx-list keys-only' },
            h('div', { class: 'idx-keys' }, ...rows.flatMap((r) => r.keys).map((k) => h('kbd', null, k))),
            h('div', { class: 'idx-row more' }, h('span', null, 'Click to see what each key does')),
          )
        : h(
            'div',
            { class: `idx-list ${two ? 'two' : ''}` },
            ...rows.map((r) =>
              h(
                'div',
                { class: 'idx-row' },
                h('span', { class: 'idx-keys' }, ...r.keys.map((k) => h('kbd', /^[↑↓]\+/.test(k) ? { class: 'chord' } : null, k))),
                h('span', null, r.does),
              ),
            ),
            rows.length ? null : h('div', { class: 'idx-row' }, h('span', null, 'No keys: this game plays itself.')),
            joy && !compact
              ? h('div', { class: 'idx-row joy' }, h('span', { class: 'idx-keys' }, h('kbd', null, 'Joy')), h('span', null, 'a joystick or gamepad works too'))
              : null,
          ),
      // Esc and the F-keys are on the keyboard's template (keyboard.ts): the big card still lists them
      compact ? null : h('div', { class: 'idx-always' }, ...always.map((g) => h('span', null, h('kbd', null, g.name), ` ${g.short}`))),
    ),
  );
}

/**
 * The card, freshly made (each place it is shown gets its own copy). Read up close it is the
 * printed card from a Sandbox Software box when there is one; taped to the monitor it is
 * always the handwritten card, which stays legible that small.
 */
/** The keycard printed for a Sandbox Software box (its printables load only when one is read up close). */
async function printedCard(entry: CatalogEntry) {
  const [{ printContext }, { boxItems }] = await Promise.all([import('../boxes/printContext'), import('../../manual/printables/items')]);
  const ctx = await printContext(entry);
  return ctx ? boxItems(ctx).find((i) => i.id === 'keycard') : undefined;
}

async function makeCard(game: PlayingGame, compact = false): Promise<HTMLElement> {
  if (!compact) {
    const entry = await originalOf(game);
    const item = entry ? await printedCard(entry) : undefined;
    if (item) {
      const [sheet] = await item.render();
      if (sheet) return h('div', { class: 'kc-printed' }, sheet.el);
    }
  }
  return indexCard(game.title, gameKeyMap(game.files, game.gam), compact);
}

function enlarge(game: PlayingGame, onClose: () => void): void {
  const close = () => {
    window.removeEventListener('keydown', onKey, true);
    overlay.remove();
    onClose();
  };
  const onKey = (e: KeyboardEvent) => {
    e.stopImmediatePropagation(); // not for the game underneath
    e.preventDefault();
    if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') close();
  };
  const holder = h('div', { class: 'key-card-large' });
  const overlay = h(
    'div',
    { class: 'desk-overlay key-card-overlay', role: 'dialog', 'aria-label': `${game.title}: keys` },
    h('button', { class: 'close', onclick: close }, 'Close (Esc)'),
    holder,
    h('p', { class: 'hint' }, 'Back to the game: Esc or click outside the card'),
  );
  overlay.addEventListener('click', (e) => e.target !== holder && !holder.contains(e.target as Node) && close());
  window.addEventListener('keydown', onKey, true);
  document.body.append(overlay);
  void makeCard(game).then((card) => holder.append(card));
}

/**
 * The spot on the monitor's bezel where the card is taped. show() puts a game's card there,
 * hide() takes it down. `refocus` gives the keyboard back to the game after reading it.
 */
export function keyCardSpot(refocus: () => void): { el: HTMLElement; show(game?: PlayingGame): void } {
  const el = h('button', { class: 'key-card-spot', hidden: true, title: 'The game’s keys — click to read' });
  let current: PlayingGame | undefined;
  return {
    el,
    show(game) {
      current = game;
      el.hidden = !game;
      clear(el);
      if (!game) return;
      el.setAttribute('aria-label', `${game.title}: keyboard reference card`);
      el.onclick = (e) => {
        e.stopPropagation();
        if (current) enlarge(current, refocus);
      };
      void makeCard(game, true).then(
        (card) =>
          current === game &&
          el.append(card, h('span', { class: 'tape', 'aria-hidden': 'true' }), h('span', { class: 'kc-hint', 'aria-hidden': 'true' }, 'Click to read')),
      );
    },
  };
}
