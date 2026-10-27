// The tour's Cast chapter: Doc Leo, the friendly clown, introduces the regulars while Teddy runs
// to each part of the page (and Gwinn drops in). Checked against cast/castPage.ts and castStage.ts.
import type { Chapter } from '../steps';

export const castChapter: Chapter = {
  id: 'cast',
  title: 'The cast',
  place: 'Cast',
  page: 'cast',
  hash: '#/cast',
  ready: '.cast-stage-controls button',
  actor: 'teddy',
  speaker: 'leo',
  music: 'clownClub',
  steps: [
    {
      id: 'cast-hello',
      action: 'enter',
      actor: 'leo',
      say: 'Smile on: showtime! I’m Doc Leo. This is the cast: everyone from the new games.',
      sound: 'honk',
      prop: { id: 'prop:chicken', run: 'across' },
    },
    { id: 'cast-teddy', action: 'enter', speaker: 'teddy', say: 'Woof!', caption: 'Teddy: Woof! (He’s ready.)', sound: 'teddyBark', ms: 2000 },
    {
      id: 'cast-stage',
      action: 'point',
      target: { label: 'the stage', css: '.cast-stage-box' },
      say: 'On stage, each regular walks on and says hello, drawn from their own game.',
    },
    {
      id: 'cast-next',
      action: 'press',
      target: { label: 'the Next character button', css: '.cast-stage-controls button[aria-label="Next character"]' },
      click: true,
      say: 'The arrows bring on the next one, or the one before.',
      sound: 'boing',
    },
    {
      id: 'cast-pick',
      action: 'point',
      target: { label: 'the Pick a character list', css: '.cast-stage-controls select' },
      say: 'Or call one by name from this list.',
    },
    {
      id: 'cast-sound',
      action: 'point',
      target: { label: 'the stage’s sound button', css: '.cast-stage-sound' },
      say: 'The stage stays quiet until you ask. Then the Teddy games’ theme plays along.',
    },
    {
      id: 'cast-families',
      action: 'point',
      target: { label: 'the three kinds of games', css: '.cast-families' },
      say: 'Three kinds of games: Sandbox Software, the Bard of Bizarre’s songs, and the games from the original CD.',
    },
    {
      id: 'cast-filters',
      action: 'point',
      target: { label: 'the Show the cast of buttons', css: '.cast-filters' },
      say: 'These show just one kind’s regulars, or everyone.',
    },
    {
      id: 'cast-card',
      action: 'point',
      target: { label: 'Teddy’s card', css: ['.cast-grid .cast-card .cast-text', '.cast-grid .cast-card'] },
      say: 'Each regular has a card: who they are, and a little about them. Teddy knows left from right!',
      sound: 'teddyBark',
    },
    {
      id: 'cast-appears',
      action: 'point',
      target: { label: 'the games Teddy is seen in', css: '.cast-grid .cast-card .cast-seen-box' },
      say: 'And the games each one is seen in. Press a picture to go to that game.',
    },
    {
      id: 'cast-gwinn',
      action: 'enter',
      actor: 'gwinn',
      speaker: 'gwinn',
      say: 'It wasn’t me. (It was me.) Zoomies!',
      sound: 'gwinnBark',
      prop: { id: 'prop:hat', run: 'across' },
    },
    {
      id: 'cast-bye',
      action: 'exit',
      actor: 'leo',
      say: 'Hey, that’s my hat! Thanks for coming to the show, folks.',
      sound: 'giggle',
    },
  ],
};
