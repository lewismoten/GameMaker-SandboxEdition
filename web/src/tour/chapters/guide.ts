// The tour's Guide chapter: Inspector Ada Penn, from Final Curtain, works through the Guide.
// It always starts at its first part (Getting started) and turns one page with Next. Checked
// against manual/webManual.ts and guideSections.ts.
import type { Chapter } from '../steps';

/** A part of the Guide in its contents (on a phone, in the Contents menu opened to show it). */
const part = (title: string) => ({ label: `${title} in the Guide’s contents`, css: '.guide-toc nav a', text: title, reveal: '.guide-toc > summary' });

export const guideChapter: Chapter = {
  id: 'guide',
  title: 'The Guide',
  place: 'Guide',
  page: 'guide',
  hash: '#/help',
  ready: '.guide article h1',
  always: true,
  actor: 'ada',
  speaker: 'ada',
  music: 'sleuthParlor',
  steps: [
    {
      id: 'guide-hello',
      action: 'enter',
      say: 'Inspector Ada Penn. Every case needs a good guide, and so does making games. This is it.',
      sound: 'creak',
    },
    {
      id: 'guide-start',
      action: 'point',
      target: { label: 'the Getting started heading', css: '.guide article h1' },
      say: 'Getting started: how to design, play and share games in this web version.',
    },
    {
      id: 'guide-tip',
      action: 'point',
      target: { label: 'the tip for new game makers', css: '.guide article .tip' },
      say: 'New here? Play a game, Look inside it, Edit a copy, then change one small thing and play again.',
      sound: 'aha',
      optional: true,
    },
    {
      id: 'guide-contents',
      action: 'point',
      target: part('The editors'),
      say: 'The contents, one part at a time. The editors explains each tool, from maps to music.',
    },
    {
      id: 'guide-sharing',
      action: 'point',
      target: part('Sharing your game'),
      say: 'Sharing your game: a web app for any web host, a copy for real DOS, or just its files.',
    },
    {
      id: 'guide-owners',
      action: 'point',
      target: { label: 'the Open the Owner’s Guide button', css: '.guide article .guide-open-owners' },
      say: 'The Owner’s Guide explains every part of a game, and how the parts fit together.',
      sound: 'hmm',
    },
    {
      id: 'guide-ultimate',
      action: 'point',
      target: { label: 'the Open The Ultimate Owner’s Guide button', css: '.guide article .guide-open-ultimate' },
      say: 'The Ultimate Owner’s Guide is about making a game people enjoy. The Level check uses its checklists.',
    },
    {
      id: 'guide-next',
      action: 'press',
      target: { label: 'the next part’s link', css: '.guide-pager a.next' },
      click: true,
      say: 'At the bottom, the next part’s name takes you on. One clue at a time.',
      sound: 'chime',
    },
    {
      id: 'guide-home',
      action: 'point',
      go: { hash: '#/help/home', ready: '.guide article h1' },
      target: { label: 'The home page heading', css: '.guide article h1' },
      say: 'Here, the home page: making a new game, bringing one in, and every shelf of games.',
    },
    {
      id: 'guide-bye',
      action: 'exit',
      say: 'Case closed. When you’re stuck, the answer is usually in here.',
      sound: 'aha',
    },
  ],
};
