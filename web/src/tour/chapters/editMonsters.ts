// The tour's "Monsters and the hero" chapter: Courier Max delivers a look at the monster editor
// on Ohm Sweet Ohm's garage monsters (the list, animation frames, power and lives, movement, a
// monster's walking path on a map) and then at the character editor on Watt, the hero (its start
// tab, the sequences list and their four tabs, the audition stage, frames that give birth to
// monsters). Read-only and in memory: it selects one monster and the hero's Sequences tab, and
// nothing is saved; the Sequences tab is a remembered choice, put back at the end (`keep`).
// Checked against editors/monsters/ (monsters.ts, monsterPath*.ts) and editors/character/
// (character.ts, characterStage.ts, characterFrames.ts, joystickControls.ts).
import type { Chapter, Target } from '../steps';

/** A label in the monster's stats panel (Power, Lives, Movement…), by its text. */
const stat = (text: string, label: string): Target => ({ label, css: '.mon-stats label', text });

/** A tab of the character editor's top row (At the start, Sequences). */
const chrTab = (text: string): Target => ({ label: `the ${text} tab`, css: '.chr-tabrow .chr-tab', text });

export const editMonstersChapter: Chapter = {
  id: 'edit-monsters',
  title: 'Monsters and the hero',
  place: 'Editor',
  page: 'editor',
  hash: '#/p/look:logic/garage.mon',
  ready: '.mon-list',
  always: true,
  actor: 'max',
  speaker: 'max',
  music: 'maxStation',
  keep: { storage: ['gm-chr-tab'] },
  steps: [
    {
      id: 'edit-monsters-hello',
      action: 'enter',
      say: 'Courier Max here, with a special delivery: the monsters first, then the hero who meets them.',
      sound: 'jet',
    },
    {
      id: 'edit-monsters-list',
      action: 'point',
      target: { label: 'the list of monsters', css: '.mon-list' },
      say: 'Every monster in the set, numbered. Pick one, and the rest of the page shows how it looks and acts.',
    },
    {
      id: 'edit-monsters-anim',
      action: 'point',
      target: { label: 'the Animation panel', css: '.mon-anim' },
      say: 'A monster is a few frames, each a picture and a time in ticks, a tick being an eighteenth of a second. Add or remove frames here.',
      spoken: 'A monster is a few frames, each a picture and a time in ticks, a tick being one eighteenth of a second. Add or remove frames here.',
    },
    {
      id: 'edit-monsters-power',
      action: 'point',
      target: stat('Power', 'the Power box'),
      say: 'Power is how tough it is: 100 or more can’t be killed by touching the hero. The Lives box says how long it lasts, forever or until destroyed.',
    },
    {
      id: 'edit-monsters-move',
      action: 'point',
      target: stat('Movement', 'the Movement list'),
      say: 'Movement: it follows its path, chases the hero, runs away from it, or wanders at random.',
    },
    {
      id: 'edit-monsters-pick',
      action: 'press',
      target: { label: 'monster 52 in the list', css: '.mon-list button[title^="Monster 52"]' },
      click: true,
      say: 'This one, number 52, follows a path of seven corners. Let’s see where it walks.',
      optional: true,
    },
    {
      id: 'edit-monsters-path',
      action: 'point',
      target: { label: 'the path map', css: '.mpath-stage' },
      say: 'The path is drawn on a real map: Map picks the scene, Starts at the monster’s spot. Click blocks to lay corners; it walks to each in turn.',
    },
    {
      id: 'edit-monsters-hero',
      action: 'point',
      go: { hash: '#/p/look:logic/watt.chr', ready: '.chr-tabrow .chr-tab' },
      target: chrTab('At the start'),
      say: 'Now the hero. The first tab is how the game starts: hit points, lives, money, five counters and the starting inventory.',
    },
    {
      id: 'edit-monsters-seqs',
      action: 'press',
      target: chrTab('Sequences'),
      click: true,
      say: 'Sequences are the hero’s moves. The built-in ones come first: Idle, Die, Hurt, Pick up and Drop.',
    },
    {
      id: 'edit-monsters-moves',
      action: 'point',
      target: { label: 'the list of sequences', css: '.chr-list' },
      say: 'Your own moves follow, each started by a key or a joystick direction. The function keys stay with the game’s own menus.',
    },
    {
      id: 'edit-monsters-tabs',
      action: 'point',
      target: { label: 'the sequence’s tabs', css: '.chr-groups .panel-tabs-list' },
      say: 'Four tabs per move: Controls says what starts it, Animation how it moves, Requirements what it needs, Sound what plays.',
    },
    {
      id: 'edit-monsters-stage',
      action: 'point',
      target: { label: 'the audition stage', css: '.chr-stage-wrap' },
      say: 'The stage auditions the move. Pause, Restart and Sound off are under it, and Behind picks which scene it plays in.',
    },
    {
      id: 'edit-monsters-birth',
      action: 'point',
      target: { label: 'the frames of the move', css: '.chr-frames-wrap' },
      say: 'A frame can show the hero, or give birth to a monster. Preview monsters from picks which set shows up here.',
    },
    {
      id: 'edit-monsters-bye',
      action: 'exit',
      say: 'Delivery complete. Next stop: the colors!',
    },
  ],
};
