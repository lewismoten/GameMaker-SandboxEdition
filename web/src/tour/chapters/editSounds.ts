// The tour's "Sounds and music" chapter: Gwinn goes through the sound editor on Watt's sound
// set (30 effects, the PC speaker and Sound Blaster columns, the drawn pitches, the make-one and
// change-it buttons) and then the music editor on the kitchen song (tracks, piano roll, tools,
// Accompany and Copy tune, the Instruments and Settings tabs). Read-only and in memory; it presses
// only Play as the game would (a short sound) and the music editor's tabs (a remembered choice,
// put back through `keep`). Checked against editors/sounds/sounds.ts, editor/tools/speakerFx.ts
// and editors/music/ (music.ts, tracks.ts, instrument.ts, songPanel.ts, tabs.ts).
import type { Chapter, Target } from '../steps';

/** A tab of the music editor (Song, Instruments, Settings). */
const musTab = (text: string): Target => ({ label: `the ${text} tab`, css: '.mus-tabs .mus-tab', text });

export const editSoundsChapter: Chapter = {
  id: 'edit-sounds',
  title: 'Sounds and music',
  place: 'Editor',
  page: 'editor',
  hash: '#/p/look:logic/watt.snd',
  ready: '.snd-list .snd-item',
  always: true,
  actor: 'gwinn',
  speaker: 'gwinn',
  music: 'teddyPark',
  keep: { storage: ['gm-mus-tab'] },
  steps: [
    {
      id: 'edit-sounds-hello',
      action: 'enter',
      say: 'Woof! My favorite editor: sounds first, then music. Everything a game can make you hear.',
      sound: 'gwinnBark',
    },
    {
      id: 'edit-sounds-list',
      action: 'point',
      target: { label: 'the list of sound effects', css: '.snd-list' },
      say: 'Thirty effects, numbered. The game plays the first nine by itself. The rest wait for a character’s move to ask for them.',
    },
    {
      id: 'edit-sounds-columns',
      action: 'point',
      target: { label: 'the PC and SB columns', css: '.snd-heads' },
      say: 'Two columns of play buttons. PC is the little speaker in the case. SB is a Sound Blaster, which plays a recording when there is one.',
      spoken: 'Two columns of play buttons. P C is the little speaker in the case. S B is a Sound Blaster, which plays a recording when there is one.',
    },
    {
      id: 'edit-sounds-play',
      action: 'press',
      target: { label: 'the Play as the game would button', css: '.snd-title .primary' },
      click: true,
      say: 'Play as the game would: the recording on a Sound Blaster if it comes with one, the speaker sound if not.',
    },
    {
      id: 'edit-sounds-voc',
      action: 'point',
      target: { label: 'the Sound Blaster sample chooser', css: '.snd-top .file-field-choose' },
      say: 'Pick a recording for this effect here, a voc file. Leave it on PC speaker only and every computer plays the speaker sound.',
      spoken: 'Pick a recording for this effect here, a vock file. Leave it on P C speaker only and every computer plays the speaker sound.',
    },
    {
      id: 'edit-sounds-pitch',
      action: 'point',
      target: { label: 'the pitch bars', css: '.snd-pitch' },
      say: 'The speaker sound is drawn: thirty-six bars of pitch, each a bit over a hundredth of a second. Drag across to draw, to the bottom for silence.',
    },
    {
      id: 'edit-sounds-make',
      action: 'point',
      target: { label: 'the Make one buttons', css: '.sfx-grid' },
      say: 'Make one composes a new effect: coin, jump, laser, explosion. Each press is a different one, and it plays at once.',
    },
    {
      id: 'edit-sounds-change',
      action: 'point',
      target: { label: 'the Change it buttons', css: '.snd-speaker .toolbar' },
      say: 'Change it reshapes what you have: higher, lower, faster, reversed, echo, vibrato. Silence clears every step. Undo is at the top.',
    },
    {
      id: 'edit-sounds-music',
      action: 'point',
      go: { hash: '#/p/look:logic/kitchen.cmf', ready: '.mus-tabs .mus-tab' },
      target: { label: 'the list of tracks', css: '.mus-tracks' },
      say: 'Now music. A song is a handful of tracks, one line of notes each. Every track has its own instrument, and you can mute or solo it.',
    },
    {
      id: 'edit-sounds-roll',
      action: 'point',
      target: { label: 'the music tools', css: '.mus-tools' },
      say: 'Notes go on the piano roll. The pencil draws, the box selects, the eraser rubs out and the hand moves you around.',
    },
    {
      id: 'edit-sounds-play-song',
      action: 'point',
      target: { label: 'the Play button', css: '.mus-play' },
      say: 'Play starts from the cursor, and Space does the same. Click the ruler to choose a start, or drag along it to mark a loop.',
    },
    {
      id: 'edit-sounds-accompany',
      action: 'point',
      target: { label: 'the Accompany button', css: '[title^="Generate accompaniment"]' },
      say: 'The Accompany button writes bass, chords and drums around a track’s tune. Copy tune makes a faster, slower or higher copy as a new song.',
    },
    {
      id: 'edit-sounds-inst',
      action: 'press',
      target: musTab('Instruments'),
      click: true,
      say: 'Instruments are the FM sounds of the Sound Blaster’s chip. Shape one with sliders and waves, then press Try it to hear a note.',
    },
    {
      id: 'edit-sounds-settings',
      action: 'press',
      target: musTab('Settings'),
      click: true,
      say: 'Settings: the drum kit, the song’s speed, where it repeats, and how loud it is. Then you are done. Woof!',
      sound: 'gwinnBark',
    },
  ],
};
