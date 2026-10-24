// The guide for today's web Game-Maker, shown at #/help.
import './webManual.css';
import { h, clear } from '../editor/core/ui';
import { decorateBbsName } from '../retro/bbs/bbsName';
import { MORE_GAMES_TITLE, moreGamesHtml } from '../credits/moreGames';
import { hashParam } from '../urlState';

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
    until there are four or more, then get a tab of their own. Unlike the shareware they are
    this project’s own and free to change (MIT, except their voice clips, which are for personal, non-commercial use
    only): <b>Edit a copy</b> works as it does for the
    Sandbox games, and <b>Notice</b> tells the song behind each one.</p>`,
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
      <li>A game started as <b>▶ Ready to play</b> has <b>🎓 First steps</b> beside Play test: ten
      small jobs that make the starter your own (a color, a block, the level, the hero, a monster, a
      sound, a way to win…). Each ticks itself when you do it, and opens the file to do it in.</li>
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
      <tr><td>A Sound Blaster sound (<code>.VOC</code>)</td><td><b>Record with the microphone…</b>, then add a robot, chipmunk, deep, radio or echo effect. Or the <b>🎛 Sound effect maker…</b> (also in the sound set editor): start from a preset (jump, coin, hurt, explosion, power-up…), 🎲 Random or 🧬 Mutate, and shape it with sliders for pitch, slide, vibrato and decay. From the sound set it fills in the slot, and can draw the same effect for the PC speaker.</td></tr>
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
    `<p>Each part of Game-Maker: Sandbox Edition works without a connection once you have
    opened it: a game you played, the desk, an editor. To take all of it with you, choose
    <b>⤓ Offline</b> at the top of the page (in the <b>⋯</b> menu on a phone or tablet) and download everything at
    once: it says how big it is first, and can remove the copy again. On the 1994 desk, type
    <code>OFFLINE</code> at the DOS prompt. To install it as an app, use your browser’s
    <b>Install</b> or <b>Add to Home Screen</b> command. Your games stay in the browser you
    made them in.</p>`,
  ],
  [
    'desk',
    'The 1994 desk',
    `<p><b>Desk</b>, in the header’s <b>Desk | DOS | Web</b> switch, shows Game-Maker the way
    it was used in DOS: a PC with a DOS prompt, Game-Maker’s text menus, a box of diskettes,
    the CD, a shareware catalog and a BBS to call. It is a simulation, not a PC emulator: no DOS program runs. Game-Maker’s
    tools are rebuilt from their original source code, and the rest is made to look and act
    the way it did. The <b>Owner’s Guide</b> on the desk explains it.</p>
    <p><b>DOS</b> is the same PC on its own, without the desk: it starts straight in
    Game-Maker, and <code>dos.html?game=</code> with a game’s id opens that game in it.
    <b>Web</b> brings you back here.</p>
    <p>The games you change on the desk or in DOS are the same games you see here, so you can
    switch between them at any time.</p>`,
  ],
  [
    'ultimate',
    'The Ultimate Owner’s Guide',
    `<p>The Game-Maker box on the desk holds a second, advanced manual for power users: palette
    swaps, blocks that act as switches and timers, gates that need a counter, monsters as actors,
    sound sets slot by slot, voice clips that aren’t cut off, FM music tricks, demos and
    play-testing, and tricks from the Sandbox games: wind, vehicles, two planes, warning frames
    and bosses in stages. Every tip is how PLAYGAME really plays a game, so it holds here and in
    DOS. Its last chapter is about this editor’s own helpers: the 🩺 Level check, its ✨ fixes,
    and the 🤖 walkthrough bot.</p>
    <p><button type="button" class="guide-open-ultimate">📒 Open The Ultimate Owner’s Guide</button></p>
    <p>It opens in the box with everything else that came in it, and prints as a booklet: choose
    <b>🖨 Print…</b>, then <b>This booklet, two pages a side</b>.</p>`,
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
    of their 1990s story: the games are free. The Sandbox and Bard of Bizarre games were all
    made in 2026 for Game-Maker: Sandbox Edition; each is presented as a fictional release
    from the 1990s year it gives. The CD's shareware games are still their authors' own, and
    really are from the 1990s, which is why they are play-only here.</p>
    <h3>Sandbox Software games</h3>
    <p>The Sandbox games were written and built by <b>Claude Opus 5.5</b>: the code that builds
    them, their pictures, music, sounds and words. Many are drawn from Lewis “Lewie” Moten
    III: his blog writing, photos he provided, and conversations about his interests,
    experiences and hobbies. Lewis directed each game and played it as it came together, and
    his feedback shaped every one. Teddy, Gwinn and Doc Leo appear as themselves.</p>
    <h3>The Bard of Bizarre</h3>
    <p>The Bard of Bizarre is Lewis “Lewie” Moten III’s song project, and his hobo clown, Doc
    Leo, PhD (Comedic Science), is its face. The Bard has one rule: the smaller and more
    overlooked the thing, the bigger the song it deserves. So the goat at the edge of the
    manger, the loaf left in the basket, the fly in the room and the remote lost in the couch
    each get the full treatment (a gospel choir, a goth anthem, an opera, a trembling
    monologue), sung with a straight face and a lot of love. The songs are silly but never
    mean, and fine for the whole family. It began with Christian songs and grew from there;
    so far the songs fall into five collections:</p>
    <ul>
      <li><b>Bizarre gospels</b>: the wrong detail of a Bible story, taken very seriously. The
      goat nobody painted in <b>Third Goat from the Left</b>, the smallest seed with the biggest
      dreams in <b>Mustard Seed Hustle</b>, the camel left holding the rich man’s gold in
      <b>Thread the Needle, Brother Camel</b>, and the bread nobody picked when the five
      thousand were fed in <b>Loaf #13 (Left in the Basket)</b>. They sort of make sense, and
      that’s the trouble.</li>
      <li><b>Mundane epics</b>: tiny everyday disasters sung like the end of the world. <b>A Fly
      Named Carl</b>, <b>Where’s the Remote?!</b>, a slice of cheesecake in <b>The Great Dairy
      Reckoning of 3:17 A.M.</b>, a borrowed pink loofah in <b>Cleanse Me, O Loofah, But Leave
      My Soul</b>, and a haunted house with an eight-year-old who isn’t scared in <b>I Screamed, She
      Smirked</b>.</li>
      <li><b>Villain anthems</b>: evil plans on a very small scale, with maniacal laughter. In
      <b>Certified Rat Tickler</b>, Doc Leo turns mad scientist with a real certificate in rat
      tickling (Lewis earned one) and plots to raise a legion of giggling rats.</li>
      <li><b>Shakespeare in Sweatpants</b>: seventeen spoken monologues by a man in a starched
      ruff and grey sweatpants about the most dramatic things that ever happened to him, like a
      lost pen, a dead ficus named Gerald and the self-checkout. The game puts him on stage at
      open-mic night.</li>
      <li><b>Veni, Vidi, Risi!</b>: six songs in Latin, as grand as Rome, about a dog who breaks
      wind at a senators’ dinner, a coward who wins every battle with his feet, a tongue
      twister, a cat after the cheese, a golden fish who sings in the baths, and a Latin song so
      clever that nobody laughs.</li>
    </ul>
    <p>Lewis dreams up each song and prompts AI tools to shape and record it. Some of the songs
    have become games, shareware “uploaded” to The Sofa BBS in the story.</p>
    <p>The Bard of Bizarre, his persona and the prompts behind each song are Lewis’s. Each
    song’s words were shaped by ChatGPT from Lewis’s prompts (Certified Rat Tickler’s after much
    back and forth), and each recording was made with Riffusion (now Google Flow Music).
    Certified Rat Tickler came with no recording, so its music was composed for the game by
    Claude Opus 5.5. The Great Dairy Reckoning of 3:17 A.M. is a spoken piece from Lewis’s own
    struggle (he is lactose intolerant, and he loves cheesecake): its voice was made with
    Riffusion, and its music was composed for the game by Claude Opus 5.5. Shakespeare in
    Sweatpants is seventeen spoken monologues, shaped with ChatGPT from Lewis’s prompts, with
    audio and vocals made with Riffusion (now Google Flow Music); its code, art and music were
    made by Claude Opus 5.5, and its coffee house, The Hive, is inspired by Lewis’s memories of
    the Beehive in Oakland, Pittsburgh (drawn from memory, not an official picture of it).
    Veni, Vidi, Risi! is Lewis’s group of comic songs in Latin: its lyrics were shaped with ChatGPT from Lewis’s prompts and its music and vocals made with Riffusion (now Google Flow Music); the
    game Veni, Vidi, Risi! takes its sung clips and FM score from those recordings, and its code, pictures (the title and cover art among them) and FM arrangements were made by Claude Opus 5.5. Third Goat from the
    Left’s cover art was made by Riffusion, and Thread the Needle, Brother Camel’s animated cover
    came with its Riffusion song; Mustard Seed Hustle’s animated cover was made with Producer.ai, Riffusion’s later name (Google bought it, and it is now Google Flow Music).
    The title and cover art of Loaf #13 (Left in the Basket), Where’s the Remote?!, A Fly
    Named Carl, Cleanse Me, O Loofah, But Leave My Soul and I Screamed, She Smirked, Certified Rat Tickler’s title, cover and certificate art, and The Great Dairy
    Reckoning’s title art were drawn for the games by Claude Opus 5.5. The Bard’s logo was made
    with DeepAI, and the photo of Doc Leo is Lewis’s own. Each game’s music and sounds are drawn
    from its song’s recording (Certified Rat Tickler’s and The Great Dairy Reckoning’s music was
    made for the game); its code, pictures and levels were made by <b>Claude Opus 5.5</b>, with
    Lewis directing and playtesting. The recordings were made on Riffusion’s free plan, whose terms
    allow only personal, non-commercial uses, so the voice clips cut from them are not MIT licensed
    and are never sold; the rest of each game is MIT.</p>
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
    <p>Everyone and everything that went into it, from the CD games’ authors to the tools, is on
    the <a href="#/credits">Credits page</a>.</p>
    <p>The full credits, history and license are in
    <a href="https://github.com/lewismoten/GameMaker-SandboxEdition/blob/master/NOTICE.md" target="_blank" rel="noopener">NOTICE.md</a>
    and <a href="https://github.com/lewismoten/GameMaker-SandboxEdition/blob/master/LICENSE" target="_blank" rel="noopener">LICENSE</a>.</p>`,
  ],
  ['more-games', MORE_GAMES_TITLE, moreGamesHtml()],
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
  article.querySelector('.guide-open-ultimate')?.addEventListener('click', () => void import('./ultimate/openUltimate').then((m) => m.openUltimateGuide()));
  // #/help/ultimate?chapter=levels opens the guide at that chapter (the level check links here)
  const chapter = hashParam('chapter');
  if (id === 'ultimate' && chapter)
    void import('./ultimate/openUltimate').then((m) => {
      // closing the guide comes back to its Open button, not to the top of the page
      article.querySelector<HTMLElement>('.guide-open-ultimate')?.focus({ preventScroll: true });
      return m.openUltimateGuide(chapter);
    });
  decorateBbsName(article);
  clear(el, h('div', { class: 'guide' }, toc, article));
}
