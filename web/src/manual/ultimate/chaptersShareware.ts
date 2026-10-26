// The Ultimate Owner's Guide, chapter 17: tricks from the shareware authors, the techniques a
// survey of the Internet Archive's Game-Maker Archive collection found in other people's games
// (.for-lewis/archive/NOTES.md), told as advice with the game each came from. Only the ideas are
// described; nothing of those games is copied (NOTICE.md). Each is checked against code/GM:
// PLAYGAME.C DoCollision (the higher power kills the lower; a shot that kills dies too and pays
// the victim's upscore), KillMon (a monster with a newmon is born again as it, also when its
// lifetime `end` runs out), SimKeyPress (the first sequence on a key that is on and has uses
// wins), loadscene (a blank file slot keeps the last scene's file), and movechars (the standing
// sequence moves the hero by its frames like any other, and repeats while no key is down).
// The recipes at the end turn ideas seen in Game-Maker games and a techniques demo shown in
// levelengine's RSD Game Maker Binge (NOTICE.md) into builds from the rules above and these:
// only the character touches background blocks (CheckTouch; monsters never do), a touch reads the
// block an animation is showing (GetTouchbl's blkmap), a monster's first form after a hero's shot
// can touch him (fromchar), monsters feel no gravity (moveallmons), and StartSceneInits takes the
// starting values from the first character only.
// "Customizing the player's own words" is the hex edit found in Builder's player (the notes'
// "The players"), with the CD XFERPLAY.EXE's strings in playerWords.ts (PLAYGAME.C, HISCOREL.C;
// F-keys from DoFunKy), the web player's own words in engine/game.ts and menus.ts, the desk's
// transfer-disk .EXE a name with no bytes (computer/drives.ts, so hexedit/hexFiles.ts finds no
// file), and GMTITLE.GIF from PLAYBACK.C (the earlier player, under TRANSFER).
import { opening, tip, type Chapter } from './chapter';
import { PLAYER_WORDS } from './playerWords';
import { ARCHIVE_TRICKS } from './archiveTricks';

const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

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
  is a secret door; a copy of the sky that is solid is an invisible bridge;
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
  <p>The same one-screen room with several doors is a level select, a hub of minigames or a
  music room: each door a link to its own scene, and each scene its own song.</p>
  <h2>Choosing a hero by link</h2>
  <p>Leave a scene’s character slot empty and PLAYGAME keeps the character it already has. So a
  select screen whose links each lead into a copy of the first level with a different character
  file sets the hero for the whole game, as long as every later level leaves the slot empty
  (<i>Blinky 3</i>). Make the heroes really differ (jump, speed, voice) or the choice is only a
  costume. And only the first character’s starting values count (Chapter 4): a ship that “takes
  less damage” can’t be made from its own hit points, so let the heroes differ in what they do,
  not in what they can take.</p>
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
  ${ARCHIVE_TRICKS}
  <h2>Customizing the player’s own words</h2>
  <p>A transferred game’s <code>.EXE</code> is Game-Maker’s own <code>XFERPLAY.EXE</code>, renamed
  after the game by Transfer (or by this edition’s DOS download). PLAYGAME’s built-in words live
  inside it as plain text: the menu’s six choices, the save and load lines, the high-score screen.
  A hex editor can change them. <i>Builder</i> did: its author overwrote every menu word with
  spaces, so its own menu picture shows clean with nothing written over it. The choices still
  work; only the words are gone. The same author’s unfinished <i>Rōdïp: Rover of the Deep</i>
  renamed the status line’s Hitpoints and Lives to Energy and Failsafes, and cleared the
  high-score words. These two games led this edition to map every word the player shows.</p>
  <ul>
    <li><b>Back up first.</b> Edit a copy, never the only one.</li>
    <li><b>Same length only.</b> Type over the letters, and pad a shorter word with spaces. Never
    insert or delete a byte: everything after it would move.</li>
    <li><b>Keep the 0 after each word,</b> and leave alone anything with a <code>%</code> in it
    (<code>%d</code>, <code>%s</code>, <code>%ld</code>): those are filled in as the game runs, and a
    changed one can crash it.</li>
    <li><b>Letters and spaces only.</b> Plain letters, digits, punctuation and spaces are safe; no
    accents or line drawing.</li>
    <li><b>Leave the credits alone.</b> The F10 box’s version line and RSD’s lines stay as they
    are, out of respect, and because Game-Maker’s license notice should travel with the player.</li>
    <li><b>Test in DOSBox</b> after every change: the menu, F1, F5, F6, a drop and a high score.</li>
  </ul>
  <p>This changes only the DOS player. The web player, the desk PC and the downloads for Mac,
  Windows and Linux draw these words from this edition’s own code, not from the
  <code>.EXE</code>, and every DOS download starts from a fresh copy of the CD’s player, so make
  the edit again after each one. The desk’s <code>HEXEDIT</code> can’t do it: the
  <code>.EXE</code> on a transfer disk is only a name there (the desk plays the game in this
  edition’s player), and it answers <i>File not found</i>. Use a hex editor on your own PC.</p>
  <p>Here is where the words are in the CD’s <code>XFERPLAY.EXE</code> (160,598 bytes):</p>
  <table class="ug-words">
    <tr><th>Offset</th><th>Bytes</th><th>Text</th><th>Shown</th></tr>
    ${PLAYER_WORDS.map((w) => `<tr><td><code>${w.offset.toString(16).toUpperCase()}</code></td><td>${w.length}</td><td><code>${esc(w.text)}</code></td><td>${w.where}</td></tr>`).join('\n    ')}
  </table>
  <p>Offsets are in hex, counted from the first byte of the file. The F9 joystick screens’ lines
  follow <code>MORE...</code>, most of them padded with spaces to 29 or 30 characters.</p>
  ${tip('Before 3.00:', 'Earlier players would not start a game without <code>GMTITLE.GIF</code>, a “Recreational Software Designs’ Game-Maker Presents:” card shown first, and authors redrew it as their own studio’s card. The 3.00 player never looks for it: your opening is the title slide list, and in this edition the start scene’s Opening sting.')}
  <h2>Recipes for bigger ideas</h2>
  <p>Players watching Game-Maker games have cheered for digging, sneaking, swinging and rolling
  dice, sometimes in games, sometimes in a demo made to show them off. Here is how each can be
  built from the rules in this guide. Where Game-Maker can’t do the real thing, the recipe says
  so and fakes it.</p>
  <h2>Ground you can dig</h2>
  <p>Background blocks change only when the hero himself touches them, so dirt that a tool digs is
  made of monsters. Fill the ground with solid monsters that stay put (power 103, say), and give
  the dig key a sequence that fires a short-lived monster at the hero’s feet with more power
  (105). The dig wins, the dirt <b>becomes</b> a puff with a few points on it, and a hole is
  left. For stone, use a tougher monster (110) and a second dig sequence on the same key that
  needs the pick in the inventory, in a lower-numbered slot than the plain one so it is chosen
  first (One key, many weapons, above). This is how Teddy digs in Teddy’s Little Big Adventure. Two things to
  plan for: every clod is one of the map’s 200 monsters, so dig fields stay small, and monsters
  feel no gravity, so nothing above a hole ever falls in.</p>
  <h2>Searchlights and sneaking</h2>
  <p>A guard’s light is a monster on a path: a pale beam, power 100 or more so it stays,
  sweeping its corridor on a steady loop. Draw it as a light dither: its see-through pixels let
  the floor show through, and only its colored ones can catch the hero. Its picture takes all
  the hero’s hit points, so being caught starts the scene over at the door. The shadows are
  simply the places its path never reaches: draw them dark, so the player can read where to
  wait. A guard that notices the hero is an attack path, but its range is a box round the guard
  (Appendix A) that ignores walls and the way he faces, so put such guards where that box is the
  room he watches.</p>
  <h2>A grappling swing</h2>
  <p>Nothing can hang the hero from a point, but a fling looks the part. Give the grapple key a
  sequence, needing the hook in the inventory, that fires a hook monster ahead for show, then
  feeds momentum forward and up through a few frames. The hero sails out over the gap, and the
  block’s gravity brings him down on the far side. Test it at every height the player might use
  it from, and keep a ledge to catch him.</p>
  <h2>A trail of light</h2>
  <p>A torch that lights the blocks around the hero can’t be done: only the hero touches
  background blocks, and only 50 monsters are drawn at once, too few to cover a dark screen.
  Two things work instead. Draw the cave floor dark, with each block becoming its lit copy when
  touched, and the hero leaves a trail of light wherever he has been (it fades when he leaves
  the scene, since the map comes back fresh). Or let him find the lamp: put it on a link to a
  scene that uses the same map with a bright palette (Chapter 1), landing beside the spot, so
  the whole cave lights up at once.</p>
  <h2>Dice and chance</h2>
  <p>A touch takes the block an animation is showing at that moment, so a ring of blocks whose
  frames last one tick each is a die: nobody can time a bump to an eighteenth of a second. Give
  each face its own touch (points, a prize, a small hurt) and make each face <b>become</b> a still
  block showing the roll, so it can’t be thrown twice. Let the faces add 1 to 6 to a special
  counter, and gates further on that take 4 or 6 make a board game: how far the player gets
  depends on the roll.</p>
  <h2>A friend who follows</h2>
  <p>A monster that moves toward the hero a little slower than his walk, with harmless pictures
  and power 100 or more, trots along behind him. Give it more power than the enemies and it
  beats any it bumps into, a guard dog that clears the way. It beats moving prizes just as
  surely, since they stay under 100 for the hero to collect them, so leave the friend at home in
  levels that have them.</p>
  <h2>A key to start over</h2>
  <p>When a puzzle can be ruined, a start-over key saves the player from quitting. Its sequence
  fires a slow monster with a lifetime of one tick, too short to go anywhere, that
  <b>becomes</b> a second monster: a full block of pixels, power under 100, whose picture takes 30,000 hit points and gives one life. A shot
  can’t touch the hero who fired it, but its next form can. The hero dies, the life it gave pays
  for the death, and the scene starts over from the door. Put it on a key nobody presses by
  accident, and say so in the instructions.</p>
  <h2>Quick-time scenes</h2>
  <p>A one-screen scene with no scrolling and a character of its own makes a moment where the
  right key matters. Each key’s sequence walks the hero onto a link: the right one to the next
  scene, the wrong ones to a scene where things go comically wrong. A standing sequence that
  waits a few seconds and then walks onto the wrong link is the timer. A flashing block can show
  which key to press, and the scene’s intro picture can say what is happening. The next scene
  names the hero’s usual character file again.</p>
  ${tip('Where these came from:', 'The games named here were looked at in the Internet Archive’s Game-Maker Archive collection, opened only with this edition’s file readers. Their ideas are described in the guide’s own words; their art, music and words belong to their authors. The recipes were suggested by games and a techniques demo seen in levelengine’s livestream “RSD Game Maker Binge” (2020), and are built here from PLAYGAME’s own rules.')}`,
};
