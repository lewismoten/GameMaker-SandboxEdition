// Ebenezer's Hidey-Hole: the room nobody mentions, under the Cold Cellar, in the light of 1777.
// The Redcoats searched the Tea Room for a week; the tea was down here all along, a spare
// pinch of it, and it is the way out (on to the Sugar Room: the Tea Room never knows). Also
// here: Ebenezer's own tricorn (Enter to pick it up, T to tip it).
import type { RoomSpec } from '../room';

export const HIDEY: RoomSpec = {
  file: 'hidey',
  level: 0,
  name: "Ebenezer's Hidey-Hole",
  style: 'parlor',
  theme: 'hidey',
  ingredient: 6,
  song: 'hidey',
  card: ['You found it.', 'Nobody talks about it.', 'Take the spare tea.'],
  signs: { Q: 'signTuesday' },
  rows: [
    '####################',
    '#@.....$.$.$......t#',
    '#..BB........HH....#',
    '#.......QQQ........#',
    '#..T..........K..I.#',
    '####################',
  ],
};
