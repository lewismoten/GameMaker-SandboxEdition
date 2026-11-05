// GRADUATION: WIRING AND WORLDS: its stage, its hall (LAB, games/kit/starter/graduationThemes.ts), its guests and its words.
import { wrap, creditsPage } from '../../kit/starter/graduationText';
import type { Graduation } from '../../kit/starter/graduationConfig';
import { LAB } from '../../kit/starter/graduationThemes';
import about from '../about.json';

export const cfg: Graduation = {
  id: 'graduation-wiring',
  stage: 'Wiring and Worlds',
  groups: ['Wiring and Puzzles', 'Bigger Worlds'],
  cameos: ['gwinn', 'watt', 'loaf'],
  theme: LAB,
  upper: 'WIRING & WORLDS',
  honors: 'IN WIRING & WORLDS',
  signs: { start: 'WALK ACROSS THE LAB', helpers: 'HELPERS AND FRIENDS ARE HERE', cheer: 'THEY CHEER FOR YOU', doc: 'DOC LEO HAS A SCROLL FOR YOU', banner: 'WIRING & WORLDS' },
  level: { title: 'The Lab', hint: 'Walk across the lab to the stage.' },
  song: { bpm: 92, lead: 'bell', transpose: 7 },
  text: {
    story: wrap(`
|GRADUATION

You have been through Wiring and Puzzles and Bigger Worlds: counters that think, switches, many rooms and scrolling.

The lab is full of the helpers who showed you around, and a few friends. Doc Leo is on the platform at the far end.

Walk across the tiles. Take your honors from the lectern.
`),
    won: wrap(`
|HONORS IN WIRING AND WORLDS

Well done.

You can wire counters and switches into puzzles, link many rooms and scroll a big world. The lab is cheering, and Doc Leo is grinning.

The next stage is waiting whenever you are ready.
`),
    credits: creditsPage('GRADUATION: WIRING AND WORLDS', about.version, 'A graduation: it comes after Wiring and Puzzles and Bigger Worlds.'),
  },
};
