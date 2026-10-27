// The Owner's Guide's front (dosManual.ts): the cover, the contents, 1. Getting Started and
// 2. The Main Menu.
import type { BookletPage } from './booklet';
import * as fig from './figures';
import type { GameShot } from '../gfx/sandboxShots';
import { regRecord } from './regRecord';
import { coverOf, figure, page } from './dosManualKit';

export function frontPages(shots: GameShot[]): BookletPage[] {
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
        <tr><td>&nbsp;&nbsp;&nbsp;How a game comes together</td><td>11</td></tr>
        <tr><td>&nbsp;&nbsp;&nbsp;The tools at a glance</td><td>13</td></tr>
        <tr><td>&nbsp;&nbsp;&nbsp;Games made with Game-Maker</td><td>16</td></tr>
        <tr><td>4. Utilities</td><td>18</td></tr>
        <tr><td>&nbsp;&nbsp;&nbsp;Troubleshooting a real PC</td><td>20</td></tr>
        <tr><td>5. The Game-Maker BBS</td><td>21</td></tr>
        <tr><td>6. Sharing Your Games</td><td>22</td></tr>
        <tr><td>Appendix A. Specifications</td><td>24</td></tr>
        <tr><td>Appendix B. Files and Folders</td><td>26</td></tr>
        <tr><td>Appendix C. The Copy Check</td><td>27</td></tr>
        <tr><td>Appendix D. About This Edition</td><td>28</td></tr>
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
  ];
}
