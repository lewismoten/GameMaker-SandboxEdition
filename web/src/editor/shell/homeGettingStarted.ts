// The home page's Getting started: under the game on a wide window when it fits there, else
// behind a How it works button in the library's header that opens it in a dialog.
import { h, modal } from '../core/ui';
import { icon } from './homeIcons';
import { wantsTouchControls } from '../../player/touch';

export function gettingStarted() {
  const touch = wantsTouchControls();
  /** What Getting started says: on the page, or in a dialog when there is no room for it. */
  const startBody = (onGuide?: () => void) => [
    h(
      'ul',
      null,
      h('li', null, h('b', null, icon('play'), 'Play'), touch ? ' right here, with on-screen controls or a gamepad' : ' right here, with keyboard or gamepad'),
      h('li', null, h('b', null, icon('edit'), 'Look inside'), ' to see how a game was made, then Edit a copy to change it'),
      h('li', null, h('b', null, icon('plus'), 'New game'), ' to start your own'),
      h(
        'li',
        null,
        h('b', null, h('span', { 'aria-hidden': 'true' }, '✦ '), 'Describe a game'),
        ' and your own AI builds one (',
        h(
          'button',
          { type: 'button', class: 'link-btn', onclick: () => void import('../../assistant/chat/settingsDialog').then((m) => m.openAiSetup()) },
          'AI setup',
        ),
        ')',
      ),
    ),
    h(
      'p',
      { class: 'meta' },
      // a touch screen has no F-keys: the player's on-screen pad has the ones that matter
      touch
        ? 'Playing: slide a thumb around the pad to move and tap the buttons to act; Esc, F1 help and F2 status have buttons too. '
        : // each key with its word, the dot after it, so a line never starts with one
          `Playing: ${['F1 help', 'F2 status', 'F3 music', 'F4 sound', 'F5 save', 'F6 load', 'Esc leaves a level'].map((k) => k.replace(/ /g, ' ')).join(' · ')}. `,
      h('a', { href: '#/help', onclick: onGuide }, 'Read the Guide →'),
      ' · ',
      h('a', { href: '#/cast' }, 'Meet the cast →'),
      ' · ',
      h('a', { href: '#/achievements' }, 'What you’ve done →'),
      ' · ',
      h('a', { href: '#/credits' }, 'Credits →'),
      ' · ',
      h('a', { href: '#/magazine', title: 'TURBO BUTTON, a 1990s game magazine: hints, reviews and every game' }, 'The magazine →'),
      ' · ',
      h('a', { href: './dos.html', title: 'The 1994 PC on its own: straight into Game-Maker, without the desk' }, 'DOS Game-Maker →'),
      ' · ',
      h('a', { href: './player/', title: 'One web page that plays old Game-Maker game folders on any web host; try it with the games here' }, 'Web player →'),
    ),
  ];
  // when Getting started has no room beside the library, a link in the library's header opens it
  const howBtn = h(
    'button',
    {
      type: 'button',
      class: 'lib-how',
      hidden: true,
      onclick: () =>
        void modal('Getting started', (close) => [
          h('div', { class: 'home-start-dialog' }, ...startBody(() => close(undefined))),
          h('div', { class: 'buttons' }, h('button', { class: 'primary', onclick: () => close(undefined) }, 'Close')),
        ]),
    },
    icon('help'),
    'How it works',
  );
  return {
    howBtn,
    /** The section on the page. */
    section: () =>
      h('section', { class: 'home-start', 'aria-labelledby': 'home-start-title' }, h('h2', { id: 'home-start-title' }, 'Getting started'), ...startBody()),
    /** On a wide window Getting started fills the space under the game only when it fits there. */
    fit(start: HTMLElement, game: HTMLElement): void {
      const fitStart = () => {
        start.classList.remove('clipped');
        start.classList.toggle('clipped', start.scrollHeight > start.clientHeight + 1);
        howBtn.hidden = !start.classList.contains('clipped');
      };
      new ResizeObserver(fitStart).observe(start.parentElement!);
      new ResizeObserver(fitStart).observe(game);
    },
  };
}
