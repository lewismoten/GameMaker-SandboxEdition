// The guide for today's web Game-Maker, shown at #/help.
import './webManual.css';
import { h, clear } from '../editor/ui';

const SECTIONS: [id: string, title: string, html: string][] = [
  [
    'start',
    'Getting started',
    `<p>Game-Maker Web designs and plays games made with Recreational Software Designs’
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
    <h3>Sample games</h3>
    <p>The free “gameware” from the Game-Maker CD. <b>▶ Play</b> plays it;
    <b>Edit a copy</b> adds a copy to your games.</p>
    <h3>Shareware</h3>
    <p>Games other people made and shared as shareware. They are play-only here, in their
    shareware form. <b>Shareware notice</b> shows the author’s terms. If you enjoy one,
    register it with its author.</p>`,
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
    `<p>After your first visit, Game-Maker Web works without a connection. To install it
    as an app, use your browser’s <b>Install</b> or <b>Add to Home Screen</b> command.
    Your games stay in the browser you made them in.</p>`,
  ],
  [
    'desk',
    'The 1994 desk',
    `<p><b>💾 1994 desk</b> shows Game-Maker the way it was used in DOS: a PC with a DOS
    prompt, Game-Maker’s text menus, a box of diskettes, the CD, a shareware catalog and
    a BBS to call. It is not an emulator; it is drawn to look the way it did. The
    <b>Owner’s Guide</b> on the desk explains it.</p>
    <p>The games you change on the desk are the same games you see here, so you can switch
    between the two at any time.</p>`,
  ],
  [
    'credits',
    'Credits and license',
    `<p>Game-Maker was made from 1991 to 1995 by Recreational Software Designs: G. Andrew
    Stone, G. Oliver Stone, Oliver Stone Jr. and Joan Stone. In 2014 Andy Stone released its
    source code under the <b>MIT License</b>, saying that “porting Game-Maker to modern OSes
    is the first step” to preserving the games people made with it.</p>
    <p>This version is a modified fork of that code by Lewis Moten, who bought Game-Maker in
    1992 with snow-shoveling money. Running in a browser is the simplest way to reach every
    modern computer, and everything here reads and writes the original file formats, so
    games made today still play in DOS and DOSBox. The web port, both the 1994 desk and
    today's web editor, was written with <b>Claude Opus 5.5</b>. It is MIT licensed too.</p>
    <p>GIF is a service mark of CompuServe; FLI is Autodesk Animator's format; Sound
    Blaster, CMF and VOC belong to Creative Technology; the OPL2 chip is Yamaha's. The CD's
    sample and shareware games belong to their authors. Sandbox Software, its BBS and the
    desk's hardware brands are made up.</p>
    <p>The full credits, history and license are in
    <a href="https://github.com/lewismoten/GameMaker-SandboxEdition/blob/master/NOTICE.md" target="_blank" rel="noopener">NOTICE.md</a>
    and <a href="https://github.com/lewismoten/GameMaker-SandboxEdition/blob/master/LICENSE" target="_blank" rel="noopener">LICENSE</a>.</p>`,
  ],
];

export function renderWebManual(el: HTMLElement): void {
  const article = h('article');
  article.innerHTML = `<h1>Game-Maker Web guide</h1>
    <p class="lead">How to design, play and share games with today’s web version.</p>
    ${SECTIONS.map(([id, title, html]) => `<h2 id="help-${id}">${title}</h2>${html}`).join('')}`;
  const nav = h(
    'nav',
    { 'aria-label': 'Guide contents' },
    h('a', { href: '#/' }, '← Home'),
    ...SECTIONS.map(([id, title]) =>
      h(
        'a',
        {
          href: `#/help`,
          onclick: (e: Event) => {
            e.preventDefault();
            article.querySelector(`#help-${id}`)?.scrollIntoView({ behavior: 'smooth' });
          },
        },
        title,
      ),
    ),
  );
  clear(el, h('div', { class: 'guide' }, nav, article));
}
