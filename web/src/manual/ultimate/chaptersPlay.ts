// The Ultimate Owner's Guide, chapters 3 to 5: monsters and characters, counters and logic,
// scenes and links. Checked against PLAYGAME (code/GM/PLAYGAME.C) and web/src/engine
// (CharBirthMon turns a fired shot to its way, movechars gives an empty Idle block 0,
// StartSceneInits takes the starting values from the first scene's character only).
import { opening, tip, type Chapter } from './chapter';

export const ACTORS: Chapter = {
  id: 'actors',
  title: 'Monsters, Heroes and Actors',
  head: '3. Monsters and Characters',
  html: `${opening(3, 'Monsters, Heroes and Actors', 'A “monster” is anything that moves on its own: enemies, yes, but also coins that roll, sparks, birds, traffic, a friend who walks you home, or a bullet.')}
  <h2>Power decides who survives</h2>
  <p>Every monster has a power. When two monsters meet, the stronger one wins. Power 100 is
  the hero’s own. A monster below 100 that touches the hero gives him its block’s effects and
  is gone (or turns into its next monster). That is a <i>pickup that moves</i>: Mustard Seed
  Hustle’s raindrops are monsters that pay into a counter when caught.</p>
  <p>A monster of 100 or more stays, and keeps applying its block’s effects on every tick it
  overlaps the hero. For an enemy, a small hurt like 1 or 2 hit points is plenty; it adds up
  fast.</p>
  <p>Monster blocks have solid sides too. A solid monster pushes the hero instead of passing
  through him: a sliding wall, a shove, a crowd. Give it power 100 or more, or it vanishes at
  the first touch.</p>
  <h2>Ways to move</h2>
  <table>
    <tr><th>Movement</th><th>Good for</th></tr>
    <tr><td>A path of up to 10 corners, each leg with its own speed and turn of the picture</td><td>patrols, traffic, elevators, actors</td></tr>
    <tr><td>Toward the hero (or away, with a negative speed)</td><td>chasers, shy animals</td></tr>
    <tr><td>Wandering to random spots 5 to 11 blocks off</td><td>crowds, flies, snowflakes</td></tr>
    <tr><td>An attack path, started when the hero comes within 8 blocks across and 5 up or down</td><td>ambushes, and actors that react</td></tr>
  </table>
  <p>Monsters keep moving everywhere on the map, on screen or not, but only one on screen can
  touch the hero. A scene holds 200 monsters at once; when every place is taken, birth blocks
  and shots simply make nothing until one leaves.</p>
  <h2>Lifetimes and “becomes”</h2>
  <p>A monster can live forever and never be killed, live until killed, last until its
  path runs out, or live a set number of ticks. When it dies it can turn into another monster on the
  same spot. Chains of these make a monster with stages. In Third Goat from the Left, a lamb
  you bump gives you wool and turns into a shorn lamb that runs away; after 240 ticks (about
  13 seconds) the shorn lamb turns back into a woolly one, ready to be bumped again.</p>
  <h2>Scripted-looking scenes</h2>
  <p>Game-Maker has no cutscene tool, but monsters, paths and timers fake one well:</p>
  <ol>
    <li><b>Cast</b> each actor as a monster on a path. Leave its blocks harmless (no hit
    points) and give it power 100 so the hero can’t pop it by walking into it.</li>
    <li><b>Cue</b> the entrance with an attack path, which starts the moment the hero comes
    near, or with a birth block, whose first birth comes its set number of ticks after the
    scene begins (up to about 15 minutes).</li>
    <li><b>Exit</b> with a lifetime that ends when the path runs out, or hand over to the next actor with
    “becomes”.</li>
    <li><b>Hold</b> the audience: give the hero a reason to stand and watch, such as a ledge
    whose way on is a block that animates open when the show is over.</li>
  </ol>
  <h2>The hero’s own tricks</h2>
  <p>A character has 20 sequences of up to 10 frames: Idle, Die, Hurt, Pick up and Drop, and
  15 of your own, each on a key or a joystick move. A sequence can be marked so it can’t be
  interrupted (a jump that finishes), to run once per key press, or to build up momentum.</p>
  <ul>
    <li><b>Firing.</b> A frame can give birth to a monster at the hero: a shot, a thrown pie,
    a puff of dust. A shot that moves toward or away from the hero ignores him once fired and
    flies straight the way he last moved, jumps included, turned to match: mirrored when it flies
    left, turned on end when it flies up or down. So draw every shot facing right.</li>
    <li><b>Ammunition.</b> Sequences 5 to 19 each have a counter; every run uses one, and at
    zero the key does nothing. Blocks that add to that counter are refills.</li>
    <li><b>Tools.</b> A sequence can need a block in the inventory: no hammer, no hammering.</li>
    <li><b>Idle needs a picture.</b> Leave the Idle sequence empty and the standing hero shows
    the character set’s first block, whatever it is. Give Idle at least one frame.</li>
    <li><b>A voice of his own.</b> Each sequence plays one sound from the scene’s set when it
    starts, so a “talk” key can say a line.</li>
  </ul>
  <h2>Facing four ways, and mirroring</h2>
  <p>Chapter 11 says why a hero should face the way he walks. Here is how, in the Character
  Maker’s Sequences tab:</p>
  <ol>
    <li><b>Draw one side.</b> Make the walk right first, frame by frame. Click a frame to see
    the whole hero in it, both blocks together, three times size beside the stage. The stage
    plays the walk at the game’s speed while you work; pause it and it holds the frame you are
    editing.</li>
    <li><b>Mirror it.</b> Under the frames, choose <i>Make the mirrored sequence in</i>, pick
    the empty slot for the walk left, and press <b>Make it</b>. Every move goes left instead of
    right and both blocks of every frame are mirrored (orientation 4 on each). The sound, the
    flags and the joystick come along, turned round; a Right arrow key becomes Left when Left
    is free.</li>
    <li><b>Or mirror it on blocks of its own.</b> Choose <i>as new mirrored blocks</i> and the
    pictures are copied, mirrored, into empty blocks of the set instead. Use this when the
    other side should differ, such as a hand that carries something or a bag slung on one
    shoulder.</li>
    <li><b>Keep the two in step.</b> The two sequences stay linked. Change the walk right and
    the bar under its frames says the mirror is out of step; <b>Update the mirrored
    sequence</b> re-makes it, moves, pauses and pictures. Repaint a block in the block painter
    and its mirror block offers <b>Apply to the mirror too</b>.</li>
    <li><b>Draw the front and back yourself.</b> Mirroring only swaps left and right. The
    walk down and the walk up need pictures of their own.</li>
  </ol>
  <h2>Characters who talk</h2>
  <p>For a friend who has something to say:</p>
  <ul>
    <li><b>Signs.</b> Letter a few blocks: Snowbound’s street signs are blocks like any other.</li>
    <li><b>A visit.</b> Put a link in front of the friend that leads to a scene using the
    <i>same map</i>, arriving right beside him. That scene’s intro picture is the
    conversation: a <code>.TXT</code> page or a <code>.LST</code> slide show. The map loads
    fresh, so keep such visits to places with nothing to collect.</li>
  </ul>`,
};

export const LOGIC: Chapter = {
  id: 'logic',
  title: 'Counters, Gates and Puzzles',
  head: '4. Counters and Logic',
  html: `${opening(4, 'Counters, Gates and Puzzles', 'Game-Maker has no programming language, but it has counters and blocks that check them. Put the two together and you can build locks, shops, switches and whole puzzles.')}
  <h2>The counters</h2>
  <table>
    <tr><th>Counter</th><th>The player sees it?</th><th>Notes</th></tr>
    <tr><td>Hit points</td><td>yes (<kbd>F2</kbd>)</td><td>at zero the Die sequence plays and a life is lost</td></tr>
    <tr><td>Lives</td><td>yes</td><td>at none left the game is lost</td></tr>
    <tr><td>Score</td><td>yes</td><td>the high score table</td></tr>
    <tr><td>Money</td><td>yes, unless set to unlimited</td><td>can pay for things (below)</td></tr>
    <tr><td>Sequence counters 1–15</td><td>no</td><td>uses of sequences 5 to 19: ammunition</td></tr>
    <tr><td>Special counters 1–5</td><td>no</td><td>yours to use for anything</td></tr>
  </table>
  <p>Their starting values are set in the Character Maker. Score, counters, lives and the
  inventory travel with the hero from scene to scene. A counter set to <i>unlimited</i> never
  changes and never stands in anyone’s way.</p>
  <p>Only the first character sets them. The starting hit points, lives, money and special
  counters come from the character of the first scene the game plays, and a scene with another
  character file later changes his sequences and pictures, never those numbers. A sequence
  counter is the one exception: a later character’s counter counts for a sequence the first
  character never had. So heroes chosen at a select screen can differ in speed, jump, weapons
  and voice, but not in how much they can take.</p>
  <h2>Showing a count</h2>
  <p>Nothing is on the screen while the game plays. <kbd>F2</kbd> shows hit points, lives, score
  and money, and nothing shows the special or sequence counters at all. Players who can’t see
  what they have stop trying to collect it, so show the count in the world:</p>
  <ul>
    <li><b>Draw the price on the gate.</b> A door that wants three keys has three keyholes
    drawn on it.</li>
    <li><b>A gate that counts down.</b> Instead of one gate that takes 3, make a chain: a gate
    with three lamps that takes 1 and becomes the same gate with two lamps, and so on. Each bump
    with a token lights one more, and the player sees how many are still to find.</li>
    <li><b>Ammunition in the picture.</b> A refill drawn with its number on it (a box marked 5)
    tells the player how many he just got. If keeping count matters, make the gun unlimited and
    put the challenge somewhere else.</li>
    <li><b>Progress on the card.</b> The intro picture of each level can say which level it is
    of how many, and what is still to do.</li>
  </ul>
  <h2>Gates that need a counter</h2>
  <p>A background block that takes from <b>money</b> or a <b>special counter</b> is refused
  unless the counter holds at least that much. A refused touch does nothing at all: no points,
  no sound, no change. That one rule is the heart of Game-Maker logic.</p>
  <p>Make a <b>locked gate</b>: a block solid on all sides that takes, say, 3 from special
  counter 1 and becomes an open doorway. Bumping it with fewer than 3 does nothing; with 3 or
  more it opens and the 3 are spent. The Sandbox games are full of these:</p>
  <ul>
    <li>Third Goat from the Left: the place in the line at the manger opens for enough wool.</li>
    <li>Certified Rat Tickler: each gate wants more carpet than the last.</li>
    <li>Mustard Seed Hustle: the crack in the sidewalk waits for enough water.</li>
  </ul>
  <p>A <b>shop</b> is the same gate pointed at money: a shelf block that takes 10 money, gives
  hit points (or points) in the same touch, and becomes an empty shelf.</p>
  <p>Lives, hit points and the sequence counters are never checked this way; only money and
  the special counters can say no.</p>
  <h2>Try it: a three-token gate</h2>
  <p>Any game with a floor to walk on will do. Draw two spare background blocks, a token and
  a door, then:</p>
  <ol>
    <li><b>The counter.</b> In the Character Maker’s <i>At the start</i> tab, under
    <b>Special counters</b>, set #1 to <b>Counts</b>, starting at <b>0</b>.</li>
    <li><b>The token.</b> In the block editor, leave all its <b>Solid sides</b> clear. Under
    <i>When touched</i>, set <b>Changes counter</b> to <i>Special counter 1</i>, <b>by</b> 1,
    and <b>Becomes block</b> to your floor block’s number.</li>
    <li><b>The gate.</b> Tick all four <b>Solid sides</b>. Set <b>Changes counter</b> to
    <i>Special counter 1</i>, <b>by</b> −3, and <b>Becomes block</b> to the floor block.</li>
    <li><b>The map.</b> Lay three tokens along a corridor and the gate across its end, walled
    so the gate is the only way on. Then play it.</li>
  </ol>
  <p>The tokens vanish as the hero walks over them. After two, the gate ignores him: no
  sound, no change. After the third it opens at a bump, and the counter is back to 0.</p>
  <p>Now set special counter 1 to start at <b>1</b> and play again. Two tokens open the gate.
  It never counted tokens; it only asks whether the counter can pay 3 without going below
  zero.</p>
  <h2>Switches and wiring</h2>
  <ul>
    <li><b>A switch</b> is a block that becomes its “on” picture when bumped. Make switches go
    one way only: a switch that flipped back would flip every time the hero moved against it.</li>
    <li><b>Two keys for one door</b> (an AND): put two gates in a row, or make the first gate
    take counter 1 and become a second gate that takes counter 2.</li>
    <li><b>Hidden state.</b> The player never sees the special counters, so a counter can
    remember things: how many candles are lit, whether the dog was fed.</li>
    <li><b>Clocks.</b> An animation chain is a timer that every copy of a block shares
    (Chapter 2): a door that opens and shuts every few seconds, a level that changes at
    the one-minute mark.</li>
  </ul>
  <h2>A worked example: Ohm Sweet Ohm</h2>
  <p>The whole game is wiring made of blocks. Batteries are birth blocks that send sparks
  (monsters) along copper traces. A pulsed battery animates between a birth block and a
  resting block, so its current comes and goes, and a timer chip does the same with a longer
  “on” than “off”. A dead cell is a solid block that becomes a live battery when bumped.
  Diodes are blocks solid on three sides, so the hero gets through one way only. None of it
  needed a line of programming.</p>
  ${tip('Reset by leaving:', 'Every visit loads a scene’s map fresh, but the counters stay. A puzzle can reset itself when the hero walks out and back in, while the counters remember what he has already paid.')}`,
};

export const SCENES: Chapter = {
  id: 'scenes',
  title: 'Scenes, Links and the Camera',
  head: '5. Scenes and Links',
  html: `${opening(5, 'Scenes, Links and the Camera', 'A game is a set of scenes joined by links. Where you put the links, and what the player sees on arrival, decide how a game feels.')}
  <h2>The scene list</h2>
  <p>Scene 0 is the front door: title picture and song, the menu picture and song, the
  storyline, instructions, credits, the high score and load/save backgrounds and the demo
  recording. Scene 1 is the way out: the game won and game lost pictures and songs. Your levels
  are scene 2 and up.</p>
  <h2>How a link works</h2>
  <p>A link is a block-sized spot on a scene’s map. The moment any part of the hero overlaps
  it, the scene ends and he arrives at the link’s landing spot in the scene it leads to. A
  scene can have 20 links. A link to scene 1 wins the game.</p>
  <p>When the hero dies and has lives left, the scene starts over and he enters again by the
  same link he came in by, intro picture and all.</p>
  <h2>Links that misfire</h2>
  <p>PLAYGAME checks a scene’s links in order, link 1 first, and takes the first one on a cell
  the hero touches. The games in the Internet Archive’s Game-Maker Archive collection trip on
  that rule in the same few ways, and the Level check looks for each:</p>
  <ul>
    <li><b>Two links on one cell.</b> Only the lower-numbered one ever fires. A level select
    with two doors drawn on one spot loses a level.</li>
    <li><b>A landing spot on a link.</b> The hero arrives standing on it and leaves on the first
    tick. Its intro picture still shows, so a pass-through card is a fair trick; a level that
    does it is skipped.</li>
    <li><b>A link left at (0, 0).</b> An unplaced link sits in the map’s top-left corner. If that
    corner is open floor, it is a warp hole for anyone who wanders, or wraps, into it.</li>
    <li><b>Links and landings in walls.</b> A link inside a block solid on every side can never
    be touched. A hero who lands inside one can walk out through walls he shouldn’t, so land him
    beside the door, not on the rock under it.</li>
    <li><b>Off the map.</b> Cells run from 0 to 99. A link at 100 never fires.</li>
    <li><b>No way to win.</b> Follow the links from the title’s first link: one chain of them
    must reach scene 1.</li>
  </ul>
  <h2>What the camera sees first</h2>
  <p>The screen shows 16 by 10 blocks of a 100 by 100 map. A scene opens with the landing spot
  8 blocks from the left edge and 5 from the top; everything else is out of sight until the
  hero goes looking. That is the place for secret rooms, a surprise, or a second route.</p>
  <p>The map also wraps around: walking off one edge comes back in at the other, and a landing
  spot near an edge shows the far side of the map at the edge of the screen. Keep the edges of
  the map plain, or use the wrap on purpose for a world that loops.</p>
  <h2>Scrolling or one screen</h2>
  <p>The Integrator turns scrolling on or off for each direction. Turn it all off for
  single-screen rooms, puzzle boards and shops. Then the screen stays where the scene opened,
  set by the landing spot, so every link into that room must land in the same place. A room
  with doors on both sides is easier as a scene that scrolls sideways only.</p>
  <h2>Between scenes</h2>
  <p>Leaving by a link, the game fades out and shows the old scene’s exit picture, if it has
  one, then the new scene’s intro picture, and fades the new scene in. The music stops at the
  fade and the new scene’s song starts from the beginning.</p>
  <h2>Don’t cut off the punch line</h2>
  <p>A digitized clip still playing when the scene ends keeps going through the fade, but the
  next picture stops it, and so does the first sound of the next scene. A gate that plays a
  voice line right beside the exit gets its line cut every time.</p>
  <p>The fix is a <b>walk-off</b>: put the link a few blocks <i>past</i> the gate, so the clip
  finishes while the hero walks there. Shakespeare in Sweatpants plays each monologue’s punch
  line at its last gate, and every stage runs on for several more blocks before the exit,
  up to eighteen of them.</p>
  <figure data-fig="walkoff"></figure>
  <p>The same goes for a scene’s first line. A voice that starts as a level opens is cut by
  the first digital sound after it, often the hero’s own first jump. Keep the opening seconds
  quiet, or give those first actions speaker-only sounds (Chapter 6).</p>`,
};
