// The game's keyboard reference card, taped to the monitor while the game plays: the printed
// quick reference card from a Sandbox Software box (manual/printables), or for any other
// game an index card written out from its character files (editor/keyMap.ts). Click it to
// read it larger.
import './keyCard.css';
import '../manual/printables/paper.css';
import { h, clear } from '../editor/core/ui';
import { boxItems } from '../manual/printables/items';
import { gameKeyMap, GLOBAL_KEYS, type GameKeyMap } from '../editor/keyMap';
import { cardRows } from './keyCardRows';
import { loadCatalog, type CatalogEntry, type GameFiles } from '../project/files';
import { printContext } from './printContext';

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

/** As many keys as fit in `room` letters (a key cap takes one more), then "…". */
function fitKeys(keys: string[], room: number): string[] {
  const out: string[] = [];
  for (const k of keys) {
    room -= k.length + 1;
    if (room < 0 && out.length) return [...out, '…'];
    out.push(k);
  }
  return out;
}

/**
 * An index card with the keys written out, for games without a printed one. `compact` is the
 * small card taped to the monitor: fewer, larger lines, so it reads at a glance.
 */
export function indexCard(title: string, km: GameKeyMap, compact = false): HTMLElement {
  const all = cardRows(km.keys, compact);
  // the small card keeps to five lines, big enough to read from the chair; the rest are up close
  const rows = compact && all.length > 5 ? all.slice(0, 4) : all;
  const more = all.length - rows.length;
  const joy = km.joystick.length > 0;
  const always = GLOBAL_KEYS.filter((g) => (compact ? g.scan <= 59 : g.scan <= 64));
  const two = !compact && rows.length + (joy ? 1 : 0) > 9;
  // the writing gets smaller to fit every line on the card's ruled lines
  const lines = Math.ceil((rows.length + (more ? 1 : 0) + (joy && !compact ? 1 : 0)) / (two ? 2 : 1)) + 1;
  const line = Math.min(compact ? 9.5 : 6.4, 43 / Math.max(1, lines));
  return h(
    'div',
    { class: `idx-card${compact ? ' compact' : ''}`, style: `--line:${line.toFixed(2)}cqw` },
    h(
      'div',
      { class: 'idx-sheet' },
      h('div', { class: 'idx-head' }, h('b', null, title), h('span', null, 'KEYS')),
      h(
        'div',
        { class: `idx-list ${two ? 'two' : ''}` },
        ...rows.map((r) => {
          // the small card has room for a dozen letters of keys a line
          const keys = compact ? fitKeys(r.keys, 12) : r.keys;
          return h(
            'div',
            { class: 'idx-row' },
            h('span', { class: 'idx-keys' }, ...keys.map((k) => (k === '…' ? h('span', null, k) : h('kbd', null, k)))),
            h('span', null, r.does),
          );
        }),
        rows.length ? null : h('div', { class: 'idx-row' }, h('span', null, 'No keys: this game plays itself.')),
        more ? h('div', { class: 'idx-row more' }, h('span', null, `+ ${more} more — click to read them all`)) : null,
        joy && !compact
          ? h('div', { class: 'idx-row joy' }, h('span', { class: 'idx-keys' }, h('kbd', null, 'Joy')), h('span', null, 'a joystick or gamepad works too'))
          : null,
      ),
      h('div', { class: 'idx-always' }, ...always.map((g) => h('span', null, h('kbd', null, g.name), ` ${g.short}`))),
    ),
  );
}

/**
 * The card, freshly made (each place it is shown gets its own copy). Read up close it is the
 * printed card from a Sandbox Software box when there is one; taped to the monitor it is
 * always the handwritten card, which stays legible that small.
 */
async function makeCard(game: PlayingGame, compact = false): Promise<HTMLElement> {
  if (!compact) {
    const entry = await originalOf(game);
    const ctx = entry ? await printContext(entry) : undefined;
    const item = ctx ? boxItems(ctx).find((i) => i.id === 'keycard') : undefined;
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
