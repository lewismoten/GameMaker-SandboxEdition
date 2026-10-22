// The guide for today's web Game-Maker, shown at #/help.
import './webManual.css';
import { h, clear } from '../editor/core/ui';
import { decorateBbsName } from '../retro/bbs/bbsName';

const SECTIONS: [id: string, title: string, html: string][] = [
  [
    'start',
    'Getting started',
    `<p>Game-Maker: Sandbox Edition designs and plays games made with Recreational Software Designs’
    Game-Maker 3.0 (1991–1995). It reads and writes the original file formats, so a game
    made here also plays in DOS, and an old game folder opens here unchanged.</p>
    <p>Everything is kept in this browser. Nothing is uploaded. Use <b>Download .zip</b> to
    keep a copy of a game elsewhere.</p>
    <div class="tip">New to Game-Maker? Play a sample game, then choose <b>Edit a copy</b> and
    change something small, such as a block or a monster’s speed, and play it again.</div>`,
  ],
  [
    'home',
    'The home page',
    `<h3>Your games</h3>
    <p><b>+ Make a new game</b> asks for a title and how to start: <b>Ready to play</b> gives you a
    first level with scenery, monsters, a hero and sounds borrowed from the CD library, to change
    as you like; <b>Empty</b> gives you just a title and an ending. <b>Open game folder…</b>, <b>Open files or
    .zip…</b>, or dropping files on the page imports an original game: the folder with its
    <code>.GAM</code>, <code>.MAP</code>, <code>.BBL</code> and other files.</p>
    <p>Games you open from elsewhere are listed under <b>Imported</b>; the rest are under
    <b>My games</b>.</p>
    <h3>Gameware</h3>
    <p>The free “gameware” from the Game-Maker CD. <b>▶ Play</b> plays it;
    <b>Edit a copy</b> adds a copy to your games. <b>Demo video</b> shows a game’s demo with its
    music and sound, and can save it as a video.</p>
    <h3>Sandbox</h3>
    <p>New games made for this edition in the original formats, so they also play in DOS. Each
    has a <b>Manual</b> to read or print, and <b>Walkthrough</b> plays the whole game from start
    to finish, with chapters to jump to and an MP4 to download.</p>
    <h3>Shareware</h3>
    <p>Games other people made and shared as shareware. They are play-only here, in their
    shareware form. <b>Shareware notice</b> shows the author’s terms. If you enjoy one,
    register it with its author.</p>
    <h3>Bizarre</h3>
    <p>Games made from the songs of The Bard of Bizarre. They are listed with the shareware
    until there are four or more, then get a tab of their own.</p>`,
  ],
  [
    'workspace',
    'Working on a game',
    `<p>Opening a game lists every kind of file on the left, even the ones you have none of
    yet, and shows the selected file’s editor on the right. Changes are saved as you go.</p>
    <ul>
      <li><b>▶ Play test</b> plays the game from its first scene.</li>
      <li>The <b>+</b> beside a kind adds one: a new file, one from the <b>library</b> (the free
      sample games on the CD, shown as pictures), one from your computer, or one made by a tool
      (see below). <b>+ Add a file…</b> shows every kind as a grid of cards.</li>
      <li>✎ edits a file; the red 🗑 deletes it. The <code>.GAM</code> file can’t be deleted.</li>
      <li>Wherever a file is chosen (a scene’s map, a sound’s sample, a palette to view with),
      you see its picture; click it to choose another, or ✎ to edit it.</li>
      <li><b>+ Add level scene</b> starts a level with the last level’s palette, blocks,
      monsters and hero, on a fresh map of its own.</li>
      <li><b>↶ Undo</b> and <b>↷ Redo</b> (<kbd>Ctrl</kbd>+<kbd>Z</kbd> and
      <kbd>Ctrl</kbd>+<kbd>Y</kbd>) take back changes in the editor you are in.</li>
    </ul>`,
  ],
  [
    'editors',
    'The editors',
    `<table>
      <tr><th>File</th><th>Editor</th><th>What you do there</th></tr>
      <tr><td><code>.GAM</code></td><td>Integrator</td><td>List the scenes, choose each scene’s files (palette, map, blocks, monsters, character, sounds, music, pictures) and link the doors between scenes.</td></tr>
      <tr><td><code>.PAL</code></td><td>Palette</td><td>256 colors, each 0–63 red, green and blue as on a VGA card.</td></tr>
      <tr><td><code>.BBL .MBL .CBL</code></td><td>Blocks</td><td>Draw 20×20 pictures for backgrounds, monsters and the character, and set each background block’s behavior: solid sides, gravity, objects, counters, sounds and what it turns into. <kbd>Ctrl</kbd>+<kbd>Z</kbd> undoes.</td></tr>
      <tr><td><code>.MON</code></td><td>Monsters</td><td>Up to 64 monsters: animation frames, strength and how they move.</td></tr>
      <tr><td><code>.MAP</code></td><td>Map</td><td>Paint background blocks onto the 100×100 map and place monsters.</td></tr>
      <tr><td><code>.CHR</code></td><td>Character</td><td>The player’s animation sequences (idle, die, hurt, pick up, drop and up to 15 of your own), the keys that start them, and what they need.</td></tr>
      <tr><td><code>.SND</code></td><td>Sounds</td><td>30 effects, each a PC-speaker tune or a Sound Blaster <code>.VOC</code> sample.</td></tr>
      <tr><td><code>.GIF .FLI .CMF .VOC .TXT</code> and more</td><td>Media</td><td>View pictures and animations, hear music and samples, and edit text screens and slide shows.</td></tr>
    </table>`,
  ],
  [
    'tools',
    'Making pictures, sounds and music',
    `<table>
      <tr><th>To make</th><th>Use</th></tr>
      <tr><td>A picture (<code>.GIF</code>)</td><td><b>Convert a picture…</b> takes any image, fits it to 320×200 and reduces it to 256 colors (or to one of your palettes), with or without dithering.</td></tr>
      <tr><td>An animation (<code>.FLI</code>)</td><td><b>From an animated GIF or pictures…</b> turns an animated GIF, or several pictures in order, into an FLI at the speed you choose.</td></tr>
      <tr><td>Music (<code>.CMF</code>)</td><td><b>Compose a song…</b>: pick a mood, key, length and speed and press Compose for a new tune; edit the notes if you like.</td></tr>
      <tr><td>A Sound Blaster sound (<code>.VOC</code>)</td><td><b>Record with the microphone…</b> or <b>Make a sound effect…</b>, then add a robot, chipmunk, deep, radio or echo effect.</td></tr>
      <tr><td>PC speaker sounds (<code>.SND</code>)</td><td>In the sound set editor, press a recipe (heal, coin, laser, explosion…) for a new take on it, and change it with higher, lower, faster, echo, mutate and more. The recipe that suits each of the game’s own nine sounds is highlighted.</td></tr>
      <tr><td>A demo (<code>.REC</code>)</td><td><b>Record one by playing…</b> starts the game in its first level and records your keys; watch it back, and trim the end. Choose it as the start scene’s demo recording.</td></tr>
    </table>`,
  ],
  [
    'play',
    'Playing',
    `<p>Each game sets its own keys, usually the arrow keys and a few others. These keys
    work in every game:</p>
    <table>
      <tr><td><kbd>Esc</kbd></td><td>Leave a level or a screen</td></tr>
      <tr><td><kbd>F1</kbd></td><td>Help</td></tr>
      <tr><td><kbd>F2</kbd></td><td>Status and inventory</td></tr>
      <tr><td><kbd>F3</kbd> / <kbd>F4</kbd></td><td>Music / sound on or off</td></tr>
      <tr><td><kbd>F5</kbd> / <kbd>F6</kbd></td><td>Save / restore the game</td></tr>
    </table>
    <p>Game pads work as joysticks. On a touch screen, buttons appear for the directions
    and for every key the character uses.</p>`,
  ],
  [
    'export',
    'Sharing your game',
    `<h3>Export web app</h3>
    <p>Makes a <code>.zip</code> with your game and its own player. Unzip it onto any web
    host that serves static files, such as GitHub Pages or Netlify. Players can install it
    like an app, and it works offline after the first visit.</p>
    <h3>Export for DOS</h3>
    <p>Makes a <code>.zip</code> in the original formats, with the game’s own
    <code>.EXE</code> named after it. It runs in DOSBox or on a real PC.</p>
    <h3>Download .zip</h3>
    <p>Just the game’s files, to back them up or open them in another browser.</p>`,
  ],
  [
    'offline',
    'Offline and installing',
    `<p>After your first visit, Game-Maker: Sandbox Edition works without a connection. To install it
    as an app, use your browser’s <b>Install</b> or <b>Add to Home Screen</b> command.
    Your games stay in the browser you made them in.</p>`,
  ],
  [
    'desk',
    'The 1994 desk',
    `<p><b>💾 1994 desk</b> shows Game-Maker the way it was used in DOS: a PC with a DOS
    prompt, Game-Maker’s text menus, a box of diskettes, the CD, a shareware catalog and
    a BBS to call. It is a simulation, not a PC emulator: no DOS program runs. Game-Maker’s
    tools are rebuilt from their original source code, and the rest is made to look and act
    the way it did. The <b>Owner’s Guide</b> on the desk explains it.</p>
    <p>The games you change on the desk are the same games you see here, so you can switch
    between the two at any time.</p>`,
  ],
  [
    'credits',
    'Credits and license',
    `<p>RSD Game-Maker was made from 1991 to 1995 by Recreational Software Designs: G. Andrew
    Stone, G. Oliver Stone, Oliver Stone Jr. and Joan Stone. In 2014 Andy Stone released its
    source code under the <b>MIT License</b>, saying that “porting Game-Maker to modern OSes
    is the first step” to preserving the games people made with it.</p>
    <p>This version is a modified fork of that code by Lewis Moten, who bought Game-Maker in
    1992 with snow-shoveling money. Running in a browser is the simplest way to reach every
    modern computer, and everything here reads and writes the original file formats, so
    games made today still play in DOS and DOSBox. The web port, both the 1994 desk and
    today's web editor, was written with <b>Claude Opus 5.5</b>: AI assistance did most of the
    porting and code generation. It is MIT licensed too.</p>
    <h3>The 1994 license and today</h3>
    <p>When Game-Maker was sold, its license let you install it on one computer at a time and
    give a game you made, free, to no more than ten people. Wider sharing needed RSD's
    permission: for shareware, its manual granted every owner a license as long as the game
    asked a registration fee of at least $5 and the author paid RSD 10% of the fees each
    quarter, and selling games meant a commercial license with royalties per copy. The
    shareware disks sold in stores for a few dollars paid for the disk, not the game; the
    registration fee went to the author.</p>
    <p>None of that applies to this edition. Under the MIT License you may use, copy, change,
    share and sell Game-Maker and the games you make with it, with no limit on people, fees
    or royalties; just keep the copyright and license notice with the program. The
    registration fees, order forms and Sandbox Software's address in the Sandbox games are part
    of their 1990s story: the games are free. The CD's shareware games are still their
    authors' own, which is why they are play-only here.</p>
    <h3>Sandbox Software games</h3>
    <p>The Sandbox games were written and built by <b>Claude Opus 5.5</b>: the code that builds
    them, their pictures, music, sounds and words. Many are drawn from Lewis “Lewie” Moten
    III: his blog writing, photos he provided, and conversations about his interests,
    experiences and hobbies. Lewis directed each game and played it as it came together, and
    his feedback shaped every one. Teddy, Gwinn and Doc Leo appear as themselves.</p>
    <h3>The Bard of Bizarre</h3>
    <p>The Bard of Bizarre is the name Lewis “Lewie” Moten III gives his songs,
    performed as his hobo clown, Doc Leo. He started with Christian songs, but the Bard isn’t limited to them. Some of those songs have become games, shareware
    “uploaded” to The Sofa BBS: so far <b>Third Goat from the Left</b>. Once there are four or
    more, they get a Bizarre collection of their own on the home page.</p>
    <p>The words are Lewis’s. The song recordings and cover art were made with Riffusion (now
    Google Flow Music), the Bard’s logo with DeepAI, and the photo of Doc Leo is Lewis’s own.
    Each game’s music and sounds are drawn from its song’s recording; its code, pictures and
    levels were made by <b>Claude Opus 5.5</b>, with Lewis directing and playtesting.</p>
    <h3>The desk PC, its BBSes and utilities</h3>
    <p>The 1994 desk’s pretend PC, with its DOS prompt, TERMINAL, THE -= S A N D B O X =- BBS
    and The Sofa BBS, and the programs on it (SAVEHACK, BACKUP, GMCRACK and its KEYGEN,
    HEXEDIT, EGG, the GM30 release, PKUNZIP and VPIC look-alikes), was written for this project by
    <b>Claude Opus 5.5</b> under Lewis’s direction. Their in-story authors are part of the
    fiction: “vesuvian” is Lewis’s eight-letter BBS handle, from the Magic: The Gathering card
    Vesuvian Doppelganger, and “DiGiTAL DUNE” is a made-up group.</p>
    <p>The hacking, cracking and editing tools are mainly for debugging: switching a game
    between shareware and registered to test both, editing and backing up saved games, and
    looking inside Game-Maker’s files (HEXEDIT is a hex viewer that names each field of
    Game-Maker’s file formats). They are dressed in 1990s scene style for fun. With the rest
    of the desk they recreate a 1990s PC as nostalgia and history: dialing BBSes, trading
    shareware, and the warez and cracking scene that was part of that world. They act only on
    the pretend PC and this site’s own data. Nothing here cracks or generates keys for any real product:
    GMCRACK’s key is worked out the way Game-Maker’s own code, now MIT licensed, checks it, and
    the “warez” are this project’s own free files. They are here to show what that era felt
    like, for testing and for fun, not to encourage software piracy. Please support the
    authors of the software you use.</p>
    <p>GIF is a service mark of CompuServe; FLI is Autodesk Animator's format; Sound
    Blaster, CMF and VOC belong to Creative Technology; the OPL2 chip is Yamaha's. The CD's
    sample and shareware games belong to their authors. PKUNZIP was PKWARE's and VPIC Bob
    Montgomery's; the ones on the desk are look-alikes. Sandbox Software, its BBS and the
    desk's hardware brands are made up.</p>
    <p>The full credits, history and license are in
    <a href="https://github.com/lewismoten/GameMaker-SandboxEdition/blob/master/NOTICE.md" target="_blank" rel="noopener">NOTICE.md</a>
    and <a href="https://github.com/lewismoten/GameMaker-SandboxEdition/blob/master/LICENSE" target="_blank" rel="noopener">LICENSE</a>.</p>`,
  ],
];

/**
 * The guide, one section at a time so it fits the window: the contents beside it (a
 * "Contents" menu on a phone), the section at #/help/<id>, and Previous / Next under it.
 */
export function renderWebManual(el: HTMLElement, sectionId?: string): void {
  const at = Math.max(
    0,
    SECTIONS.findIndex(([id]) => id === sectionId),
  );
  const [id, title, html] = SECTIONS[at];
  const article = h('article', { 'aria-labelledby': `help-${id}` });
  article.innerHTML = `${at === 0 ? '<p class="guide-kicker">Game-Maker: Sandbox Edition guide</p>' : '<p class="guide-kicker">Guide</p>'}
    <h1 id="help-${id}">${title}</h1>
    ${at === 0 ? '<p class="lead">How to design, play and share games with today’s web version.</p>' : ''}
    ${html.replace(/<(\/?)h3\b/g, '<$1h2')}`;
  const link = (i: number, label: string, cls = '') =>
    h('a', { href: `#/help/${SECTIONS[i][0]}`, class: cls, 'aria-current': i === at ? 'page' : undefined }, label);
  article.append(
    h(
      'nav',
      { class: 'guide-pager', 'aria-label': 'Previous and next section' },
      at > 0 ? link(at - 1, `← ${SECTIONS[at - 1][1]}`, 'prev') : h('span'),
      at < SECTIONS.length - 1 ? link(at + 1, `${SECTIONS[at + 1][1]} →`, 'next') : h('span'),
    ),
  );
  const toc = h(
    'details',
    { class: 'guide-toc', open: matchMedia('(min-width: 761px)').matches },
    h('summary', null, h('span', null, 'Contents: '), title),
    h('nav', { 'aria-label': 'Guide contents' }, h('a', { href: '#/' }, '← Home'), ...SECTIONS.map(([, t], i) => link(i, t))),
  );
  decorateBbsName(article);
  clear(el, h('div', { class: 'guide' }, toc, article));
}
