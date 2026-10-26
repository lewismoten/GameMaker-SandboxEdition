// The Ultimate Owner's Guide, chapters 9 and 10 and the appendix: title screens and demos,
// play-testing, and the numbers to remember. Checked against PLAYGAME (code/GM/PLAYGAME.C)
// and web/src/engine (game.ts, recorder.ts, showGraphic.ts; menus.ts drawDefaultScreen: no menu
// picture gives DrawDefaultScrn's random color rings). The instructions advice draws on watching
// players in two videos (NOTICE.md), in our own words.
import { opening, tip, type Chapter } from './chapter';

export const SHOW: Chapter = {
  id: 'show',
  title: 'Title Screens and Demos',
  head: '9. Demos and Titles',
  html: `${opening(9, 'Title Screens and Demos', 'The first thirty seconds sell a game. Make the menu readable, the story quick, and let the game play itself when nobody is touching the keys.')}
  <h2>The menu picture</h2>
  <p>PLAYGAME writes the game’s name and its six choices (Play, Read Instructions, Read
  Storyline, See Credits, See Highest Scores, Quit) over your menu picture, in the lower middle
  of the screen: roughly from x 70 to 260 and y 100 to 170 of the 320 by 200 picture. It uses
  the blue nearest to a strong blue in the picture’s own palette. Keep that area plain and
  light, and keep a real blue in the picture’s palette.</p>
  <p>Leave the menu picture out and PLAYGAME draws its own: rings of color on black, in a
  palette it makes up at random, different every time the game starts. It is a sure sign of an
  unfinished game. A level scene with no palette is no better: it keeps whatever palette the
  scene before it used, so its colors depend on the way the player came in. Fill in the
  pictures and palettes of every scene, scene 0 included.</p>
  <h2>Text screens and slide shows</h2>
  <ul>
    <li>A <code>.TXT</code> page shows 16 lines of up to 31 characters, written over whatever
    picture is on the screen in the color nearest a deep purple. Show a plain “paper” picture
    first and the text sits on it. Keep lines to 30: PLAYGAME reads 31 characters at a time, so
    a line of exactly 31 leaves its line break behind as an extra blank line.</li>
    <li>A <code>.LST</code> is a slide show: one file name per line, each with an optional
    pause in seconds. A line with no pause waits for a key, and <kbd>Esc</kbd> skips the rest.</li>
    <li>Left to themselves, a <code>.GIF</code> stays up 15 seconds, a backdrop 20, a text page 90,
    and an <code>.FLI</code> plays once and moves on.</li>
    <li>A studio sting goes first in the title slide show, the way the Sandbox games open on
    their sand castle. A game you start in this edition can open on a “Made with Game-Maker:
    Sandbox Edition” card and a “YOUR NAME PRESENTS” card, as an animation or a still picture; the
    start scene’s <b>🎬 Opening sting…</b> adds them to any game, changes them, or takes them out.
    Keep a sting short: the player sees it every time.</li>
  </ul>
  <h2>Instructions players read</h2>
  <p>Most players open the instructions once, skim them, and press <kbd>Esc</kbd> as soon as
  they think they can start. Write for that reader. Three pages (48 lines) hold everything a
  game needs; if you need more, it is usually the story leaking in.</p>
  <table>
    <tr><th>Part</th><th>What it says</th></tr>
    <tr><td>The goal</td><td>One line: what winning looks like. <i>Find the five fuses and get the lights back on.</i></td></tr>
    <tr><td>The keys</td><td>Every key the hero has, and only those, one per line: <i>Space: dig</i>. Read the list against the character’s sequences before you upload; a key the page names that nothing uses sends players hunting for a bug.</td></tr>
    <tr><td>The dangers</td><td>What hurts, and what to do about it: <i>Sparks hurt. Rubber boots let you cross them.</i></td></tr>
    <tr><td>The items</td><td>A short legend of what each pickup does. A thing the player can’t work out is a thing he walks past.</td></tr>
    <tr><td>The odd rules</td><td>Anything that works unlike other games. A strange rule the instructions explain is a feature; the same rule unexplained feels like the author being mean.</td></tr>
    <tr><td>The F-keys</td><td><kbd>F2</kbd> shows hit points, lives and score, and <kbd>F5</kbd> saves (<kbd>F6</kbd> loads). Say so, since nothing is on screen during play.</td></tr>
  </table>
  <p>Put the story on its own page, the menu’s Read Storyline, and keep it short too: a page or
  two that sets up the goal. A long story nobody needs to play is better as a scene’s intro
  picture, a little at a time. And because few players read any of it first, teach the keys in
  the game as well (Chapter 15).</p>
  <p>The Level check reads the pages for you: <b>Help that names the wrong keys</b> compares the
  keys they name with the character’s, <b>Long instructions or story</b> counts the pages, and
  <b>Text that’s hard to read</b> measures the purple letters against your picture.</p>
  <h2>Don’t keep players waiting</h2>
  <p>PLAYGAME plays an <code>.FLI</code> from its first frame to its last before it looks at the
  keyboard. Press <kbd>Esc</kbd> in the middle of a long intro and nothing happens: the key waits
  its turn, and only when the animation ends does it skip the rest of the slide show. Whoever is
  seeing your intro for the twentieth time is stuck watching it again.</p>
  <ul>
    <li><b>Cut long animations into clips.</b> Keep each <code>.FLI</code> to about four seconds
    and list the clips one after another in the slide show, each with a pause of 0. Each clip
    draws over the last frame of the one before, so they play as one animation, and
    <kbd>Esc</kbd> gets its chance at every join.</li>
    <li><b>Hide the joins.</b> Start each clip on the frame after the one the last clip ended on,
    never the same frame again, and cut where the colors hold still, not halfway through a fade.
    Only the last clip fades to black.</li>
    <li><b>The menu’s pages too.</b> The story, the instructions and the credits are shown when
    the player asks for them, and they should let go just as quickly.</li>
  </ul>
  <h2>Animations of your own</h2>
  <p>Open any <code>.FLI</code> and choose <b>Scene maker</b> (or make a new animation with
  <i>Make a scene…</i>). A scene is a background, a map view or a color, with tracks on a
  timeline: words in the PC’s own 8 by 8 letters that slide in, type out or roll up like
  credits; your characters and monsters moving with their own pictures along a path, turning
  round when they walk the other way; and blocks set on the picture. Drag anything on the
  picture to move it. <i>Generate…</i> starts you off with an intro (the title over the first
  level, the hero walking across), a cast (everyone in turn, close up, with a name card: a monster’s is the Name you
  give it in the monster editor, kept with your editor notes and never in the game’s files) or the
  story typed over your levels, all from the game’s own files and all yours to change.</p>
  <ul>
    <li><b>Every change is the real file.</b> The scene is written into the <code>.FLI</code>
    PLAYGAME plays, 320 by 200 in 256 colors; the scene itself stays with this edition, so the
    animation opens just as you left it.</li>
    <li><b>Mind the edges.</b> A word that runs off the screen is cut off in the game. The maker
    lists such text, says by how much, and outlines it in red when you choose it; <i>Fit it inside</i> wraps it, then shrinks
    it, then moves it in.</li>
    <li><b>Colors.</b> Each background brings its palette. Sprites keep their colors when the
    picture has room for them, and otherwise take the nearest. Fades hide a change of picture.</li>
  </ul>
  <h2>Demos</h2>
  <p>Leave the menu alone for 30 seconds and PLAYGAME plays the demo recording named in scene 0,
  then comes back to the menu. A recording keeps only the keys, each with the game tick it was
  pressed on, up to 1,000 presses.</p>
  <ul>
    <li><b>Making one.</b> In this edition, <i>Record one by playing…</i> starts your game in its
    first level and records you; watch it back and trim the end. And every game that makes the
    top ten is saved as a recording too (<code>DATA1.REC</code> and up): a great run is already
    a demo.</li>
    <li><b>Let the bot play.</b> <i>Let the bot play…</i> has the walkthrough bot play instead:
    choose a scene and how many seconds of it, watch the demo in the game, and keep it. Every
    demo starts in the first level, so a demo of a later scene shows the bot getting there
    first.</li>
    <li><b>Why demos drift.</b> Only keys are kept, not where the monsters went. A monster that
    wanders at random goes somewhere new each time, and the demo’s hero ends up bumping into
    things that weren’t there when you recorded. Keep wanderers out of the demo’s level, or end
    the demo early.</li>
    <li><b>A demo that teaches.</b> The demo is the one lesson every idle player sees. Let it
    show the first few moves of level 1, slowly and plainly: the first jump, the first pickup,
    the first door.</li>
    <li><b>Across levels.</b> On a 1995 PC the time spent on a “press a key” picture between
    levels was counted by how fast that PC could ask for keys, so a demo that crossed into the
    next level could slip on a faster or slower machine. Demos recorded in this edition count
    game ticks only. Still, a demo that stays in one level is the safe one.</li>
  </ul>
  ${tip('Pro tip:', 'Record the demo last. Every change to the first level after it, even one block, can send the demo’s hero into a wall.')}`,
};

export const TESTING: Chapter = {
  id: 'testing',
  title: 'Testing Like a Pro',
  head: '10. Testing',
  html: `${opening(10, 'Testing Like a Pro', 'You know where every secret is, so you are the worst person to test your own game. Do it anyway, on purpose, with a list.')}
  <h2>A play-test checklist</h2>
  <table class="ug-check">
    <tr><th aria-label="Done"></th><th>Try this</th><th>Because</th></tr>
    <tr><td>☐</td><td>Take every link, both ways if there is a way back</td><td>a landing spot inside a wall traps the hero</td></tr>
    <tr><td>☐</td><td>Die once in every scene</td><td>the scene restarts by the same link, map fresh, intro again</td></tr>
    <tr><td>☐</td><td>Leave a scene and come back</td><td>coins and doors come back too</td></tr>
    <tr><td>☐</td><td>Bump every gate with too little, then enough</td><td>a gate that opens early skips a puzzle</td></tr>
    <tr><td>☐</td><td>Walk back and forth over every reward</td><td>one that doesn’t change pays again and again</td></tr>
    <tr><td>☐</td><td>Play with the sound up and listen to the end of every voice line</td><td>a link or the next sound cuts clips</td></tr>
    <tr><td>☐</td><td>Play once with sound (<kbd>F4</kbd>) and music (<kbd>F3</kbd>) off</td><td>nothing should need ears</td></tr>
    <tr><td>☐</td><td>Look at the menu and <kbd>F2</kbd> in every palette</td><td>a missing blue hides the words</td></tr>
    <tr><td>☐</td><td>Save with <kbd>F5</kbd> and restore with <kbd>F6</kbd> in every scene</td><td>players will</td></tr>
    <tr><td>☐</td><td>Read the instructions with the character’s keys beside you</td><td>a key the help names that does nothing reads as a bug</td></tr>
    <tr><td>☐</td><td>Watch the demo twice</td><td>it should end the same way both times</td></tr>
    <tr><td>☐</td><td>Hand it to someone who has never seen it, and say nothing</td><td>where they get stuck is your next fix</td></tr>
  </table>
  <h2>Testing faster</h2>
  <ul>
    <li><b>Start where you are working.</b> While you work on level four, link the start of
    the game straight to it for a while. Put the link back when you are done.</li>
    <li><b>Give yourself plenty.</b> Raise the starting lives and hit points in a copy of the
    character while testing, and test once more with the real numbers at the end.</li>
    <li><b>Keep a save at each level.</b> Ten save slots are plenty for a whole game.</li>
    <li><b>Let the bot go first.</b> In this edition the map editor’s Level check (🩺) plays a
    scene on the real engine, trying every key from every spot the hero can stand on. It colors
    the map where the hero got to, marks the places with no way out, and lists what players
    would mind, each with the page of this guide that explains it (Chapter 14). It can’t tell
    you whether the game is fun; that is still the friends’ job.</li>
  </ul>
  <h2>Writing a hint book</h2>
  <p>A good hint book answers the questions players really ask, in the words they would use:
  “How do I get past the dog?”, not “The Canine Puzzle”. Give each question two or three
  answers, from a gentle nudge to the full solution, so a reader can stop as soon as the light
  comes on. The Sandbox games print their answers under a red pattern that only shows through
  red film, so no one reads the next answer by accident.</p>
  <p>Write it while you test: every place a tester got stuck is a question for the book.</p>
  <p>Put the gentlest hint in the game itself, too, where nobody needs the book: a sign beside
  the puzzle, or a line on the level’s intro picture. That picture shows again every time the
  hero dies and the scene starts over, so a player stuck on a level reads its hint on each
  try.</p>
  <p class="ug-wink">Looking for the really sneaky stuff? Some things aren’t in any official manual.</p>`,
};

export const NUMBERS: Chapter = {
  id: 'numbers',
  title: 'The Numbers to Remember',
  head: 'Appendix A',
  html: `${opening('Appendix A', 'The Numbers to Remember', 'The limits and timings this guide relies on, in one place.')}
  <table>
    <tr><th>Thing</th><th>Number</th></tr>
    <tr><td>A block</td><td>20 × 20 pixels, one byte a pixel</td></tr>
    <tr><td>Background / monster / character blocks in a set</td><td>150 / 100 / 50</td></tr>
    <tr><td>Clear pixel in monster and character blocks</td><td>255</td></tr>
    <tr><td>A map</td><td>100 × 100 blocks, wrapping at the edges</td></tr>
    <tr><td>The screen</td><td>16 × 10 blocks (320 × 200 pixels)</td></tr>
    <tr><td>Landing spot on the opening screen</td><td>8 blocks from the left, 5 from the top</td></tr>
    <tr><td>Monsters in a set / in a scene at once</td><td>64 / 200</td></tr>
    <tr><td>Pictures in a monster’s animation</td><td>20</td></tr>
    <tr><td>Corners in a monster path</td><td>10</td></tr>
    <tr><td>Birth blocks give birth within</td><td>the screen and half a screen round it</td></tr>
    <tr><td>The view starts to scroll</td><td>about 5 blocks from the middle across, 3 up or down</td></tr>
    <tr><td>Attack range</td><td>8 blocks across, 5 up or down</td></tr>
    <tr><td>Character sequences / frames each</td><td>20 / 10</td></tr>
    <tr><td>Inventory</td><td>10 objects</td></tr>
    <tr><td>Special counters / sequence counters</td><td>5 / 15</td></tr>
    <tr><td>Links in a scene</td><td>20</td></tr>
    <tr><td>Sounds in a set</td><td>30 (0–8 played by events)</td></tr>
    <tr><td>PC speaker tune</td><td>36 steps of 1/146 second</td></tr>
    <tr><td>A <code>.VOC</code> on a real PC</td><td>under 65,535 bytes; keep to 40,000</td></tr>
    <tr><td>One chunk of an <code>.FLI</code> on a real PC</td><td>under 16,000 bytes; 127 changes a line</td></tr>
    <tr><td>A game tick</td><td>1/18.2 second</td></tr>
    <tr><td>A quick tap of a key</td><td>about 0.3 second: an “Always finish” step whose first frame is shorter plays twice</td></tr>
    <tr><td>Music timing</td><td>146 ticks a second</td></tr>
    <tr><td>FM voices</td><td>9, or 6 and a drum kit in rhythm mode</td></tr>
    <tr><td>Demo recording</td><td>1,000 key presses</td></tr>
    <tr><td>Menu idle before the demo</td><td>30 seconds</td></tr>
    <tr><td>Text page</td><td>16 lines of 30 characters (a 31st adds a blank line)</td></tr>
    <tr><td>Saved games</td><td>10 slots</td></tr>
    <tr><td>A player’s word changed in a hex editor (Chapter 17)</td><td>the same number of bytes, and the 0 after it kept</td></tr>
  </table>`,
};
