// The tour's "Make a walkthrough" chapter: Doc Leo opens the walkthrough dialog from the Integrator's
// start scene on Ohm Sweet Ohm (look-only) and goes through its parts: Watch, Make one with the bot,
// its time for each scene, Make it and Play it myself. The dialog is opened and shut; the bot is
// never started and nothing is kept. The home page's Walkthrough button opens this same dialog, titled
// Walkthrough, and also watches a game's own shipped walkthrough. Checked against
// editor/widgets/walkDialog.ts and editors/integrator/integrator.ts (the "Make a walkthrough…" button).
import type { Chapter, Opener, Target } from '../steps';

/** The walkthrough dialog, opened by the start scene's Make a walkthrough button. */
const dialog: Opener = {
  label: 'the walkthrough box',
  by: '.grator-panel button[title^="Let a bot play the whole game"]',
  shown: '.modal .wd',
  close: '.modal .modal-close',
};

/** A control inside the walkthrough dialog. */
const wd = (label: string, css: string, text?: string): Target => ({ label, css, text, in: dialog });

export const editWalkthroughChapter: Chapter = {
  id: 'edit-walkthrough',
  title: 'Make a walkthrough',
  place: 'Editor',
  page: 'editor',
  hash: '#/p/look:logic/ohmsweet.gam?scene=0',
  ready: '.grator-tools',
  always: true,
  actor: 'leo',
  speaker: 'leo',
  music: 'clownClub',
  steps: [
    {
      id: 'edit-walkthrough-hello',
      action: 'enter',
      say: 'Stuck on a level, kids? A walkthrough is the whole game played start to finish, and the editor can make one for you.',
      sound: 'honk',
    },
    {
      id: 'edit-walkthrough-open',
      action: 'press',
      target: { label: 'the Make a walkthrough button', css: dialog.by },
      opens: dialog,
      say: 'On the start scene, this button opens the walkthrough box. The home page’s Walkthrough button opens the same one.',
    },
    {
      id: 'edit-walkthrough-watch',
      action: 'point',
      target: wd('the Watch part', '.wd-part'),
      say: 'Watch plays what the bot made in the player, with chapters. There you can Download MP4 or Copy for YouTube.',
    },
    {
      id: 'edit-walkthrough-make',
      action: 'point',
      target: wd('the Make one part', '.wd-part:nth-of-type(2)'),
      say: 'The walkthrough bot plays each scene on the real engine. If it gets stuck, what it made still plays as far as it got.',
    },
    {
      id: 'edit-walkthrough-time',
      action: 'point',
      target: wd('the Time for each scene choice', '.wd .field', 'Time for each scene'),
      say: 'Time for each scene is how long the bot tries one scene: from 30 seconds to 10 minutes. I won’t start it today.',
    },
    {
      id: 'edit-walkthrough-go',
      action: 'point',
      target: wd('the Make it button', '.wd .toolbar button.primary', 'Make it'),
      say: 'Make it starts the bot. It tries styles from quickest to most thorough until one gets through, and Stop keeps the scenes it finished.',
    },
    {
      id: 'edit-walkthrough-mine',
      action: 'point',
      target: wd('the Make one part', '.wd-part:nth-of-type(2)'),
      say: 'Once the bot has played, any scene gets Play it myself: reach an exit and your play is kept. Mine or Bot chooses who plays it next time.',
    },
    {
      id: 'edit-walkthrough-look',
      action: 'point',
      target: wd('the Watch part', '.wd-part'),
      say: 'This game is open to look at only, so a walkthrough made here is kept apart from its files. They are never changed.',
    },
    {
      id: 'edit-walkthrough-bye',
      action: 'exit',
      say: 'Now go on, play it yourself, or let the bot show you the way. Honk honk!',
    },
  ],
};
