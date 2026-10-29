// The tour's Achievements chapter: Dex Dynamo, from In The Year 2000!, shows what the page keeps
// track of. Checked against achievements/page.ts, catalog.ts and details.ts.
import type { Chapter } from '../steps';

/** A section's heading, by its title. */
const section = (title: string) => ({ label: `the ${title} heading`, css: '.ach-section-head h2', text: title });

export const achievementsChapter: Chapter = {
  id: 'achievements',
  title: 'Achievements',
  place: 'Achievements',
  page: 'achievements',
  hash: '#/achievements',
  ready: '.ach-grid .ach-card',
  actor: 'dex',
  speaker: 'dex',
  music: 'y2kTitle',
  steps: [
    {
      id: 'achievements-hello',
      action: 'enter',
      say: 'Hi! I’m Dex Dynamo, from the year 2000. This page keeps track of everything you’ve done here.',
      sound: 'oneup',
    },
    {
      id: 'achievements-summary',
      action: 'point',
      target: { label: 'the count of achievements unlocked', css: '.ach-summary' },
      say: 'Up top: how many you’ve unlocked so far, out of all of them.',
    },
    {
      id: 'achievements-making',
      action: 'point',
      target: section('Making games'),
      say: 'Making games: start one, change a file, run the Level check, download it for DOS or the web.',
    },
    {
      id: 'achievements-card',
      action: 'point',
      target: { label: 'the first badge', css: '.ach-grid .ach-card' },
      say: 'Each badge says what to do to earn it. Press one to see more, and where to go for it.',
      sound: 'kaching',
    },
    {
      id: 'achievements-playing',
      action: 'point',
      target: section('Playing'),
      say: 'Playing: finish games on the web, on the 1994 desk, even on a phone held sideways.',
    },
    {
      id: 'achievements-hearts',
      action: 'point',
      target: { label: 'the Tin heart badge', css: '.ach-card[data-id="heart-first"]' },
      say: 'Tin hearts are tucked away inside the games. Touch one and it counts here.',
      prop: { id: 'tinHeart', run: 'drop' },
      optional: true,
    },
    {
      id: 'achievements-watching',
      action: 'point',
      target: section('Watching'),
      say: 'Watching: sit back with a walkthrough, or record a video of the screen.',
    },
    {
      id: 'achievements-desk',
      action: 'point',
      target: section('The 1994 desk'),
      say: 'The 1994 desk: switch on the PC, dial a BBS, run the programs on it.',
    },
    {
      id: 'achievements-site',
      action: 'point',
      target: section('Around the site'),
      say: 'Around the site: meet the cast, unfold a map, visit the Library. A few badges stay hidden until you find them.',
      prop: { id: 'easterEgg', run: 'across' },
    },
    {
      id: 'achievements-reset',
      action: 'point',
      target: { label: 'the Reset achievements button', css: '.ach-reset button' },
      say: 'Start over forgets the badges in this browser, after asking. Your games and saves stay.',
    },
    {
      id: 'achievements-bye',
      action: 'exit',
      say: 'They’re kept in this browser, for these pages and the desk alike. Now go earn some!',
      sound: 'oneup',
    },
  ],
};
