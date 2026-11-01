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
  // the page's open tab is kept in the address
  keep: { params: ['tab'] },
  steps: [
    {
      id: 'settings-hello',
      action: 'enter',
      say: 'Courier Max, with a delivery: the settings. They live behind the gear, top right.',
      // Max's voice loses a take's first word: an "It's" goes first
      spoken: "It's Courier Max, with a delivery: the settings. They live behind the gear, top right.",
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
      // Max's voice loses a take's first word
      spoken: 'The Theme button goes dark, light, or whatever your computer uses. Each press picks the next one.',
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
      target: { label: 'the Credits page’s sections', css: ['.credits-page .credits-tabs', '.credits-page h1'] },
      say: 'This page’s sections: the people who made the original Game-Maker, the game authors, and every tool used, AI too.',
    },
    {
      id: 'settings-tab-original',
      action: 'press',
      target: { label: 'the The original tab', css: '.credits-tab', text: 'The original' },
      click: true,
      say: 'The original names RSD and the Stone family, part by part.',
    },
    {
      id: 'settings-tab-authors',
      action: 'press',
      target: { label: 'the Game authors tab', css: '.credits-tab', text: 'Game authors' },
      click: true,
      say: 'Game authors covers the CD’s games, Sandbox Software, and the Bard.',
    },
    {
      id: 'settings-tab-people',
      action: 'press',
      target: { label: 'the The people tab', css: '.credits-tab', text: 'The people' },
      click: true,
      say: 'The people are Lewis, and the cast who appear as themselves.',
    },
    {
      id: 'settings-tab-more-games',
      action: 'press',
      target: { label: 'the More games tab', css: '.credits-tab', text: 'More games' },
      click: true,
      say: 'More games points to other sites that keep the games players made.',
    },
    {
      id: 'settings-tab-bard',
      action: 'press',
      target: { label: 'the The Bard tab', css: '.credits-tab', text: 'The Bard' },
      click: true,
      say: 'The Bard shows who made what, game by game.',
    },
    {
      id: 'settings-tab-bbs',
      action: 'press',
      target: { label: 'the BBS pictures tab', css: '.credits-tab', text: 'BBS pictures' },
      click: true,
      say: 'BBS pictures says who took each one, and lets you download one by modem.',
    },
    {
      id: 'settings-tab-ai',
      action: 'press',
      target: { label: 'the AI tools tab', css: '.credits-tab', text: 'AI tools' },
      click: true,
      say: 'AI tools lists what each tool made.',
    },
    {
      id: 'settings-tab-pieces',
      action: 'press',
      target: { label: 'the Third-party pieces tab', css: '.credits-tab', text: 'Third-party pieces' },
      click: true,
      say: 'Third-party pieces are the fonts, headers and runtimes in the site and players.',
    },
    {
      id: 'settings-tab-software',
      action: 'press',
      target: { label: 'the Software tab', css: '.credits-tab', text: 'Software' },
      click: true,
      say: 'Software lists the build and test tools, and what they use.',
    },
    {
      id: 'settings-bye',
      action: 'exit',
      say: 'Delivered. Signed, sealed, and on to the next world.',
      sound: 'jet',
    },
  ],
};
