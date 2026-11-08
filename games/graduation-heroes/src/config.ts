// GRADUATION: HEROES AND FOES: its stage, its hall (CASTLE, games/kit/starter/graduationThemes.ts), its guests and its words.
import { wrap, creditsPage } from '../../kit/starter/graduationText';
import type { Graduation } from '../../kit/starter/graduationConfig';
import { CASTLE } from '../../kit/starter/graduationThemes';
import about from '../about.json';
import { song } from './song';

export const cfg: Graduation = {
  id: 'graduation-heroes',
  stage: 'Heroes and Foes',
  groups: ['Changing Your Hero', 'Foes and Bosses'],
  cameos: ['chicken', 'teddy', 'will', 'joe', 'goat', 'gwinn', 'watt', 'camel'],
  theme: CASTLE,
  upper: 'HEROES AND FOES',
  honors: 'IN HEROES AND FOES',
  signs: {
    start: 'WALK UP THE RUNNER',
    helpers: 'HELPERS AND FRIENDS ARE HERE',
    cheer: 'THEY CHEER FOR YOU',
    doc: 'DOC LEO HAS A SCROLL FOR YOU',
    banner: 'HEROES AND FOES',
  },
  arrive: {
    title: 'The Castle Path',
    hint: 'Cross the grounds to the castle.',
    welcome: 'THE CASTLE IS AHEAD',
    nods: ['hop', 'bug', 'flock'],
  },
  level: { title: 'The Great Hall', hint: 'Walk up the runner to the dais.' },
  song,
  text: {
    story: wrap(`
|GRADUATION

You have been through Changing Your Hero and Foes and Bosses: new heroes and vehicles, foes that think and bosses that take hits.

The great hall is full of the helpers who showed you around, and a few friends. Doc Leo waits on the dais.

Walk up the red runner. Take your honors from the lectern.
`),
    won: wrap(`
|HONORS IN HEROES AND FOES

Well done.

You can be a new hero, drive a vehicle, meet foes that think and beat bosses that take hits. The hall is cheering, and Doc Leo is grinning.

The next stage is waiting whenever you are ready.
`),
    credits: creditsPage('GRADUATION: HEROES AND FOES', about.version, 'A graduation: it comes after Changing Your Hero and Foes and Bosses.'),
  },
};
