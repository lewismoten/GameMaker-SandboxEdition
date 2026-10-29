// The Guide's sections: an id, a title and HTML, as plain strings with no DOM, so the build can
// write each one into its own static page for search engines (scripts/seoBuild.ts, help-<id>.html)
// as the app shows it at #/help/<id> (webManual.ts).
import { MORE_GAMES_TITLE, moreGamesHtml } from '../credits/moreGamesList';

/** Every section of the Guide, in order. */
export const GUIDE_SECTIONS: [id: string, title: string, html: string][] = [
  [
    'start',
    'Getting started',
    `<p>Game-Maker: Sandbox Edition designs and plays games made with Recreational Software Designs’
    Game-Maker 3.0 (1991–1995). It reads and writes the original file formats, so a game
    made here also plays in DOS, and an old game folder opens here unchanged.</p>
    <p>Everything is kept in this browser. Nothing is uploaded, unless you set up your own AI to
    work on a game. To keep a copy elsewhere, choose <b>Download</b> and then <b>Game files</b> for
    one game, or <b>Back up / restore…</b> in the <b>⚙ Settings</b> menu for everything at once.</p>
    <div class="tip">New to Game-Maker? Play a sample game, then choose <b>Look inside</b>, then
    <b>Edit a copy</b> on the bar above the editor, and change something small, such as a block or a monster’s speed, and play it again.</div>
    <p>To be shown around, press <b>?</b> at the top of any page and choose <b>Show me around this
    page</b>: characters from the games point out each control and say what it does.</p>
    <h3>The two printed guides</h3>
    <p>The Game-Maker box holds two guides written for the DOS version. Their menus and keys
    are DOS Game-Maker’s, but what they teach holds here too, since this edition makes the
    same games.</p>
    <ul>
      <li><b>The Owner’s Guide</b> explains every part of a game (palettes, blocks, maps,
      monsters, the hero, sounds and music) and how they fit together.
      <br /><button type="button" class="guide-open-owners">📖 Open the Owner’s Guide</button></li>
      <li><b>The Ultimate Owner’s Guide</b> is about designing a game people enjoy: a hero who
      feels right, levels that teach, fair enemies, keys under the hands, music and sound, and
      play-testing. Its checklists are the ones the Level check uses.
      <br /><button type="button" class="guide-open-ultimate">📒 Open The Ultimate Owner’s Guide</button></li>
    </ul>`,
  ],
  [
    'site',
    'Finding your way',
    `<p>The bar at the top of the page leads everywhere:</p>
    <ul>
      <li><b>Games</b>: every game, to play, look inside or make your own (see the next part).</li>
      <li><b>Guide</b>: this guide.</li>
      <li><b>Library</b>: everything to read and print, by game or by type: manuals, hint books, maps,
      the papers in each game’s box, <a href="#/magazine">TURBO BUTTON</a>, the Owner’s Guides, your
      notes on imported games, each game’s walkthrough, and videos about the site. Its print shop
      makes disk labels, CD labels and retail boxes.</li>
      <li><b>Achievements</b>: what you’ve done, here and on the 1994 desk, kept in this browser.</li>
      <li><b>Cast</b>: the regulars of the new games on a stage, and the games each one is in.</li>
      <li><b>Desk | DOS | Web</b>: the 1994 desk, DOS Game-Maker on its own, or this web version
      (see <a href="#/help/desk">The 1994 desk</a>).</li>
      <li><b>?</b> (Guides): <b>Show me around this page</b>; <b>Guides wait on this page</b>, so two
      of the cast stand in its corner, ready to show you around; and <b>Watch the whole tour</b> of
      the site, or <b>Record the whole tour</b> as videos.</li>
      <li><b>⚙ Settings</b>: <b>Play offline</b>, <b>Source on GitHub</b>, <b>Credits</b>,
      <b>Theme</b> (dark, light or the system’s), <b>Guided tour</b>, <b>AI setup…</b> and
      <b>Back up / restore…</b> (see <a href="#/help/offline">Offline, installing and
      backups</a>).</li>
    </ul>
    <p>On a phone or tablet, the pages the bar has no room for and the settings are in its
    <b>⋯</b> menu.</p>`,
  ],
  [
    'home',
    'The home page',
    `<p>The <b>Games</b> page shows one game at the top with everything you can do with it:
    <b>Play</b>, <b>Look inside</b> (its files in the editor, as released), <b>Keys</b> (what each key
    does), and, where the game has them, <b>Manual</b> or <b>Maps</b>, <b>Walkthrough</b>,
    <b>Notice</b>, <b>Saves &amp; scores</b>, <b>Download</b> and <b>Demo video</b>. <b>Copy link</b>
    copies a link that opens the page on that game, and <b>Another</b> shows another.</p>
    <p>Below it are the collections, in tabs: <b>My games</b>, <b>Imported</b>, <b>Sandbox</b>,
    <b>Bizarre</b>, <b>Gameware</b> and <b>Shareware</b>. <b>Find a game…</b> searches them, and
    <b>How it works</b> sums it all up.</p>
    <h3>Making a new game</h3>
    <p><b>+ New game</b> asks for a title and how to start: <b>Ready to play</b> gives you a
    first level with scenery, monsters, a hero and sounds borrowed from the CD library, to change
    as you like; <b>Empty</b> gives you just a title and an ending; <b>Describe it to your AI…</b>
    has your own AI build a first level from what you describe (see
    <a href="#/help/workspace">Working on a game</a>).</p>
    <p>It also asks how the game opens, before your title screen. Four “Made with Game-Maker:
    Sandbox Edition” animations of about four and a half seconds each: <b>Falling letters</b> (the
    usual), <b>Block by block</b>, <b>Wipe</b> and <b>Typewriter</b>. <b>Classic RSD</b> plays the
    CD’s own RSD logo animation, the one its sample games show before their story screens;
    <b>Still picture</b> shows the falling letters’ card as one picture for four seconds; <b>None</b>
    leaves it out. Press ▶ beside one to watch it first. Type <b>your name or studio</b> and a
    “YOUR NAME PRESENTS” card follows it, drawn to fit the screen. They are your game’s own files
    (<code>MADEWITH.FLI</code> or <code>RSDTBOX.FLI</code>, <code>PRESENTS.FLI</code> and the title
    slide show <code>TITLE.LST</code>), so they play in DOS and in every copy you download. To swap
    or remove them later, or to add them to a game made before, open the start scene in the
    <code>.GAM</code> and choose <b>🎬 Opening sting…</b>.</p>
    <h3>My games and Imported</h3>
    <p>Games you make or copy are under <b>My games</b>; games you bring in are under
    <b>Imported</b>. <b>Open</b> opens one in the editor, and <b>⋯ More</b> renames, duplicates,
    moves it to the other list or deletes it.</p>
    <p>To bring a game in, drop it on the import tile (or anywhere on the page), click the tile to
    choose files, or choose <b>or open a game folder…</b>. It takes a game’s files with its
    <code>.GAM</code>, a <code>.zip</code> (even zips inside zips), a self-extracting
    <code>.EXE</code> archive (only read, never run), a folder of several games or zips, or a
    one-page <code>.html</code> export. When it finds more than one game, it lists them to tick.</p>
    <p>Give each imported game 1 to 5 stars and a note (<b>Your rating and note</b> beside it, or
    <b>Rating and note…</b> under ⋯ More), then show only some ratings or sort by rating. Your notes
    are in the Library too. <b>Remove all imported…</b> removes them all, only some ratings, or
    one import’s games.</p>
    <h3>Sandbox</h3>
    <p>New games made for this edition in the original formats, so they also play in DOS. Each
    has a <b>Manual</b> to read or print, and <b>Walkthrough</b> plays the whole game from start
    to finish, with chapters to jump to and an MP4 to download.</p>
    <h3>Bizarre</h3>
    <p>Games made from the songs of <a href="#/help/bard">The Bard of Bizarre</a>. They are this
    project’s own and free to change (MIT, except their voice clips, which are for personal,
    non-commercial use only): <b>Look inside</b> and <b>Edit a copy</b> work as they do for the
    Sandbox games, and <b>Notice</b> tells the song behind each one.</p>
    <h3>Gameware</h3>
    <p>The free “gameware” from the Game-Maker CD. <b>Look inside</b> opens its files as
    released, and <b>Edit a copy</b> there adds a copy to your games. <b>Demo video</b> shows a
    game’s demo with its music and sound, and can save it as a video.</p>
    <h3>Shareware</h3>
    <p>Games other people made and shared as shareware. They are play-only here, in their
    shareware form: you can look inside them but not copy them. <b>Notice</b> shows the author’s
    terms. If you enjoy one, register it with its author.</p>
    <h3>Saves &amp; scores</h3>
    <p>A game’s saved games, each with a map of where it was saved, and its high scores. You can
    change a saved game, start a new one in its slot, or save it as a <code>.SAV</code> file and
    bring one back.</p>`,
  ],
  [
    'workspace',
    'Working on a game',
    `<p>Opening a game lists every kind of file on the left, even the ones you have none of
    yet, and shows the selected file’s editor on the right. Changes are saved as you go
    (<kbd>Ctrl</kbd>+<kbd>S</kbd> saves at once). A game opened with <b>Look inside</b> is
    read-only: <b>✎ Edit a copy</b> above the editor makes a copy you can change.</p>
    <ul>
      <li><b>▶ Play Game</b> plays the game from its title screen. <b>▶ Play Level</b> plays
    from a level instead: its <b>▾</b> lists every way the game’s links bring the player into a
    level (“Level 2 at 40,12, from Level 1’s exit”), and the button plays the last one you
    picked, or the level whose map is open. It starts right in the level; the title and menu
    come after play ends.</li>
    <li>A map shows its links as markers: cyan ways in, where the hero arrives (a star for
    where the game starts), and gold exits, where touching a block leads on (a flag for Game
    won). Drag one or nudge it with the arrow keys to move it; click it to see the map or
    screen at its other end and change or delete it. <b>＋ Exit</b> adds one.</li>
      <li>The <b>+</b> beside a kind adds one: a new file, one from the <b>library</b> (the free
      sample games on the CD, shown as pictures), one from your computer, or one made by a tool
      (see <a href="#/help/tools">Making pictures, sounds and music</a>). <b>+ Add a file…</b>
      shows every kind as a grid of cards.</li>
      <li>✎ edits a file; the red 🗑 deletes it. The <code>.GAM</code> file can’t be deleted.</li>
      <li>Wherever a file is chosen (a scene’s map, a sound’s sample, a palette to view with),
      you see its picture; click it to choose another, or ✎ to edit it.</li>
      <li><b>+ Add level scene</b> starts a level with the last level’s palette, blocks,
      monsters and hero, on a fresh map of its own.</li>
      <li><b>↶ Undo</b> and <b>↷ Redo</b> (<kbd>Ctrl</kbd>+<kbd>Z</kbd> and
      <kbd>Ctrl</kbd>+<kbd>Y</kbd>) take back changes in the editor you are in. <kbd>?</kbd> lists
      the keys the open editor knows, and <kbd>Ctrl</kbd>+<kbd>P</kbd> finds a file or scene by
      name.</li>
      <li><b>Download</b> saves the whole game to play elsewhere (see
      <a href="#/help/export">Sharing your game</a>).</li>
      <li>A game started as <b>▶ Ready to play</b> has <b>🎓 First steps</b> beside Play Game: ten
      small jobs that make the starter your own (a color, a block, the level, the hero, a monster, a
      sound, a way to win…). Each ticks itself when you do it, and opens the file to do it in.</li>
    </ul>
    <h3>Checking a level</h3>
    <p>In a map, <b>🩺</b> opens the <b>Level check</b>: a bot plays the scene, tries every move from
    every place it can stand, and shows where it went and what players would mind (traps, dead
    ends, prizes in view but out of reach, and more), each with why it matters and the part of The
    Ultimate Owner’s Guide about it. Many have a one-click ✨ fix. <b>▶ Play and record</b> adds your own play to
    the picture. On the start scene of the <code>.GAM</code>, <b>☑ Before you upload…</b> is a
    checklist that ticks itself where the check can tell, and <b>🤖 Make a walkthrough…</b> has
    the bot play the whole game, to watch or save as an MP4.</p>
    <h3>The DOS player and cards</h3>
    <p>The <code>.GAM</code> also has <b>▤ DOS player</b>, to change the stand-alone DOS player’s
    own words, colors, frames and timings screen by screen (drag them on its preview to move them)
    and the extensions of its files, as 1990s authors did with a hex editor. <b>📝 Instruction
    card…</b> and <b>🪧 Level card…</b> write the game’s instructions, or a level’s name, goal and
    hint, from a few lines of yours and the game’s own keys.</p>
    <h3>Your own AI</h3>
    <p><b>✦</b>, beside the open file’s name, opens the <b>Assistant</b>: an AI you set up yourself
    (<b>⚙ Settings → AI setup…</b>, with Ollama on your computer or an OpenAI key) that can look
    at the game, change it, run the Level check and suggest what to do next. Every change can be
    undone, and you can have it ask first or only look. An AI app on your computer that speaks
    MCP can do the same: choose <b>Use an AI tool on this computer instead (MCP)…</b> in the
    Assistant.</p>`,
  ],
  [
    'editors',
    'The editors',
    `<table>
      <tr><th>File</th><th>Editor</th><th>What you do there</th></tr>
      <tr><td><code>.GAM</code></td><td>Integrator</td><td>List the scenes, choose each scene’s files (palette, map, blocks, monsters, character, sounds, music, pictures) and link the doors between scenes.</td></tr>
      <tr><td><code>.PAL</code></td><td>Palette</td><td>256 colors, each 0–63 red, green and blue as on a VGA card. Color 255 is see-through in monster and character blocks; color 0 is the background of the player’s own screens, which the note beside it shows.</td></tr>
      <tr><td><code>.BBL .MBL .CBL</code></td><td>Blocks</td><td>Draw 20×20 pictures for backgrounds, monsters and the character, and set each background block’s behavior: solid sides, gravity, objects, counters, sounds and what it turns into.</td></tr>
      <tr><td><code>.MON</code></td><td>Monsters</td><td>Up to 64 monsters: animation frames, strength and how they move, with their paths drawn on a map.</td></tr>
      <tr><td><code>.MAP</code></td><td>Map</td><td>Paint background blocks onto the 100×100 map (with terrain, building and stamp tools), place monsters, move the links, and run the Level check.</td></tr>
      <tr><td><code>.CHR</code></td><td>Character</td><td>The player’s animation sequences (idle, die, hurt, pick up, drop and up to 15 of your own), the keys that start them, and what they need.</td></tr>
      <tr><td><code>.SND</code></td><td>Sounds</td><td>30 effects, each a PC-speaker tune or a Sound Blaster <code>.VOC</code> sample.</td></tr>
      <tr><td><code>.GIF .FLI .CMF .VOC .TXT</code> and more</td><td>Media</td><td>View pictures and animations, hear music and samples, edit songs on a piano roll, and edit text screens, slide shows, backdrops, high-score tables and demos.</td></tr>
    </table>`,
  ],
  [
    'tools',
    'Making pictures, sounds and music',
    `<table>
      <tr><th>To make</th><th>Use</th></tr>
      <tr><td>A picture (<code>.GIF</code>)</td><td><b>Convert a picture…</b> takes any image, fits it to 320×200 and reduces it to 256 colors (or to one of your palettes), with or without dithering.</td></tr>
      <tr><td>An animation (<code>.FLI</code>)</td><td><b>From an animated GIF or pictures…</b> turns an animated GIF, or several pictures in order, into an FLI at the speed you choose. Or open an animation’s <b>🎬 Scene maker</b> and build one on a timeline from the game’s own backgrounds, words, characters, monsters and blocks.</td></tr>
      <tr><td>Music (<code>.CMF</code>)</td><td><b>+ New music</b> starts an empty song. <b>Compose a song…</b>: pick a mood, key, length and speed and press Compose for a new tune; edit the notes if you like. <b>Generate accompaniment</b> writes bass, chords and drums around one track’s tune, and <b>Copy melody to a new song</b> makes a faster or slower version of it. To use a track in another song, press ⧉ on the track, open the other song and press <b>Paste track</b> under its tracks, or choose <b>Add a track from another song…</b> there: the track brings its notes and instrument and goes on the next free track, and if the two songs count beats differently its timing is rescaled to land on the same beats.</td></tr>
      <tr><td>A Sound Blaster sound (<code>.VOC</code>)</td><td><b>Record with the microphone…</b>, then add a robot, chipmunk, deep, radio or echo effect. Or the <b>🎛 Sound effect maker…</b> (also in the sound set editor): start from a preset (jump, coin, hurt, explosion, power-up…), 🎲 Random or 🧬 Mutate, and shape it with sliders for pitch, slide, vibrato and decay. From the sound set it fills in the slot, and can draw the same effect for the PC speaker.</td></tr>
      <tr><td>PC speaker sounds (<code>.SND</code>)</td><td>In the sound set editor, press a recipe (heal, coin, laser, explosion…) for a new take on it, and change it with higher, lower, faster, echo, mutate and more. The recipe that suits each of the game’s own nine sounds is highlighted.</td></tr>
      <tr><td>A block’s picture</td><td>In the block editor, <b>Make a texture</b> draws a seamless 20×20 texture (grass, brick, water…) in the nearest colors your palette has.</td></tr>
      <tr><td>A demo (<code>.REC</code>)</td><td><b>Record one by playing…</b> starts the game in its first level and records your keys; watch it back, and trim the end. Choose it as the start scene’s demo recording.</td></tr>
    </table>`,
  ],
  [
    'play',
    'Playing',
    `<p>Each game sets its own keys, usually the arrow keys and a few others; <b>Keys</b> on its
    page shows them. These keys work in every game:</p>
    <table>
      <tr><td><kbd>Esc</kbd></td><td>Leave a level or a screen</td></tr>
      <tr><td><kbd>F1</kbd></td><td>The game’s instructions</td></tr>
      <tr><td><kbd>F2</kbd></td><td>Status and inventory</td></tr>
      <tr><td><kbd>F3</kbd> / <kbd>F4</kbd></td><td>Music / sound on or off</td></tr>
      <tr><td><kbd>F5</kbd> / <kbd>F6</kbd></td><td>Save / restore the game</td></tr>
    </table>
    <p>Game pads work as joysticks. On a touch screen, buttons appear for the directions
    and for every key the character uses. Saved games and high scores stay in this browser;
    <b>Saves &amp; scores</b> on the game’s page shows them.</p>`,
  ],
  [
    'export',
    'Sharing your game',
    `<p>Choose <b>Download</b> on a game (on the home page, or in the editor) and pick how
    it will be played. Each one carries the game with its own player, so whoever gets it
    needs nothing else.</p>
    <h3>The web</h3>
    <p><b>Web page</b> is the game and its player in one <code>.html</code> file that opens in
    any browser, offline; its <code>.zip</code> is a web app to unzip onto any web host that
    serves static files, such as GitHub Pages or Netlify, which players can install like an
    app. <b>Web player</b> is for your own site: one page that plays Game-Maker game folders.</p>
    <h3>DOS</h3>
    <p>The original files with the game’s own <code>.EXE</code> (the stand-alone player, named
    after the game), for DOSBox or a real DOS PC. <b>▤ DOS player</b> in the <code>.GAM</code>
    changes that player’s words, colors and frames, and its files’ extensions.</p>
    <h3>Game files</h3>
    <p>Just the game’s files, to back them up or open them in another browser.</p>
    <h3>Windows</h3>
    <p>A program to double-click (<code>.exe</code>, or a <code>.zip</code>), for Windows 10
    and 11. It isn’t code-signed, so the first time choose <b>More info → Run anyway</b>.
    <a href="#/windows">Playing on Windows</a> explains it.</p>
    <h3>Mac</h3>
    <p>An app for macOS 11 or later, on Apple silicon or Intel (<code>.dmg</code>, or a
    <code>.zip</code>). It isn’t notarized, so the first time open it from <b>System Settings →
    Privacy &amp; Security</b>. <a href="#/mac">Playing on a Mac</a> explains it.</p>
    <h3>Linux</h3>
    <p>A folder (<code>.tar.gz</code>) with <code>play.sh</code>, which plays the game in a
    window with WebKitGTK, or in your browser. <a href="#/linux">Playing on Linux</a> explains
    it.</p>
    <p>Every download but DOS plays on a web engine (a browser, or the one built into Windows,
    macOS or Linux); the DOS one is the most future-proof.</p>`,
  ],
  [
    'offline',
    'Offline, installing and backups',
    `<p>Each part of Game-Maker: Sandbox Edition works without a connection once you have
    opened it: a game you played, the desk, an editor. To take all of it with you, choose
    <b>⤓ Play offline</b> in the <b>⚙ Settings</b> menu at the top of the page (the <b>⋯</b> menu on a phone or tablet) and download everything at
    once: it says how big it is first, and can remove the copy again. On the 1994 desk, type
    <code>OFFLINE</code> at the DOS prompt. To install it as an app, use your browser’s
    <b>Install</b> or <b>Add to Home Screen</b> command.</p>
    <p>Your games stay in the browser you made them in. To move them to another browser or
    computer, or to keep them safe, choose <b>💾 Back up / restore…</b> in the same menu: it saves
    everything this browser keeps (your games, though not imported ones; saved games and high
    scores; achievements; the desk’s PC; notes and settings) to one <code>.gmbackup</code> file, and brings it back part by
    part, merged with what is here or in its place.</p>`,
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
    switch between them at any time.</p>
    <p>On the desk, beside the shareware catalog, lies this month’s <b>TURBO BUTTON</b>, a
    mid-1990s game magazine: the news that Game-Maker’s source code is free, interviews, hints
    for every game, the games listed, reviews, BBS listings and ads. Its order forms and listings
    open the games and pages they name. <a href="#/magazine">Read TURBO BUTTON here</a>, or print
    it.</p>`,
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
    <p>It opens in the box with everything else that came in it (the Library has it too), and
    prints as a booklet: choose <b>🖨 Print…</b>, then <b>Print booklet: this one</b>.</p>`,
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
    today’s web editor, was written with <b>Claude Opus 5.5</b>: AI assistance did most of the
    porting and code generation. It is MIT licensed too.</p>
    <p>Who made each part of the original, every game’s authors, the people, the AI tools and
    what each one made (the Sandbox games and The Bard of Bizarre’s game by game), and the
    software and fonts used are on the <a href="#/credits">Credits page</a>.</p>
    <h3>The 1994 license and today</h3>
    <p>When Game-Maker was sold, its license let you install it on one computer at a time and
    give a game you made, free, to no more than ten people. Wider sharing needed RSD’s
    permission: for shareware, its manual granted every owner a license as long as the game
    asked a registration fee of at least $5 and the author paid RSD 10% of the fees each
    quarter, and selling games meant a commercial license with royalties per copy. The
    shareware disks sold in stores for a few dollars paid for the disk, not the game; the
    registration fee went to the author.</p>
    <p>None of that applies to this edition. Under the MIT License you may use, copy, change,
    share and sell Game-Maker and the games you make with it, with no limit on people, fees
    or royalties; just keep the copyright and license notice with the program. The
    registration fees, order forms and Sandbox Software’s address in the Sandbox games are part
    of their 1990s story: the games are free. The Sandbox and Bard of Bizarre games were all
    made in 2026 for Game-Maker: Sandbox Edition; each is presented as a fictional release
    from the 1990s year it gives. The Bard games’ voice clips are the exception to the MIT
    License: they are for personal, non-commercial use only. The CD’s shareware games are still
    their authors’ own, and really are from the 1990s, which is why they are play-only here.</p>
    <h3>The desk’s hacking tools</h3>
    <p>The desk’s PC has 1990s-style tools for cracking, hacking and editing (GMCRACK and its
    KEYGEN, SAVEHACK, HEXEDIT and more). They are mainly for debugging: switching a game between
    shareware and registered to test both, editing and backing up saved games, and looking inside
    Game-Maker’s files. They act only on the pretend PC and this site’s own data. Nothing here
    cracks or generates keys for any real product: GMCRACK’s key is worked out the way
    Game-Maker’s own code, now MIT licensed, checks it, and the “warez” are this project’s own
    free files. They are here to show what that era felt like, not to encourage software piracy.
    Please support the authors of the software you use.</p>
    <p>GIF is a service mark of CompuServe; FLI is Autodesk Animator’s format; Sound
    Blaster, CMF and VOC belong to Creative Technology; the OPL2 chip is Yamaha’s. The CD’s
    sample and shareware games belong to their authors. PKUNZIP was PKWARE’s and VPIC Bob
    Montgomery’s; the ones on the desk are look-alikes. Sandbox Software, its BBS and the
    desk’s hardware brands are made up.</p>
    <p>The full notices and license are in
    <a href="https://github.com/lewismoten/GameMaker-SandboxEdition/blob/master/NOTICE.md" target="_blank" rel="noopener">NOTICE.md</a>
    and <a href="https://github.com/lewismoten/GameMaker-SandboxEdition/blob/master/LICENSE" target="_blank" rel="noopener">LICENSE</a>.</p>`,
  ],
  [
    'bard',
    'The Bard of Bizarre',
    `<p>The Bard of Bizarre is Lewis “Lewie” Moten III’s song project, and his hobo clown, Doc
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
      ruff and gray sweatpants about the most dramatic things that ever happened to him, like a
      lost pen, a dead ficus named Gerald and the self-checkout. The game puts him on stage at
      open-mic night.</li>
      <li><b>Veni, Vidi, Risi!</b>: six songs in Latin, as grand as Rome, about a dog who breaks
      wind at a senators’ dinner, a coward who wins every battle with his feet, a tongue
      twister, a cat after the cheese, a golden fish who sings in the baths, and a Latin song so
      clever that nobody laughs.</li>
    </ul>
    <p>Lewis dreams up each song and prompts AI tools to shape and record it. Some of the songs
    have become games, shareware “uploaded” to The Sofa BBS in the story, under <b>Bizarre</b> on
    the home page. Which tool or person made each part of each game is in the
    <a href="#/credits">Credits page</a>’s table.</p>`,
  ],
  ['more-games', MORE_GAMES_TITLE, moreGamesHtml()],
];
