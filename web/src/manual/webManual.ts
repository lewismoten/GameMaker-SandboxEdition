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
    <p><b>+ New game</b> starts an empty game. <b>Open game folder…</b>, <b>Open files or
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
    `<p>Opening a game shows its files on the left, grouped by kind, and the selected file’s
    editor on the right. Changes are saved as you go.</p>
    <ul>
      <li><b>▶ Play test</b> plays the game from its first scene.</li>
      <li><b>+ New</b> makes a new file of any kind; <b>Add files…</b> brings in pictures,
      sounds or music.</li>
      <li>Each file can be renamed, duplicated, downloaded or deleted. The <code>.GAM</code>
      file can’t be deleted or renamed.</li>
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
