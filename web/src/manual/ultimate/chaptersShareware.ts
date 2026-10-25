// The Ultimate Owner's Guide, chapter 17: tricks from the shareware authors, the techniques a
// survey of the Internet Archive's Game-Maker Archive collection found in other people's games
// (.for-lewis/archive/NOTES.md), told as advice with the game each came from. Only the ideas are
// described; nothing of those games is copied (NOTICE.md). Each is checked against code/GM:
// PLAYGAME.C DoCollision (the higher power kills the lower; a shot that kills dies too and pays
// the victim's upscore), KillMon (a monster with a newmon is born again as it, also when its
// lifetime `end` runs out), SimKeyPress (the first sequence on a key that is on and has uses
// wins), loadscene (a blank file slot keeps the last scene's file), and movechars (the standing
// sequence moves the hero by its frames like any other, and repeats while no key is down).
import { opening, tip, type Chapter } from './chapter';

export const SHAREWARE: Chapter = {
  id: 'shareware',
  title: 'Tricks From the Shareware Authors',
  head: '17. Shareware Tricks',
  html: `${opening(17, 'Tricks From the Shareware Authors', 'Game-Maker’s first authors had no guide like this one, and they found their own way to bosses, secret doors and cutscenes. These are their best ideas, from games kept in the Internet Archive’s Game-Maker Archive collection. Every one is plain Game-Maker data that PLAYGAME plays as described.')}
  <h2>A boss with hit points</h2>
  <p>A monster dies at one hit, but its <b>Becomes</b> monster takes its place. Chain them: a
  monster the hero’s shots can hit (its power below theirs) becomes, when hit, a copy with power
  255 that no shot can hurt, a flashing animation and a lifetime of 30 to 50 ticks; when that runs
  out it becomes the next hittable link. Five links make a boss that takes five hits, with a
  breather after each. Put the big score on the last link’s kill score. Make each invulnerable
  window a little longer, or each phase a little faster, and the fight climbs: <i>Blinky 3</i>
  stretches its windows from 57 to 207 ticks, <i>Crystal Mania 4</i>’s boss flees faster after
  every hit, and <i>Blinky 2</i> and <i>Ninja Tuck</i> build whole fights this way.</p>
  <h2>Rings of blocks as timers and brains</h2>
  <p>A block that animates into another, and that one into the next and back round, is a clock
  that runs all level. Give each block of the ring a different monster to give birth to and a boss
  room’s attacks take turns by themselves (<i>Blinky 2</i>). A plain block that turns, after a
  long wait, into a look-alike that hurts is a level timer (<i>Parsec Man 3D</i>), and a slow ring
  with one frame that hurts is a fire that pulses (<i>Thal’s Quest for the Crystals</i>).</p>
  <h2>Look-alike blocks as secret doors</h2>
  <p>Two blocks with the same picture can do different things. A copy of the wall that isn’t solid
  is a secret door; a copy of the sky that is solid is an invisible bridge (<i>Dead Awakening</i>);
  a copy with a gravity is a hidden slide or current. Copies that look like empty space but stand
  in the way, and change when bumped, make the invisible maze of <i>Parsec Man 3D</i>. Hint at
  them fairly: a crack, a different echo, a coin that leads the way.</p>
  <h2>Touch chains</h2>
  <p>A block that turns into another block when touched can do more than vanish. Chain eleven of
  them whose solidity goes from none up to full and back down, and a door slides open a step each
  time the hero walks into it (<i>Orb: the Derelict Planet</i>). Walls that become their open copies
  one bump at a time (<i>Shanna</i>) and crates that turn into prizes work the same way.</p>
  <h2>Cutscenes and menus as tiny levels</h2>
  <p>A scene can be one screen with no scrolling and a character file of its own whose standing
  sequence waits a while and then walks the hero onto a link. Add a key sequence that walks onto
  it at once, and the player can skip it. That is an intermission with music, sound and moving
  actors, built from parts you already know (<i>Andy in Asunderland</i>, <i>Builder</i>, and
  <i>Blinky 2</i>’s intro and ending, which share one map).</p>
  <h2>Choosing a hero by link</h2>
  <p>Leave a scene’s character slot empty and PLAYGAME keeps the character it already has. So a
  select screen whose links each lead into a copy of the first level with a different character
  file sets the hero for the whole game, as long as every later level leaves the slot empty
  (<i>Blinky 3</i>). Make the heroes really differ (jump, speed, voice) or the choice is only a
  costume.</p>
  <h2>Physics by changing the character</h2>
  <p>The same hero with a slower walk and jumps made of momentum is a moon level; with gentle
  steps in every direction, a swim. Give those scenes their own character file (<i>Ninja Tuck</i>’s
  moon, <i>Thal’s Quest for the Crystals</i>’ swimming and climbing elf) and add gravity blocks for
  currents.</p>
  <h2>A standing sequence that moves</h2>
  <p>The standing sequence plays whenever no key is down, and its frames move the hero like any
  other. Make them move and the hero never stops: an auto-runner (<i>Hurdles</i>) or a sled that
  always slides downhill while the keys steer and speed it (<i>Seal Boarders</i>). Scroll the
  scene one way only, so there is no going back.</p>
  <h2>One key, many weapons</h2>
  <p>Several sequences can share a key. PLAYGAME starts the first one that is switched on and has
  uses left, so give each weapon its own sequence, each needing the pickup that switches it on,
  and put a last sequence with no frames on the same key whose sound says <i>I don’t have
  that</i> (<i>A-J’s Quest</i>). Its use counter is the ammunition.</p>
  <h2>Short-lived monsters</h2>
  <p>A monster with a lifetime of three ticks, born from the hero’s sequence beside him, is a sword
  swipe that kills what it touches (<i>Ninja Tuck</i>). A monster that rises a little and vanishes
  after 30 ticks, as the <b>Becomes</b> of each enemy, is a score that pops up where the enemy fell
  (<i>Shanna</i>). Both use monster slots, so keep count on a busy screen.</p>
  <h2>Timing by hand</h2>
  <p>Even steps look mechanical. A jump whose frames rise fast and slow at the top
  (<i>Ninja Tuck</i>), a patrol that slows into each corner by giving each leg its own speed, and a
  crowd of the same creature with slightly different picture times so they never move in step
  (<i>Penguin Pete</i>) all look alive for no extra pictures.</p>
  <h2>Transitions with the palette</h2>
  <p>An animation frame that changes only the palette costs a few hundred bytes, however big the
  picture. Fade a picture in or out, flash it or cycle its colors that way, and the whole
  animation stays tiny and plays on any PC (RSD’s own text-box animations in <i>Penguin Pete</i>).
  Fade-in and fade-out animations round a text screen in a slide list make a cheap page turn.</p>
  ${tip('Where these came from:', 'The games named here were looked at in the Internet Archive’s Game-Maker Archive collection, opened only with this edition’s file readers. Their ideas are described in our own words; their art, music and words belong to their authors.')}`,
};
