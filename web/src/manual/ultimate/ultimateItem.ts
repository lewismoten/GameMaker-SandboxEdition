// The Ultimate Owner's Guide as a piece in the Game-Maker box (gmItems.ts): its title, its
// black and gold cover (the box's picture of it) and the chapter to open at. Its pages, with
// every chapter, load from ultimateGuide.ts only when the guide is opened.
import './ultimateCover.css';
import { h } from '../../editor/core/ui';
import { sheet } from '../printables/kit';
import type { BoxItem } from '../printables/viewer';

export const ULTIMATE_TITLE = 'The Ultimate Owner’s Guide';

/** The front cover: black and gold, for the designer who has read the first guide twice. */
export function ultimateCover(): HTMLElement {
  return h(
    'div',
    { class: 'ug-cover' },
    h('div', { class: 'ug-band' }, h('span', null, 'GAME-MAKER 3.0'), h('span', null, 'SANDBOX EDITION')),
    h('div', { class: 'ug-blocks', 'aria-hidden': 'true' }, ...Array.from({ length: 16 }, (_, i) => h('i', { class: `ug-b${(i * 7) % 5}` }))),
    h(
      'h1',
      { class: 'ug-name' },
      h('span', { class: 'ug-the' }, 'The '),
      h('span', { class: 'ug-ultimate' }, 'Ultimate'),
      h('span', { class: 'ug-owners' }, ' Owner’s Guide'),
    ),
    h('p', { class: 'ug-for' }, 'For Advanced Designers'),
    h('ul', { class: 'ug-topics' }, ...['Palette magic', 'Blocks that think', 'Voice and FM music', 'Demos and play-testing'].map((t) => h('li', null, t))),
    h('p', { class: 'ug-foot' }, 'Tips and tricks from the makers of the Sandbox games', h('br'), 'Not an RSD publication'),
  );
}

let wanted: string | undefined;

/** The next time the guide is opened, it turns to this chapter (an id in plan.ts CHAPTERS). */
export function openAtChapter(id: string | undefined): void {
  wanted = id;
}

/** The guide as a piece in the Game-Maker box. */
export function ultimateItem(): BoxItem {
  return {
    openAt: () => {
      const id = wanted;
      wanted = undefined;
      return id;
    },
    id: 'ultimate',
    title: ULTIMATE_TITLE,
    note: 'Advanced tips and tricks, stapled',
    icon: '📒',
    pages: async () => (await import('./ultimateGuide')).ultimatePages(),
    render: async () => [sheet(5.5, 8.5, 'ug-thumb', ultimateCover())],
  };
}
