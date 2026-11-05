// GRADUATION: BLOCKS AND SHOWCASE: its stage, its hall (GALLERY, games/kit/starter/graduationThemes.ts), its guests and its words.
import { wrap, creditsPage } from '../../kit/starter/graduationText';
import type { Graduation } from '../../kit/starter/graduationConfig';
import { GALLERY } from '../../kit/starter/graduationThemes';
import about from '../about.json';

export const cfg: Graduation = {
  id: 'graduation-blocks',
  stage: 'Blocks and Showcase',
  groups: ['Drawing with Blocks', 'Showcase Tricks'],
  cameos: ['lewie', 'camel', 'joe'],
  theme: GALLERY,
  upper: 'BLOCKS & SHOWCASE',
  honors: 'IN BLOCKS & SHOWCASE',
  signs: { start: 'WALK THROUGH THE GALLERY', helpers: 'HELPERS AND FRIENDS ARE HERE', cheer: 'THEY CHEER FOR YOU', doc: 'DOC LEO HAS A SCROLL FOR YOU', banner: 'BLOCKS & SHOWCASE' },
  level: { title: 'The Gallery', hint: 'Walk through the gallery to the stage.' },
  song: { bpm: 88, lead: 'strings', transpose: -3 },
  text: {
    story: wrap(`
|GRADUATION

You have been through Drawing with Blocks and Showcase Tricks: drawn and animated blocks, light and dark and the big-game tricks.

The gallery is full of the helpers who showed you around, and a few friends. Doc Leo is on the stage by the paintings.

Walk through the gallery. Take your honors from the lectern.
`),
    won: wrap(`
|HONORS IN BLOCKS AND SHOWCASE

Well done.

You can draw and animate your own blocks, play with light and dark and use the big-game tricks. The gallery is cheering, and Doc Leo is grinning.

The Sandbox Diploma is waiting once every stage has its honors.
`),
    credits: creditsPage('GRADUATION: BLOCKS AND SHOWCASE', about.version, 'A graduation: it comes after Drawing with Blocks and Showcase Tricks.'),
  },
};
