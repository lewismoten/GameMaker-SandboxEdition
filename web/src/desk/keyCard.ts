// The game's keyboard reference card, taped to the monitor while the game plays: the printed
// quick reference card from a Sandbox Software box (manual/printables), or for any other
// game an index card written out from its character files (editor/keyMap.ts). Click it to
// read it larger.
import './keyCard.css';
import '../manual/printables/paper.css';
import { h, clear } from '../editor/ui';
import { boxItems } from '../manual/printables/items';
import { gameKeyMap, GLOBAL_KEYS, type GameKeyMap } from '../editor/keyMap';
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

/** What a key does, in a few words: the first way it is used, plus "…" when levels differ. */
function keyDoes(k: GameKeyMap['keys'][number]): string {
  const titles = [...new Set(k.uses.map((u) => u.action.title))];
  return titles.length > 2 ? `${titles.slice(0, 2).join(' / ')} …` : titles.join(' / ');
}

/** An index card with the keys written out, for games without a printed one. */
export function indexCard(title: string, km: GameKeyMap): HTMLElement {
  const keys = km.keys.filter((k) => k.uses.some((u) => u.action.kind !== 'nothing'));
  // the writing gets smaller to fit every key on the card's ruled lines
  const rows = Math.ceil((keys.length + (km.joystick.length ? 1 : 0)) / (keys.length > 8 ? 2 : 1)) + 1;
  const line = Math.min(5.8, 38 / Math.max(1, rows));
  return h(
    'div',
    { class: 'idx-card', style: `--line:${line.toFixed(2)}cqw` },
    h(
      'div',
      { class: 'idx-sheet' },
      h('div', { class: 'idx-head' }, h('b', null, title), h('span', null, 'KEYS')),
      h(
        'div',
        { class: `idx-list ${keys.length > 8 ? 'two' : ''}` },
        ...keys.map((k) => h('div', { class: 'idx-row' }, h('kbd', null, k.name), h('span', null, keyDoes(k)))),
        keys.length ? null : h('div', { class: 'idx-row' }, h('span', null, 'No keys: this game plays itself.')),
        km.joystick.length ? h('div', { class: 'idx-row joy' }, h('kbd', null, 'Joy'), h('span', null, 'a joystick (or gamepad) works too')) : null,
      ),
      h('div', { class: 'idx-always' }, ...GLOBAL_KEYS.filter((g) => g.scan <= 64).map((g) => h('span', null, h('kbd', null, g.name), ` ${g.short}`))),
    ),
  );
}

/** The card, freshly made (each place it is shown gets its own copy). */
async function makeCard(game: PlayingGame): Promise<HTMLElement> {
  const entry = await originalOf(game);
  const ctx = entry ? await printContext(entry) : undefined;
  const item = ctx ? boxItems(ctx).find((i) => i.id === 'keycard') : undefined;
  if (item) {
    const [sheet] = await item.render();
    if (sheet) return h('div', { class: 'kc-printed' }, sheet.el);
  }
  return indexCard(game.title, gameKeyMap(game.files, game.gam));
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
      void makeCard(game).then((card) => current === game && el.append(card, h('span', { class: 'tape', 'aria-hidden': 'true' })));
    },
  };
}
