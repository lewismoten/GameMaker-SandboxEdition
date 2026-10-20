// The boards, in order. Every board is one screen; Watt drops onto the GND pad in the
// middle and has to reach the outlet. Legend: # housing, (space) outside, . board,
// @ Watt's pad, X outlet, $ gold screw, 0..9 A..F batteries (each with its wire below),
// o switch (off) i switch (on), t timer button, g gate, f fuse, n/c relays (normally
// open / closed), % = & * ~ parts soldered to the board.
import type { BoardSpec } from './board';

export const BOARDS: BoardSpec[] = [
  {
    file: 'toaster',
    title: 'The Toaster',
    room: 'kitchen',
    card: ['Everything in here is set', 'to "bagel". Even the bagels.'],
    rows: [
      '################',
      '#0....o.....####',
      '#...........####',
      '#...........##.#',
      '#.$.........##.#',
      '#.......@...gX.#',
      '#...........##.#',
      '#...........####',
      '#...........####',
      '################',
    ],
    wires: { 0: { path: 'R11 D4' } },
    solution: 'UUULLU wwww DDDRRRRRRR',
    hint: 'How do I get past the crackling gate?',
    answer: 'Bump the switch from below to turn it on. Current runs along the wire to the gate and shuts it down. Keep off the wire while it glows!',
  },
  {
    file: 'blender',
    title: 'The Blender',
    room: 'kitchen',
    card: ['Puree, frappe, liquefy,', 'and one button marked "UH-OH".'],
    rows: [
      '##########0#####',
      '#.........o#####',
      '#..........#####',
      '#..........#...#',
      '#.$........#.X.#',
      '#.......@..#...#',
      '#..........g...#',
      '#..........#...#',
      '#..........#####',
      '################',
    ],
    wires: { 0: { path: 'D7 R1 U1' } },
    solution: 'UUUUR R ww R www DDDDD RRRR UU R',
    hint: 'The gate is open, but the wire next to it is live!',
    answer:
      'A gate stays open once current has reached it. Bump the switch again to turn the power off, wait for the last spark to drain away, then walk through.',
  },
];
