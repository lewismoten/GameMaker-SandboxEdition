// The tour's Settings chapter: Courier Max, from Maximus: The Hundred Worlds, delivers the ⚙
// Settings menu item by item (on a narrow window, the ⋯ menu), opened to show each one and shut
// again, and nothing in it is started. It plays on the Credits page, the menu's one page of its
// own. Checked against settingsMenu.ts, theme.ts, offline/offlineDialog.ts,
// assistant/chat/settingsDialog.ts, backup/openDataBackup.ts and credits/creditsPage.ts.
import type { Chapter } from '../steps';
import { setting } from './targets';

export const settingsChapter: Chapter = {
  id: 'settings',
  title: 'Settings',
  place: 'Settings',
  page: 'credits',
  hash: '#/credits',
  ready: '.credits-page h1',
  actor: 'max',
  speaker: 'max',
  music: 'maxStation',
  steps: [
    {
      id: 'settings-hello',
      action: 'enter',
      say: 'Courier Max, with a delivery: the settings. They live behind the gear, top right.',
      sound: 'jet',
    },
    {
      id: 'settings-offline',
      action: 'point',
      target: setting('Play offline'),
      say: 'Play offline says how big the whole site is, then saves it all, so it works with no connection.',
      sound: 'warp',
    },
    {
      id: 'settings-source',
      action: 'point',
      target: setting('Source on GitHub'),
      say: 'Source on GitHub: every line of this site’s code, open for anyone to read.',
    },
    {
      id: 'settings-credits',
      action: 'point',
      target: setting('Credits'),
      say: 'Credits names who and what made everything here. That’s this page.',
    },
    {
      id: 'settings-theme',
      action: 'point',
      target: setting('Theme'),
      say: 'Theme goes dark, light, or whatever your computer uses. Each press picks the next one.',
    },
    {
      id: 'settings-tour',
      action: 'point',
      target: setting('Guided tour'),
      say: 'Guided tour plays this whole tour again, every page in order.',
    },
    {
      id: 'settings-ai',
      action: 'point',
      target: setting('AI setup'),
      say: 'AI setup connects your own AI, on your computer or with your own key, for the editor’s Assistant.',
      sound: 'coin',
    },
    {
      id: 'settings-backup',
      action: 'point',
      target: setting('Back up / restore'),
      say: 'Back up saves everything this browser keeps to one file. Restore brings it back, here or on another computer.',
    },
    {
      id: 'settings-page',
      action: 'point',
      target: { label: 'the Credits page’s sections', css: ['.credits-page .page-toc', '.credits-page h1'] },
      say: 'This page’s sections: the original Game-Maker’s makers, the game authors, and every tool used, AI too.',
    },
    {
      id: 'settings-bye',
      action: 'exit',
      say: 'Delivered. Signed, sealed, and on to the next world.',
      sound: 'jet',
    },
  ],
};
