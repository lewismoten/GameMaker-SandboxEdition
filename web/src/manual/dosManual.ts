// The Game-Maker 3.0 Owner's Guide for the desk PC, typeset like a 1994 manual. It
// describes this recreation (the desk, its DOS and Game-Maker's text menus) in the voice
// of the original documentation, with specifications from GM_SPECS.TXT.
import { type BookletPage } from './booklet';
import './booklet.css';
import { h } from '../editor/core/ui';
import { isSandboxGame, loadCatalog, type CatalogEntry } from '../project/files';
import { bookletPageCount } from './printables/imposition';
import type { BookPage } from './printables/manualPages';
import * as fig from './figures';
import { sandboxShots, type GameShot } from '../gfx/sandboxShots';
import { gmCover } from './printables/gmCover';
import { regRecord } from './regRecord';

const TITLE = 'Game-Maker 3.0 Owner\u2019s Guide';

function div(html: string, ...more: HTMLElement[]): HTMLElement {
  const el = document.createElement('div');
  el.innerHTML = html;
  el.append(...more);
  return el;
}

function figure(draw: Parameters<typeof fig.shot>[0], caption: string, rows?: [number, number]): string {
  return `<figure><img alt="${caption}" src="${fig.shot(draw, rows)}"><figcaption>${caption}</figcaption></figure>`;
}

const page = (chapter: string, html: string, ...more: HTMLElement[]): BookletPage => ({ head: [TITLE, chapter], body: div(html, ...more) });

/** What each Sandbox Software game shows a designer, for its figure's caption. */
const GAME_NOTES: Record<string, string> = {
  maximus: 'Maximus: The Hundred Worlds. A hundred small maps linked by doors.',
  teddy: 'Teddy\u2019s Little Big Adventure. A two-block hero with twenty animations.',
  year2000: 'In The Year 2000! Blocks that move the character along like conveyors.',
  snowbound: 'Snowbound: The $89 Shovel. Monsters on paths drive the traffic.',
  sandcast: 'Sandcastle Knight. Gravity blocks, and objects to pick up and put down.',
  blaster: 'Virus Blaster. Shots, explosions and monsters born from other monsters.',
  logic: 'Ohm Sweet Ohm. Blocks that change when touched make the puzzles.',
  sleuth: 'Final Curtain. Text screens between the levels tell the story.',
};

function gallery(shots: GameShot[], first: number): string {
  return `<div style="display:grid;grid-template-columns:1fr 1fr;gap:0 3cqw">${shots
    .map(
      (g, i) =>
        `<figure><img alt="${g.title}" src="${g.canvas.toDataURL()}"><figcaption>Figure 3-${first + i}. ${GAME_NOTES[g.id] ?? g.title}</figcaption></figure>`,
    )
    .join('')}</div>`;
}

/** The blueprint cover, peeled back to show Teddy's game (or whichever game loaded). */
function coverOf(shots: GameShot[]): HTMLElement {
  const g = shots.find((s) => s.id === 'teddy') ?? shots[0];
  return gmCover(g?.canvas.toDataURL(), g?.title);
}

function pages(shots: GameShot[]): BookletPage[] {
  return [
    {
      cover: true,
      body: coverOf(shots),
    },
    page(
      'Contents',
      `<h1>Contents</h1>
      <table>
        <tr><td>1. Getting Started</td><td>2</td></tr>
        <tr><td>&nbsp;&nbsp;&nbsp;Drives and DOS commands</td><td>3</td></tr>
        <tr><td>2. The Main Menu</td><td>5</td></tr>
        <tr><td>&nbsp;&nbsp;&nbsp;Playing, saving and high scores</td><td>6</td></tr>
        <tr><td>3. Designing Games</td><td>8</td></tr>
        <tr><td>&nbsp;&nbsp;&nbsp;Game-Maker words</td><td>9</td></tr>
        <tr><td>&nbsp;&nbsp;&nbsp;Your first game</td><td>11</td></tr>
        <tr><td>&nbsp;&nbsp;&nbsp;The tools at a glance</td><td>12</td></tr>
        <tr><td>&nbsp;&nbsp;&nbsp;Games made with Game-Maker</td><td>15</td></tr>
        <tr><td>4. Utilities</td><td>17</td></tr>
        <tr><td>&nbsp;&nbsp;&nbsp;Troubleshooting a real PC</td><td>19</td></tr>
        <tr><td>5. The Game-Maker BBS</td><td>20</td></tr>
        <tr><td>6. Sharing Your Games</td><td>21</td></tr>
        <tr><td>Appendix A. Specifications</td><td>23</td></tr>
        <tr><td>Appendix B. Files and Folders</td><td>25</td></tr>
        <tr><td>Appendix C. The Copy Check</td><td>26</td></tr>
        <tr><td>Appendix D. About This Edition</td><td>27</td></tr>
      </table>
      <div class="note"><strong>Welcome!</strong> It\u2019s as much fun to create computer games as it is to play them.
      Game-Maker lets you turn your game ideas into great games with no programming at all.
      We suggest you start by playing a few of the sample games, then read Chapter 3 and try
      the tools in the order given there.</div>`,
      regRecord('page'),
    ),
    page(
      '1. Getting Started',
      `<span class="chapter">1</span>
      <h1>Getting Started</h1>
      <p>Your desk has everything you need: the PC, a box of 3\u00bd\u2033 diskettes, the Game-Maker
      box with its CD-ROM, and the shareware catalog.</p>
      <h2>Turning on the computer</h2>
      <p>Press <b>POWER</b> on the front of the computer. The BIOS counts memory, DOS starts,
      and you are left at the <code>C:\\&gt;</code> prompt. Click the screen (or the keyboard)
      before typing.</p>
      <p>The <b>TURBO</b> button switches between full speed and the speed of an older PC,
      about a 286. Programs load and unpack more slowly with Turbo off. Game-Maker games play
      at nearly the same pace; with Turbo off a busy scrolling screen can stutter a little and
      the view trails the player, as on a 286.</p>
      <p>The <b>\u2922</b> button on the monitor fills your window with the screen. Press it
      again to return to the desk.</p>`,
    ),
    page(
      '1. Getting Started',
      `<h2>Your computer and its drives</h2>
      <table>
        <tr><th>Drive</th><th>What it holds</th></tr>
        <tr><td><b>A:</b></td><td>The 3\u00bd\u2033 1.44 MB floppy drive. Pick a diskette from the disk box to put it in; press <b>EJECT</b> to take it out.</td></tr>
        <tr><td><b>C:</b></td><td>The hard disk. Game-Maker is installed in <code>C:\\GM</code>, with one folder for each game. Shareware you download from the BBS goes in <code>C:\\DOWNLOAD</code>.</td></tr>
        <tr><td><b>D:</b></td><td>The Game-Maker CD-ROM, exactly as it shipped. You can play from it, but you can\u2019t change it.</td></tr>
      </table>
      <p>You do not need a diskette to use Game-Maker. Everything can be done on the hard disk.
      Diskettes are for games other people gave you, and for the games you <i>Transfer</i> to
      give away.</p>
      ${figure(fig.dosPrompt, 'Figure 1-1. The DOS prompt after starting up.')}`,
    ),
    page(
      '1. Getting Started',
      `<h2>DOS commands you will need</h2>
      <p>Type a command and press <kbd>Enter</kbd>. Upper and lower case are the same.
      Type <code>HELP</code> at any time for a summary.</p>
      <table>
        <tr><th>Command</th><th>What it does</th></tr>
        <tr><td><code>DIR</code> [<code>/W</code>] [<code>/P</code>]</td><td>Lists the files in this folder. <code>/W</code> lists them across the screen, <code>/P</code> stops after each screenful.</td></tr>
        <tr><td><code>CD GM</code></td><td>Goes into the GM folder. <code>CD ..</code> goes back out, <code>CD \\</code> goes to the top.</td></tr>
        <tr><td><code>A:</code> <code>C:</code> <code>D:</code></td><td>Changes to another drive.</td></tr>
        <tr><td><code>MD C:\\GM\\MYGAME</code></td><td>Makes a new folder for a game of your own.</td></tr>
        <tr><td><code>TYPE README.TXT</code></td><td>Shows a text file. Shareware games tell you how to register in their text files.</td></tr>
        <tr><td><code>GM</code></td><td>Starts Game-Maker.</td></tr>
        <tr><td><code>PLAYGAME</code></td><td>Plays a game without the menus.</td></tr>
        <tr><td><code>TERMINAL</code></td><td>Calls the Game-Maker BBS with your modem.</td></tr>
        <tr><td><code>CLS</code> <code>VER</code> <code>MEM</code></td><td>Clears the screen, shows the DOS version, shows memory.</td></tr>
      </table>
      <p>To run a game on a diskette, put it in drive A:, type <code>A:</code> and then the
      game\u2019s name. <code>DIR</code> shows the <code>.EXE</code> to type.</p>
      <div class="note"><strong>Tip.</strong> Pressing <kbd>\u2191</kbd> brings back the last command (DOSKEY).</div>`,
    ),
    page(
      '2. The Main Menu',
      `<span class="chapter">2</span>
      <h1>The Main Menu</h1>
      <p>Type <code>GM</code> at the prompt, or click the Game-Maker box on the desk. The main
      menu appears across the top of the screen.</p>
      ${figure(fig.mainMenu, 'Figure 2-1. The main menu.', [0, 2])}
      <p>Use <kbd>\u2190</kbd> and <kbd>\u2192</kbd> to move the bar, then press <kbd>Enter</kbd>.
      You can also press the first letter of an item, or click it with the mouse.
      <kbd>Esc</kbd> backs out of any menu.</p>
      <table>
        <tr><td><b>Play</b></td><td>Choose a game and play it.</td></tr>
        <tr><td><b>Design</b></td><td>The design tools (Chapter 3).</td></tr>
        <tr><td><b>Utilities</b></td><td>Backup, Restore, Transfer, Joystick Setup and Joystick Diagnostic (Chapter 4).</td></tr>
        <tr><td><b>About</b></td><td>About Game-Maker and how to order it.</td></tr>
        <tr><td><b>Quit</b></td><td>Return to DOS.</td></tr>
        <tr><td><b>Help</b></td><td>A help screen for this menu. Every menu has one.</td></tr>
      </table>
      <p>The bottom line of the screen shows the <i>game area</i>: the folder Game-Maker is working in.</p>`,
    ),
    page(
      '2. The Main Menu',
      `<h2>Playing games</h2>
      <p>Choose <b>Play</b>, then pick a game\u2019s <code>.GAM</code> file. The sample games
      <i>Sample</i>, <i>Pipemare</i> and <i>Nebula</i> are good ones to start with.</p>
      <p>The arrow keys move your character four ways; in games whose hero moves diagonally, the
      corner keys of the numeric keypad (<kbd>Home</kbd>, <kbd>PgUp</kbd>, <kbd>End</kbd>,
      <kbd>PgDn</kbd>) move it the other four. Other actions (jumping, shooting, and so on) use
      the keys the game\u2019s designer chose; press <kbd>F1</kbd> to see the game\u2019s own help.</p>
      <table>
        <tr><th>Key</th><th>During a game</th></tr>
        <tr><td><kbd>Esc</kbd></td><td>Stop the game and go back to its title menu; also leaves the F1, F2 and F10 screens</td></tr>
        <tr><td><kbd>F1</kbd></td><td>Help</td></tr>
        <tr><td><kbd>F2</kbd></td><td>Status and inventory (press it again to go back to the game)</td></tr>
        <tr><td><kbd>F3</kbd></td><td>Music on or off</td></tr>
        <tr><td><kbd>F4</kbd></td><td>Sound on or off</td></tr>
        <tr><td><kbd>F5</kbd></td><td>Save the game</td></tr>
        <tr><td><kbd>F6</kbd></td><td>Restore a saved game</td></tr>
        <tr><td><kbd>F7</kbd></td><td>Not used (kept for a later version)</td></tr>
        <tr><td><kbd>F8</kbd></td><td>Joystick on or off</td></tr>
        <tr><td><kbd>F9</kbd></td><td>Calibrate the joystick</td></tr>
        <tr><td><kbd>F10</kbd></td><td>About Game-Maker</td></tr>
      </table>
      <div class="note"><strong>Note.</strong> A joystick or game pad plugged into your computer works
      in every game. Press <kbd>F8</kbd> to switch to it.</div>`,
    ),
    page(
      '2. The Main Menu',
      `<h2>A game\u2019s title menu</h2>
      <p>Every game starts at its own title screen with the same menu: <b>Play</b>, <b>Read
      Instructions</b>, <b>Read Storyline</b>, <b>See Credits</b>, <b>See Highest Scores</b> and
      <b>Quit</b>. Move the bar with the arrow keys and press <kbd>Enter</kbd>.</p>
      <h3>Saving your place</h3>
      <p><kbd>F5</kbd> saves the game in one of ten slots; type a name for it so you know it
      again. <kbd>F6</kbd> lists the slots and picks up where you left off.</p>
      <h3>Lives and levels</h3>
      <p>When your hero dies, a life is used up and the level starts over. Your score, money,
      counters and inventory go with you from level to level; hit points are filled up again
      after each death. When the last life is gone the game is over.</p>
      <h3>High scores and demos</h3>
      <p>Each game keeps its own top ten. A game that makes the list is recorded as it was
      played, in <code>DATA1.REC</code> through <code>DATA10.REC</code>. If nobody touches the
      title menu for 30 seconds, the game plays its demo: a recording its designer made with the
      Integrator.</p>`,
    ),
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
      `<h2>Your first game</h2>
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
      <div class="note"><strong>Tip.</strong> The fastest way to learn is to change a sample game.
      Load Sample\u2019s map in the Map Maker, move a few blocks, and play it again.</div>`,
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
      <p>Every one of these Sandbox Software games was built with the tools in this box: no
      programming, just blocks, monsters, maps and the Integrator. The pictures are their
      own maps, drawn from their own files.</p>
      ${gallery(shots.slice(0, 4), 3)}`,
    ),
    page(
      '3. Designing Games',
      `${gallery(shots.slice(4, 8), 7)}
      <div class="note"><strong>See how they work.</strong> Sandbox Software\u2019s games are on the
      CD. Open any of them in Game-Maker\u2019s design tools and look at its blocks, monsters and
      maps, then make something of your own.</div>`,
    ),
    page(
      '4. Utilities',
      `<span class="chapter">4</span>
      <h1>Utilities</h1>
      ${figure(fig.utilityMenu, 'Figure 4-1. The Utilities menu.', [0, 2])}
      <h3>Backup</h3>
      <p>Copies every file of a game into a <code>.ZIP</code> archive, saved in the Downloads
      folder of the computer you are using today. (In 1994 Backup copied a game to diskettes
      in drive A:, and Restore copied it back.)</p>
      <h3>Restore</h3>
      <p>Puts a game that came with Game-Maker back the way it was on the CD. Your changes to
      it are lost. (On a 1994 PC you did this by copying the game\u2019s folder from the CD
      with <code>COPY</code>.)</p>
      <h3>Transfer</h3>
      <p>Packages a game for others to play. Put a blank diskette from the disk box in
      drive A:, choose Transfer and the game, and answer <code>A:\\</code>. When the transfer
      is done you may also <b>(D)ownload</b> it: the archive has the game\u2019s files and its own
      <code>.EXE</code>, ready for DOSBox or a real PC.</p>
      <h3>Joystick Setup and Diagnostic</h3>
      <p>On this computer joysticks and game pads are set up for you.</p>`,
    ),
    page(
      '4. Utilities',
      `<h2>When something goes wrong</h2>
      <p>Game-Maker reports problems in a red box. Press the highlighted letter to answer it.</p>
      ${figure(fig.errorBox, 'Figure 4-2. An error box.', [5, 12])}
      <table>
        <tr><th>Message</th><th>What to do</th></tr>
        <tr><td>Can\u2019t find <i>file</i>!</td><td>The file is not in the game area. Check the folder on the bottom line, or choose the file from the list instead of typing it.</td></tr>
        <tr><td>I can\u2019t access the disk!</td><td>There is no diskette in drive A:. Pick one from the disk box.</td></tr>
        <tr><td>The disk in drive A: isn\u2019t blank</td><td>Transfer needs a blank diskette.</td></tr>
        <tr><td>Not ready reading drive A</td><td>At the DOS prompt: put a diskette in drive A:, then answer <code>R</code> to Retry or <code>F</code> to Fail.</td></tr>
        <tr><td>Bad command or file name</td><td>DOS doesn\u2019t know that command. Check the spelling, or <code>CD</code> into the game\u2019s folder first.</td></tr>
      </table>
      <p>Shareware games are play-only. To change one, ask its author for permission and
      the files, as its <code>README</code> explains. Sandbox Software\u2019s own games are the
      exception: open them in Game-Maker and see how they work.</p>`,
    ),
    page(
      '4. Utilities',
      `<h2>Troubleshooting a real PC</h2>
      <p>The PC on this desk is set up for you, so none of these come up here. They are what
      owners of a real 1994 PC ran into most.</p>
      <table>
        <tr><th>Problem</th><th>What helped</th></tr>
        <tr><td>Out of memory</td><td>Game-Maker needs about 512K of the 640K below the first megabyte. Type <code>MEM</code>; take memory-resident programs out of <code>AUTOEXEC.BAT</code> and <code>CONFIG.SYS</code>, or start MS-DOS 6 \u201cclean\u201d (press <kbd>F5</kbd> or hold <kbd>Shift</kbd> at \u201cStarting MS-DOS\u2026\u201d).</td></tr>
        <tr><td>Won\u2019t start</td><td>MS-DOS 4.1 or later is needed; OS/2 and Windows NT won\u2019t do. From Windows 3.1, run it as a full-screen DOS program (not under Windows 3.0). Turn off QEMM\u2019s Stealth mode.</td></tr>
        <tr><td>The menus can\u2019t start a tool</td><td>Some PCs can\u2019t run one program from inside another. Type <code>GMBAT</code> for the plain batch-file menu.</td></tr>
        <tr><td>Strange colors or a broken picture</td><td>Choose standard VGA, or your Super VGA card\u2019s chip set, on the configuration screen. Deleting <code>C:\\GM\\CONFIG.DAT</code> starts the configuration over.</td></tr>
        <tr><td>No mouse pointer</td><td>Load the mouse driver (<code>MOUSE</code>) before starting Game-Maker.</td></tr>
        <tr><td>No sound</td><td>Check the Sound Blaster\u2019s address, IRQ and DMA settings. Other cards, such as the Pro Audio Spectrum 16, need their Sound Blaster mode turned on.</td></tr>
      </table>`,
    ),
    page(
      '5. The Game-Maker BBS',
      `<span class="chapter">5</span>
      <h1>The Game-Maker BBS</h1>
      <p>Game-Maker owners shared their games as shareware on bulletin board systems. Type
      <code>TERMINAL</code> and pick <i>The -= S A N D B O X =- BBS</i> from the dialing
      directory. <i>The Sofa</i>, a multi-line board for chatting, is there too.</p>
      ${figure(fig.bbs, 'Figure 5-1. Logging on to The Sandbox.', [1, 11])}
      <p>Press <kbd>F</kbd> for the sand pile of files, then <kbd>D</kbd> and a game\u2019s number to download it. It is
      unpacked into <code>C:\\DOWNLOAD</code>. <kbd>G</kbd> says goodbye and hangs up.</p>
      <h3>What is shareware?</h3>
      <p>Shareware is try-before-you-buy. You may play a shareware game and share copies of it.
      If you enjoy it, send the author the registration fee shown in its text files and in the
      paper catalog on the desk. Many authors sent registered users more levels. The few
      dollars a store or a mail-order library charged for a shareware disk paid for the disk
      and the copying, not the game: the registration fee was the author\u2019s.</p>`,
    ),
    page(
      '6. Sharing Your Games',
      `<span class="chapter">6</span>
      <h1>Sharing Your Games</h1>
      <h3>In 1994</h3>
      <p>Game-Maker\u2019s license let you install it on one computer at a time and keep a
      backup copy. Games you made could be <i>transferred</i> and given away free to no more
      than ten people, who could not pass them on; the gameware you drew could go to anyone.
      Giving a game to more people, or for money, took a license from Recreational Software
      Designs:</p>
      <ul>
        <li><b>Shareware.</b> Every owner had one, as long as the game asked its players a
        registration fee of at least $5.00 and the author paid RSD 10% of the fees, every
        quarter.</li>
        <li><b>Selling games.</b> A commercial license, with a royalty per copy.</li>
      </ul>
      <p>The license was printed on the sealed disk envelope, and opening it meant you agreed.</p>`,
    ),
    page(
      '6. Sharing Your Games',
      `<h3>Today</h3>
      <p>In 2014 Andy Stone released Game-Maker\u2019s source code under the <b>MIT
      License</b>, and this edition keeps it. Use, copy, change, share or sell Game-Maker and the
      games you make with it, with no limit on people and nothing to pay: just keep the
      copyright and license notice with the program. Sandbox Software\u2019s registration fees
      are part of their 1995 story; the games are free.</p>`,
    ),
    page(
      'Appendix A. Specifications',
      `<h1>Appendix A. Specifications</h1>
      <h3>Hardware</h3>
      <ul>
        <li>286 or better, IBM AT or PS/2 compatible (a 286 runs some games slowly); 512K memory available</li>
        <li>MS-DOS 4.1 or later; runs full screen from Windows 3.1</li>
        <li>Standard VGA (320 by 200, 256 colors); Super VGA cards with ATI, Trident 8800 and 8900, Paradise, Tseng ET3000 and ET4000 chip sets</li>
        <li>Two button Microsoft compatible mouse; 102 key keyboard (most others work)</li>
        <li>Hard disk; 3\u00bd\u2033 1.44 MB drive; double-spin CD-ROM drive for the bonus CD. Optional: joystick, Sound Blaster compatible sound card</li>
      </ul>
      <h3>Maps (scenes)</h3>
      <ul>
        <li>100 by 100 blocks (2000 by 2000 pixels), or a smaller area you choose. A VGA screen is 16 by 10 blocks.</li>
        <li>Scrolling in all directions; the right side joins the left and the top joins the bottom.</li>
        <li>255 colors plus \u201cclear\u201d. Doors take the character to other scenes.</li>
      </ul>`,
    ),
    page(
      'Appendix A. Specifications',
      `<h3>Picture blocks</h3>
      <ul>
        <li>Solid on each side separately, or passable. Gravity in any of eight directions.</li>
        <li>Objects can be picked up and put down. Touching a block can play a sound and change money, hit points, lives, ammunition and other counters.</li>
        <li>Blocks can change with time or when touched, and can give birth to monsters.</li>
      </ul>
      <h3>Characters</h3>
      <ul>
        <li>Twenty animation sequences of up to ten frames; one or two blocks in size.</li>
        <li>Inventory, and an initial inventory. An object or counter can enable a sequence.</li>
        <li>Counters: money, lives, hit points, score, five designer counters and fifteen sequence counters.</li>
        <li>Shoots designer drawn objects; dies when hit points reach zero.</li>
      </ul>
      <h3>Monsters</h3>
      <ul>
        <li>Up to 64 monsters in a set, 20 frames each; up to 200 monsters per scene.</li>
        <li>Move toward or away from the character, at random, along a path, or attack along a path when in range.</li>
        <li>Live until killed, until the end of a path, for a set time, or forever. Can give birth to another monster when they die.</li>
      </ul>
      <h3>Multimedia</h3>
      <ul>
        <li>Slide shows of FLI animations, GIF pictures and text, before or after any level.</li>
        <li>Sound Blaster music (<code>.CMF</code>) and digitized sound (<code>.VOC</code>); 30 sounds per scene.</li>
      </ul>`,
    ),
    page(
      'Appendix B. Files and Folders',
      `<h1>Appendix B. Files and Folders</h1>
      <p>Game-Maker lives in <code>C:\\GM</code>, with one folder (game area) for each game.
      Keep all of a game\u2019s files in its folder, with DOS names of up to eight letters.</p>
      <table>
        <tr><th>Ending</th><th>What it holds</th></tr>
        <tr><td><code>.GAM</code></td><td>The game itself, made by the Integrator</td></tr>
        <tr><td><code>.MAP</code></td><td>A map (scene)</td></tr>
        <tr><td><code>.BBL</code> <code>.MBL</code> <code>.CBL</code></td><td>Background, monster and character block sets</td></tr>
        <tr><td><code>.MON</code> <code>.CHR</code></td><td>Monsters; a character</td></tr>
        <tr><td><code>.PAL</code></td><td>A palette</td></tr>
        <tr><td><code>.SND</code></td><td>A sound set</td></tr>
        <tr><td><code>.CMF</code> <code>.VOC</code></td><td>Sound Blaster music; a digitized sound</td></tr>
        <tr><td><code>.GIF</code> <code>.FLI</code> <code>.BKD</code></td><td>A picture, an animation, an old-style backdrop</td></tr>
        <tr><td><code>.TXT</code> <code>.LST</code></td><td>Text screens; a list of displays to show in turn</td></tr>
        <tr><td><code>.REC</code></td><td>A recorded game: a demo or a high score</td></tr>
      </table>`,
    ),
    page(
      'Appendix C. The Copy Check',
      `<h1>Appendix C. The Copy Check</h1>
      <p>A copy of Game-Maker whose registration doesn\u2019t match asks a question each time
      it starts: a page of this guide, a paragraph and a word to type in. The page numbers are
      the ones printed at the foot of these pages.</p>
      <p>Count only the paragraphs of text on that page, from the top: not headings, tables,
      lists, boxed notes or picture captions. Then count words; \u201cGame-Maker\u201d is one
      word.</p>
      <p>A new copy comes unregistered, so GM asks every time until you register it. While it
      asks, this guide opens beside the monitor at the right page, and the registration card
      lies next to it: write your name, <b>Mail the card</b> for your registration number (the
      reply comes right back) and choose <b>Apply</b>. Or type <code>GM REGISTER</code> and
      enter the name and number as the program asks.</p>
      <div class="note"><strong>Why?</strong> Disks were easy to copy; a thick printed manual was
      not. Many programs of the day asked for a word from the manual. RSD\u2019s own questions
      came from its printed book; this edition asks from this guide.</div>`,
    ),
    page(
      'Appendix D. About This Edition',
      `<h1>Appendix D. About This Edition</h1>
      <p>Game-Maker was written by Recreational Software Designs of Amherst, New Hampshire, and
      sold from 1991, first on diskettes and in 1994, as version 3.0, on CD-ROM with a
      comb-bound manual. This guide describes a recreation that runs in a web browser, in its
      own Sandbox Edition box. It is not a PC emulator, and no DOS program runs: the DOS
      prompt, the BBS and the utilities are a simulation made to look and act as they did,
      Game-Maker\u2019s menus and designers are rebuilt from their original source code, and
      the games are played by a new engine, ported from PLAYGAME\u2019s source, that reads
      the original files. Only a few parts of the hardware are emulated, such as the VGA
      screen and the Sound Blaster\u2019s FM music chip.</p>
      <p>Games you make here are saved in the original formats, so they also play in DOSBox
      or on a real PC.</p>
      <p>The shareware on the BBS and in the disk box belongs to its authors and is shown in
      its shareware state only. Please honor the authors\u2019 registration terms.</p>
      <p>In 2014 Game-Maker\u2019s author, Andy Stone, released its source code under the
      <b>MIT License</b>. This edition is a modified fork of it by Lewis Moten, ported to the
      browser with Claude Opus 5.5, and it is MIT licensed too: the games you make are yours to
      share however you like (Chapter 6).</p>
      <div class="note"><strong>Make-believe:</strong> Sandbox Software, its address, the BBS
      phone numbers and the brands on this desk are made up.</div>`,
    ),
    {
      cover: true,
      body: div(
        `
        <div class="cover-banner"><em>It’s as much fun to create computer games as it is to play them.</em></div>
        <div class="cover-title">Notes</div>`,
        regRecord('cover'),
        h('div', { class: 'rr-notes', 'aria-hidden': 'true' }),
        h('div', { class: 'cover-foot' }, 'GAME-MAKER · Recreational Software Designs'),
      ),
    },
  ];
}

/** The gallery's screenshots: give them a moment to load, and go without them if they can't. */
const galleryShots = () => Promise.race([sandboxShots(), new Promise<GameShot[]>((r) => setTimeout(() => r([]), 4000))]);

/** The guide's pages as the box shows them: index n is the page with n printed at its foot (the copy check's page numbers). */
export async function dosManualPages(): Promise<BookPage[]> {
  return bookPages(pages(await galleryShots()));
}

/** The guide in the box viewer, with the box's other contents (loaded only now: the copy check needs just the pages). */
export async function openDosManual(): Promise<void> {
  const [shots, { openBox }, { gmBoxItems }] = await Promise.all([galleryShots(), import('./printables/viewer'), import('./printables/gmItems')]);
  const family = (await loadCatalog().catch(() => [] as CatalogEntry[])).filter(isSandboxGame);
  return openBox('Game-Maker SE 3.0', bookPages(pages(shots)), gmBoxItems(family), { binding: 'comb' });
}

/** The guide as a stapled booklet for the box viewer: note pages fill it out to whole folded sheets. */
function bookPages(guide: BookletPage[]): BookPage[] {
  const body = (p: BookletPage) => (Array.isArray(p.body) ? p.body : [p.body]);
  const inside = guide.slice(0, -1).map((p, i): BookPage => ({ kind: i === 0 || p.cover ? 'cover' : 'text', head: p.head, body: body(p) }));
  const back: BookPage = { kind: 'cover', body: body(guide[guide.length - 1]) };
  const pads = bookletPageCount(guide.length) - guide.length;
  for (let i = 0; i < pads; i++) inside.push({ kind: 'notes', head: [TITLE, 'Notes'], body: [h('h2', null, 'Notes'), h('div', { class: 'mp-ruled' })] });
  return [...inside, back];
}
