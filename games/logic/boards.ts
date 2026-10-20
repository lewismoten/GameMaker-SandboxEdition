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
];
