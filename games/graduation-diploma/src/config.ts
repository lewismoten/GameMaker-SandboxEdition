// THE SANDBOX DIPLOMA: the finale. All eight helpers and the Cast's guests are in the hall (the helpers of every stage), under a
// banner for each stage, with confetti falling; Doc Leo hands over the diploma. Its level is src/levels.ts.
import { wrap, creditsPage } from '../../kit/starter/graduationText';
import type { Graduation } from '../../kit/starter/graduationConfig';
import about from '../about.json';

export const cfg: Graduation = {
  id: 'graduation-diploma',
  stage: 'The Sandbox Diploma',
  title: 'DIPLOMA',
  groups: [
    'The Basics',
    'Moving and Pushing',
    'Worlds That Push Back',
    'Changing Your Hero',
    'Foes and Bosses',
    'Telling a Story',
    'Putting It Together',
    'Wiring and Puzzles',
    'Bigger Worlds',
    'Drawing with Blocks',
    'Showcase Tricks',
  ],
  stillGuests: true,
  cameos: ['teddy', 'gwinn', 'chicken', 'lewie', 'joe', 'watt', 'carl', 'goat', 'will', 'camel', 'loaf', 'seed', 'egg', 'heart'],
  theme: {},
  upper: 'THE SANDBOX',
  endTitle: 'DIPLOMA!',
  honors: 'FIRST CLASS',
  signs: {
    start: 'THE LONG WALK TO YOUR DIPLOMA',
    helpers: 'EVERYONE CAME TO CHEER',
    cheer: 'EVEN TEDDY AND GWINN CAME',
    doc: 'DOC LEO HAS YOUR DIPLOMA',
    banner: 'THE SANDBOX DIPLOMA',
  },
  arrive: {
    title: 'The Long Walk',
    hint: 'Walk to the hall one last time.',
    welcome: 'ONE LAST WALK',
    nods: ['ladder', 'wind', 'hop', 'pads', 'fakeWall', 'popups'],
  },
  level: { title: 'The Long Aisle', hint: 'Walk up to the stage.' },
  song: { bpm: 76, lead: 'brass', transpose: 0 },
  text: {
    story: wrap(`
|THE SANDBOX DIPLOMA

You have the honors of every stage. Walking, pushing, heroes and foes, stories, wiring and worlds, blocks and showcase: all of it.

Everyone came: the helpers of every stage, Teddy and Gwinn, and friends from all over. Confetti is falling, and Doc Leo is on the stage.

Walk the long aisle. Take your diploma from the lectern.`),
    won: wrap(`
|THE SANDBOX DIPLOMA

Game Maker, first class.

Everyone is cheering, Teddy has a diploma of his own, and Doc Leo is grinning.

Now go and make something of your own.`),
    credits: creditsPage('THE SANDBOX DIPLOMA', about.version, 'The last graduation: it comes after the other six.'),
  },
};
