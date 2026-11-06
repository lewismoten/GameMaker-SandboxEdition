// GRADUATION: MOVING AND PUSHING: its stage, its hall (GYM, games/kit/starter/graduationThemes.ts), its guests and its words.
import { wrap, creditsPage } from '../../kit/starter/graduationText';
import type { Graduation } from '../../kit/starter/graduationConfig';
import { GYM } from '../../kit/starter/graduationThemes';
import about from '../about.json';

export const cfg: Graduation = {
  id: 'graduation-moving',
  stage: 'Moving and Pushing',
  groups: ['Moving and Pushing', 'Worlds That Push Back'],
  cameos: ['gwinn', 'joe', 'goat', 'teddy', 'carl', 'chicken', 'loaf', 'lewie'],
  theme: GYM,
  upper: 'MOVING & PUSHING',
  honors: 'IN MOVING & PUSHING',
  signs: {
    start: 'WALK ACROSS THE COURT',
    helpers: 'HELPERS AND FRIENDS ARE HERE',
    cheer: 'THEY CHEER FOR YOU',
    doc: 'DOC LEO HAS A SCROLL FOR YOU',
    banner: 'MOVING & PUSHING',
  },
  arrive: {
    title: 'The Green',
    hint: 'Cross the green to the gym doors.',
    welcome: 'THE GYM IS AHEAD',
    nods: ['heart', 'ice', 'wind'],
  },
  level: { title: 'The Court', hint: 'Walk across the court to the stage.' },
  song: { bpm: 96, lead: 'brass', transpose: 2 },
  text: {
    story: wrap(`
|GRADUATION

You have been through Moving and Pushing and Worlds That Push Back: power-ups, throwing, ice, water, gravity and wind.

The gym is full of the helpers who showed you around, and a few friends. Doc Leo is on the stage with something for you.

Walk across the court. Take your honors from the lectern.
`),
    won: wrap(`
|HONORS IN MOVING AND PUSHING

Well done.

You can grab power-ups, throw things, slide on ice, swim, and push back against gravity and wind. The gym is cheering, and Doc Leo is grinning.

The next stage is waiting whenever you are ready.
`),
    credits: creditsPage('GRADUATION: MOVING AND PUSHING', about.version, 'A graduation: it comes after Moving and Pushing and Worlds That Push Back.'),
  },
};
