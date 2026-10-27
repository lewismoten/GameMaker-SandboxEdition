// The Owner's Guide's back (dosManual.ts): 4. Utilities, 5. The Game-Maker BBS, 6. Sharing Your
// Games, the appendices and the back cover.
import type { BookletPage } from './booklet';
import { h } from '../editor/core/ui';
import * as fig from './figures';
import { regRecord } from './regRecord';
import { div, figure, page } from './dosManualKit';

export function backPages(): BookletPage[] {
  return [
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
      <div class="note"><strong>Historical terms.</strong> These do not apply to the Sandbox
      Edition. Today\u2019s license, the MIT License, is on the next page.</div>
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
