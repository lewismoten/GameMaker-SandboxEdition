// A yellowed newspaper clipping pinned to the wall: the day Game-Maker's source code was
// released (NOTICE.md). Click it to read it larger. Nothing in it is made up: the facts and
// the one quote are the ones NOTICE.md gives, with their source.
import './newsClipping.css';
import { focusInto } from '../overlayFocus';
import { h } from '../../editor/core/ui';

const QUOTE = 'if there is interest in preserving the old games you guys made then porting Game-Maker to modern OSes is the first step';

/** The clipping; `heading` is its headline's tag (a heading only where it is read, in the larger view). */
function article(heading: 'h2' | 'div'): HTMLElement {
  return h(
    'div',
    { class: 'clip-paper' },
    h('div', { class: 'clip-kicker' }, 'COMPUTERS · July 12, 2014'),
    h(heading, { class: 'clip-head' }, 'Game-Maker’s source code set free'),
    h('div', { class: 'clip-deck' }, 'The 1990s game construction kit is now open source under the MIT License'),
    h(
      'p',
      null,
      'Andy Stone, the original programmer of Game-Maker, the DOS kit for making your own computer games from Recreational Software Designs of Amherst, N.H., has published its source code on GitHub under the MIT License, along with the CD image and an installed copy.',
    ),
    h('p', null, 'Game-Maker was created by G. Andrew (Andy) Stone with G. Oliver Stone, Oliver Stone Jr. and Joan Stone, and sold from 1991 to 1995.'),
    h('p', null, 'People are free to use the code as they like, Stone said, but ', h('q', null, QUOTE), '.'),
    h('p', { class: 'clip-url' }, 'github.com/gandrewstone/GameMaker'),
  );
}

function readLarger(): void {
  let back = () => {};
  const close = () => {
    window.removeEventListener('keydown', onKey, true);
    overlay.remove();
    back();
  };
  const onKey = (e: KeyboardEvent) => {
    e.stopImmediatePropagation(); // not for the PC underneath
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    }
  };
  const overlay = h(
    'div',
    { class: 'desk-overlay clip-overlay', role: 'dialog', 'aria-label': 'Newspaper clipping: Game-Maker’s source code set free' },
    h('button', { class: 'close', onclick: close }, 'Close (Esc)'),
    h('div', { class: 'clip-large' }, article('h2')),
    h(
      'p',
      { class: 'clip-source' },
      'Recreated for this desk from the project’s NOTICE.md. The quote is as cited by ',
      h('a', { href: 'https://en.wikipedia.org/wiki/Game-Maker', target: '_blank', rel: 'noopener' }, 'Wikipedia: Game-Maker'),
      '. The source: ',
      h('a', { href: 'https://github.com/gandrewstone/GameMaker', target: '_blank', rel: 'noopener' }, 'github.com/gandrewstone/GameMaker'),
      '.',
    ),
  );
  overlay.addEventListener('click', (e) => e.target === overlay && close());
  window.addEventListener('keydown', onKey, true);
  document.body.append(overlay);
  back = focusInto(overlay.querySelector('button.close'));
}

export function newsClipping(): HTMLElement {
  return h(
    'button',
    {
      class: 'news-clipping',
      onclick: readLarger,
      title: 'A newspaper clipping: Game-Maker’s source code set free (click to read)',
      'aria-label': 'Newspaper clipping about Game-Maker’s source code release',
    },
    h('div', { class: 'clip-small', 'aria-hidden': 'true' }, article('div')),
  );
}
