// The wire waste basket under the clock (room/wasteBasket.ts), rummaged through: out comes
// a crumpled first try, a different one each time (a level that didn't work, a title that
// didn't make it, an IOU), and now and then something Gwinn got to first.
import { h } from '../../editor/core/ui';
import { flash, pressable, say, turns } from './propKit';
import { roomSound } from './propSound';

interface Draft {
  text: string;
  /** What is scrawled on the sheet, in the bubble (a line or two). */
  scrawl: string[];
  chewed?: boolean;
  floppy?: boolean;
}

const DRAFTS: Draft[] = [
  { text: 'A crumpled level sketch: a maze shaped like a maze. Too mazey.', scrawl: ['LEVEL 7 (try 4)', '#.#.#.#.# ← ???'] },
  { text: 'A rejected title: SUPER MEGA ULTRA GAME 2: THE SEQUEL TO NOTHING.', scrawl: ['SUPER MEGA ULTRA', 'GAME 2 (no.)'] },
  { text: 'An IOU: one (1) finished game. Signed, me. Dated last summer.', scrawl: ['I.O.U.', '1 finished game'] },
  { text: 'A floppy labelled DO NOT USE. It goes back in the basket. Again.', scrawl: ['DO NOT USE'], floppy: true },
  { text: 'A boss design: a toaster with feelings. Margin note: needs more feelings.', scrawl: ['BOSS: toaster', 'w/ feelings'] },
  { text: 'A hero sprite that is just a square. The square is very brave.', scrawl: ['HERO', '■ (brave)'] },
  { text: 'A doodle of Teddy with a long, swishy tail. Wrong! He has a fluffy rump and no tail at all.', scrawl: ['TEDDY v1', '(tail??)'] },
  { text: 'A shopping list: graph paper, more graph paper, a better eraser.', scrawl: ['graph paper', 'MORE graph paper'] },
  { text: 'Tooth marks! Gwinn got to this draft first. The level is now… abstract.', scrawl: ['LEV~L 3', '(chewed)'], chewed: true },
  { text: 'A soggy instruction sheet. Gwinn has reviewed it: two paws down.', scrawl: ['HOW TO PL~', '(slobber)'], chewed: true },
];

function sheet(d: Draft): HTMLElement {
  const el = h('span');
  const lines = d.scrawl
    .map(
      (s, i) =>
        `<text x="${d.floppy ? 45 : 14}" y="${d.floppy ? 30 : 24 + i * 16}" ${d.floppy ? 'text-anchor="middle"' : ''} font-family="'Comic Sans MS','Marker Felt',cursive" font-size="${d.floppy ? 10 : 11}" fill="${d.floppy ? '#c0141b' : '#1d3a8a'}">${s.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</text>`,
    )
    .join('');
  el.innerHTML = d.floppy
    ? `<svg viewBox="0 0 90 90" width="72" height="72" aria-hidden="true">
        <rect x="2" y="2" width="86" height="86" rx="3" fill="#2a2d33"/>
        <rect x="22" y="2" width="44" height="26" fill="#b9bec6"/><rect x="50" y="6" width="10" height="18" fill="#2a2d33"/>
        <rect x="10" y="40" width="70" height="44" fill="#fbf8ee"/>
        ${lines}</svg>`
    : `<svg viewBox="0 0 150 60" width="150" height="60" aria-hidden="true">
        <path d="M4 6 L146 3 L144 56 L6 58 Z" fill="#fbf8ee" stroke="#b9b39f"/>
        <path d="M40 4 L52 58 M100 3 L92 57 M5 30 L145 26" stroke="#d8d2bd" stroke-width="1"/>
        ${lines}
        ${d.chewed ? '<path d="M120 3 q5 8 10 0 q5 8 10 0 l6 0 v20 q-8 -4 -10 4 q-6 -6 -12 0 q-2 -10 -4 -24z" fill="#fffbe9"/><circle cx="30" cy="48" r="6" fill="#d9d0a6" opacity="0.6"/>' : ''}
      </svg>`;
  return el.firstElementChild as HTMLElement;
}

export function wastebasketProp(basket: HTMLElement): () => void {
  const next = turns(DRAFTS);
  const use = () => {
    const d = next();
    roomSound.crinkle();
    flash(basket, 'rummage', 700);
    say(basket, d.text, sheet(d));
  };
  return pressable(basket, 'Waste basket: rummage through it', use, {
    id: 'desk-wastebasket',
  });
}
