// The tour's "The Level check" chapter: Inspector Penn opens the map editor's Level check panel on
// her own Final Curtain's first act (read-only, in memory; Ohm Sweet Ohm's levels are all explored
// in two seconds, too quick to watch), presses Run check so the bot really plays the level for the
// panel's Quick 15 seconds while the heat map fills in live (the two steps after the press last
// 18 seconds between them), then goes
// through the colors, the marks, the findings and the report, Watch the bot and Play and record
// buttons, and the checklist. The last check is kept only in the project's companion in memory;
// nothing of the game changes, and the Make… maze, fixes and "meant to be" buttons are only
// pointed at. Checked against editors/map/check/ (checkPanel.ts, checkExtras.ts, markInfo.ts,
// myHeatControls.ts) and editors/map/tools/overlay.ts HEAT_COLORS.
import type { Chapter, Target } from '../steps';

/** The map toolbar's Level check button: it shows the panel (and the tour shuts it again). */
const CHECK_BUTTON = '.mt-modes .mt-tool[aria-label="Level check"]';

/** A control in the Level check panel, which the tour opens by its button. */
const lc = (label: string, css: string, text?: string): Target => ({ label, css, text, reveal: CHECK_BUTTON });

export const editCheckChapter: Chapter = {
  id: 'edit-check',
  title: 'The Level check',
  place: 'Editor',
  page: 'editor',
  hash: '#/p/look:sleuth/act1.map',
  ready: '.mt-toolset .mt-tool',
  always: true,
  actor: 'ada',
  speaker: 'ada',
  music: 'sleuthParlor',
  steps: [
    {
      id: 'edit-check-hello',
      action: 'enter',
      say: 'A level can look fine and still hide a snag. The Level check sends a bot in to play it, then hands me a report. Shall we?',
      sound: 'hmm',
    },
    {
      id: 'edit-check-panel',
      action: 'point',
      target: lc('the Level check panel', '.lc-panel'),
      say: 'The Check button in the map’s toolbar opens this panel. It plays the level on the real engine, trying every move from every place the hero can stand.',
    },
    {
      id: 'edit-check-time',
      action: 'point',
      target: lc('the Time choice', '.lc-panel .toolbar .field', 'Time'),
      say: 'Time is how long the bot may play: Quick is 15 seconds, Thorough a minute, Exhaustive four. Longer finds more.',
    },
    {
      id: 'edit-check-slow',
      action: 'point',
      target: lc('the Slower hands box', '.lc-panel .toolbar .check', 'Slower hands'),
      say: 'Slower hands plays it again one key at a time, with a pause between changes, as a person might. It says where that can’t get through.',
    },
    {
      id: 'edit-check-run',
      action: 'press',
      target: lc('the Run check button', '.lc-panel .toolbar button.primary', 'Run check'),
      click: true,
      say: 'Run check! Now watch the map.',
      ms: 3500,
    },
    {
      id: 'edit-check-live',
      action: 'point',
      target: lc('the progress bar', '.lc-progress'),
      say: 'The bot is really playing. The bar counts down the time left, and the map colors in wherever it has been, as it goes.',
      ms: 14500,
      optional: true,
    },
    {
      id: 'edit-check-colors',
      action: 'point',
      target: lc('the heat map key', '.lc-legend .lc-ramp'),
      say: 'That is the heat map. Dark purple is a moment spent there, then blue, green and, brightest yellow, a lot. Places with no color, the bot never reached.',
    },
    {
      id: 'edit-check-soon',
      action: 'point',
      target: lc('the Color by choice', '.lc-toggles .field', 'Color by'),
      say: 'Color by can show how soon the bot got there instead: bright for early, dark for late. The switches hide the heat map or the marks.',
    },
    {
      id: 'edit-check-marks',
      action: 'point',
      target: lc('the marks key', '.lc-marks'),
      say: 'Marks show a death, a stuck spot where the bot found no way out, or a finding. Rest the pointer on one for words.',
      optional: true,
    },
    {
      id: 'edit-check-counts',
      action: 'point',
      target: lc('the finding counts', '.lc-counts'),
      say: 'Findings are counted as problems, warnings, suggestions and notes. Press one to list just those.',
      optional: true,
    },
    {
      id: 'edit-check-finding',
      action: 'point',
      target: lc('a finding', '.lc-list .lc-go'),
      say: 'Each finding says what and where. Press it and the map shows the place. Beneath is why players mind, with a link to the guide.',
      optional: true,
    },
    {
      id: 'edit-check-accept',
      action: 'point',
      target: lc('the Mark as checked button', '.lc-list .lc-accept'),
      say: 'If a finding is how you want it, mark it checked. It leaves the list, the counts and the badges. Some also offer a fix button.',
      optional: true,
    },
    {
      id: 'edit-check-report',
      action: 'point',
      target: lc('the report button', '.lc-extras button', 'Open as a report'),
      say: 'Open as a report shows every finding in a big window, with a CSV file and a printable checklist to work from.',
    },
    {
      id: 'edit-check-watch',
      action: 'point',
      target: lc('the watch and play buttons', '.lc-plays'),
      say: 'Watch the bot replays its route. Play and record lets you play the level; where you go makes your own heat map to compare with the bot’s.',
      optional: true,
    },
    {
      id: 'edit-check-upload',
      action: 'point',
      target: lc('the Before you upload button', '.lc-panel .toolbar button', 'Before you upload'),
      say: 'Before you upload ticks off the guide’s checklist wherever the checks can tell. The other editors show these findings as small notes beside an item.',
    },
    {
      id: 'edit-check-bye',
      action: 'exit',
      say: 'Case closed, for now. Run it again after every change, and you’ll find the snags before your players do.',
    },
  ],
};
