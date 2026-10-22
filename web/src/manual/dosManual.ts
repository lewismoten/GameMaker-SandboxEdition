// The Game-Maker 3.0 Owner's Guide for the desk PC, typeset like a 1994 manual. It
// describes this recreation (the desk, its DOS and Game-Maker's text menus) in the voice
// of the original documentation, with specifications from GM_SPECS.TXT.
import { type BookletPage } from './booklet';
import './booklet.css';
import { h } from '../editor/core/ui';
import { loadCatalog, type CatalogEntry } from '../project/files';
import { openBox } from './printables/viewer';
import { bookletPageCount } from './printables/imposition';
import type { BookPage } from './printables/manualPages';
import { gmBoxItems } from './printables/gmItems';
import * as fig from './figures';
import { sandboxShots, type GameShot } from '../desk/boxes/gmShots';
import { gmCover } from './printables/gmCover';

const TITLE = 'Game-Maker 3.0 Owner\u2019s Guide';

function div(html: string): HTMLElement {
  const el = document.createElement('div');
  el.innerHTML = html;
  return el;
}

function figure(draw: Parameters<typeof fig.shot>[0], caption: string, rows?: [number, number]): string {
  return `<figure><img alt="${caption}" src="${fig.shot(draw, rows)}"><figcaption>${caption}</figcaption></figure>`;
}

const page = (chapter: string, html: string): BookletPage => ({ head: [TITLE, chapter], body: div(html) });

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
        <tr><td>&nbsp;&nbsp;&nbsp;Your computer and its drives</td><td>3</td></tr>
        <tr><td>&nbsp;&nbsp;&nbsp;DOS commands you will need</td><td>4</td></tr>
        <tr><td>2. The Main Menu</td><td>5</td></tr>
        <tr><td>&nbsp;&nbsp;&nbsp;Playing games</td><td>6</td></tr>
        <tr><td>3. Designing Games</td><td>7</td></tr>
        <tr><td>&nbsp;&nbsp;&nbsp;Choosing files</td><td>8</td></tr>
        <tr><td>&nbsp;&nbsp;&nbsp;Your first game</td><td>9</td></tr>
        <tr><td>&nbsp;&nbsp;&nbsp;Games made with Game-Maker</td><td>10</td></tr>
        <tr><td>4. Utilities</td><td>12</td></tr>
        <tr><td>&nbsp;&nbsp;&nbsp;When something goes wrong</td><td>13</td></tr>
        <tr><td>5. The Game-Maker BBS</td><td>14</td></tr>
        <tr><td>Appendix A. Specifications</td><td>15</td></tr>
        <tr><td>Appendix B. About This Edition</td><td>17</td></tr>
      </table>
      <div class="note"><strong>Welcome!</strong> It\u2019s as much fun to create computer games as it is to play them.
      Game-Maker lets you turn your game ideas into great games with no programming at all.
      We suggest you start by playing a few of the sample games, then read Chapter 3 and try
      the tools in the order given there.</div>`,
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
      <p>The <b>TURBO</b> button switches between full speed and the speed of an older PC.
      Games made with Game-Maker run at the same pace either way; Turbo off lets you see how
      a game felt on a slower 286.</p>
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
        <tr><td><b>Utilities</b></td><td>Backup, Restore and Transfer (Chapter 4).</td></tr>
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
      <p>The arrow keys move your character. Other actions (jumping, shooting, and so on) use
      the keys the game\u2019s designer chose; press <kbd>F1</kbd> to see the game\u2019s own help.</p>
      <table>
        <tr><th>Key</th><th>During a game</th></tr>
        <tr><td><kbd>Esc</kbd></td><td>End the game, or close a help screen</td></tr>
        <tr><td><kbd>F1</kbd></td><td>Help</td></tr>
        <tr><td><kbd>F2</kbd></td><td>Status and inventory</td></tr>
        <tr><td><kbd>F3</kbd></td><td>Music on or off</td></tr>
        <tr><td><kbd>F4</kbd></td><td>Sound on or off</td></tr>
        <tr><td><kbd>F5</kbd></td><td>Save the game</td></tr>
        <tr><td><kbd>F6</kbd></td><td>Restore a saved game</td></tr>
        <tr><td><kbd>F8</kbd></td><td>Joystick on or off</td></tr>
        <tr><td><kbd>F9</kbd></td><td>Calibrate the joystick</td></tr>
        <tr><td><kbd>F10</kbd></td><td>About Game-Maker</td></tr>
      </table>
      <div class="note"><strong>Note.</strong> A joystick or game pad plugged into your computer works
      in every game. Press <kbd>F8</kbd> to switch to it.</div>`,
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
      folder of the computer you are using today.</p>
      <h3>Restore</h3>
      <p>Puts a game that came with Game-Maker back the way it was on the CD. Your changes to
      it are lost.</p>
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
      paper catalog on the desk. Many authors sent registered users more levels.</p>`,
    ),
    page(
      'Appendix A. Specifications',
      `<h1>Appendix A. Specifications</h1>
      <h3>Hardware</h3>
      <ul>
        <li>Standard VGA (256 color mode)</li>
        <li>Two button Microsoft compatible mouse</li>
        <li>286 or better, AT or PS/2 compatible; 512K memory available</li>
        <li>Hard disk; joystick and Sound Blaster compatible sound card optional</li>
      </ul>
      <h3>Maps (scenes)</h3>
      <ul>
        <li>100 by 100 blocks (2000 by 2000 pixels), or a smaller area you choose. A VGA screen is 16 by 10 blocks.</li>
        <li>Scrolling in all directions; the right side joins the left and the top joins the bottom.</li>
        <li>255 colors plus \u201cclear\u201d. Doors take the character to other scenes.</li>
      </ul>
      <h3>Picture blocks</h3>
      <ul>
        <li>Solid on each side separately, or passable. Gravity in any of eight directions.</li>
        <li>Objects can be picked up and put down. Touching a block can play a sound and change money, hit points, lives, ammunition and other counters.</li>
        <li>Blocks can change with time or when touched, and can give birth to monsters.</li>
      </ul>`,
    ),
    page(
      'Appendix A. Specifications',
      `<h3>Characters</h3>
      <ul>
        <li>Twenty animation sequences of up to ten frames; one or two blocks in size.</li>
        <li>Inventory, and an initial inventory. An object or counter can enable a sequence.</li>
        <li>Counters: money, lives, hit points, score, five designer counters and fifteen sequence counters.</li>
        <li>Shoots designer drawn objects; dies when hit points reach zero.</li>
      </ul>
      <h3>Monsters</h3>
      <ul>
        <li>Up to 60 monster types and 200 monsters per scene, 20 frames each.</li>
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
      'Appendix B. About This Edition',
      `<h1>Appendix B. About This Edition</h1>
      <p>Game-Maker was written by Recreational Software Designs and sold in a pink box from
      1991. This guide describes a recreation that runs in a web browser. Nothing here is an
      emulator: the DOS prompt, the menus and the BBS are drawn to look as they did, and the
      games are played by a new engine that reads the original files.</p>
      <p>Games you make here are saved in the original formats, so they also play in DOSBox
      or on a real PC.</p>
      <p>The shareware on the BBS and in the disk box belongs to its authors and is shown in
      its shareware state only. Please honor the authors\u2019 registration terms.</p>
      <p>In 2014 Game-Maker\u2019s author, Andy Stone, released its source code under the
      <b>MIT License</b>. This edition is a modified fork of it by Lewis Moten, ported to the
      browser with Claude Opus 5.5, and it is MIT licensed too: the games you make are yours to
      share however you like.</p>
      <div class="note"><strong>Make-believe:</strong> Sandbox Software, its address, the BBS
      phone numbers and the brands on this desk are made up.</div>`,
    ),
    {
      cover: true,
      body: div(`
        <div class="cover-banner"><em>It’s as much fun to create computer games as it is to play them.</em></div>
        <div class="cover-title">Notes</div>
        <div class="cover-sub">Game name: ____________________<br><br>Folder: C:\\GM\\____________<br><br>Registration code: ______________</div>
        <div class="cover-foot">GAME-MAKER · Recreational Software Designs</div>`),
    },
  ];
}

export async function openDosManual(): Promise<void> {
  // the gallery's screenshots: give them a moment to load, and go without them if they can't
  const shots = await Promise.race([sandboxShots(), new Promise<GameShot[]>((r) => setTimeout(() => r([]), 4000))]);
  const family = (await loadCatalog().catch(() => [] as CatalogEntry[])).filter((g) => g.original);
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
