// The Ultimate Owner's Guide, chapters 9 and 10 and the appendix: title screens and demos,
// play-testing, and the numbers to remember. Checked against PLAYGAME (code/GM/PLAYGAME.C)
// and web/src/engine (game.ts, recorder.ts, showGraphic.ts).
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
  <h2>Text screens and slide shows</h2>
  <ul>
    <li>A <code>.TXT</code> page shows 16 lines of up to 31 characters, written over whatever
    picture is on the screen in the color nearest a deep purple. Show a plain “paper” picture
    first and the text sits on it.</li>
    <li>A <code>.LST</code> is a slide show: one file name per line, each with an optional
    pause in seconds. A line with no pause waits for a key, and <kbd>Esc</kbd> skips the rest.</li>
    <li>Left to themselves, a <code>.GIF</code> stays up 15 seconds, a backdrop 20, a text page 90,
    and an <code>.FLI</code> plays once and moves on.</li>
  </ul>
  <h2>Animations of your own</h2>
  <p>Open any <code>.FLI</code> and choose <b>Scene maker</b> (or make a new animation with
  <i>Make a scene…</i>). A scene is a background, a map view or a color, with tracks on a
  timeline: words in the PC’s own 8 by 8 letters that slide in, type out or roll up like
  credits; your characters and monsters moving with their own pictures along a path, turning
  round when they walk the other way; and blocks set on the picture. Drag anything on the
  picture to move it. <i>Generate…</i> starts you off with an intro (the title over the first
  level, the hero walking across), a cast (everyone in turn, close up, with a name card) or the
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
    <tr><td>Attack range</td><td>8 blocks across, 5 up or down</td></tr>
    <tr><td>Character sequences / frames each</td><td>20 / 10</td></tr>
    <tr><td>Inventory</td><td>10 objects</td></tr>
    <tr><td>Special counters / sequence counters</td><td>5 / 15</td></tr>
    <tr><td>Links in a scene</td><td>20</td></tr>
    <tr><td>Sounds in a set</td><td>30 (0–8 played by events)</td></tr>
    <tr><td>PC speaker tune</td><td>36 steps of 1/146 second</td></tr>
    <tr><td>A <code>.VOC</code> on a real PC</td><td>under 65,535 bytes; keep to 40,000</td></tr>
    <tr><td>A game tick</td><td>1/18.2 second</td></tr>
    <tr><td>Music timing</td><td>146 ticks a second</td></tr>
    <tr><td>FM voices</td><td>9, or 6 and a drum kit in rhythm mode</td></tr>
    <tr><td>Demo recording</td><td>1,000 key presses</td></tr>
    <tr><td>Menu idle before the demo</td><td>30 seconds</td></tr>
    <tr><td>Text page</td><td>16 lines of 31 characters</td></tr>
    <tr><td>Saved games</td><td>10 slots</td></tr>
  </table>`,
};
