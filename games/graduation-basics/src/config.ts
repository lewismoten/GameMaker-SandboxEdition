// GRADUATION: FIRST STEPS (Sandbox Software, 1994): the first graduation, which comes after The Basics. The hall is
// the default one (games/kit/starter/graduationHall.ts); everything else is games/kit/starter/graduationBuild.ts.
import { wrap, creditsPage } from '../../kit/starter/graduationText';
import type { Graduation } from '../../kit/starter/graduationConfig';
import about from '../about.json';

export const cfg: Graduation = {
  id: 'graduation-basics',
  stage: 'First Steps',
  groups: ['The Basics'],
  cameos: ['teddy', 'lewie'],
  theme: {},
  upper: 'FIRST STEPS',
  honors: 'IN FIRST STEPS',
  signs: {
    start: 'WALK UP TO THE STAGE',
    helpers: 'YOUR HELPERS ARE HERE',
    cheer: 'THEY CHEER FOR YOU',
    doc: 'DOC LEO HAS A SCROLL FOR YOU',
    banner: 'FIRST STEPS',
  },
  arrive: {
    title: 'The Front Walk',
    hint: 'Stroll up to the hall doors.',
    welcome: 'WELCOME GRADUATES',
    nods: ['ladder', 'keyGate', 'coins', 'crates'],
  },
  level: { title: 'The Aisle', hint: 'Walk up to the stage.' },
  song: { bpm: 88, lead: 'lead', transpose: 0 },
  text: {
    story: wrap(`
|GRADUATION

You have been through The Basics: walking, doors, monsters, coins and walls that break.

Today the helpers who showed you around are in the hall, up on the balcony, and Doc Leo is on the stage with something for you.

Walk up the red carpet. Take your honors from the lectern.
`),
    won: wrap(`
|HONORS IN FIRST STEPS

Well done.

You can walk, open doors, meet monsters, collect coins and break walls. The helpers are cheering, and Doc Leo is grinning.

The next stage is waiting whenever you are ready.
`),
    credits: creditsPage('GRADUATION: FIRST STEPS', about.version, 'A graduation: it comes after The Basics.'),
  },
};
