// The tour's "Downloads" chapter: Courier Max opens the Download chooser on Ohm Sweet Ohm and goes
// through each way a game leaves the editor: the web page, the web player, DOS, the game's files,
// and the Windows, Mac and Linux programs. The chooser is opened and shut with Cancel; nothing is
// built or downloaded. Checked against editor/shell/download.ts (CHOICES, chooseDownload) and
// workspace.ts (the Download button, the file's ⋯ menu), mapPoster/map.ts, checkReport.ts.
import type { Chapter, Opener, Target } from '../steps';

/** The Download chooser, opened by the Download button in the file list. */
const chooser: Opener = {
  label: 'the Download chooser',
  by: '.sidebar .side-actions button[aria-haspopup="dialog"]',
  shown: '.download-chooser',
  close: '.download-chooser .buttons button:first-child',
};

/** One row of the chooser, by the start of its name. */
const row = (name: string): Target => ({ label: `the ${name} choice`, css: '.download-chooser .dl-choice', text: name, in: chooser });

export const editExportChapter: Chapter = {
  id: 'edit-export',
  title: 'Downloads',
  place: 'Editor',
  page: 'editor',
  hash: '#/p/look:logic/kitchen.map',
  ready: '.sidebar .side-actions',
  always: true,
  actor: 'max',
  speaker: 'max',
  music: 'maxStation',
  steps: [
    {
      id: 'edit-export-hello',
      action: 'enter',
      say: 'Special delivery! Every game I fly needs a way to reach its players. Let’s see how yours leaves the editor.',
      sound: 'clack',
    },
    {
      id: 'edit-export-save',
      action: 'say',
      say: 'In a game of yours, a note under the Download button says changes save in this browser as you go. Download a zip now and then to keep a copy safe.',
    },
    {
      id: 'edit-export-open',
      action: 'press',
      target: { label: 'the Download button', css: chooser.by, reveal: '.sidebar .files-toggle' },
      opens: chooser,
      say: 'The Download button opens the chooser. Pressing it only opens the list: nothing is made until you choose one.',
    },
    {
      id: 'edit-export-list',
      action: 'point',
      target: { label: 'the list of downloads', css: '.download-chooser fieldset', in: chooser },
      say: 'Pick a row, then press Download. Each one is built right here in your browser, so nothing leaves it until you save the file.',
    },
    {
      id: 'edit-export-web',
      action: 'point',
      target: row('Web page'),
      say: 'Web page is the game and its player in one file that opens in any browser, offline. The second button makes a web app zip for a web host.',
    },
    {
      id: 'edit-export-player',
      action: 'point',
      target: row('Web player'),
      say: 'Web player is for your own site: one page that plays game folders, with this game’s folder beside it. More details explains how.',
    },
    {
      id: 'edit-export-dos',
      action: 'point',
      target: row('DOS'),
      say: 'DOS gives the original Game-Maker files with the stand-alone player, for DOSBox or a real DOS PC. Import that zip here to edit a copy.',
    },
    {
      id: 'edit-export-files',
      action: 'point',
      target: row('Game files'),
      say: 'Game files is your project just as it is here, a zip to keep safe or import again.',
    },
    {
      id: 'edit-export-windows',
      action: 'point',
      target: row('Windows'),
      say: 'Windows makes a program to double-click, or a zip of it. It is not code-signed, so the first time you choose More info, then Run anyway.',
    },
    {
      id: 'edit-export-mac',
      action: 'point',
      target: row('Mac'),
      say: 'Mac makes an app on a disk image, or a zip, not notarized: open it first from Privacy and Security. Linux makes a folder with play.sh.',
    },
    {
      id: 'edit-export-caveat',
      action: 'point',
      target: { label: 'the note under the list', css: '.download-chooser .meta', in: chooser },
      say: 'All but DOS still need a web engine, so a future update could break them. DOS, in DOSBox, is the most future-proof.',
    },
    {
      id: 'edit-export-buttons',
      action: 'point',
      target: { label: 'the chooser’s buttons', css: '.download-chooser .buttons', in: chooser },
      say: 'Download builds the chosen file, and the button beside it picks the second format. Cancel shuts this with nothing made. I’ll leave them be.',
    },
    {
      id: 'edit-export-file',
      action: 'point',
      target: { label: 'the file’s more actions menu', css: '.file-more > summary' },
      say: 'The three dots on any file have Download file, which saves just that one file to your computer.',
      optional: true,
    },
    {
      id: 'edit-export-bye',
      action: 'exit',
      say: 'Pictures and papers go out too: the map picture saves a PNG, a Level check report a CSV, and a walkthrough an MP4. Happy trails!',
      spoken:
        'Pictures and papers go out too: the map picture saves a PNG, a Level check report a C S V file, and a walkthrough an M P four video. Happy trails!',
    },
  ],
};
