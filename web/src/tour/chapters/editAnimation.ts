// The tour's "Animations and slide shows" chapter: Lewie goes through the animation editor on
// Ohm Sweet Ohm's intro (frames, speed, the film strip, the scene maker's timeline), then the
// picture editor (copying a 20 by 20 area into a block) and a slide show (the timeline of clips,
// the inspector's "Then" choices, the media bin). Read-only and in memory; it presses only the
// Scene maker tab, which changes nothing until something is added. Checked against
// editors/animation/ (animation.ts, scene/sceneEditor.ts, scene/sceneTimeline.ts),
// editors/picture/picture.ts and editors/slideShow/slideShow.ts.
import type { Chapter } from '../steps';

export const editAnimationChapter: Chapter = {
  id: 'edit-animation',
  title: 'Animations and slide shows',
  place: 'Editor',
  page: 'editor',
  hash: '#/p/look:logic/intro.fli',
  ready: '.fli-strip',
  always: true,
  actor: 'lewie',
  speaker: 'lewie',
  music: 'snowTitle',
  steps: [
    {
      id: 'edit-animation-hello',
      action: 'enter',
      say: 'Lewie here. Let me show you how I make things move: animations first, then pictures and slide shows.',
      sound: 'scoop',
    },
    {
      id: 'edit-animation-tabs',
      action: 'point',
      target: { label: 'the Frames and Scene maker tabs', css: '.fli-tabs' },
      say: 'Two ways to work. Frames steps through the pictures one by one. The Scene maker builds the animation from a timeline.',
    },
    {
      id: 'edit-animation-stage',
      action: 'point',
      target: { label: 'the animation screen', css: '.fli-monitor' },
      say: 'It plays as soon as you open it. The game plays an animation once; Loop here lets you watch it again and again.',
    },
    {
      id: 'edit-animation-speed',
      action: 'point',
      target: { label: 'the speed controls', css: '.fli-speed-row' },
      say: 'Speed is how long each frame stays, counted in 70ths of a second. Every frame gets the same time. Presets run up to one second.',
      spoken: 'Speed is how long each frame stays, at seventy ticks to the second. Every frame gets the same time. Presets run up to one second.',
    },
    {
      id: 'edit-animation-strip',
      action: 'point',
      target: { label: 'the film strip', css: '.fli-strip' },
      say: 'The film strip shows every frame. Click one to see it, or drag it to a new place.',
    },
    {
      id: 'edit-animation-actions',
      action: 'point',
      target: { label: 'the frame buttons', css: '.fli-actions' },
      say: 'Duplicate a frame to hold it longer. Move or delete it. Plus Picture adds a GIF after it, from this game or your computer.',
    },
    {
      id: 'edit-animation-scene',
      action: 'press',
      target: { label: 'the Scene maker tab', css: '.fli-tabs [role="tab"]', text: '🎬' },
      click: true,
      say: 'The Scene maker. An animation made here keeps its scene, so it opens again just as you left it.',
    },
    {
      id: 'edit-animation-timeline',
      action: 'point',
      target: { label: 'the scene’s timeline', css: '.scn-timeline' },
      say: 'Each track holds items on a timeline: moving text, a walking character, a monster or a block. Drag on the picture to move them.',
    },
    {
      id: 'edit-animation-generate',
      action: 'point',
      target: { label: 'the Generate button', css: '.scn-bottom .primary' },
      say: 'Generate makes an intro, a cast list or a story from the game’s own pictures, characters and text. You can change all of it after.',
    },
    {
      id: 'edit-animation-picture',
      action: 'point',
      go: { hash: '#/p/look:logic/blender.gif', ready: '.pic-canvas' },
      target: { label: 'the picture', css: '.pic-canvas' },
      say: 'A picture. You do not paint it here. Click to choose a twenty by twenty area, and Shift-click snaps to the block grid.',
    },
    {
      id: 'edit-animation-copy',
      action: 'point',
      target: { label: 'the Copy the area into a block panel', css: '.pic-copy' },
      say: 'The area becomes a block. Pick the block set, see before and after, and press Copy into block. This is how pictures turn into game art.',
    },
    {
      id: 'edit-animation-show',
      action: 'point',
      go: { hash: '#/p/look:logic/blender.lst', ready: '.sl-track' },
      target: { label: 'the slide show’s timeline', css: '.sl-track' },
      say: 'A slide show is a timeline of pictures, animations and text screens. Drag the edges of a clip to show it longer or shorter.',
    },
    {
      id: 'edit-animation-then',
      action: 'point',
      target: { label: 'the slide’s settings', css: '.sl-inspector' },
      say: 'Then says what happens after a slide: wait for a key, go straight on, or wait some seconds. From here plays the show from this slide.',
    },
    {
      id: 'edit-animation-bin',
      action: 'point',
      target: { label: 'the media bin', css: '.sl-bin' },
      say: 'Everything the game has that fits in a show is in the bin. Drag it onto the timeline, or tap it to add it after the chosen slide.',
    },
    {
      id: 'edit-animation-bye',
      action: 'exit',
      say: 'Pictures that move, shows that play. That is my kind of making. Bye now!',
    },
  ],
};
