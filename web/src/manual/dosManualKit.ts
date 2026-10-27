// The Owner's Guide's shared makings (dosManual.ts): its running head, a page of HTML, a
// figure drawn from Game-Maker's own screens, and the Sandbox games' gallery and cover.
import { type BookletPage } from './booklet';
import * as fig from './figures';
import type { GameShot } from '../gfx/sandboxShots';
import { gmCover } from './printables/gmCover';

export const TITLE = 'Game-Maker 3.0 Owner\u2019s Guide';

export function div(html: string, ...more: HTMLElement[]): HTMLElement {
  const el = document.createElement('div');
  el.innerHTML = html;
  el.append(...more);
  return el;
}

export function figure(draw: Parameters<typeof fig.shot>[0], caption: string, rows?: [number, number]): string {
  return `<figure><img alt="${caption}" src="${fig.shot(draw, rows)}"><figcaption>${caption}</figcaption></figure>`;
}

export const page = (chapter: string, html: string, ...more: HTMLElement[]): BookletPage => ({ head: [TITLE, chapter], body: div(html, ...more) });

/** What each Sandbox Software game shows a designer, for its figure's caption. */
const GAME_NOTES: Record<string, string> = {
  maximus: 'Maximus: The Hundred Worlds. A hundred small maps linked by doors.',
  teddy: 'Teddy\u2019s Little Big Adventure. A two-block hero with twenty animations.',
  year2000: 'In The Year 2000! Blocks that move the character along like conveyors.',
  snowbound: 'Snowbound: The $89 Shovel. Monsters on paths drive the traffic.',
  sandcast: 'Sandcastle Knight. Gravity blocks, and objects to pick up and put down.',
  blaster: 'Virus Blaster. Shots, explosions and monsters born from other monsters.',
  logic: 'Ohm Sweet Ohm. Blocks that change when touched make the puzzles.',
  sleuth: 'Final Curtain. Text screens between the levels tell the story.',
};

export function gallery(shots: GameShot[], first: number): string {
  return `<div style="display:grid;grid-template-columns:1fr 1fr;gap:0 3cqw">${shots
    .map(
      (g, i) =>
        `<figure><img alt="${g.title}" src="${g.canvas.toDataURL()}"><figcaption>Figure 3-${first + i}. ${GAME_NOTES[g.id] ?? g.title}</figcaption></figure>`,
    )
    .join('')}</div>`;
}

/** The blueprint cover, peeled back to show Teddy's game (or whichever game loaded). */
export function coverOf(shots: GameShot[]): HTMLElement {
  const g = shots.find((s) => s.id === 'teddy') ?? shots[0];
  return gmCover(g?.canvas.toDataURL(), g?.title);
}
