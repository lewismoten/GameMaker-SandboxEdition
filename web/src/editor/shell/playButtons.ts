// The workspace's Play buttons, at the top of every editor: Play Game (from the title screen)
// and Play Level, a split button whose main part plays the current pick (playLevel.ts) and
// whose ▾ opens a menu of every way the game's links bring the player into a level.
import './playButtons.css';
import { h, clear } from '../core/ui';
import type { Game } from '../../formats/game';
import { currentPick, playChoices, type PlayChoice, type PlayPick } from './playLevel';

interface PlayButtonsContext {
  game(): Game | undefined;
  /** The level whose map is open, if any. */
  here(): number | undefined;
  last(): PlayPick | undefined;
  playGame(): void;
  playLevel(pick: PlayChoice): void;
}

export function playButtons(ctx: PlayButtonsContext): HTMLElement {
  const game = ctx.game();
  const choices = game ? playChoices(game) : [];
  const pick = currentPick(choices, ctx.last(), ctx.here());
  const playGame = h(
    'button',
    { type: 'button', class: 'primary side-play', 'aria-label': 'Play Game', title: 'Play the game from its title screen', onclick: () => ctx.playGame() },
    h('span', { 'aria-hidden': 'true' }, '▶ '),
    h('span', { class: 'pb-long' }, 'Play '),
    'Game',
  );
  const main = h(
    'button',
    {
      type: 'button',
      class: 'pb-main',
      'aria-label': 'Play Level',
      disabled: !pick,
      title: pick ? `Play ${pick.label}` : 'No link brings the player into a level yet (link one in the integrator)',
      onclick: () => pick && ctx.playLevel(pick),
    },
    h('span', { 'aria-hidden': 'true' }, '▶ '),
    h('span', { class: 'pb-long' }, 'Play '),
    'Level',
  );
  const menu = h('div', { class: 'pb-menu', role: 'menu', 'aria-label': 'Play from', hidden: true });
  const arrow = h(
    'button',
    {
      type: 'button',
      class: 'pb-arrow',
      'aria-label': 'Choose where Play Level starts',
      title: 'Choose a level and where in it to start',
      'aria-haspopup': 'menu',
      'aria-expanded': 'false',
      disabled: !choices.length,
    },
    h('span', { 'aria-hidden': 'true' }, '▾'),
  );
  const group = h('div', { class: 'pb-split', role: 'group', 'aria-label': 'Play Level' }, main, arrow, menu);

  const items = () => [...menu.querySelectorAll<HTMLButtonElement>('[role=menuitemradio]')];
  const close = (focus = true) => {
    if (menu.hidden) return;
    menu.hidden = true;
    arrow.setAttribute('aria-expanded', 'false');
    document.removeEventListener('pointerdown', outside, true);
    removeEventListener('resize', shut);
    if (focus) arrow.focus();
  };
  const shut = () => close(false);
  const outside = (e: PointerEvent) => {
    if (!group.contains(e.target as Node)) close(false);
  };
  const open = (at: 'current' | 'first' | 'last' = 'current') => {
    let lastTo = -1;
    clear(
      menu,
      ...choices.flatMap((c) => {
        const out: HTMLElement[] = [];
        if (c.to !== lastTo && lastTo >= 0) out.push(h('div', { role: 'separator', class: 'pb-sep' }));
        lastTo = c.to;
        const on = c === pick;
        out.push(
          h(
            'button',
            {
              type: 'button',
              role: 'menuitemradio',
              'aria-checked': String(on),
              tabIndex: -1,
              onclick: () => {
                close(false);
                ctx.playLevel(c);
              },
            },
            h('span', { class: 'pb-check', 'aria-hidden': 'true' }, on ? '✓' : ''),
            c.label,
          ),
        );
        return out;
      }),
    );
    menu.hidden = false;
    arrow.setAttribute('aria-expanded', 'true');
    // fixed to the window, so a scrolling side bar never clips it
    const r = group.getBoundingClientRect();
    const w = Math.min(420, innerWidth - 16);
    menu.style.width = `${w}px`;
    menu.style.left = `${Math.max(8, Math.min(innerWidth - w - 8, r.left))}px`;
    menu.style.top = `${r.bottom + 4}px`;
    menu.style.maxHeight = `${Math.max(120, innerHeight - r.bottom - 12)}px`;
    const list = items();
    const target = at === 'first' ? list[0] : at === 'last' ? list[list.length - 1] : (list.find((b) => b.getAttribute('aria-checked') === 'true') ?? list[0]);
    target?.focus({ preventScroll: true });
    document.addEventListener('pointerdown', outside, true);
    addEventListener('resize', shut);
  };
  arrow.addEventListener('click', () => (menu.hidden ? open() : close()));
  arrow.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      open(e.key === 'ArrowDown' ? 'first' : 'last');
    }
  });
  menu.addEventListener('keydown', (e) => {
    const list = items();
    const i = list.indexOf(document.activeElement as HTMLButtonElement);
    const go = (k: number) => list[(k + list.length) % list.length]?.focus({ preventScroll: true });
    if (e.key === 'ArrowDown') go(i + 1);
    else if (e.key === 'ArrowUp') go(i - 1);
    else if (e.key === 'Home') go(0);
    else if (e.key === 'End') go(list.length - 1);
    else if (e.key === 'Escape') close();
    else if (e.key === 'Tab') return close(false);
    else return;
    e.preventDefault();
    e.stopPropagation();
  });
  return h('div', { class: 'pb-row' }, playGame, group);
}
