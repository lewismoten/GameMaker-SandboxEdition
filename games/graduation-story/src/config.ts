// GRADUATION: STORY AND FINISH: its stage, its hall (THEATER, games/kit/starter/graduationThemes.ts), its guests and its words.
import { wrap, creditsPage } from '../../kit/starter/graduationText';
import type { Graduation } from '../../kit/starter/graduationConfig';
import { THEATER } from '../../kit/starter/graduationThemes';
import about from '../about.json';

export const cfg: Graduation = {
  id: 'graduation-story',
  stage: 'Story and Finish',
  groups: ['Telling a Story', 'Putting It Together'],
  cameos: ['teddy', 'joe', 'seed'],
  theme: THEATER,
  upper: 'STORY AND FINISH',
  honors: 'IN STORY AND FINISH',
  signs: {
    start: 'WALK DOWN TO THE STAGE',
    helpers: 'HELPERS AND FRIENDS ARE HERE',
    cheer: 'THEY CLAP FOR YOU',
    doc: 'DOC LEO HAS A SCROLL FOR YOU',
    banner: 'STORY AND FINISH',
  },
  arrive: {
    title: 'The Plaza',
    hint: 'Cross the plaza to the theater.',
    welcome: 'THE THEATER IS AHEAD',
    nods: ['say', 'pads', 'countdown'],
  },
  level: { title: 'The Theater', hint: 'Walk down the aisle to the stage.' },
  song: { bpm: 80, lead: 'organ', transpose: -2 },
  text: {
    story: wrap(`
|GRADUATION

You have been through Telling a Story and Putting It Together: words, pictures, sound, timing and a whole small game.

The theater is full of the helpers who showed you around, and a few friends. The spotlight is on Doc Leo.

Walk down the aisle. Take your honors from the lectern.
`),
    won: wrap(`
|HONORS IN STORY AND FINISH

Well done.

You can tell a story with words, pictures and sound, time a scene and put a whole small game together. The house is clapping, and Doc Leo is grinning.

The next stage is waiting whenever you are ready.
`),
    credits: creditsPage('GRADUATION: STORY AND FINISH', about.version, 'A graduation: it comes after Telling a Story and Putting It Together.'),
  },
};
