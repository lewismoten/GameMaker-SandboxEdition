// The Owner's Guide's 3. Designing Games (dosManual.ts): Game-Maker's words, how a game comes
// together, the tools, and the gallery of games made with it.
import type { BookletPage } from './booklet';
import * as fig from './figures';
import type { GameShot } from '../gfx/sandboxShots';
import { figure, gallery, page } from './dosManualKit';

export function designPages(shots: GameShot[]): BookletPage[] {
  return [
    page(
      '3. Designing Games',
      `<span class="chapter">3</span>
      <h1>Designing Games</h1>
      <p>Choose <b>Design</b> from the main menu to see the design tools. Each one is its own
      program with full color graphical screens; a mouse is needed.</p>
      ${figure(fig.designMenu, 'Figure 3-1. The Design menu with the Integrator chosen.', [0, 2])}
      <table>
        <tr><td><b>Palette</b></td><td>Sets of 256 colors to paint with.</td></tr>
        <tr><td><b>Block</b></td><td>Draw 20\u00d720 picture blocks for backgrounds, monsters and characters.</td></tr>
        <tr><td><b>Monster</b></td><td>Animate monster blocks and give them powers and paths.</td></tr>
        <tr><td><b>Map</b></td><td>Build scenes up to 100\u00d7100 blocks, and place monsters.</td></tr>
        <tr><td><b>Character</b></td><td>Animate your hero and set the keys that control it.</td></tr>
        <tr><td><b>Image</b></td><td>Cut blocks out of GIF pictures.</td></tr>
        <tr><td><b>Sound</b></td><td>Design sound effects.</td></tr>
        <tr><td><b>Integrator</b></td><td>Put scenes, characters, music and pictures together into a game.</td></tr>
      </table>`,
    ),
    page(
      '3. Designing Games',
      `<h2>Game-Maker words</h2>
      <table>
        <tr><td><b>Block</b></td><td>A small square picture, 20 by 20 dots (pixels). Scenery, monsters and heroes are all drawn as blocks.</td></tr>
        <tr><td><b>Map</b></td><td>One scene of a game: a grid of background blocks up to 100 by 100, with monsters placed on it.</td></tr>
        <tr><td><b>Character</b></td><td>The hero the player controls.</td></tr>
        <tr><td><b>Monster</b></td><td>Anything else that moves: enemies, friends, shots, doors that open, birds overhead.</td></tr>
        <tr><td><b>Gameware</b></td><td>The pieces a game is made of (palettes, block sets, monsters, characters, maps, sounds). You can borrow gameware from one game for another.</td></tr>
        <tr><td><b>Game area</b></td><td>The folder that holds one game\u2019s files, such as <code>C:\\GM\\SAMPLE</code>.</td></tr>
        <tr><td><b>MB1 / MB2</b></td><td>The left and right mouse buttons. MB2 often does a second job, such as picking a color for the right button.</td></tr>
      </table>
      <h3>From dot to world</h3>
      <p>A VGA screen is 320 dots across and 200 down, in 256 colors. Sixteen blocks fit across
      it and ten down, so a full 100 by 100 map is about 62 screens. The map scrolls as the hero
      moves, and its right edge joins its left (and its top its bottom), so a hero can walk all
      the way around a world.</p>`,
    ),
    page(
      '3. Designing Games',
      `<h2>Choosing files</h2>
      <p>Every tool starts by asking which file to work on. Type a name, or move through the
      list with the arrow keys and press <kbd>Enter</kbd>. Choose <code>..</code> to go up a
      folder, or a folder\u2019s name to go into it. Choose <code>&lt;New file&gt;</code> to start
      a new one.</p>
      ${figure(fig.picker, 'Figure 3-2. Choosing a block set in C:\\GM\\SAMPLE.', [0, 12])}
      <h3>Changing the games that came with Game-Maker</h3>
      <p>The sample games in <code>C:\\GM</code> are yours to change. If you change your mind,
      <b>Utilities, Restore</b> puts a game back the way it came on the CD.</p>
      <h3>Today\u2019s tools</h3>
      <p>Each designer has a <b>MENU</b> button (or <kbd>Esc</kbd>) that returns to its menu, and
      a <b>HELP!</b> button. To work on the same files with the modern Game-Maker for the web,
      use the yellow note on the monitor. See its own guide (the <b>?</b> link) for details.</p>`,
    ),
    page(
      '3. Designing Games',
      `<h2>How a game comes together</h2>
      <p>Most designers work in this order. Keep every file for one game in the same folder.</p>
      <ol>
        <li>Make a folder: at the DOS prompt type <code>MD C:\\GM\\MYGAME</code>, or choose
        <code>&lt;New file&gt;</code> in any tool and give the game a name.</li>
        <li><b>Palette.</b> Start from a palette of a sample game, or make your own.</li>
        <li><b>Block.</b> Draw background blocks (<code>.BBL</code>), monster blocks
        (<code>.MBL</code>) and character blocks (<code>.CBL</code>). Set which background
        blocks are solid, which have gravity, and which can be picked up.</li>
        <li><b>Monster</b> and <b>Character.</b> Arrange blocks into animation sequences.</li>
        <li><b>Map.</b> Paint a scene with your background blocks and place monsters on it.</li>
        <li><b>Sound.</b> Optional sound effects for the character and blocks.</li>
        <li><b>Integrator.</b> Make the <code>.GAM</code> file: list the scenes, link the doors
        between them, and add title pictures, FLI animations and music.</li>
        <li><b>Play</b> it from the main menu.</li>
      </ol>
      <div class="note"><strong>Tip.</strong> The fastest way to learn is to change a game that
      already works. Try the exercise on the next page before you build all of these parts.</div>`,
    ),
    page(
      '3. Designing Games',
      `<h2>Your first change</h2>
      <p>Take the brick path away from the cottage in <i>Sample</i>, then play it to see the change.</p>
      <ol>
        <li><b>Back it up.</b> At the prompt type <code>CD \\GM\\SAMPLE</code>, then <code>GM</code>.
        The bottom line reads <i>Game area: C:\\GM\\SAMPLE</i>. Choose <b>Utilities</b>, then
        <b>Backup</b>, and press <kbd>Enter</kbd> on <code>SAMPLE.GAM</code>. Every file in the
        folder goes into <code>SAMPLE.ZIP</code> under its own name (page 18). Press <kbd>C</kbd>,
        then <kbd>Esc</kbd>.</li>
        <li><b>Open its map.</b> Choose <b>Design</b>, then <b>Map</b>. Press <kbd>Enter</kbd> at
        <b>Choose a Map</b> and again on <code>SAMPLE.MAP</code>. The bar moves down by itself:
        press <kbd>Enter</kbd> twice at each of the next four items to load the block sets,
        monsters and palette, then once at <b>Edit Chosen Map</b>.</li>
        <li><b>Change the scenery.</b> Press <kbd>Z</kbd> to see the top left corner full size: the
        cottage, with a brick path from its front door. Grass, the first block in the list, and
        the dot tool are already chosen. Hold MB1 and drag along the path.</li>
        <li><b>Save, then play.</b> Press <kbd>Esc</kbd>. At <b>Save Map</b> press <kbd>Enter</kbd>,
        <kbd>Enter</kbd> on <code>SAMPLE.MAP</code>, and <kbd>Y</kbd> to write over it. Press
        <kbd>Enter</kbd> at <b>Quit</b> and <kbd>Esc</kbd>. Choose <b>Play</b>, <b>Play a
        Game!</b> and <code>SAMPLE.GAM</code>, then <b>Play</b>.</li>
        <li><b>Look.</b> The hero starts in the cottage doorway, and grass now runs up to the door.</li>
      </ol>
      <div class="note"><strong>Changed your mind?</strong> <b>Utilities, Restore</b> puts Sample
      back the way it came on the CD.</div>`,
    ),
    page(
      '3. Designing Games',
      `<h2>The tools at a glance</h2>
      <h3>Palette Designer</h3>
      <p>A palette is 256 colors, each mixed from red, green and blue (0 to 63 each). Keep color 0
      black: it is the background of every design screen. Color 15 is the mouse pointer, and
      color 255 is \u201cclear\u201d: monsters and characters show the scenery through it.</p>
      <h3>Block Designer</h3>
      <p>A background set holds 150 blocks, a monster set 100 and a character set 50. Draw with
      the dot, line, box, filled box, circle, disk and fill tools; shift, rotate and flip a block
      with the buttons below it. Block 0 is what a new map is filled with.</p>
      <p>The <b>INFO</b> screen gives a background block its <i>attributes</i>: which sides are
      solid, which way gravity pulls (two directions make a diagonal, opposite ones a glide
      area), whether it is an object to pick up, what it becomes after a time or when touched,
      what it adds to score, hit points, money, lives or a counter, and which monster it gives
      birth to. Drag one block onto another to copy its attributes.</p>
      <div class="note"><strong>Time.</strong> Game time runs at about 18 ticks a second: 1092 ticks
      is a minute, and the longest wait, 9999 ticks, is about nine minutes.</div>`,
    ),
    page(
      '3. Designing Games',
      `<h3>Character Maker</h3>
      <p>A hero has 20 animation sequences: standing idle, dying, being hurt, picking up and
      dropping an object, and fifteen more you tie to keys or the joystick. Each sequence has up
      to ten frames of one or two blocks, and can need an object in the inventory or use up a
      counter (arrows, for instance). Set the hero\u2019s hit points, lives and starting
      inventory (up to ten objects). A frame can give birth to a monster: that is how a hero
      shoots.</p>
      <h3>Monster Maker</h3>
      <p>A monster set has up to 64 monsters of up to 20 frames each. Each one moves toward the
      hero, away, at random or along a path you draw; it can attack when the hero comes close,
      pass through walls or be stopped by them, and die when killed, at the end of its path,
      after a time or never. A dying monster can leave another behind, and killing it can add to
      the score.</p>
      <h3>Map Maker</h3>
      <p>Paint a map with background blocks and place up to 200 monsters on it (up to 50 are
      shown on the screen at once). <b>Z</b> zooms out to see the whole map. You can limit
      scrolling to part of the map.</p>`,
    ),
    page(
      '3. Designing Games',
      `<h3>Image Reader</h3>
      <p>Opens a GIF picture and cuts blocks out of it, up to 9 by 15 blocks at a time: a quick
      way to turn a drawing from a paint program into scenery. (Game-Maker 3.0 shows GIF
      pictures directly, so the older backdrop files, <code>.BKD</code>, are seldom needed.)</p>
      <h3>Sound Designer</h3>
      <p>A sound set holds 30 PC speaker sounds; each can also name a Sound Blaster
      <code>.VOC</code> recording to play instead. The first nine are played by the game itself:
      hit points gained, a monster dies, money gained and spent, a life gained, score up and
      down, and a counter up and down. The Sound Designer also converts <code>.CMF</code> music
      for Game-Maker.</p>
      <h3>Integrator</h3>
      <p>Each square on the Integrator\u2019s screen is a scene. The green ones are the title
      screen and the end of the game. Give each scene its palette, map, block sets, monsters,
      character, sounds and music, then draw links between scenes: a link is a door on one map
      that leads to a spot on another.</p>
      <p>Pictures and words between levels are <i>multimedia displays</i>: a <code>.GIF</code>,
      an <code>.FLI</code> animation, a <code>.TXT</code> file (30 characters to a line) or a
      <code>.LST</code> list that shows several of them in turn. Each line of a list is a file
      name and the seconds to show it.</p>`,
    ),
    page(
      '3. Designing Games',
      `<h2>Games made with Game-Maker</h2>
      <p>These Sandbox Software games use Game-Maker\u2019s blocks, monsters, maps and
      Integrator scenes. Open their files in the tools to see how they work, and build your own
      without programming. The pictures are their own maps, drawn from their own files.</p>
      ${gallery(shots.slice(0, 4), 3)}`,
    ),
    page(
      '3. Designing Games',
      `${gallery(shots.slice(4, 8), 7)}
      <div class="note"><strong>See how they work.</strong> Sandbox Software\u2019s games are on the
      CD. Open any of them in Game-Maker\u2019s design tools and look at its blocks, monsters and
      maps, then make something of your own.</div>`,
    ),
  ];
}
