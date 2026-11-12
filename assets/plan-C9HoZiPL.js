import{b as c}from"./imposition-Dxm9MY_v.js";const a=(t,s,n)=>`<header class="ug-open">
  <span class="ug-num${typeof t=="string"?" ug-appx":""}" aria-hidden="true">${t}</span>
  <h1><span class="ug-sr">${typeof t=="number"?`Chapter ${t}: `:`${t}: `}</span>${s}</h1>
  <p class="ug-lead">${n}</p></header>`,o=(t,s)=>`<div class="note"><strong>${t}</strong> ${s}</div>`,e=(...t)=>`<p class="see"><i>On the Sample CD:</i> ${t.map(s=>`<code>${s}</code>`).join(", ").replace(/, ([^,]*)$/,t.length>2?", and $1":" and $1")}.</p>`,p={id:"palettes",title:"Palettes: One Map, Many Moods",head:"1. Palettes",html:`${a(1,"Palettes: One Map, Many Moods","The cheapest special effect in Game-Maker costs 768 bytes. Swap a scene’s palette and every block in it changes its look, without redrawing a single pixel.")}
  <h2>How a block knows its colors</h2>
  <p>A block doesn’t store colors at all. Each of its 400 pixels holds a number from 0 to 255,
  and that number is looked up in the scene’s palette (<code>.PAL</code>) when the block is
  drawn. Each palette entry is a mix of red, green and blue, each from 0 to 63, the way the VGA
  card counts. Change entry 37 from leaf green to frosty blue and every pixel painted with 37,
  in every block, monster and hero, turns blue with it.</p>
  <p>Each scene in the Integrator chooses its own palette. Leave the slot empty and the scene
  keeps whatever palette the scene before it used.</p>
  <figure data-fig="moods"></figure>
  <h2>Restyle a scene with a second palette</h2>
  <p>Because the picture lives in the numbers and the mood lives in the palette, one block set
  can serve a whole game of different places and times:</p>
  <ul>
    <li><b>Snowbound</b> draws its streets once. Each street then gets a palette for its time
    of day: a pink winter morning, a bright noon, a dusk and a blue night.</li>
    <li><b>Third Goat from the Left</b> uses one block set for the whole of Bethlehem. The same
    stones are blue under the stars in the shepherds’ field, lamp-lit in town, silver at the
    caravan and gold in the stable.</li>
    <li><b>Loaf #13</b> goes from a bright noon on the hillside to the warm dark inside the
    baskets, a purple dusk and night on the way home.</li>
  </ul>
  <p>Try the same trick for seasons (green, gold and white), underwater (everything pushed
  toward blue-green, the brightest colors pulled down), or a haunted version of a level you
  already built (grays, a sickly green and one red you keep for eyes). A far plane is the same
  trick: draw the far scene’s things half the size, and give it a palette with every color mixed
  part of the way toward a pale sky, so a trail that loads it looks like a step into the distance.</p>
  <p>Some players see colors differently, and red and green can look alike to them. Do not let a
  color carry a meaning alone: give danger a pointed shape, give a safe path a light, striped
  pattern, and look at the level with the color taken out. Game-Maker cannot check this for you.</p>
  ${e("DAYNIGHT","SAMEHOUS","NEARFAR","VERYFAR","COLORS","COLRDOOR")}
  <h2>Plan in ramps</h2>
  <p>Palette swaps work best when the palette is planned, not grown. Lay it out in
  <i>ramps</i>: short runs of shades of one material, dark to light. Five shades of grass,
  five of stone, four of skin, and so on. Paint every block only from ramps, never from a
  stray color. Then a night palette is the same ramps, each shade darkened and nudged toward
  blue, and every block follows along.</p>
  <figure data-fig="compare"></figure>
  <p>Keep a few ramps out of the tint on purpose. The Sandbox games mark their lamp light, lit
  windows, stars and gold as <i>glowing</i> ramps that stay bright in every palette, so at
  night they shine instead of going dim. In Snowbound the window light even gets brighter
  after dark.</p>
  <figure data-fig="goat"></figure>
  <figure data-fig="loaf"></figure>
  <h2>Colors everyone can tell apart</h2>
  <p>Some players don’t see red and green as two colors, and some play on a gray screen. The
  palette editor’s <b>Color vision</b> tab shows a level in grayscale and as players with
  protanopia, deuteranopia or tritanopia see it. It lists the colors that touch on the map, or
  a monster and the scenery it stands in, that look alike there, and ramp steps too close to
  see. Click one to see where; ✨ makes the safe change, usually one color a little lighter or
  darker, and Undo puts it back. Two colors you chose to look alike, such as a texture’s two
  hues of one lightness, can be dismissed with <b>✓ They’re meant to look alike</b>; the
  <b>dismissed</b> toggle under the list shows them again.</p>
  <h2>Colors the program goes looking for</h2>
  <p>Game-Maker and PLAYGAME draw some things in whatever color of your palette is
  <i>nearest</i> to a color they have in mind. If your palette has nothing close, they settle
  for something murky. Keep these in every palette:</p>
  <table>
    <tr><th>Who looks</th><th>For</th><th>What it draws</th></tr>
    <tr><td>The game’s menu</td><td>a strong blue</td><td>the menu items and the game’s name, over your menu picture</td></tr>
    <tr><td>The <kbd>F2</kbd> and <kbd>F10</kbd> screens</td><td>blue and yellow</td><td>their frames and words: score, money, hit points, lives</td></tr>
    <tr><td>Text screens (<code>.TXT</code>)</td><td>a deep purple</td><td>every line of the text</td></tr>
    <tr><td>A menu choice you left empty, or <kbd>F1</kbd> with no instructions</td><td>a bright red</td><td>“No game-specific…” notes</td></tr>
    <tr><td>The design tools</td><td>grays, reds, black, a green</td><td>their own frames, buttons and lists</td></tr>
  </table>
  <h2>Color 0 is the background</h2>
  <p>Before some of its own screens, PLAYGAME wipes the whole screen to palette color 0 and
  writes on that: the “Congratulations” name prompt after a game ends, the high-score table when
  the game has no high-score picture, the <kbd>F1</kbd> line when there are no instructions, and
  the <kbd>F2</kbd>, <kbd>F5</kbd>, <kbd>F6</kbd>, <kbd>F9</kbd> and <kbd>F10</kbd> screens. They
  show in the level’s palette; the name prompt shows in the palette of the last level played.</p>
  <p>The words on them don’t come from colors you picked. The player carries a few fixed
  targets, in the VGA’s 0 to 63 levels, and uses whichever palette entry is nearest:</p>
  <table>
    <tr><th>Target</th><th>Red, green, blue</th><th>Writes</th></tr>
    <tr><td>Yellow</td><td>63, 63, 0</td><td><kbd>F10</kbd>’s words, load and save slot names</td></tr>
    <tr><td>Red</td><td>63, 10, 10</td><td>“No game-specific…” notes, the <kbd>F1</kbd> line, slot markers</td></tr>
    <tr><td>Blue</td><td>10, 10, 63</td><td>the menu, load and save headings, <kbd>F2</kbd>, the drop picker</td></tr>
    <tr><td>Purple</td><td>50, 10, 50</td><td>text pages</td></tr>
    <tr><td>High-score red</td><td>63, 10, 10</td><td>“Congratulations”, the name prompt, the table’s heading</td></tr>
    <tr><td>High-score blue</td><td>10, 10, 63</td><td>the place line, the typed name, the table’s rows</td></tr>
  </table>
  <p>“Nearest” is simple arithmetic. For each of the 256 entries, take its difference from the
  target in red, in green and in blue, square the three and add them up. The smallest total
  wins, and on a tie the lower entry number wins. (In RSD’s source this is
  <code>RGBdata::Match</code>.)</p>
  <p>Black is the safe color 0. Those reds and blues were chosen to stand out on black; a gray
  or bright color 0 turns every one of these screens that color, and the matched red and blue
  can land at nearly its lightness. To aim the words somewhere else, open the <code>.gam</code>,
  press <b>DOS player</b> in the integrator’s toolbar, and change a screen’s target or a
  target’s levels; Play and every download follow it. The palette editor’s note by color 0
  opens a preview of each of these screens in the palette you are editing, and the Level check
  lists every palette whose color 0 isn’t black.</p>
  ${o("Troubleshooting: my high score screen is hard to read.","Open the palette of the game’s last level and select color 0. If it isn’t black, that color is the screen’s background. Make it black. If blocks use color 0 as a color of their own, first copy it into a spare entry and repaint those pixels with it, so the level looks the same.")}
  <h2>Index 255 is see-through</h2>
  <p>In monster and character blocks, pixel value 255 isn’t a color: it is the clear part
  that lets the background show around a sprite. Don’t spend entry 255 on a color you need.
  Monsters also touch the hero only where their pixels aren’t clear, so a sprite with a lot
  of clear space around it is a fairer sprite.</p>
  <h2>Fades</h2>
  <p>Every scene fades in from black to its palette and fades back to black when it ends, and
  pictures between scenes fade in the same way. Inside a level the palette never changes, so
  a flash of lightning or the lights going out is done with blocks instead (Chapter 2). Between
  levels, an <code>.FLI</code> animation can change its colors from frame to frame: a frame
  that changes only the palette costs very little, which is how the Sandbox cartoons and logo stings
  fade in and out.</p>
  ${o("Pro tip:","Check a new palette on the menu and the <kbd>F2</kbd> screen, not just in the level. That is where a missing blue shows up first.")}`},u={id:"blocks",title:"Blocks That Behave",head:"2. Blocks",html:`${a(2,"Blocks That Behave","A background block is more than a picture. It has solid sides, a gravity, a reward or a price, a block it turns into when touched and a block it turns into over time. Most of a game’s cleverness lives here.")}
  <h2>The 150-block budget</h2>
  <p>A background set (<code>.BBL</code>) holds 150 blocks, a monster set (<code>.MBL</code>)
  100 and a character set (<code>.CBL</code>) 50. That sounds tight, but the budget is per
  <i>scene</i>, not per game: every scene can load a different set. Keep the blocks all your
  scenes share (floors, walls, coins, doors) at the same numbers in every set, and spend the
  rest of each set on that scene alone. Ohm Sweet Ohm does this: every room of the house has
  its own <code>.BBL</code>, drawn from one list of names, so the same number is always the
  same kind of block.</p>
  <table>
    <tr><th>Spend on</th><th>A typical share</th></tr>
    <tr><td>Ground, walls and their edges and corners</td><td>40–60</td></tr>
    <tr><td>Big pictures: houses, trees, signs (each is several blocks)</td><td>30–50</td></tr>
    <tr><td>Animation frames (water, lamps, flags)</td><td>15–25</td></tr>
    <tr><td>Rewards, doors, switches and their “after” blocks</td><td>15–25</td></tr>
    <tr><td>Secrets and spares</td><td>the rest</td></tr>
  </table>
  ${e("BLK150")}
  ${e("SHORE")}
  <h2>Trade art for blocks</h2>
  <p>When a scene runs out of blocks, don’t draw smaller; choose what the player won’t miss.
  A door handle, a sun visor or a crease in an armrest is a block or two that nobody sees at
  the size the game plays. A long skyline can repeat: a strip that repeats every 20 pixels
  costs one block a column, where a 40-pixel strip of fresh drawing costs about five. Sort
  your scenes by how they are drawn, too. Scenes drawn with the same palette roles can share one
  block set, and scenes with the same layout one map, so thirty files can become a dozen. Spend the blocks you
  saved on the thing that makes the level: the sign, the character, the animation.</p>
  <p>Monsters and the hero can show a block turned or mirrored (eight ways in all), set on
  each step of a monster’s path and on each frame of the hero’s sequences. Draw a walker
  facing one way and let the turns do the other side. Background blocks can’t be turned on
  the map, so a mirrored wall corner is a block of its own.</p>
  <h2>Solid sides, one side at a time</h2>
  <p>Each side of a block is solid or not, separately. Mixing them gives you:</p>
  <ul>
    <li><b>Platforms you jump up through.</b> Make only the top solid. The hero rises through
    from below and lands on top.</li>
    <li><b>One-way passages.</b> Make a block solid on every side but one, and the hero can
    only come in from the open side. Ohm Sweet Ohm’s diodes work this way.</li>
    <li><b>Hidden walls.</b> A solid block painted exactly like open air.</li>
    <li><b>False floors and secret doors.</b> A block that looks like floor or wall but has
    no solid sides. The hero drops through, or walks into the wall and keeps going.</li>
  </ul>
  <h2>Gravity is a block property</h2>
  <p>Gravity isn’t set for the whole game. Each block says which way it pulls (up, down, left,
  right or any mix), and the pull that counts is the block the hero is mostly standing in,
  more than half a block deep. While a block pulls, the hero speeds up in that direction each
  tick, up to a top speed.</p>
  <ul>
    <li><b>Ladders, water, outer space:</b> blocks with no gravity. The hero floats, and any
    drift slowly dies away.</li>
    <li><b>Conveyor belts and wind:</b> blocks that pull sideways. In The Year 2000! uses
    them to carry the hero along.</li>
    <li><b>Updrafts and geysers:</b> a column of blocks that pulls up.</li>
    <li><b>Walls and ceilings:</b> blocks that pull left, right or up hold the hero to a wall or a
    ceiling. Draw him turned to match and give his arrows new moves, and he walks up the wall.</li>
    <li><b>Only the hero feels it.</b> Monsters ignore gravity and go where their movement
    takes them, so a monster walking off a ledge walks on through the air. Keep walkers on paths
    that stay on the ground, and let things that should fall do it with a path that goes down.</li>
  </ul>
  ${e("GRAVITY","SWIM","DROPDOWN","AROUNDRM")}
  <h2>Animation runs by block number</h2>
  <p>A block can turn into another block after a number of ticks (a tick is 1/18 of a second),
  and that one into the next. A chain that comes back to its start loops: water, torches,
  blinking lights. But note how it is kept: the timer belongs to the block <i>number</i>, not
  to a spot on the map. Every copy of a block on the map is always in the same frame, and the
  clock starts when the scene starts.</p>
  <p>That makes animation the tool for <b>level-wide timed events</b>. A chain that ends on a
  block that stays itself turns every copy at once: a bridge that falls away 30 seconds into
  the level, a gate that opens after a minute, every lamp in town going out together. It is
  the wrong tool for one crumbling floor tile, because every copy of that tile would crumble
  at the same moment.</p>
  <h2>Touch, and what a block becomes</h2>
  <p>“Becomes when touched” changes only the spot that was touched. A block is touched when the
  hero moves into it or changes frame on it, and the test is made where he is trying to go,
  <i>before</i> walls stop him. So bumping a solid block counts as touching it: that is how
  doors, switches and breakable walls work.</p>
  <p>Two rules save a lot of grief:</p>
  <ul>
    <li><b>Rewards must become something else.</b> A coin that stays a coin pays again every
    time it is touched, many times a second.</li>
    <li><b>Give every frame the same “becomes”.</b> An animated block is touched as whichever
    frame is showing, so each frame needs the same touch settings.</li>
  </ul>
  <figure data-fig="chain"></figure>
  ${e("SMASHIT","DIGIT")}
  <h2>Big pictures: groups, and watching them move</h2>
  <p>A sign, a mirror or a poster is several blocks that only make sense together, and so is a
  monster two blocks wide. In the block editor, Shift-click or Ctrl-click the blocks and choose
  <b>Group picked blocks</b>, or use <b>Group with neighbors</b> for a run of blocks in a row,
  and give the group a name and its blocks across and down. <b>Suggest groups</b> looks for them for you:
  background blocks that always sit together on the maps, monsters placed side by side that move
  in step, and the hero’s top and bottom blocks. Nothing is added until you tick it.</p>
  <p>While you paint a block of a group, the whole group is shown around it; click a neighbor
  to paint that one. <b>Edit as one picture</b> joins the group into one canvas, where a line or
  a fill runs straight across the block edges, and Apply puts each part back in its block (with
  an Undo for the whole group). Groups are notes for you: they live beside the game, never in it,
  and DOS never sees them.</p>
  <p>Under <b>Preview &amp; uses</b>, the animation the block is in plays at the game’s own 18
  ticks a second: its chain, the monster that shows it, or the hero’s sequence; the group’s
  animation plays in the Groups panel. Each stroke shows up in it at once, so you can fix a frame and watch
  the whole cycle. Pause it, or step one frame at a time; it starts paused if your computer is
  set to reduce motion.</p>
  <h2>Blocks that give birth</h2>
  <p>A background block can give birth to a monster every so many ticks: a cannon, a nest, a
  leaky pipe. Like animation, the timer belongs to the block number, and only blocks within
  about half a screen of the view give birth, so a spawner far away stays quiet until the hero
  comes near. In Ohm Sweet Ohm each battery is a birth block that sends sparks along its wire;
  a <i>pulsing</i> battery is a birth block that animates into a resting block and back, so
  the current comes and goes.</p>
  ${o("Pro tip:","Leaving a scene and coming back loads its map fresh from the disk: every coin is back, every door shut again. Score, counters and inventory come along with the hero. Plan for it, or a player will farm your coins.")}
  ${e("SEEDNEST")}`},m={id:"actors",title:"Monsters, Heroes and Actors",head:"3. Monsters and Characters",html:`${a(3,"Monsters, Heroes and Actors","A “monster” is anything that moves on its own: enemies, yes, but also coins that roll, sparks, birds, traffic, a friend who walks you home, or a bullet.")}
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
  ${e("WHOWINS","POWERUP")}
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
  ${e("MONSTERS","FOLLOWME","SEEN","FLOCK")}
  <h2>Lifetimes and “becomes”</h2>
  <p>A monster can live forever and never be killed, live until killed, last until its
  path runs out, or live a set number of ticks. When it dies it can turn into another monster on the
  same spot. Chains of these make a monster with stages. In Third Goat from the Left, a lamb
  you bump gives you wool and turns into a shorn lamb that runs away; after 240 ticks (about
  13 seconds) the shorn lamb turns back into a woolly one, ready to be bumped again.</p>
  ${e("HERETODY")}
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
  ${e("SHOW")}
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
  ${e("KITMOVES","HOMEKEYS","KITDUCK","THROWIT","MANYWEAP","PICKITUP")}
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
    fresh, so keep such visits to places with nothing to collect. Chapter 5’s pass-through
    scene makes the visit seamless.</li>
  </ul>
  ${e("SAYSOMTH","EVRYTALK")}`},w={id:"logic",title:"Counters, Gates and Puzzles",head:"4. Counters and Logic",html:`${a(4,"Counters, Gates and Puzzles","Game-Maker has no programming language, but it has counters and blocks that check them. Put the two together and you can build locks, shops, switches and whole puzzles.")}
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
  ${e("COINS","KEYSDOOR")}
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
  ${e("THREETOK")}
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
  <h2>Showing a count</h2>
  <p>The engine cannot print a counter as a number, so show it with pictures. Make each pickup
  <b>Become</b> a lit version of itself instead of the sky, and a row of them is a meter: lit
  bulbs are the count. Each value needs its own picture, and the bulbs do not read the counter, so
  keep the gate's price equal to the number of bulbs in the map.</p>
  ${e("SHOWCNT")}
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
  ${e("SWITCHES","WIREDRM")}
  <h2>The gate is the exit</h2>
  <p>A “collect them all” level needs no key. Put the level’s only link on the cell of a gate
  that takes exactly as many as the map holds: 70 dots, 10 rings, 25 coins. Each pickup adds 1;
  the gate refuses every bump until the last one is in, then opens, and the next step into the
  doorway is the link. The archive’s games use this for dot mazes, ring hunts and toll doors.</p>
  <ul>
    <li><b>Count exactly.</b> A gate that takes 19 on a map of 18 can never open (the Level
    check’s <i>Counters that run out</i> says so). Recount after every edit to the map.</li>
    <li><b>Mind the start.</b> A special counter that starts at 1 opens a gate of 10 with 9.
    Start it at 0.</li>
    <li><b>Mind the carry.</b> Counters travel between scenes but the map comes back fresh, so
    a player who leaves and comes back can collect the same pickups twice. Make the gate take
    what it needs, and the room one-way, or give each level its own counter.</li>
  </ul>
  <h2>An AND gate from monster power</h2>
  <p>Monsters that meet compare power: the stronger kills the weaker, and two of the same power
  pass through each other. That is enough for logic. A dial is a ring of monsters, each
  becoming the next when shot. Give the right setting power 150 and the wrong ones 175. Then let
  a birth block send a checker monster of power 150 along the row of dials every few seconds.
  Any wrong dial kills it; only when every dial is right does it reach the end, where it beats
  a weak lamp monster whose <b>Becomes</b> is the lit lamp. One of the archive’s word puzzles
  is built exactly so.</p>
  <ul>
    <li>The hero’s shots must be stronger than every dial (over 175) to turn them.</li>
    <li>Monsters never touch background blocks, so the lamp, not the checker, talks to the hero.
    Give the lit lamp power 200, so later checkers can’t hurt it, and a monster block that adds
    to a special counter when he touches it. The door is a gate on that counter.</li>
    <li>An OR is two rows that each send a checker to the same lamp.</li>
  </ul>
  ${e("ANDGATE")}
  <h2>A worked example: Ohm Sweet Ohm</h2>
  <p>The whole game is wiring made of blocks. Batteries are birth blocks that send sparks
  (monsters) along copper traces. A pulsed battery animates between a birth block and a
  resting block, so its current comes and goes, and a timer chip does the same with a longer
  “on” than “off”. A dead cell is a solid block that becomes a live battery when bumped.
  Diodes are blocks solid on three sides, so the hero gets through one way only. None of it
  needed a line of programming.</p>
  ${o("Reset by leaving:","Every visit loads a scene’s map fresh, but the counters stay. A puzzle can reset itself when the hero walks out and back in, while the counters remember what he has already paid.")}`},f={id:"scenes",title:"Scenes, Links and the Camera",head:"5. Scenes and Links",html:`${a(5,"Scenes, Links and the Camera","A game is a set of scenes joined by links. Where you put the links, and what the player sees on arrival, decide how a game feels.")}
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
  ${e("ROOMS")}
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
  <h2>Talk, pictures and cut-ins: the pass-through scene</h2>
  <p>PLAYGAME has no dialog box. What it does have is a picture between scenes, so a
  conversation, a found note, a short animation or a page of text is a scene of its own that
  the hero only passes through:</p>
  <ol>
    <li><b>A new scene on the same level map.</b> Add a scene that loads the very map, blocks and
    monsters of the level the hero is standing in.</li>
    <li><b>Its intro picture is the message.</b> A <code>.GIF</code>, an <code>.FLI</code>
    animation, a <code>.TXT</code> page or a <code>.LST</code> slide show of all three.</li>
    <li><b>An all-black palette.</b> Every color in the scene’s palette is black.</li>
    <li><b>Land on the way out.</b> The link into the scene lands the hero on the same cell as
    the scene’s only link out, and that link leads back to the level, landing him beside the
    spot that sent him (not on it, or he talks forever).</li>
  </ol>
  <p>Walking into the friend, the sign or the note, the game fades out, shows the picture, and
  starts the new scene with the hero already standing on its exit. He leaves on the first
  tick, and the level comes back. To the player, the friend simply spoke.</p>
  <p><b>Why black?</b> PLAYGAME fades every scene’s map in and out, even one that lasts a
  single tick. With an ordinary palette the level flashes up for a moment between the picture
  and the return, and looks like a glitch. With every color black, that fade happens unseen.
  The picture itself is not affected: a <code>.GIF</code> or <code>.FLI</code> carries its own
  colors.</p>
  <p><b>Why the same map?</b> Because the scene is only seen for one tick, the map is there for
  the landing spot and the link out, and the level’s own map already has a cell the hero is
  standing near. Using it costs no new files, keeps one place to edit, and puts the link out
  exactly where he was. If something does show (a scene that isn’t quite black, a slow
  machine), it is the same room he was in, so nothing jumps. Final Curtain goes one step
  further and leaves the palette lit for its answers: each answer scene is the very room Ada
  asked in, so the talk just carries on.</p>
  <ul>
    <li><b>Text pages need red.</b> PLAYGAME writes its MORE… prompt in the palette entry
    nearest red. In an all-black palette that is entry 0, so give the page’s picture a palette
    with red at 0, as Keep It Brief does, or the prompt is black on black.</li>
    <li><b>A gift on arrival.</b> The block the hero lands on is touched in that one tick, so it
    can score, heal or raise a counter. Quest for the Round Tuit’s townsfolk hand over a writ, a
    lost dog or a reward that way (its talks use a small map of their own built for the
    purpose).</li>
    <li><b>The level comes back fresh.</b> Returning is a new visit, so the level’s map reloads:
    keep talks away from prizes, or count what was taken in a counter.</li>
    <li><b>The Level check knows the trick.</b> It reports a landing spot on a link, which is
    right for a pass-through scene; dismiss it there.</li>
  </ul>
  <p>Quest for the Round Tuit talks to every townsperson this way, Keep It Brief shows its
  thirty-third book’s card and its chapter-done pages, and Final Curtain gives its answers and
  wrong verdicts.</p>
  ${e("PICTURES")}
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
  ${e("SCROLL")}
  <h2>Many rooms on one map</h2>
  <p>Nothing says each scene needs its own map. In the archive’s games, a dozen one-screen
  houses behind a town’s doors share a single map, a strip of four stages is one map with up
  and down scrolling turned off so the view never leaves its strip, and three stages of a
  platformer sit side by side on one file. Each room is its own scene, with its own landing
  spot, links, song and cast, and the rooms really are next to each other.</p>
  <ul>
    <li><b>Fewer files,</b> one block set and one place to edit walls that rooms share.</li>
    <li><b>A free checkpoint.</b> Dying starts only the current scene over, so splitting a long
    stage into scenes on the same map saves the player’s progress at each split.</li>
    <li><b>Wall the rooms off.</b> Solid blocks between them, or a scroll that stops, keep the
    player from strolling into the next room without its scene’s rules.</li>
    <li><b>Land in the same place.</b> In a room that doesn’t scroll, the landing spot sets what
    the screen shows, so every link into the room should land on the same cell.</li>
    <li><b>The map comes back fresh</b> on every visit. What the hero took in one room is back
    when he returns, so keep prizes where he only goes once.</li>
  </ul>
  ${e("ONEMAP")}
  <p>An overhead map is the same grid with gravity off. Each area of an overworld can be its own scene on one map with scrolling off, and a road off the edge is a link on every block it crosses, landing the hero in the middle of the next area. A door is the same kind of link.</p>
  ${e("OVERHEAD")}
  <p>A world can hold a town and a town can hold a house, each its own scene with its own map file and its own pictures, so a town is one block on the world map and houses are streets wide in the town. Each way in needs a link back whose landing cell is where the hero came from, and the hero keeps his counters from scene to scene, so a key found in one can open a gate in another.</p>
  ${e("TOWNLINK")}
  <h2>Laps round the wrap</h2>
  <p>The map wraps: off the right edge is the left edge, off the bottom is the top. Racing games
  in the archive put the finish line just behind the start, so the only way to reach it is all
  the way round; an endless fall is a shaft that wraps top to bottom with scrolling only down; and
  traffic that drives off one side comes back on the other forever. Put a one-way wall just
  behind the start, or the player turns round and crosses the finish line at once. Lay a road a
  little crooked, one block over every few rows, and it wraps again and again, so a long road
  fits on one map.</p>
  ${e("DIAGWRAP","BELTWAY")}
  ${e("ROADTILE")}
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
  up to eighteen of them. End the walk at a door the player can see, and put the link on
  the door itself, so touching it is leaving. A link on a bare cell beyond the door leaves the
  hero standing in the doorway wondering why nothing happens. And walk it yourself at an
  ordinary pace: a player who strolls takes longer than a tester who runs.</p>
  <figure data-fig="walkoff"></figure>
  <p>The same goes for a scene’s first line. A voice that starts as a level opens is cut by
  the first digital sound after it, often the hero’s own first jump. Keep the opening seconds
  quiet, or give those first actions speaker-only sounds (Chapter 6).</p>`},b={id:"sounds",title:"The Sound Set, Slot by Slot",head:"6. Sound Sets",html:`${a(6,"The Sound Set, Slot by Slot","A sound set (.SND) holds 30 sounds. Knowing which event plays which slot is the difference between a game that chirps at random and one that talks to the player.")}
  <h2>Two sounds in every slot</h2>
  <p>Each slot holds a PC speaker tune, 36 steps of 1/146 of a second (about a quarter of a
  second), and, if you like, the name of a Sound Blaster <code>.VOC</code> file. With a Sound
  Blaster, a slot that names a <code>.VOC</code> plays it; otherwise the speaker tune plays.
  Players without a card hear only the speaker, so fill in both.</p>
  ${e("SOUNDS","SNDBOARD","OUTLOUD")}
  <h2>A block can’t choose its sound</h2>
  <p>There is no “sound” setting on a block. The first nine slots belong to events, and
  PLAYGAME picks the slot by what the touch did:</p>
  <table>
    <tr><th>Slot</th><th>Plays when</th></tr>
    <tr><td>0</td><td>a touch adds hit points</td></tr>
    <tr><td>1</td><td>the hero’s shot kills a monster, or a weak monster touches him and makes no other sound</td></tr>
    <tr><td>2 / 3</td><td>money goes up / down</td></tr>
    <tr><td>4</td><td>an extra life</td></tr>
    <tr><td>5 / 6</td><td>the score goes up / down</td></tr>
    <tr><td>7 / 8</td><td>any other counter goes up / down</td></tr>
    <tr><td>9–29</td><td>only when a character sequence names them</td></tr>
  </table>
  <p>Being hurt plays the Hurt sequence’s own sound, and dying the Die sequence’s, so those
  come from slots you choose. One touch makes one sound: an extra life wins over everything;
  otherwise hit points come first, then money or a counter, then the score. A coin that adds
  money and points plays the money sound only.</p>
  <h2>Choosing sounds by choosing counters</h2>
  <p>Since the counter decides the sound, pick counters with your ears. Third Goat from the
  Left counts wool in a special counter, so every tuft plays slot 7, a bleat of joy. And
  because each scene loads its own sound set, the same event can say something new in each
  place: there an extra life sings “Third goat from the left!” in the fields and town, and
  whispers “He sees you.” in the stable.</p>
  <h2>One voice at a time</h2>
  <p>The Sound Blaster plays one <code>.VOC</code> at a time, and a new one cuts off the one
  playing. The PC speaker is a separate voice. So a slot with no <code>.VOC</code> name is a
  <b>speaker-only</b> sound, and it never interrupts a voice clip.</p>
  <p>Use that on purpose. Give the sounds a player makes all the time (steps, hops, a buzz, a
  tick) only a speaker tune, and save the Sound Blaster for the lines that matter. A Fly Named
  Carl keeps its flying and buzzing on the speaker so they never cut off a lyric, and the tin
  heart that hides in the Sandbox games ticks only on the speaker for the same reason.</p>
  <h2>🎛 The sound effect maker</h2>
  <p>In the sound set editor, <b>🎛 Make one with the sound effect maker…</b> builds a
  <code>.VOC</code> for the slot you are on. Start from a preset (jump, coin, hurt, explosion,
  power-up, laser and more; each press gives a new take), roll 🎲 Random, or 🧬 Mutate the one
  you have. Then shape it with sliders: pitch, slide, a jump in pitch, vibrato, the attack, hold
  and decay, repeats and tone. It saves an 8-bit, 11&nbsp;kHz <code>.VOC</code>, names it in the
  slot, and can draw the same effect as the slot’s PC speaker steps, so players without a card
  hear it too. The sliders’ settings stay with the project’s editor notes, so the sound set and
  .VOC editors can reopen them later.</p>
  <h2>A .VOC as a PC speaker tune</h2>
  <p>The game plays a slot’s <code>.VOC</code> on a Sound Blaster and its 36 speaker steps on a
  PC speaker, so the two should sound alike. In the sound set editor, a slot with a
  <code>.VOC</code> has <b>▶ Preview as PC speaker</b>: it finds the strongest pitch in each
  step of the recording, leaves the quiet parts silent (the speaker can only be on or off), and
  plays the result, drawn as outlines over the steps. Noisy sounds, like a crash, hop around
  their pitch. Choose <b>Fit</b>: the whole sound sped up to a quarter of a second, or just its
  first quarter second as timed. If you like it, <b>✓ Use it for the PC speaker</b> puts it in
  the slot; Undo takes it back.</p>
  ${o("Pro tip:","A player can turn sound effects off with <kbd>F4</kbd> and music with <kbd>F3</kbd>. Make sure nothing in your game can only be understood by ear.")}`},g={id:"voice",title:"Digitized Voice",head:"7. Voice",html:`${a(7,"Digitized Voice","Nothing sells a moment like a real voice: a cheer, a gasp, a line of a song. A few short clips, used well, go further than a dozen used everywhere.")}
  <h2>The clip’s size is the limit</h2>
  <p>A <code>.VOC</code> is 8-bit sound, one channel, at a rate you choose. PLAYGAME reads the
  whole file with a byte count that stops at 65,535, so on a real PC a bigger file plays wrong.
  The Sandbox and Bard games keep every clip under 40,000 bytes to be safe:</p>
  <table>
    <tr><th>Rate</th><th>Sounds like</th><th>Longest clip in 40,000 bytes</th></tr>
    <tr><td>11,025 Hz</td><td>clear speech and singing</td><td>about 3.6 seconds</td></tr>
    <tr><td>8,000 Hz</td><td>a telephone: fine for longer lines</td><td>about 4.9 seconds</td></tr>
  </table>
  <h2>Recording and trimming</h2>
  <ul>
    <li>Record close to the microphone in a quiet room, and say the line a few ways.</li>
    <li>Trim the silence at both ends right up to the voice. Dead air at the start makes the
    sound feel late; at the end it only wastes bytes.</li>
    <li>Give each end a very short fade so it doesn’t click, and bring the level up until the
    loudest part is nearly full scale. Eight bits are noisy when quiet.</li>
    <li>Cut on a breath or a pause, never mid-word.</li>
  </ul>
  <p>In this edition the sample editor selects and trims, inserts a pause, records from the
  microphone, and saves 8-bit sound at the clip’s own rate, the way the Sound Blaster plays it.</p>
  <h2>Story beats</h2>
  <p>Put voice where the story turns: an extra life, a gate that opens, a goal reached, a
  boss’s first appearance. The Bard of Bizarre games cut their clips from the song itself, so
  the hook line plays when you earn a life and the big moments get their lyrics.</p>
  <h2>Timing</h2>
  <ul>
    <li>A clip that starts as a level opens is cut by the next digital sound. Leave the first
    second or so quiet (Chapter 5).</li>
    <li>A clip at a gate needs a walk-off before the next link (Chapter 5): a visible door a
    few blocks on, with the link on the door itself.</li>
    <li>Players walk at their own pace, and some stop to look. A line they have to hear (a
    clue, a joke’s punch line) is safer when the hero can’t reach the exit until it is nearly
    done.</li>
    <li>A clip on a sequence the player can start again before it ends cuts itself off; keep
    the sounds of repeatable moves short.</li>
  </ul>
  <p>The Sandbox and Bard games are checked with a tool that plays the whole walkthrough, writes down every
  clip, and complains about any that is cut off before its end. Your own version of that is
  simple: play your game through with the sound up and listen to the end of every line.</p>`},y={id:"music",title:"FM Music on the OPL2",head:"8. Music",html:`${a(8,"FM Music on the OPL2","The Sound Blaster’s music comes from a little FM synthesizer chip, the OPL2. It has nine voices, two “operators” each, and more tricks than its size suggests.")}
  <h2>What PLAYGAME plays</h2>
  <ul>
    <li>Songs are Creative Music Files (<code>.CMF</code>) timed at Game-Maker’s own 146 ticks a
    second. A file made for another clock stays silent.</li>
    <li>Each MIDI channel drives one FM voice and plays <b>one note at a time</b>. A chord takes
    a channel per note.</li>
    <li><b>Melody mode</b> has nine voices on channels 0–8. <b>Rhythm mode</b>, switched on with
    controller <code>0x67</code>, has six voices on channels 0–5 plus a drum kit on channels 11–15:
    bass drum, snare, tom-tom, cymbal and hi-hat. The bass drum takes a whole voice; the snare
    and hi-hat share one voice’s pitch, and the tom-tom and cymbal share another’s.</li>
    <li>Pitch bend and transpose are ignored. Velocity is honored: it scales the instrument’s
    loudness.</li>
    <li>At the end of the song it starts over at once. A song loops cleanly if its last bar
    leads back into its first.</li>
    <li>The tempo is written into the timing of every note, so a song that speeds up is simply
    written faster.</li>
  </ul>
  <h2>When music starts over</h2>
  <p>Every scene starts its song from the top: when the scene begins, and again every time the
  hero dies and the scene restarts. The title song plays under the title, the menu song comes
  back after each game, and the storyline has a song of its own. Write level songs whose first
  bars can stand being heard often.</p>
  <h2>Patches</h2>
  <p>An instrument is 11 bytes: two operators and how they connect. The <i>modulator</i> bends
  the <i>carrier</i>, the one you hear, and the more it bends the brighter the sound. The
  music editor’s instrument list writes them in a short shorthand: <code>x</code> the frequency
  multiple, <code>tl</code> the level (0 loudest, 63 silent), <code>ar dr sl rr</code> the attack,
  decay, sustain level and release, <code>hold</code> to hold while the key is down, <code>w</code>
  the waveform, <code>vib trem</code> the chip’s vibrato and tremolo, <code>fb</code> feedback, and
  <code>add</code> to hear both operators side by side. A few from the list:</p>
  <table class="ug-patches">
    <tr><th>Instrument</th><th>Modulator / carrier / voice</th></tr>
    <tr><td><b>Square Lead</b><br><small>a modulator at twice the pitch leaves only odd harmonics: hollow, like a square wave or a clarinet</small></td><td><code>x2 tl24 ar15 dr0 sl0 rr5 hold</code><br><code>x1 ar15 dr0 sl0 rr5 hold</code><br><code>fb0</code></td></tr>
    <tr><td><b>Pipe Organ</b><br><small>both operators heard: two pipes an octave apart</small></td><td><code>x2 tl8 ar9 dr0 sl0 rr5 hold</code><br><code>x1 ar8 dr0 sl0 rr5 hold</code><br><code>fb2 add</code></td></tr>
    <tr><td><b>Tubular Bells</b><br><small>a 2 : 7 ratio is out of tune with itself, which is what makes a bell clang</small></td><td><code>x7 tl30 ar15 dr3 sl4 rr3</code><br><code>x2 ar15 dr2 sl3 rr3</code><br><code>fb0</code></td></tr>
    <tr><td><b>Vocal “Aah”</b><br><small>a slow attack and vibrato on both operators: the games’ singing voice</small></td><td><code>x2 tl29 ar6 dr4 sl1 rr6 hold vib</code><br><code>x1 ar7 dr5 sl1 rr7 hold vib</code><br><code>fb6</code></td></tr>
    <tr><td><b>Deep Sub-Bass</b><br><small>a quiet modulator leaves a nearly pure, deep tone that holds</small></td><td><code>x1 tl44 ar15 dr4 sl6 rr6</code><br><code>x1 ar15 dr1 sl1 rr6 hold</code><br><code>fb0</code></td></tr>
  </table>
  <h2>🎼 Draw a tune, let the band play</h2>
  <p>Draw a melody on one track of the piano roll, then press <b>🎼 Accompany…</b>. It hears
  the tune’s key and a chord for each bar (or half bar), and writes a bass line, chords and drums
  on the other tracks in the style you pick: march, waltz, ballad, rock or chiptune. <b>🎲 Another
  take</b> picks other patterns, sounds and, where the tune allows, other chords. It switches the
  song to rhythm mode (six melody tracks and the drum kit) and replaces the other tracks; Undo
  brings them back.</p>
  <p><b>⧉ Copy tune…</b> copies one track’s tune into a new song, faster or slower and moved up
  or down, with a new band if you like: a slow version for a sad scene, a fast one for a chase.</p>
  <h2>Tricks that push a CMF</h2>
  <p>The Bard of Bizarre songs use these, all made of plain events that PLAYGAME understands:</p>
  <ul>
    <li><b>Swells and sweeps.</b> A program change loads a new instrument even under a held note,
    and a song can carry up to 128 instruments. Step through copies of one patch that differ
    only in level and a held chord swells, or brightens like a filter opening.</li>
    <li><b>A seventh melodic voice.</b> In rhythm mode the bass drum is a full voice whose pitch
    follows its note, so with a long patch it plays a sub bass line. The tom-tom is tunable too.</li>
    <li><b>Chords on one channel.</b> A fast arpeggio sounds like a chord; a harp spreads its
    chord across several channels so each note rings out.</li>
    <li><b>Slides.</b> With no pitch bend, a glide is a quick run of semitone steps.</li>
    <li><b>A choir from two voices.</b> The same notes on two channels whose patches differ
    only in the vibrato setting beat against each other like a section.</li>
    <li><b>Echoes and dynamics.</b> The line again later and softer on another channel; a
    crescendo is a ramp of velocities.</li>
  </ul>`},k={id:"show",title:"Title Screens and Demos",head:"9. Demos and Titles",html:`${a(9,"Title Screens and Demos","The first thirty seconds sell a game. Make the menu readable, the story quick, and let the game play itself when nobody is touching the keys.")}
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
    <li>Write in-game text in plain ASCII. The player draws its letters from the PC’s built-in
    font, which stops at character 127: accented letters, symbols and box lines come out as
    scribbles in DOS (Level check: <b>Characters DOS can’t draw</b>).</li>
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
  pressed or let go on, up to 1,000 of those changes (a press and its release are two).</p>
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
  ${e("MAKETITL")}
  ${o("Pro tip:","Record the demo last. Every change to the first level after it, even one block, can send the demo’s hero into a wall.")}`},v={id:"testing",title:"Testing Like a Pro",head:"10. Testing",html:`${a(10,"Testing Like a Pro","You know where every secret is, so you are the worst person to test your own game. Do it anyway, on purpose, with a list.")}
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
  <p class="ug-wink">Looking for the really sneaky stuff? Some things aren’t in any official manual.</p>`},A={id:"numbers",title:"The Numbers to Remember",head:"Appendix A",html:`${a("Appendix A","The Numbers to Remember","The limits and timings this guide relies on, in one place.")}
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
  </table>`},T={id:"craft",title:"Designing With a Goal",head:"11. Designing With a Goal",html:`${a(11,"Designing With a Goal","Every tool in this guide can make a game more impressive. This chapter is about making it more fun, which is not always the same thing, and is the only thing a player will remember.")}
  <h2>Fun first, fireworks second</h2>
  <p>Before you build the clever part, write one sentence: what does the player <i>do</i>, and
  why is it fun to do it again? A clever trick or a forty-block boss earns its place
  only if it serves that sentence. Play your first level before you draw the tenth. If it
  isn’t fun with plain blocks, prettier blocks won’t save it.</p>
  ${o("Watching people play:","Several pieces of advice in this chapter and the next few come from watching other people play Game-Maker games: levelengine’s long livestream “RSD Game Maker Binge” (2020) and Pixelmusement’s “ADG Episode 250 - Game-Maker” (2018). What made players quit, and what made them grin, is retold here in this guide’s own words, with every engine fact checked against PLAYGAME.")}
  <h2>A hero who feels right</h2>
  <p>The hero’s speed is set by his walk frames: how many pixels each frame moves him, and how
  many ticks it waits (a tick is 1/18 of a second). Four pixels every tick is about 73 pixels a
  second, a screen in a little over four seconds: a good place to start. Much slower and the
  game can drag, however lovely the scenery, unless a heavy, careful hero is the idea; a frame
  can’t move him more than 11 pixels a tick anyway.</p>
  <ul>
    <li><b>Steady, not twitchy.</b> Give every walk frame the same move and the same pause. A
    jumpy frame in the middle of a cycle makes the hero feel slippery.</li>
    <li><b>Jumps that finish.</b> Mark the jump as a sequence that can’t be interrupted, so a
    stray key can’t cut it off in mid-air.</li>
    <li><b>One step per press</b> for puzzle games on a grid, so a held key doesn’t overshoot.</li>
    <li><b>Momentum</b> for ice, space or a vehicle, where a little slide is the point. A ship
    that coasts on after the key is let go feels like ice; if it should stop when the player
    stops, give it plain frames, not momentum.</li>
    <li><b>Firing stops walking.</b> Only one sequence runs at a time. While a fire sequence
    repeats, the hero stands still, and pressing an arrow stops the shooting. Keep the fire
    sequence to one short frame that can be interrupted, so walking and firing take turns
    quickly; or, for a shooter, put the shot on the walk frames themselves, so the hero fires
    whenever he moves.</li>
  </ul>
  ${e("SLIDE","BOOTS","KITMOVES")}
  <h2>Face the way you walk</h2>
  <p>A hero drawn only from the front, sliding left and right with his legs going, is one of the
  first things a player notices, and often reads as a rushed game. Most heroes look best drawn
  four ways:</p>
  <ul>
    <li><b>A side view for walking.</b> Draw him facing right and give the left walk the same
    frames mirrored (orientation 4). A hero two blocks tall needs <i>both</i> blocks mirrored, or
    his head keeps looking the wrong way.</li>
    <li><b>A front view</b> for standing still, and for walking down the screen when the game
    is seen from above.</li>
    <li><b>A back view</b> for walking up the screen, climbing a ladder or going in at a
    door.</li>
    <li><b>Monsters turn round too.</b> A monster that paces with a side view needs its return
    leg mirrored (orientation 4 on that corner of its path). Chasers and wanderers turn on their
    own.</li>
    <li><b>Monsters walking up and down</b> a map seen from above need a back and a front. A
    monster has one picture for its whole path, so chain monsters that die after their path and
    become the next. Mind PLAYGAME’s quirk: the monster it becomes first walks the
    <i>old</i> monster’s first leg. So give each link the pictures of one leg but the path of the
    leg after it, and place a starter with a zero-length path that becomes the link holding the
    first leg. Each link starts its animation over, and a killed monster becomes the next one
    too, so chain only monsters the hero can’t kill.</li>
  </ul>
  <p>The one exception is something that looks the same from every side on purpose: a ball, a
  word bubble, a ship that always flies nose first, a cardboard cutout that slides as a joke.
  The Level check (chapter 14) asks about a hero
  who walks sideways facing you, one whose head doesn’t turn, one who climbs a ladder showing
  his front or side, and a monster that never turns round; press <b>Looks the same from every
  side</b> on a finding and it stops asking about that one.</p>
  <h2>Keys under the hands</h2>
  <p>A player’s right hand rests on the arrow keys and stays there; the left rests at the
  bottom-left of the keyboard. Every key a level asks for should sit under one of those hands,
  so nobody looks down in the middle of a jump. The Game-Maker games on the CD agree on most of
  it: every one moves with the arrows, almost all jump with Up, and most fire with Space and jump
  sideways with 7 and 9 on the keypad.</p>
  <ul>
    <li><b>Moving:</b> the arrows, with Home and PgUp (keypad 7 and 9) to jump up-left and
    up-right. Give the same moves to W A S D and Q E too, and the game plays left-handed.</li>
    <li><b>The main action:</b> Space, under either thumb.</li>
    <li><b>A few more:</b> keys the left hand reaches without moving while the right steers:
    Z, X, C, V and B along the bottom row, then F, G, R, T, or 1 to 5. Keep a key’s job the same
    in every level.</li>
    <li><b>Not:</b> P, H, J, K, L, O, the number keys 6 to 0, or anything right of them. The CD’s
    old habit of P to pick up and D to drop sends the right hand across the board; pick up with
    Space or Down, and drop on a left-hand key, instead.</li>
    <li><b>One fire key.</b> A shot already flies the way the hero last moved (Chapter 3), so
    one key fires every way. A sword with a key for each direction asks players to find four
    keys, and the one they never find is the one they needed. Don’t split the ammunition across
    several fire keys either: the counters are invisible, and one empty gun out of four reads as
    a broken key.</li>
    <li><b>Jump keys that come in threes.</b> Only one key is read at a time, so Up and Right
    together can’t make a sideways jump; that is why the old games put one on 7 and 9. Name the
    three together in the help (<i>Up jumps; 7 and 9 jump left and right</i>), and keep the
    same three in every level.</li>
    <li><b>Few of them.</b> Arrows, Space and two or three more are as many as most players keep
    in their heads. The Level check (chapter 14) asks about a key the right hand has to leave the
    arrows for; a key pressed once in a while, like a map or a menu, can sit anywhere.</li>
  </ul>
  <h2>Room to move</h2>
  <p>The hero is a block wide and two blocks tall, and the screen is only 16 by 10 blocks. Leave
  air around him: passages three blocks high where he can jump, gaps he can clear with a
  block to spare, and ledges wider than his feet. The view only starts to scroll once he is
  about a third of the screen from the middle, so long runs need open space ahead; a hazard
  that appears at the screen’s edge as he arrives is a wall he couldn’t see.</p>
  <h2>What the camera can see</h2>
  <p>PLAYGAME’s view doesn’t follow the hero; it waits, then hurries. These are its numbers,
  for a screen 16 blocks wide and 10 high:</p>
  <table>
    <tr><th>Moment</th><th>What the player sees ahead</th></tr>
    <tr><td>Walking toward an edge from a standstill</td><td>The view doesn’t move until the hero is about 5 blocks past the middle, about 2 blocks from the edge</td></tr>
    <tr><td>Once it scrolls</td><td>It runs faster than any hero and keeps going until he is 3 or 4 blocks <i>behind</i> the middle: about 10 blocks ahead at a walk</td></tr>
    <tr><td>Turning back</td><td>He is already behind the middle, so the way back shows 4 or 5 blocks, down to 2 before the view turns round</td></tr>
    <tr><td>Falling</td><td>The view starts down when he is 3 blocks below the middle: a block and a half under his feet</td></tr>
    <tr><td>Jumping up</td><td>The view starts up only when his head is half a block from the top</td></tr>
    <tr><td>Scrolling turned off that way</td><td>He can walk to the very edge, and nothing past it is ever shown</td></tr>
  </table>
  <p>So the blind moments are the first steps of a run, a turn, the bottom of a fall and the top
  of a jump. Keep the first few blocks after each of them clear of anything that hurts, and
  make a fast hero, or a scene that moves him by itself, start well away from the edge he heads
  for. A danger met in the first two blocks of view is a danger nobody could see coming.</p>
  <h2>A difficulty curve, not a cliff</h2>
  <ul>
    <li><b>Ramp up evenly.</b> Most games do well to ask for one thing more each level, and
    to make the last level feel like the best one, not the cruelest. A breather level, or a
    gentle game that never gets hard, can be just as right on purpose.</li>
    <li><b>A scene is a checkpoint.</b> When the hero dies he starts the <i>scene</i> over. A
    long, hard level costs a lot each time; split it into scenes joined by links, and the
    player keeps what he earned. A long final run with no rest can be the point, as long as it
    is meant.</li>
    <li><b>No surprise deaths.</b> Show a danger before it can kill: a hazard in plain sight,
    a crack in a false floor, a monster seen pacing before it pounces. A player should die
    because he slipped, never because he couldn’t have known.</li>
    <li><b>Lives and hit points are a budget.</b> Start with enough of both that a new player
    sees the second level. Spread healing blocks where the hard parts end.</li>
    <li><b>Lives that matter.</b> Three to five lives keep a death worth avoiding; ninety-nine
    make it free. Mind what a death keeps: the inventory, the score and the counters stay with
    the hero, while the scene’s map comes back fresh, keys and coins and all. A player who dies
    after picking up a key can pick it up again, and points that come back on every try can be
    farmed. Put what must be earned once in the scene before the hard part, so a death in the
    hard part doesn’t bring it back.</li>
  </ul>
  <h2>A length that fits</h2>
  <p>Players rarely mind a short game. They mind one that stops without ending, and one that
  never seems to end. Choose the length on purpose, and tell the player what it is.</p>
  <ul>
    <li><b>Short is fine if it ends.</b> A game of five or ten minutes that finishes with a real
    won screen leaves players pleased. The same five minutes that stop on a blank screen feel
    like a demo, and the player asks whether there was more.</li>
    <li><b>Mid-length wants a curve.</b> Four or five levels, each a little harder than the last,
    can hold a player for most of an hour. That is often the best size of all: long enough to
    learn the game, short enough to finish it in one sitting.</li>
    <li><b>Long wants chapters.</b> Ten or twenty levels is a lot to promise a stranger. Group
    them into chapters of three to five, and end each chapter with a done screen of its own: the
    exit picture of its last level, which plays only when the hero leaves by a link, never after
    a death. <i>Chapter 2 complete! Press F5 to save.</i> A player can stop there pleased, and
    come back.</li>
    <li><b>Say where they are.</b> Players who can see the end keep going; players who can’t
    start asking how many levels are left, and then stop. Put “Level 3 of 10” on each level’s
    intro picture. The intro shows again after every death, so the count stays in front of them.
    The Integrator’s <b>🪧 Level card…</b> on a level writes it for you, counting the levels in
    the order play meets them. Say the size in the instructions too: <i>ten levels in three
    chapters.</i></li>
    <li><b>Remind them to save, early and in the game.</b> <kbd>F5</kbd> saves and
    <kbd>F6</kbd> loads, in any scene, with ten slots. A line in the help reaches only the
    players who read it, and most don’t. Put the reminder on the first level’s card and on every
    chapter’s done screen. With no save, a game over sends the next try back to level 1.</li>
    <li><b>Let a death count.</b> Length and stakes go together. With a few lives (above), each
    level is worth playing well; with saves at the chapter ends, a game over late in a long game
    costs one chapter, not the evening. Dozens of lives make a long game merely long.</li>
    <li><b>The end says you won.</b> However long the game, the last thing the player sees
    should leave no doubt (Chapter 12, “An ending, not an ad”).</li>
  </ul>
  <h2>Fair enemies</h2>
  <ul>
    <li><b>Few at a time.</b> Two or three enemies on the screen at once is usually plenty: the
    player can read each one. Eight at once can be hard to read, but a swarm can be the
    point of a level, a wave to survive or a shooter’s big moment. Count them on the map with
    the 16 by 10 view in mind, and decide which you mean.</li>
    <li><b>Births that stop.</b> A birth block keeps giving birth while it is on the screen or
    within half a screen of it. Unless a flood is the idea, give it a long time between births, or let its block
    animate to a quiet one after a while. Don’t make a killed enemy turn into another hostile one by accident: “becomes” is
    for stages, not for multiplying.</li>
    <li><b>A spawner the hero can shut.</b> A birth block is a background block, so its touch
    can make it <i>become</i> another: a closed hatch that gives birth to nothing. Bumping the
    hatch shuts it for the rest of the visit, a flood with an off switch. Add to a special counter
    in the same touch, and a gate that wants that count opens once every hatch is shut. Monsters
    and shots never touch background blocks, so the hero has to do it himself.</li>
    <li><b>Patterns players can learn.</b> A monster that paces the same path every time gives
    the player a fair chance even when it is fast. Save the wanderers for crowds.</li>
    <li><b>Shots that connect.</b> A shot is born level with the hero’s upper block, unless the
    frame that fires it has a downward move of 20 (one block), which drops it to his lower block.
    A shot at head height flies over a beetle a block tall. Fire at the height of the enemies the
    level has, and try every gun against every foe.</li>
    <li><b>Easy to see.</b> Draw enemies from ramps the background doesn’t use, with a dark
    outline, so none of them hides against the scenery by accident. A camouflaged foe can be a
    fair trick when the game hints at it first.</li>
    <li><b>One hit, one hurt.</b> A strong monster hurts on every tick it overlaps the hero, so
    a slow escape costs many hit points. It goes on costing them while the Hurt sequence plays:
    PLAYGAME takes hit points on every touch, and only the Hurt animation waits to finish before it
    can start again. So the Hurt sequence doesn’t slow the damage; it decides whether the player
    can get away. Keep it short, let it be interrupted, and give it frames that move the hero
    back a few pixels, out of reach. A monster gives the effects of the picture it is showing, so
    one that hurts on a single frame of its animation stings once a cycle, not every tick; and
    one below power 100 is gone after its first touch, like a bee.</li>
    <li><b>Chasers that let go.</b> A monster that chases forever turns a level into a race.
    If a race isn’t what you want, give chasers a lifetime, or a chase speed a little slower
    than the hero’s walk.</li>
  </ul>
  <h2>A final boss worth the trip</h2>
  <p>End on an event. Build the boss as a chain of monsters joined by “becomes”, one stage per
  hit, each a little faster or with a new attack path, so the player sees the fight turning.
  Give him a shape and colors nothing else in the game has, room to dodge, and a reward:
  a big score, an exit picture, a won screen that says thank you.</p>
  ${e("BIGBUG","PHASES","GIANT")}
  <h2>Variety</h2>
  <p>Each scene can load its own palette, block set, monsters and music, so use them: a new
  place, a new enemy and a new item every level or two. A gimmick (flying, skiing, a puzzle
  room) is a great change of pace for one level; a whole game of it can get old, unless the
  gimmick is the game. One look all the way through can be a style too, if it is chosen.</p>
  <h2>Polish that players notice</h2>
  <ul>
    <li><b>Smooth cycles.</b> Walk and idle cycles should loop with no jump between the last
    frame and the first, with even pauses. Animated blocks too: water that hiccups catches the
    eye for the wrong reason.</li>
    <li><b>Readable colors.</b> Keep strong contrast between what can hurt, what can be
    walked on and what is only scenery. Look at a level with your eyes half shut: what stands
    out should be what matters. Avoid busy patterns of black and white behind the hero.</li>
    <li><b>Sounds you can hear a hundred times.</b> The sounds a player makes constantly
    usually wear best short and soft, with the loud and long ones kept for rare events. Music should fit the place,
    and because each level’s song starts over on every death, its opening should wear well.</li>
    <li><b>Music in every level.</b> A silent level may feel unfinished to players. Players notice music of
    your own, and they recognize a tune lifted from somewhere else, so write your own or credit
    whose it is.</li>
    <li><b>Nothing that flashes fast.</b> A block ring with one-tick frames, or an animation
    that swaps bright and dark, can flash 18 times a second. Keep big bright flashes under three
    a second, for the comfort and safety of every player. Show a hit with a sound, a face and a
    number rather than a flash, and let a storm sky lift and hold instead of strobing.</li>
    <li><b>Kind jokes.</b> Funny is good; funny at the expense of a real person, or of a group
    of people, isn’t.</li>
  </ul>
  ${e("FLASHSAF")}
  <p>A game also meets slow computers. A long sound freezes a slow PC while it is read from the disk, a crowd of monsters or a screenful of moving blocks can make a round take longer than a tick, and then the hero walks slowly. Keep sounds short and monsters few.</p>
  ${e("SLOWPC")}
  <h2>Charm players remember</h2>
  <p>Players forgive rough art in a game that makes them laugh. What they talk about later is
  rarely the engine work; it is the personality.</p>
  <ul>
    <li><b>Humor.</b> A silly zone name, an absurd story told straight, a key that does nothing
    useful but does it with style, a credits page that pokes fun at itself.</li>
    <li><b>A lost screen worth seeing.</b> The game over picture is seen far more often than the
    won one. A friendly joke there turns a loss into a grin and another try.</li>
    <li><b>Your own music and art.</b> Original tunes and pictures get noticed, even in a small
    game.</li>
    <li><b>A title that is the box.</b> The title screen is the cover of your game. Show the game
    itself: its hero, its world, its name in big letters. A plain “title screen” or a picture
    from some other game costs you the player’s patience before the first level.</li>
  </ul>
  <h2>Finish the idea</h2>
  <p>A game that stops early, or whose last level is a sketch, leaves players remembering the
  gap. Fill in the storyline, instructions and credits; make the won screen; play it through
  from the title one last time. Then hand it to friends and watch without helping. Every place
  they frown is your to-do list.</p>
  ${o("Rules of thumb, not rules:","Everything in this chapter is a habit that makes most games better, and every one of them can be broken on purpose. If you have to explain it, the game hasn’t; put the explanation in the level.")}`},S={id:"upload",title:"Before You Upload",head:"Appendix B",newPage:!0,html:`${a("Appendix B","Before You Upload","Tear this page out, or copy it. Tick every box before your game leaves your hard disk. A line you broke on purpose counts as ticked.")}
  <table class="ug-check">
    <tr><th aria-label="Done"></th><th>Check</th></tr>
    <tr><td>☐</td><td>The first minute is fun; the hero’s speed feels right to someone new, and a tap moves him once</td></tr>
    <tr><td>☐</td><td>The hero faces the way he walks; pacing monsters turn round</td></tr>
    <tr><td>☐</td><td>Every jump has a block to spare; every landing is in sight before the jump</td></tr>
    <tr><td>☐</td><td>Each level asks a little more; the last is the best, not the meanest</td></tr>
    <tr><td>☐</td><td>Long levels are split into scenes, so a death costs little</td></tr>
    <tr><td>☐</td><td>Every danger shows before it can kill; hazard blocks fill their cells; the start is safe</td></tr>
    <tr><td>☐</td><td>What the hero can stand on looks solid, and what he falls through doesn’t</td></tr>
    <tr><td>☐</td><td>Nowhere to get stuck: every pit has a way out, every lock its key, and nothing needed is left behind a one-way spot</td></tr>
    <tr><td>☐</td><td>Two or three enemies on a screen, each with a job, unless a crowd is the point; birth blocks rest</td></tr>
    <tr><td>☐</td><td>Enemies stand out in every palette; a touch costs little and pushes clear</td></tr>
    <tr><td>☐</td><td>Solid monsters can’t trap the hero: their paths stop a block short of walls, stay off the map’s top and bottom rows and never close in</td></tr>
    <tr><td>☐</td><td>A few lives, not dozens: a death costs a little, not everything</td></tr>
    <tr><td>☐</td><td>Every item can be reached and no scenery looks like one; mazes have landmarks; no wait over 3 seconds</td></tr>
    <tr><td>☐</td><td>Nothing shown can’t be used: no doors or links that lead nowhere, no prizes out of reach, none your own shots destroy</td></tr>
    <tr><td>☐</td><td>Someone with slower hands can finish: one key at a time, no split-second timing</td></tr>
    <tr><td>☐</td><td>The final boss has stages; the ending is a real scene that says you won, not an ad</td></tr>
    <tr><td>☐</td><td>Something new every level or two; the gimmick has its own level</td></tr>
    <tr><td>☐</td><td>Any key beyond the arrows and fire is taught in the game itself, near the start, and sits under the left hand</td></tr>
    <tr><td>☐</td><td>The help names every key the hero has, and only those</td></tr>
    <tr><td>☐</td><td>The goal fits in one line, and the instructions say it; help and story fit in three pages</td></tr>
    <tr><td>☐</td><td>Every odd rule is explained in the game or the help</td></tr>
    <tr><td>☐</td><td>Players can tell how far they are: level cards say which level of how many; a long game comes in chapters, and the first card and each chapter’s end say <kbd>F5</kbd> saves</td></tr>
    <tr><td>☐</td><td>Animations loop smoothly and play in real DOS; menu, <kbd>F2</kbd> and text screens are readable</td></tr>
    <tr><td>☐</td><td>Nothing flashes faster than three times a second</td></tr>
    <tr><td>☐</td><td>The title screen shows the game you’ll play</td></tr>
    <tr><td>☐</td><td>Frequent sounds are short; no voice line is cut off; music fits</td></tr>
    <tr><td>☐</td><td>Storyline, instructions, credits, won and lost screens are filled in</td></tr>
    <tr><td>☐</td><td>The first scene’s hero sets the starting hit points, lives and counters for every hero; every hero has a standing picture</td></tr>
    <tr><td>☐</td><td>Nothing in the game mocks a real person or a group</td></tr>
    <tr><td>☐</td><td>The demo plays the same way twice</td></tr>
    <tr><td>☐</td><td>Three friends played it through, and you fixed where they got stuck</td></tr>
  </table>`},x={id:"levels",title:"Levels Players Forgive",head:"12. Levels Players Forgive",html:`${a(12,"Levels Players Forgive","Players forgive a plain-looking game. They don’t forgive a level that traps them, kills them without warning or wastes their evening. Here is how to build maps that are hard in the right way.")}
  <h2>Teach, test, twist</h2>
  <p>Give each level one new idea and walk it through three beats. First show it where a
  mistake is cheap: the first spring sits over flat floor. Then ask for it under a little
  pressure: a spring over a pit. Then turn it: a spring that throws the hero past a key they
  must come back for. A mechanic used once, in its plainest form, often feels like an idea left
  half explored, so ask whether it could come back with a twist. Sometimes the answer is no: a
  one-off surprise, a single silly level, a joke told once can be the best moment in a game. The
  last level is a fine place for every idea to come back together.</p>
  ${e("FIRSTSTP","TEACHTWI")}
  <h2>Never trap the player</h2>
  <p>A player should always be able to go on or go back. Getting stuck with no way out but
  <kbd>Esc</kbd> is the one mistake nobody forgives, because the only fix is to start again.</p>
  <ul>
    <li><b>Keys before locks.</b> If a door needs a key, make sure the hero can’t pass the
    point of no return without it, or that a way back to the key stays open.</li>
    <li><b>A way out of every pit.</b> Any hole the hero can drop into needs a ladder, a rope or
    a link out, unless it kills them outright (and then it should look deadly).</li>
    <li><b>One-way means obvious.</b> A drop or a door that won’t let them return is fine if
    everything they still need lies ahead. Mark it: a sign, an arrow, a ledge too high.</li>
    <li><b>Test by misbehaving.</b> Walk into every hole, ride every lift the wrong way and leave
    every key behind. Wherever you get stuck, a player will too.</li>
  </ul>
  <h2>Look before you leap</h2>
  <p>Gravity in PLAYGAME speeds the hero up by a pixel a tick, every tick: after half a second
  they are falling half a block a tick, and a fall of one screen takes about a second. That is
  too fast to steer by. Keep drops short, or put the landing on screen before the jump, so the
  player chooses where to land instead of finding out. A gravity block that pulls the hero
  along a pole or a chute is the same: show where it ends before they step on.</p>
  <h2>Hazards that hit where they are drawn</h2>
  <p>A monster hurts only where its pixels touch the hero’s. A <i>block</i> is different: it
  touches through its whole 20 × 20 cell, clear corners and all. A row of small spikes drawn in
  the bottom of a cell is, to the engine, a full block of spikes, so the hero dies a hand’s
  width above them. Draw hazard blocks edge to edge and top to bottom, or move the danger into
  a monster that sits still, which hurts only by its drawn shape.</p>
  ${e("HAZARDS")}
  <h2>Danger players can see</h2>
  <p>A death is fair when the player could have seen it coming and could have got away. Three
  kinds break that rule, and players remember each one as the moment the game cheated.</p>
  <ul>
    <li><b>Hits from off the screen.</b> Only a monster on the screen can touch the hero, but one
    just past the edge is there a moment later: a chaser at 8 pixels a tick crosses two blocks of
    view in five ticks, a quarter of a second. Keep fast foes where the view shows them first
    (Chapter 11 has the camera’s numbers), and keep birth blocks from sending shots in from
    out of sight.</li>
    <li><b>Hits over and over.</b> A strong monster takes hit points on every tick it overlaps
    the hero, and a hazard block keeps hurting while he struggles in it. A hero pinned in a corner or
    held in a pit of spikes loses his whole life without a chance to move. Leave room to step
    back, let the Hurt sequence push him clear, and never put a hurting block where he can’t
    walk or jump straight out of it.</li>
    <li><b>Killers nobody sees.</b> A hazard drawn like the floor, a mine with no picture, a
    monster born on top of the hero. Mind “becomes” in particular: the new monster is born on
    the very spot of the old, so a monster killed by touching the hero puts its next form right
    on him. Make that next form harmless, or have it move off before it can hurt. And PLAYGAME
    draws only 50 monsters a frame; a 51st on a crowded screen still hurts, unseen.</li>
  </ul>
  <p>When the hero does die, let the player see why. The Die sequence is the picture he gets:
  give it a few frames that show what happened, and keep it short.</p>
  <h2>Footing you can trust</h2>
  <p>Players read a level by its pictures. Whatever looks solid, they stand on; whatever looks
  like a door, they walk into. When the picture lies, they stop trusting every block, and the
  game turns into poking at walls.</p>
  <ul>
    <li><b>Solid looks solid.</b> Draw the ground the hero stands on with a firm top edge, and
    the scenery he passes in front of in softer, darker colors. A cloud that is only scenery
    should never look like the cloud he stood on a screen ago.</li>
    <li><b>Things that look usable are usable.</b> A door that never opens, an EXIT sign with
    no way out under it, a ladder he can’t climb: each one costs the player a few minutes and
    some faith. A link has no picture of its own; it is only a spot on the map, and whatever block
    is there is what players see. So draw a way out at every link, and never draw one where there
    is none.</li>
    <li><b>Look-alike foes act alike.</b> Two monsters drawn the same should do the same thing.
    If a tougher or faster one needs to look like its cousin, give it a different color or an
    outline.</li>
    <li><b>Tricks with a tell.</b> A secret door in a wall (Chapter 17) is a fine surprise when
    something gives it away: a crack, a coin trail, a different shade. A floor that drops away
    with no tell is just a trap.</li>
  </ul>
  <p>The Level check asks about the blocks that fool the eye (<b>Floors and walls that look
  alike</b>) and the ones drawn like the level’s exits that aren’t (<b>Doors that lead
  nowhere</b>); a fair secret you meant can be marked as on purpose.</p>
  ${e("SLIPPERY")}
  <h2>Opposites apart</h2>
  <p>Two blocks that do opposite things (a lift up and a lift down, ice beside glue, a push
  left beside a push right) should never touch, and should never share a color. Put a block of
  plain ground between them, so one tap too many isn’t the difference between the way on and
  the bottom of the map.</p>
  <h2>Everything on the map has a job</h2>
  <ul>
    <li><b>Reachable treasure.</b> Collect every item in your own game at least once. A coin
    sealed behind a log may look like a mistake to players, not a secret; if it is scenery, draw it as
    scenery. An extra life in plain view that no route reaches may feel to the player like a joke
    at their expense.</li>
    <li><b>Shots that spare the prizes.</b> A prize that moves is a monster, and the hero’s shot
    kills a monster weaker than itself. Give moving prizes at least the shot’s power (still under
    100, so the hero’s touch collects them), or a stray shot can destroy the very thing the
    level asks for.</li>
    <li><b>A prize that changes with the clock.</b> Draw two pickups, say a bonus worth 500 and a
    block that gives +1 hit point, and set each one’s <i>Becomes block</i> to the other with a
    <i>Time</i> of 400 ticks (about 22 seconds). Both are picked up by touch, so whichever shows
    when the hero arrives is what he gets, and waiting beside it is a choice: greed or need. A
    player who is hurt will watch for the heart, and a heart in plain sight is no longer a gift.
    (Every copy of a block shares one clock, so all the pairs on the map swap together.)</li>
    <li><b>No padding.</b> An enemy usually earns its place by teaching, testing or guarding
    something. Three more monsters dropped beside the exit tend to make a level meaner rather
    than harder.</li>
    <li><b>Fair speeds.</b> An enemy much faster than the hero is fairest when it is easy to
    read: a straight path, a clear warning. A threat already in reach at the start usually feels
    unfair; give the player a moment to look around, unless the ambush is the joke.</li>
  </ul>
  <h2>Mazes with a compass</h2>
  <p>A maze is fun while the player is making choices and wearing once they are only guessing.
  Unless getting lost is the point, give it landmarks: a different floor color for each wing, a sign at the
  crossroads, the goal glimpsed through a window early on. Keep dead ends short, or put
  something in them worth the walk. Draw your maze on paper and trace the route; if your
  pencil gets lost, so will the player.</p>
  <p>A map that wraps needs landmarks most of all: walk off one edge and the hero comes back at
  the other, and a long road that loops looks the same on every lap. Put something one of a
  kind near the seam, so the player can tell he is going round. A maze of hidden walls is a maze
  of guessing; give it a tell, or keep it short.</p>
  <h2>Show the way out</h2>
  <p>“Where do I go?” is the question that ends more games than any monster. A player who knows
  where he is headed will put up with a lot; one who doesn’t will quit at the first long
  corridor.</p>
  <ul>
    <li><b>Let him glimpse the goal.</b> Show the exit, the castle or the prize early, through a
    window, across a pit, at the far end of the first screen, so the whole level is the way to
    it.</li>
    <li><b>Put the exit on the door.</b> The link belongs on the doorway the player sees, so
    walking into the door is leaving. When it sits a block or two past a door, the hero stands
    in the frame and the game does nothing, and players decide it is broken. Where a voice line
    has to finish first, lengthen the walk to the door (Chapter 5), never the gap behind it.</li>
    <li><b>Make the exit a beacon.</b> Draw the way out unlike anything else in the level, and
    animate it: every copy of an animated block changes at once, so a doorway that glows or a
    flag that waves catches the eye from across the screen.</li>
    <li><b>Signs at the turns.</b> An arrow block at a crossroads costs one block of the 150.
    Letter a few words on a sign where the level asks for something new, and give a street of
    shops a picture over each door (a pizza slice, a floppy disk, a badge) so the player knows
    which one is the way on without trying them all.</li>
    <li><b>Landmarks for the long walk.</b> On a big map, give each part its own color or object
    (the red pipes, the big tree), so a player who comes back to it knows he has been there.</li>
    <li><b>Say the goal.</b> Put it in one line on the level’s intro picture and in the
    instructions: <i>Find the three keys and reach the tower.</i> If you can’t say it in a line,
    the player won’t know it either.</li>
  </ul>
  <h2>Waiting is not a challenge</h2>
  <p>A hazard that blocks the way on a timer (a burst of lightning, a lift, a crusher) should
  usually open again within about three seconds. Longer, and the player is mostly standing
  there. A pause can build tension, and a long one can be right; then give them something to do
  meanwhile: a coin to grab, a foe to dodge.</p>
  <h2>Collecting is not a game</h2>
  <p>A level whose whole job is to gather twenty of something is a chore, however nicely the
  coins are drawn. Give each pickup a reason: it opens a gate, feeds a character, fills a
  meter the story cares about, or sits where reaching it takes a new skill. Then give the
  level one idea of its own, a puzzle, a joke, a change of scenery halfway through, so the
  player remembers it for something besides the count. Sandbox games aim for a first
  play of fifteen minutes or more, and what fills the time is variety: a ride, a puzzle, a
  chase and a quiet room, not more of the same.</p>
  <h2>Detours worth taking</h2>
  <p>The best levels offer a choice: the safe way on, or a risky side path with a prize. Keep
  the side path optional, and its way back as fair as its way in; an extra life that costs two
  on the return trip is a trap with a bow on it. A quiet, easy level just before the last
  stretch lets the player catch their breath and feel how far they have come.</p>
  <h2>Controls the level teaches</h2>
  <p>Arrow keys and a fire key need no lesson; anything more does. Put the lesson in the level:
  a sign that says <i>Press Space to dig</i> right where the first digging is. And make every
  key answer quickly: a sequence whose first frame waits half a second may seem not to respond, however
  good it looks, unless the wind-up is the point of a heavy move. A key kept secret on purpose is
  a different thing, and a fine one: then let a clue lead to it.</p>
  <h2>An ending, not an ad</h2>
  <p>The last screen the player sees is the one they will tell friends about. Make it a real
  scene with its own music and a thank-you, so nobody has to ask whether they won. Only a link
  to scene 1 wins: it plays the game won song and picture, then the high scores. A last level
  that links back to an earlier scene, or a “You win!” sign with play still going on round it,
  leaves the player unsure. Put the words on the won picture itself, in big letters. If you want to
  sell a sequel, say so after the ending, never instead of it. Make the lost screen worth seeing
  too: it is the one players see most, and a friendly joke there sends them back for another
  try.</p>
  ${o("Play it badly:","Your own test runs are too good. Once a level is done, play it again making every mistake you can think of. Each one that leaves you stuck, blind or bored is a fix.")}`},E=`<h2>A flock that holds its shape</h2>
  <p>Maximus has pods of star whales that spell a word or draw a picture on the galaxy chart.
  Each whale is one monster on one cell. Every whale of a kind walks the same path at the same
  speed from the moment the scene starts, so they all move together and the letters never
  smear. They also share one power, and monsters of equal power pass through each other, so
  the pod never thins itself out. Leave the space a pod swims through empty of other
  monsters, and count it against the map’s 200.</p>
  ${e("FLOCK")}
  <h2>A pulse that runs down the screen</h2>
  <p>The data bus rides in Virus Blaster are one screen that never scrolls, painted in
  perspective. Below the horizon every cell of the board is the same ring of eight blocks, two
  lit and six dark, a tick each. The trick is where each row joins the ring: a row nearer the
  ship starts a little further round it. A lit band leaves the horizon and sweeps down toward
  the player every eight ticks, and because the steps between rows aren’t even, it seems to
  gather speed as it comes. No monster moves at all.</p>
  <ul>
    <li><b>The same idea, sideways,</b> is a string of chasing bulbs over a door, or a light that
    runs along a fuse.</li>
    <li><b>One ring, any number of places.</b> Each starting point is just another block of the
    same ring, so the effect costs eight blocks however big the screen is.</li>
  </ul>
  <h2>Locks on the power ladder</h2>
  <p>In Teddy’s Little Big Adventure, his tricks each send out a little monster of their own: a paw for a high five, a whirl
  for a spin, a ball of fluff that rolls, a heart for a sit. On the fifth level each person or
  thing in the way is a lock, set just under the trick meant for it on the power ladder. The
  hand wanting a high five is 108 and the paw is 110; the pins are 117 and the fluff 120; the
  heart, at 130, is the only trick strong enough for the clown who wants a sit. The stronger trick
  wins each meeting and the lock becomes its reward: a ticket, a fallen pin, a happy friend.</p>
  <ul>
    <li><b>A stronger trick opens every lock under it.</b> Lay out the ladder on paper first, and
    keep the most useful trick for the top step.</li>
    <li><b>Teach each trick before its lock.</b> A player who has used the whirl once will think
    of it when a lock seems to want a spin.</li>
    <li><b>A counter makes a ladder too.</b> Give bronze, silver and gold keys the amounts 1, 2 and
    3 on one counter, and doors the prices 1, 2 and 3. A bigger key opens every cheaper door, and
    each door takes only its price, so the change stays in the counter.</li>
  </ul>
  ${e("POWERKEY")}
  <p>A price can also be paid in coins. Give a coin the Money counter (number 3) and a stall block the same counter with a negative amount: touching it takes the price, and with too few coins nothing happens. The stall turns into a block that hands over the item.</p>
  ${e("SPENDIT")}
  <p>A shop is the same idea on a shelf. Give a coin the Money counter (number 3) and each stall block the same counter with a negative amount for its price: touching it takes the price, and with too few coins nothing happens. The stall turns into a block that hands over the item and then into a SOLD counter, so each thing can be bought once.</p>
  ${e("KITSSHOP")}
  <h2>A set copied for one level</h2>
  <p>Snowbound’s long sled run needed more blocks than its full 150. The answer was a copy of
  the set for that one scene, with the blocks the hill never shows (the houses, the mall, the
  arcade) drawn over as snowbanks, birches and distance boards. Every block it shares with the
  other levels keeps its number, so the sled and the snow behave the same. Any scene can load
  its own set this way (Chapter 2).</p>
  <p>The same trick keeps keys apart. Counters carry from level to level, so a spare gold key is
  still in the pocket two levels later. A level whose doors must not take it gets keys and doors
  on another special counter, in a copy of the set made for that level.</p>
  ${e("SPECCNTR")}`,O={id:"tricks",title:"Tricks From the Sandbox Games",head:"13. Tricks",html:`${a(13,"Tricks From the Sandbox Games","Every trick here shipped in a Sandbox game, and every one is made of plain Game-Maker parts: block settings, monster settings and character sequences. No special tools, only clever wiring.")}
  <h2>Wind you can see coming</h2>
  <p>The back lot in Teddy’s Little Bigger Adventure has gusts over the rooftops. Each gust is
  a ring of three air blocks that animate into one another:</p>
  <table>
    <tr><th>Block</th><th>Gravity</th><th>Lasts</th><th>Looks like</th></tr>
    <tr><td>Blowing</td><td>right</td><td>28 ticks</td><td>streaks across the sky</td></tr>
    <tr><td>Calm</td><td>down, like any air</td><td>26 ticks</td><td>plain sky</td></tr>
    <tr><td>Stirring</td><td>down</td><td>12 ticks</td><td>a few faint wisps</td></tr>
  </table>
  <p>The stirring frame is the warning: two thirds of a second to brace. The windsocks on the
  vents run the same three-block ring with sock pictures, limp, lifting and straight out. Since
  every copy of a block keeps the same clock (Chapter 2), each sock stands out at the exact
  moment each gust blows, all over the map. The vents are solid, and the cell just downwind of
  each one is left as calm air: a shelter to wait in.</p>
  <ul>
    <li><b>Updrafts.</b> A fan lying face up, with a column of blocks above it that pull up.
    Two pictures of rising streaks swap every 3 ticks, so the column looks like it moves.</li>
    <li><b>A current.</b> Creek blocks pull left. The deep ones pull left <i>and</i> up, so a
    swimmer floats and is carried back downstream.</li>
    <li><b>Quicksand.</b> A solid block that becomes the next one when touched, in a long
    chain that ends in an open hole. Standing on a block touches it every tick, so the sand
    sinks only where the hero stands still.</li>
  </ul>
  ${e("GUSTS")}
  ${e("QUIKSAND")}
  <h2>Vehicles are characters</h2>
  <p>Game-Maker has no vehicles, but each scene names its own character file in the
  Integrator. A car, a sled or a submarine is just another <code>.CHR</code>, and a link into a
  scene that uses it puts the hero in the driver’s seat. Score, counters and inventory ride
  along.</p>
  <ul>
    <li><b>Driving THE CHEZ.</b> In Quest for the Round Tuit, the Dawdle Flats load
    <code>CHEZ.CHR</code>. Its arrow sequences move 5 pixels every tick. Hit points stand for the battery’s charge, and Space is a horn: its frame gives birth
    to a honk monster that flies ahead and clears gulls out of the road.</li>
    <li><b>Sledding.</b> Snowbound’s sled has momentum on every sequence. Steering moves a pixel
    a frame, braking moves 2 up, and a push is one shove per key press, so holding the key
    can’t wind the speed up forever. The hill does the rest. A slope block pulls up and down at
    once; the pulls cancel, so the sled keeps whatever speed it has. Steep blocks pull down,
    and moguls pull up for a bump.</li>
    <li><b>A craft for every world.</b> Maximus flies a pod, a diver or a rover, chosen by each world’s
    scene. Every thrust has momentum and moves a pixel a frame, for that drifting feel; a dash
    is momentum and once per press, a quick shove of 7 and then 4.</li>
  </ul>
  ${e("WHEEL")}
  <h2>Two planes and a focus key</h2>
  <p>Depth Perception plays each level in two planes, near and far. They are two scenes built
  from one layout, each with its own map, block set and character, both on one palette. A
  focus ring is a link from one plane’s scene to the same spot in the other’s. What is sharp
  is solid; the other plane’s walls are drawn blurred, at half strength, and have no solid
  sides. A bridge that is floor in one plane is a void in the other (its touch takes 999 hit
  points), so you can’t cross it in the wrong focus.</p>
  <p>Each change of focus loads a map fresh, so a lens can be picked up again. Depth gives each
  level’s lens gates a different special counter, so a lens carried twice can’t open a later
  level’s gate.</p>
  <h2>Isometric art on a square grid</h2>
  <p>Some Depth rooms are drawn as if seen from a corner. The game is still the plain grid: a
  20 × 20 block holds one map cell, and its floor is drawn as a 20 by 10 diamond in the lower
  half of the block, with a cube as a hexagon standing on it. What is solid is still what the
  cell says, so keep every wall’s footprint inside its own cell, and the eye and the engine
  agree.</p>
  <h2>Timed hazards that warn first</h2>
  <p>A hazard on a timer is an animation ring of at least three blocks: rest, warning, danger,
  and back to rest. In I Screamed, She Smirked, a fog machine rests 32 ticks, rumbles for 12
  with wisps at the grate and a red pilot light, then puffs for 22 ticks, hurting 6. The whole
  round is 66 ticks, under four seconds.</p>
  <ul>
    <li><b>A warning of 10 ticks or more</b>, about half a second, drawn in a color that only
    means “about to”.</li>
    <li><b>Danger shorter than safety,</b> and the whole round about 3 seconds, so nobody
    stands waiting (Chapter 12).</li>
    <li><b>Floors that flicker out.</b> Depth’s pulse panels are floor for 28 ticks, flicker
    between warning and steady every 4 ticks, then vanish for 40.</li>
    <li><b>Every copy fires at once.</b> For a row that ripples, give each place its own block
    numbers, with each ring starting at a different frame.</li>
  </ul>
  ${e("WARNFRST")}
  <h2>Word locks and counter gates</h2>
  <p>KEEP IT BRIEF! counts the words a reader carries in the money counter, renamed. A word
  lock is a solid turnstile that takes 20 and becomes an open turnstile; walking through the
  open one gives the 20 back. So the lock only <i>looks</i>: it opens for anyone carrying 20
  words, and spends none. A gate that should keep what it takes simply leaves out the refund.
  Counter gates are the same rule from Chapter 4: in Teddy’s Little Bigger Adventure a clue
  adds 1 to a special counter, and the car door takes 1 and swings open.</p>
  ${e("WORDLOCK")}
  <h2>Hurts that happen once</h2>
  <p>A block or a strong monster hurts on every tick the hero touches it. Four ways to make it
  sting once:</p>
  <ul>
    <li><b>Become a look-alike.</b> Snowbound’s rocks take 8 hit points and become the same
    picture, still solid, with no hurt. A sled stopped against a rock isn’t hurt again.</li>
    <li><b>Run dry.</b> The fog machine’s puff becomes a dry vent where it was touched, so
    standing on it costs only once.</li>
    <li><b>Keep the monster under power 100.</b> It hurts, then is gone or becomes its next
    monster. Depth’s henchmen are all power 90 to 98; only the boss stays.</li>
    <li><b>A stinging frame.</b> In Where’s the Remote?!, one frame of each monster’s
    animation carries the hurt and shows for a single tick; the rest are harmless.</li>
  </ul>
  <p>A solid hazard needs one more care. A solid monster puts a hero it touches right beside
  it, on the side it pushes him out of, and never looks for walls there. Its Top side
  (SOLTOP) pushes him <i>under</i> it, so a hazard with that side set sinks a hero who lands on
  it into the floor, where it goes on hurting him. Leave out SOLTOP on hazards (keep SOLBOT and
  the sides): he still stands on its back and is pushed off its sides. And end a pacer’s path
  two blocks short of a wall (one is sometimes enough; the Level check tells you), or one that
  walks up against it shoves him inside it.</p>
  <h2>Cameos that say hello once</h2>
  <p>Certified Rat Tickler has old friends from other Sandbox games wandering through. Each is a
  monster of power 50 whose block is worth 250 points. On the first touch it pays and becomes
  its “off” copy: the same pictures with no points, power 100 so it isn’t popped, a short path
  and a lifetime of 36 ticks, so it waves and strolls off. Without that swap, a cameo of power
  100 would pay out on every tick the hero stood beside it.</p>
  <h2>Bosses in stages</h2>
  <p>“Becomes” is the boss maker (Chapter 11). Three ways the Sandbox games use it:</p>
  <ul>
    <li><b>One monster per hit.</b> A Virus Blaster boss’s weak point is a chain of monsters,
    each becoming the next when shot. Each hit is worth 20; the last is worth 1,000 or more
    and becomes an explosion. With three hits left, its pictures change to a damaged tint. The
    final boss splits: its top becomes a core that needs 4 more hits, and its bottom becomes a
    harmless flicker for 16 ticks, then a shard that hunts.</li>
    <li><b>Stages that change the fight.</b> Depth’s Count Polygon has five stages, each a run
    of whole, cracked and shattered monsters, with swoops wider and faster every stage. After
    the second he steals a lens, and the fight moves to the far plane.</li>
    <li><b>A breather between blows.</b> Maximus’s Heart Eye becomes a stunned eye, too strong
    to touch for 36 ticks while it rises, then wounded, reeling and failing (spiked, and
    faster). Last comes a light worth 10,000 that heals the hero. Six stages use six of the
    set’s 64 monsters: count them early.</li>
  </ul>
  ${e("PHASES")}
  ${E}
  ${o("Borrow freely:","Open any Sandbox game in the editor and look at the blocks and monsters behind a trick you liked. Everything above is there to be read, setting by setting.")}`},C={id:"check",title:"The Level Check and the Walkthrough Bot",head:"14. The Level Check",html:`${a(14,"The Level Check and the Walkthrough Bot","This edition’s editor can play your game for you. It won’t tell you whether the game is fun, but it will find the traps, the prizes nobody can reach and the hurts nobody can dodge, long before a friend does.")}
  <h2>What the Level check plays</h2>
  <p>Open a map and press 🩺 <b>Level check</b>. The bot plays the scene that uses the map, on
  the same engine the player uses, entering where play enters it and carrying the hit points,
  score and inventory the hero would bring. From every place the hero comes to rest it tries
  every move the character has, each place once. Choose how long it may play: Quick (15
  seconds), Thorough (a minute) or Exhaustive (four minutes). When it is done it says how many
  places it tried, and whether it tried every move from every one or the time ran out first.
  While it plays, a bar fills and says how long is left: <i>up to</i> the time you chose, or
  <i>about</i> so many seconds once the places still waiting to be tried are clearly running
  out, with the count of places tried so far.</p>
  <h2>The heat map</h2>
  <p>The map is colored where the bot went, from dark for a moment to bright for a long while,
  with a legend beside it. Switch it to <i>how soon it got there</i> to see the order a player
  is likely to find things. The useful part is what stays <i>uncolored</i>: an uncolored room is
  somewhere the bot did not reach. Check whether it missed a route, needed more time, or found a
  real access problem. Turn the heat map and the
  marks on and off with the boxes above the list. Tick <b>Gray level</b> to draw the map in
  shades of gray, from the lightness of each color in the scene’s palette, so the heat map’s
  colors stand out from the blocks under them. It only changes how the editor shows the map, and
  the editor remembers it for every map. The heat map fills in about once a second while the
  check runs, so you can watch the bot spread out from the start, and its deaths appear as it
  finds them.</p>
  <h2>The marks</h2>
  <p>On top of the heat map: a white <b>✕</b> where the hero died (the tooltip says how many
  tries ended there), red <b>hatching</b> over a stuck spot, a cyan <b>○</b> on each cell a
  finding is about, and a dashed yellow square around the place you picked from the list.
  Rest the pointer on a cell and a tooltip says what each mark there is, and what the heat
  color means (<i>Time spent: a lot</i>). The legend under the heat map lists each kind of
  mark with how many there are; press one to go to the next, and its meaning is read out, so
  the marks work from the keyboard too. Zoomed out to 25% or 10%, the marks become small
  filled squares in the same colors, and the tooltip finds the nearest one.</p>
  <h2>Your own heat map</h2>
  <p>The bot tries everything, but it can’t tell which places matter. Press <b>▶ Play and
  record</b> and play the scene yourself: it opens at this scene, and everywhere your hero goes,
  and how long it stays, is kept as your own heat map, saved with the project’s editor notes
  (never in the game’s files) and added to each time you play. The same session can keep your
  play for the walkthrough too (see below). Then choose what to <b>Show</b>: the bot’s
  heat map, yours, both combined, or <b>Compare</b>, which colors the places only the bot
  reached orange, the places only you reached blue, and the places you both reached light
  gray. A line underneath says how much of the bot’s ground you’ve covered (a place counts when
  you passed within a block of it) and how many areas it found that you haven’t;
  <b>→ Next place you haven’t been</b> takes you to each. Keep playing until the orange is
  only where you don’t mind a player not going. <b>Clear my heat map</b> starts yours again.</p>
  <h2>Stuck spots</h2>
  <p>Places the hero can reach but never leave are hatched, with the likeliest reason: a pit
  with no way up, a drop that only goes one way, or a lock whose key can no longer be had. A
  place is only called stuck once every place it leads to has been tried, so a run cut short
  by the clock doesn’t cry wolf; it says how far it got instead.</p>
  <h2>Findings</h2>
  <p>The list below the map holds about thirty kinds of finding: blind drops, hazard art smaller
  than its cell, opposite blocks side by side, hurts that hold the hero, scores that pay every
  tick, counters that run out before their gate, crowded screens, chasers that never let go,
  keys never taught, long waits, a hero who walks sideways facing you and a monster that never
  turns round, and more. Each is marked a problem, a warning, a suggestion or a note; the
  buttons at the top show one kind at a time. Problems and warnings are facts the bot
  measured: the hero can get stuck here, this exit is never reached, this block hurts through
  its whole cell. 💡 Suggestions, and many notes, are design habits instead (crowded screens,
  an idea used once, a chaser that never lets go, a long scene, a slow hero): prompts to look
  again, not rules. Many great games break one on purpose, and the check can’t know which. Click a finding to go to its place on the map.
  Each one says, in a line, why players mind, and its 📒 link opens the part of this guide that
  explains it. When you have looked at a finding and it is how you want it (a boss meant to
  hold on, a swarm meant to overwhelm, a maze meant to confuse), <b>✓ That’s on purpose</b> on
  a suggestion, or <b>✓ Mark as checked: it’s meant to be</b> on anything else, takes it out of
  the list, the counts, the badges and Before You Upload; <b>N accepted · show</b> lists those
  again, each with a button to put it back.</p>
  <h2>The report, and a checklist to fix from</h2>
  <p>A long list is easier to work through with room to read. <b>📋 Open as a report…</b>
  shows every finding of the map’s last check in a large window, grouped into problems,
  warnings, suggestions and notes, each with its scene and cell, why players mind, its 📒
  link and its fix and accept buttons. The same buttons pick one kind at a time; <b>Show
  accepted</b> lists the ones you kept as they are. Pick a finding to close the report and go
  to it on the map. Two checklists come with it: <b>⬇ Download CSV checklist</b> saves one row a
  finding (kind, check, scene, map, x, y, what, the measures, why it matters, the guide’s
  section, and whether it is open, accepted or on purpose) for a spreadsheet, and <b>🖨 Print
  or save as PDF</b> prints them with a box to tick by each; your browser’s Print can save
  the page as a PDF. In Before You Upload, <b>📋 Every map’s findings as a report…</b> does the
  same for the whole game at once.</p>
  <h2>✨ Fixes, and Undo</h2>
  <p>Many findings offer a one-click fix: stretch the hazard art to fill its cell, outline a
  monster in a standout color, add a ladder out of a pit, open a one-block gap, shorten a
  timed cycle to about 3 seconds, speed up a slow lift, add the keys to the instructions,
  put landmarks at a maze’s crossroads, or halve the healing in the second half. A fix changes
  your files at once. <b>↶ Undo fix</b>, beside <b>▶ Run check</b>, takes back the last fix,
  and the one before that. Run the check again to see the difference. Under <b>Make…</b>, select an area at
  least 7 blocks each way and the panel builds a maze in it, with landmarks at its crossroads;
  the map’s own Undo takes that back.</p>
  <h2>Badges in the other editors</h2>
  <p>The block, monster and sound editors run the same file checks on every scene that uses the
  file. When one finds something about the item you are editing (a block whose hurt is drawn
  too small, a monster the color of the scenery, a long sound that plays all the time), a small
  badge beside it says what, why players mind, and where in this guide to read more. The
  badges only read; they change nothing, and update each time the editor saves.</p>
  <h2>A checklist that ticks itself</h2>
  <p><b>☑ Before you upload…</b>, in the map’s Level check and in the Integrator, opens
  Appendix B as a checklist. A line the checks can judge completely ticks itself when nothing
  is found. A line they can judge only in part says “nothing found; the rest is your call”. A
  line with findings says how many, and of which kinds. The lines about play need a Level
  check on every map first, and some lines (smooth loops, a demo that plays the same twice,
  three friends) only you can tick. Your ticks are kept with the project’s editor notes, never
  in the game’s own files.</p>
  <h2>🤖 Make a walkthrough</h2>
  <p>In the Integrator, <b>🤖 Make a walkthrough…</b> lets the bot play the whole game, from the
  title’s first link, scene by scene. In each scene it tries bot styles from quickest to most
  thorough until one reaches a scene it hasn’t seen yet without dying:</p>
  <ol>
    <li><b>Run and hop</b>, in scenes with gravity, or <b>Maze walker</b>, in scenes without.</li>
    <li><b>Every move</b> the character has.</li>
    <li><b>Every move, waiting out hazards</b> at every place, for timed blocks and lifts.</li>
    <li><b>Collect everything, then go on</b>, for a side room whose prize is the point, or a
    way on that opens only for what the hero carries.</li>
  </ol>
  <p>The path it found is played again on the engine from the scene’s start, and the keys are
  kept tick by tick, so the walkthrough plays back exactly. Pick the time for each scene, from
  30 seconds to 10 minutes. Where no style gets through, it stops and says so, lists the styles
  it tried, and leaves its heat map on that scene’s map for you to read. The walkthrough ends
  where the bot got to; it never pretends.</p>
  <p>A stop is not proof of a broken game. Riddles, secret doors and tight timing beat the bot
  often: of the 31 games on the original CD, it plays 2 from start to end. It is best at
  telling you a scene you thought was easy isn’t.</p>
  <h2>Your own play, and watching the bot</h2>
  <p>Where the bot can’t get through, or plays a scene in a way you would rather not show, play
  it yourself. <b>▶ Play and record</b>, in the map’s Level check, is one session for both
  jobs: while you play, your heat map grows, and the keys you press are kept tick by tick. A
  death starts the scene over. When you reach an exit, play stops and offers <b>✓ Keep this
  play for the walkthrough</b> beside <b>↺ Try again</b>; keep another try later and it
  replaces the one before. <b>■ Done</b> ends the session. In <b>🤖 Make a walkthrough…</b>,
  each scene you kept a play of can use <b>Mine</b> or <b>Bot</b>. The bot plays your keys
  from wherever the walkthrough has got to and plays the rest itself, and the whole
  walkthrough is checked on the engine as before. If your play no longer reaches an exit (you
  changed the map since, or the hero arrives carrying something else), the list says so and
  the bot plays that scene instead.</p>
  <p><b>▶ Watch the bot</b> plays the bot’s route through this scene in the walkthrough player,
  with play, pause and a seek bar: the game’s walkthrough, started at this scene, or, when it
  has no route here yet, one the bot makes for this scene alone. A route made that way stays
  as it was when you edit the map, so the panel says <i>The map changed since the bot’s route
  was made</i>, and <b>↻ Make the bot’s route again</b> lets it look again. <b>▶ Watch my
  play</b> plays yours the same way, so you can compare the two.</p>
  <h2>First steps for a first game</h2>
  <p>A game started as <b>▶ Ready to play</b> comes with <b>🎓 First steps</b>, beside Play
  test: ten small jobs that make the starter yours. Play it, change a color, draw a block,
  build the level, change the hero and a monster, give it a sound, add a way to win and a Game
  won screen, then run the Level check. Each step ticks itself the moment the game changes,
  opens the file to do it in, and links to the page of this guide that explains it.</p>
  ${e("FIRSTGAM")}
  <h2>What is still your job</h2>
  <p>No check can tell you whether the first minute is fun, whether the story hangs together,
  whether a joke lands, or whether the boss is a good fight rather than merely a long one. The
  bot finds what is broken; your friends find what is dull. Use both.</p>
  ${o("From the editor to this page:","Every 📒 link opens the web Guide’s Ultimate page in a new tab, turned to the right chapter, with the section to read named in the link’s tooltip. The addresses look like <code>#/help/ultimate?chapter=levels</code>, so a link to any chapter can be shared.")}`},I=`<h2>Ideas the limits leave room for</h2>
  <p>No Sandbox game has shipped these yet. Each one rests on the clock and the ceilings above,
  and each is worth a test level in DOSBox before a whole game leans on it.</p>
  <ul>
    <li><b>A beat on whole ticks.</b> Choose a tempo whose beat is a whole number of game ticks:
    6 ticks is about 182 beats a minute, 8 is 136½, 12 is 91 and 16 is about 68. At eight song
    ticks to the game tick, an 8-tick beat is 64 ticks of the song. Blocks, births and lifetimes
    then land on the beat, every time.</li>
    <li><b>Let the picture judge.</b> A note block whose ring is worth points only while it is
    lit scores a touch made in time and nothing otherwise. Give the lit part at least two ticks,
    better three, since a press can arrive a tick late. Make what the player sees the cue, keep
    the music soft-edged (held chords, not one hard downbeat to hit), and start with a bar that
    doesn’t count.</li>
    <li><b>A key for each line of a staff.</b> A frame that fires a monster places it a number
    of rows from the hero set by the frame’s up-and-down move, and doesn’t move him. So each of
    several keys can fire into its own row, and since every sequence has a sound slot of its
    own, each key can sound its own note as well.</li>
    <li><b>A chord is a channel per note.</b> With six melody voices beside the drums, a
    three-note chord leaves three for a tune, a bass and one more. For a stab under the FM band,
    try a speaker tune that hops between three pitches over its 36 steps.</li>
    <li><b>Three layers at once.</b> The song, a speaker part and a voice clip can all sound
    together: a beeper riff over the band, and a sung word at the moment that matters.</li>
    <li><b>One phrase per scene.</b> A song starts over with every scene and every death, so a
    long piece can be a chain of short scenes, each with its own phrase, passed along by doors
    on a clock (Chapter 17, “Doors on a clock”). Leave a breath at the end of each phrase for
    the fade.</li>
    <li><b>A hero who keeps time.</b> Give every sequence, standing included, the same move each
    tick, and the hero crosses the map at a fixed number of blocks a beat: a playhead running
    over a score drawn in blocks.</li>
    <li><b>A demo that plays itself.</b> Record a clean run of a timing level and it plays
    under the title on its own, as long as it fits in 1,000 key changes.</li>
  </ul>`,L=`<h2>One clock under everything</h2>
  <p>PLAYGAME speeds up the PC’s timer chip eight times over, to about 146 beats a second.
  Every beat plays the next bit of the song and the next step of a speaker sound. Every
  eighth beat is a <b>game tick</b>, about 18 a second, or 55 thousandths of a second each:
  the hero, the monsters, block animations, birth times and lifetimes all move on those. So a
  game tick is exactly eight ticks of the song, and the two never drift apart while a scene
  plays.</p>
  <ul>
    <li><b>Keys count on ticks.</b> A press waits for the next tick, so a player can be up to one
    tick late without knowing it. A key held down is not pressed again; whether its sequence goes
    on repeating is the sequence’s own setting (Chapter 15, “A tap is not a hold”).</li>
    <li><b>Jumps hold the keys back.</b> While a sequence that can’t be interrupted is past its
    first frame, new presses wait their turn until it ends.</li>
    <li><b>A touch sees the picture showing.</b> When the hero touches an animated block, he gets
    the settings of the frame on the screen at that tick, not of the block you placed. Points,
    hurts, counters and refusals can all change from one frame of a ring to the next.</li>
    <li><b>The song starts first.</b> A scene’s song begins before its map is drawn and faded in,
    and the game clock starts after the fade. The music and the blocks may sit a few ticks apart,
    by an amount that depends on the PC. Anything you want judged to the tick, judge with blocks,
    births and lifetimes, never by ear, and play it in DOSBox before you build on it.</li>
  </ul>
  <h2>Every file’s ceiling</h2>
  <table>
    <tr><th>Part</th><th>The most PLAYGAME takes</th></tr>
    <tr><td>Background blocks (<code>.BBL</code>)</td><td>150 a set, 20 × 20 pixels</td></tr>
    <tr><td>Monster and character blocks</td><td>100 (<code>.MBL</code>), 50 (<code>.CBL</code>)</td></tr>
    <tr><td>Monster kinds (<code>.MON</code>)</td><td>64, each with 20 pictures that play and a path of 10 corners</td></tr>
    <tr><td>A map</td><td>100 × 100 cells that wrap both ways, 200 monsters, 50 of them drawn</td></tr>
    <tr><td>The hero (<code>.CHR</code>)</td><td>20 sequences of 10 frames, 10 things carried, 11 pixels a tick at most</td></tr>
    <tr><td>A scene</td><td>20 links out</td></tr>
    <tr><td>Sounds (<code>.SND</code>)</td><td>30 slots; a speaker tune is 36 steps, a quarter of a second</td></tr>
    <tr><td>Voice clips (<code>.VOC</code>)</td><td>one playing at a time, each under 64 KB</td></tr>
    <tr><td>Songs (<code>.CMF</code>)</td><td>146 ticks a second; nine voices, or six and the drums</td></tr>
    <tr><td>Text pages</td><td>16 lines of 30 characters</td></tr>
    <tr><td>A demo (<code>.REC</code>)</td><td>1,000 key changes</td></tr>
  </table>
  <p>Three sounds can play at once: the song, one speaker tune and one voice clip. A new speaker
  tune replaces the one sounding, and a new clip cuts off the last clip.</p>`,M={id:"players",title:"Designing for Every Player",head:"15. Every Player",html:`${a(15,"Designing for Every Player","You know your game by heart and your fingers know its keys. The player meets it cold, perhaps with slower hands. Here is how to keep the small surprises from turning into a reason to quit.")}
  <h2>A tap is not a hold</h2>
  <p>PLAYGAME plays a sequence again, from its first frame, if its key is still down when the
  last frame ends. Each frame shows for its pause in ticks (a pause of 0 counts as 1), and a
  tick is 1/18.2 of a second, about 55 thousandths. Most walks can be interrupted, so letting
  go stops the hero at once: a tap walks as far as it is held, which suits a smooth walk. A grid
  walker, though, ticks <b>Always finish the sequence</b> so each step lands squarely on a block,
  and such a sequence holds back every key event until its first frame comes round again. A
  step of five frames at pause 1 shows its first frame for one tick, and a quick tap lasts
  longer than that: the key let go waits for the next step, and the hero takes two for one
  press. Hold the first frame instead (5 ticks or more), and make the rest of the step one or
  two quick strides: a tap under about a quarter of a second then walks one block, and a held
  key still walks on. A longer last frame doesn’t help, since the key let go still waits for the
  next first frame. A move that should happen once a press, like a shove, wants
  <b>Once per key press</b> instead. The Level check works the time out for you.</p>
  <h2>Scenery that looks collectable</h2>
  <p>Players reach for anything drawn like a prize. A coin painted into the wallpaper, or a
  heart on a shelf that gives nothing, will be walked into, jumped at and puzzled over, and then
  reported as a bug. Draw scenery so it can’t be mistaken: another color, a frame round it,
  a picture that isn’t a prize at all. The Level check compares every background block that does
  nothing with the prizes of its scene (points, money, a life, something to carry) and asks
  about the look-alikes. A decoy can be a fair joke, if the game tells it once.</p>
  <h2>A safe start</h2>
  <p>Give the player a moment when a scene begins. Keep foes a few blocks from where the hero
  comes in, and watch the ones that walk: a monster whose path passes the door a second later
  is as close as one standing beside it. Leave the cells beside the entry free of anything that
  hurts, too. The Level check asks about all three. A boss room where the boss is waiting is a
  fine exception: mark the finding as on purpose.</p>
  <h2>The first ten minutes</h2>
  <p>A new player makes up his mind about a game in its first level, often in ten or twenty
  minutes, and seldom gets to the level you are proudest of if the first one is the hardest.
  Make level 1 a lesson that feels like play:</p>
  <ul>
    <li><b>One thing at a time.</b> Walk, then jump, then the first pickup, then the first foe,
    each with room to get it wrong.</li>
    <li><b>Nothing that can kill in the first screen.</b> The first death should come after the
    player knows the keys.</li>
    <li><b>A course to practice on.</b> A short training level, or a first level the instructions
    call practice, takes the fear out of trying every key. Maximus starts on a training deck that
    teaches walking, hopping, picking up, shooting, paying a door and riding a lift before the
    first planet.</li>
    <li><b>Done in minutes.</b> A first level the bot finishes in under a minute or two takes a
    newcomer several times as long. Keep it short, and save the long levels for players who
    already like the game.</li>
  </ul>
  <h2>Teach the controls in the first room</h2>
  <p>Few players read the instructions before they play. Any key beyond the arrows that the
  hero needs to grab, use or fight belongs where it is first needed: a sign by the first thing to
  pick up (<i>Stand on it and press G</i>), a line on the first level’s card, a word on the menu’s
  instructions at the very least. The Level check looks for the key’s name on the first level’s
  card and on the menu’s story and instructions, and asks when it finds nothing. It can’t read
  the words drawn on a sign block, so mark a key taught that way as on purpose.</p>
  <h2>Ways back, and no softlocks</h2>
  <p>Every drop, every door that closes behind the hero and every link with no link back is a
  one-way move. One-way is fine when it is plain: a chute everyone can see is a chute. It is a
  trap when something the rest of the level needs can be left behind: the keys still in the
  house when the door swings shut, the twentieth page in a level already finished. Then the
  player finds out only at the end, and the only fix is to start over.</p>
  <ul>
    <li><b>Close the way out until it is safe.</b> A door that opens only once the keys are
    carried, or a friend who says <i>you’ll need the keys</i>, costs one block.</li>
    <li><b>Or keep the way back open.</b> A ladder, a stool, a second link.</li>
    <li><b>Side doors never spend the key to the way on.</b> If a key opens an optional room
    and the main door too, a curious player who opens the side room first is stuck. Give each
    lock its own kind of key, or put enough keys out for every lock.</li>
    <li><b>Count what the end asks for.</b> If the last gate wants 20 pages, the game must hold
    at least 20 that a player can still reach when they get there, or the earlier exits must
    stay shut until the pages are found.</li>
  </ul>
  <p>The Level check’s bot remembers what the hero carries everywhere it goes. It marks each
  place it can’t get back to the start from (dismiss the ones you meant), and when it plays a
  whole game it plays it again leaving behind everything it can, and says where going on
  without something leaves the end out of reach.</p>
  ${e("TRYAGAIN")}
  <h2>Designing for slower hands</h2>
  <p>The bot presses keys to the tick. A jump that needs <kbd>↑</kbd> and <kbd>→</kbd> at the
  same moment, a key let go within a tenth of a second or a hold of exactly so long are easy for
  it and hard for many people. Tick <b>Slower hands</b> in the Level check and the bot plays
  again with one key at a time and at least 300 thousandths of a second between changes (set
  your own pace beside it); where it can no longer finish, it says where. The fixes are usually
  small: a jump that already carries sideways, a step to climb instead of a leap, a ledge a
  block wider, a lift that waits.</p>
  ${o("Hand it over:","Watch someone who has never seen the game play the first level without a word from you. Every place they hesitate is a sign, a step or a safer start you still need.")}`},D={id:"limits",title:"Where Game-Maker Runs Out",head:"16. Where It Runs Out",html:`${a(16,"Where Game-Maker Runs Out","Some of Game-Maker’s limits are printed on the box. Others show only on a real PC with real memory, or when a game fills every slot. These are the ones the Sandbox games ran into, and the ways round them.")}
  <h2>Animations and DOS memory</h2>
  <p>PLAYGAME reads an .FLI through one buffer of up to 65,520 bytes, and asks for less, two bytes
  at a time, when memory is short; a game started from another program has less to spare. Each
  frame is a handful of chunks (a palette, the changed lines, a full picture packed in runs), and
  the player draws a chunk only when the <i>whole</i> chunk fits in that buffer. A chunk that
  doesn’t is drawn from whatever the buffer holds: streaks and garbage. So the limit is not the
  file’s size. It is the biggest single chunk of a single frame, which is nearly always the first
  full picture, or a cut to a new scene in the middle. Keep every chunk under 16,000 bytes and
  it plays on any PC that can run the game.</p>
  <figure><img src="./ultimate/carl-dos.webp" width="320" height="200" class="ug-pix" alt="A Fly Named Carl’s title screen in DOSBox: the title and the byline are sharp, but the picture behind them is streaked and smeared, with Carl only a pale ghost."><figcaption>A Fly Named Carl’s first title in real DOS, before the fix. The title and the byline came later in small chunks and drew right; the big first picture behind them didn’t fit and is streaked. DOSBox screenshot by Lewis Moten.</figcaption></figure>
  <p>The first frame matters most. Each later frame paints only what changed, so garbage under a
  moving part heals as the animation plays, while garbage under a part that never moves stays
  until the end.</p>
  <p>You are in good company. Of 190 animations in the community games kept in the Internet
  Archive’s Game-Maker Archive collection, 123 have a chunk over 16,000 bytes, and so do RSD’s own
  text-box animations. On a PC with memory to spare they played; started from another program,
  or on a machine short of memory, they come back streaked.</p>
  <h2>The other FLI faults</h2>
  <ul>
    <li><b>A line of 128 changes or more.</b> The player reads a line’s count of changes as a
    signed byte, so 128 reads as a huge negative number and the frame goes wrong whatever the
    memory. Busy dithering on a line that changed everywhere is the usual cause.</li>
    <li><b>An all-black chunk.</b> Some animators write a frame of plain black as a special
    chunk. PLAYGAME’s screen driver has no routine for it and crashes. Draw black as an ordinary
    picture instead.</li>
  </ul>
  <p>The health check and Before You Upload warn about all three, file by file. The fix for each
  is the same: open the animation in the Animation editor and save any change (even one you
  undo). The editor writes it again in pieces DOS reads, and it looks exactly the same.</p>
  <h2>Ways round the memory limit</h2>
  <ul>
    <li><b>Several chunks in one frame.</b> A frame may hold more than one chunk of changed lines:
    split a big picture into bands, top to bottom, all in the same frame. The player can’t tell;
    it is what the editor’s writer does.</li>
    <li><b>Animate only part of the screen.</b> A still backdrop with one moving corner makes
    small frames after the first.</li>
    <li><b>A plainer picture.</b> A smaller picture, fewer colors or less dithering packs into
    longer runs.</li>
    <li><b>Build the first picture over a few frames.</b> Draw the middle in the first frame and
    the edges in the next two, or a quarter at a time, at full speed: it reads as one picture
    arriving.</li>
  </ul>
  <h2>Tips for animators</h2>
  <ul>
    <li><b>Set the palette after the picture.</b> When an animation starts, the screen still holds
    the last picture. A first frame that changes the palette first shows that old picture in the
    new colors for a moment. Put the palette after the picture’s bands in the first frame (the
    editor does), or start from black.</li>
    <li><b>Fade out before a picture.</b> PLAYGAME cuts to black after an animation and fades the
    next picture in. An intro that ends on a short fade to black meets that cut smoothly; one that
    ends on a bright frame jumps.</li>
    <li><b>Keep intros short.</b> <kbd>Esc</kbd> is read only between animations, so a long one
    can’t be skipped until it ends. A few short clips in a slide list answer sooner.</li>
  </ul>
  ${L}
  <h2>Limits that aren’t, and one that is</h2>
  <ul>
    <li><b>More than 20 scenes.</b> The Integrator starts with 20, but that is no ceiling: community
    games ship with 60 to 81, and Maximus has 101.</li>
    <li><b>200 monsters on a map.</b> A full map plays; community games place 193 to 200 on one.
    Only 50 are drawn at once (below).</li>
    <li><b>Songs at the wrong speed are silent.</b> PLAYGAME plays a <code>.CMF</code> only if its
    header’s clock says 146 ticks a second; any other value and the scene is quiet in DOS. Some
    community games lost their winning song that way. Save music from this edition’s editor and it
    is always 146.</li>
  </ul>
  <h2>The wall glitch</h2>
  <p>Anyone who has played a pile of Game-Maker games has met it: the hero is suddenly stuck
  inside a wall, or hangs in the air and won’t fall, or turns up at the far edge of the map
  while the view races round after him. Players blame the engine, and they are half right. It
  is the way PLAYGAME handles a <i>solid monster</i>. When one touches the hero, PLAYGAME moves
  him into the cell beside it, on the side he is pushed out of, and stops his movement that way.
  It never looks at what is in that cell. If it holds a wall, he is now inside the wall, where
  nearly every step and every pull of gravity is blocked, so he stays. A push past the map’s
  top or bottom row carries him over the edge and, since the map wraps, out at the far side.</p>
  <p>A monster block’s solid boxes name the side of the hero they stop. <b>Bottom</b> holds up
  his feet, so he stands on it. <b>Top</b> pushes him down under it. <b>Left</b> stops a hero who
  meets it with his left side, <b>Right</b> one who meets it with his right. Which one acts
  depends on the way the two are farther apart, across or up and down.</p>
  <p>None of this needs a new engine. It needs room:</p>
  <ul>
    <li><b>A block of air before every wall.</b> Leave at least one empty block between a solid
    monster’s path and any wall or solid block it walks toward, or end its path a block short. A
    pacer that walks right up to a wall shoves a hero waiting in that last gap inside it, and a
    lift that comes down flush with the floor presses him into it.</li>
    <li><b>Hazards you can pass through.</b> A monster that hurts needs no solid sides, so leave
    them all off and it simply hurts. A solid one pushes as it bites: it sinks a hero who lands on
    it into the floor, or pins him to a wall. A monster meant to be stood on gets Bottom alone.</li>
    <li><b>Off the edge rows.</b> Keep solid monsters off the map’s top and bottom rows.</li>
    <li><b>Lifts that rise to meet him.</b> Let a platform come up from below the hero, so he
    lands on its back, rather than sweep into him from the side. Give it a slow moment at each
    end, a last block at speed 1, so he can step on and off, and leave two empty blocks over its
    highest stop: he is two blocks tall, and rides with his feet on it.</li>
    <li><b>One at a time.</b> Don’t let two solid monsters close in on the same spot. Squeezed
    from both sides, the hero is popped out the other way, into the ceiling or the floor.</li>
    <li><b>Stand in every gap.</b> Test by waiting in each gap a solid monster passes, beside it,
    under it and on it, and letting it come to you.</li>
  </ul>
  <p>The Level check reads the files for these: solid monsters on the edge rows, paths that
  stop right against a block, solid monsters that close in, and monsters that are solid and hurt.
  Its touch probe then plays the risky ones, and says where a hero sinks, is pushed into a wall
  or is held. Tell your players to save with <kbd>F5</kbd> now and then all the same.</p>
  <h2>What a full game found</h2>
  <p>Maximus, the Sandbox game that fills every slot, found limits the box doesn’t mention.
  Each was checked against PLAYGAME:</p>
  <ul>
    <li><b>Fifty on the screen.</b> A map holds 200 monsters, but only 50 are drawn a frame. A
    51st on the screen still moves and still hurts; nobody sees it.</li>
    <li><b>The 21st picture never plays.</b> A monster has 21 animation slots, and PLAYGAME counts
    to 20 and starts over.</li>
    <li><b>Shots need a free monster slot.</b> A bolt is born into one of the map’s 200 slots. On a
    full map the gun does nothing, and birth blocks stop too: leave a dozen free.</li>
    <li><b>Thirty means thirty.</b> A text line of 31 characters leaves its line break for the
    next read, and a blank line appears. Wrap at 30, 16 lines a page.</li>
    <li><b>A quick tap can do nothing.</b> Letting go ends a sequence that can be interrupted, so
    a shot on a late frame never fires from a tap. Put it on the first frame.</li>
    <li><b>One clock for every copy.</b> An animated block changes everywhere at once. Two
    look-alike blocks with different timers stagger them.</li>
    <li><b>Maps forget, counters remember.</b> A scene loads its map fresh each visit; what must
    stay done belongs in a counter.</li>
    <li><b>Pushy platforms.</b> A solid moving monster can shove the hero into a wall: keep
    platforms a block clear of walls (the wall glitch, above).</li>
    <li><b>A one-tick scene still flashes.</b> PLAYGAME fades every scene in and out; give a
    pass-through scene an all-black palette.</li>
    <li><b>Twenty sequences go fast.</b> Three play themselves, so a hero has 17 keys at most.
    List them before you draw.</li>
  </ul>
  ${I}
  ${o("Test on the real thing:","An emulator such as DOSBox, set to a modest machine, finds what no editor can: memory, timing and the sound card. Play every animation and every scene in it once before you upload.")}`},r={bytes:160598,sha256:"404be3612012488e5e8ed5ce1dc2e183cf4b53bd4a6cc9b4d8a1d14e980bca5c"},P=[{offset:153344,length:30,text:"No game-specific instructions.",where:"Read Instructions, when the game has none"},{offset:153375,length:27,text:"No game-specific storyline.",where:"Read Storyline, when it has none"},{offset:153403,length:31,text:"No game-specific credits given.",where:"See Credits, when it has none"},{offset:153435,length:4,text:"Play",where:"Menu"},{offset:153440,length:17,text:"Read Instructions",where:"Menu"},{offset:153458,length:14,text:"Read Storyline",where:"Menu"},{offset:153473,length:11,text:"See Credits",where:"Menu"},{offset:153485,length:18,text:"See Highest Scores",where:"Menu"},{offset:153504,length:4,text:"Quit",where:"Menu"},{offset:153633,length:9,text:"Load Game",where:"F6, heading (no load picture)"},{offset:153646,length:29,text:"This game has not been saved!",where:"F6, an empty slot"},{offset:153676,length:16,text:"Old Game Loaded!",where:"F6"},{offset:153695,length:9,text:"Save Game",where:"F5, heading (no save picture)"},{offset:153710,length:24,text:"I cannot save your game!",where:"F5, when the file can’t be written"},{offset:153735,length:11,text:"Game Saved!",where:"F5"},{offset:154396,length:31,text:"No game-specific help included.",where:"F1, when the game has no help"},{offset:154428,length:14,text:"Score:     %ld",where:"F2 status",format:!0},{offset:154443,length:13,text:"Money:     %d",where:"F2 status",format:!0},{offset:154457,length:13,text:"Hitpoints: %d",where:"F2 status",format:!0},{offset:154471,length:13,text:"Lives:     %d",where:"F2 status",format:!0},{offset:154485,length:37,text:"Elapsed Time: %02ld:%02ld:%02ld.%02ld",where:"F2 status",format:!0},{offset:154584,length:7,text:"MORE...",where:"A text page longer than the screen"},{offset:155007,length:21,text:"Choose object to drop",where:"Dropping something carried"},{offset:155029,length:25,text:"Use arrow keys to select,",where:"Dropping"},{offset:155055,length:25,text:"<Enter> to accept, <ESC> ",where:"Dropping"},{offset:155081,length:25,text:"to quit without dropping.",where:"Dropping"},{offset:157899,length:14,text:"Top Ten Scores",where:"High scores, heading"},{offset:157947,length:11,text:"Hit any key",where:"High scores, foot"},{offset:157967,length:16,text:"Congratulations!",where:"A new high score"},{offset:158022,length:16,text:"Enter Your Name:",where:"A new high score"}],G=`<h2>More from the archive</h2>
  <p>A second look through the collection, the rest of its two hundred and seventy games, turned
  up these. As before, each is plain Game-Maker data.</p>
  <h2>Ground on a meter</h2>
  <p>A block that takes from a special counter is refused when the counter can’t pay, and a
  refused touch changes nothing at all. Use that on terrain and you have a meter:</p>
  <ul>
    <li><b>Digging.</b> Solid earth that takes 1 from special counter 1 and becomes a tunnel.
    While the counter lasts, the hero bores through; at 0 the earth stays solid. Shovels on the
    map add 10.</li>
    <li><b>Flight or fuel.</b> Sky that takes 1 and becomes a look-alike that pulls <i>up</i>,
    which turns back into the sky a tick later. The hero hovers while the meter lasts, then
    falls. It costs 1 each time the sky comes back under him, up to 18 a second, so refills
    should be big.</li>
  </ul>
  <p>Nothing shows the counter (Chapter 4), so draw the meter: a fuel gauge on the level card,
  refills marked with their amount, a sputter when it runs dry.</p>
  <h2>Shops that say no</h2>
  <p>Money works the same way. A solid price block that takes 10 money and <b>becomes</b> the
  goods is a shop shelf: bump it with too little and nothing happens. A block the hero can pick
  up can carry a price too, and PLAYGAME won’t let him take it until he can pay, so a weapon on
  a counter is a weapon for sale; holding it switches its sequence on. Draw the price on the
  shelf, and test that a player who skips every coin can still finish.</p>
  <h2>Weapons in tiers</h2>
  <p>When monsters meet, the higher power wins and two of the same power pass through each other.
  So a weapon beats exactly the monsters below it. Give the pea shooter power 60, armored
  ships 109 and the bomb 110: only bombs crack the armor. A ladder of shots at 101, 111 and 125
  against foes at 100, 109 and 115 makes each better weapon worth finding. Put a weapon’s
  sequence before the plain one on the same key, needing its pickup and with limited uses, and it
  falls back to the plain shot by itself when it runs dry (One key, many weapons, above).</p>
  <ul>
    <li>Prizes are monsters too. A shot stronger than a prize destroys it (the Level check’s
    <i>Shots that destroy prizes</i>).</li>
    <li>A foe of power 100 or more can’t be beaten by touching it, only by a stronger shot.</li>
  </ul>
  <h2>Shots aimed by the last move</h2>
  <p>A shot monster with a chase or flee speed and no path is launched along the way the hero
  last moved, and keeps going straight: one monster fires in all eight directions. Its lifetime
  sets its range. Two catches:</p>
  <ul>
    <li><b>Four fire keys, one aim.</b> Fire-up, fire-down, fire-left and fire-right keys that
    give birth to the same shot all fire the way he last <i>walked</i>. Start each fire
    sequence with a frame that nudges the hero a pixel the way it means, then the frame that
    fires, and each key aims itself.</li>
    <li><b>A hero who stands still</b> fires the way of his last step, which may not be where he
    faces now. Draw the shot so its direction reads, or keep a path shot for straight ahead.</li>
  </ul>
  <h2>Doors on a clock</h2>
  <p>A solid block at the exit that turns, after a few hundred ticks, into a look-alike you can
  walk through makes a “survive until the door opens” room; with foes no shot can stop, it is a
  siege. Give the open copy a pull toward the link and it fetches the hero in. Every copy of a
  block shares one clock that starts when the scene loads, so all the doors open together, and
  they shut again on a return visit. Show the wait: a lamp that turns from red to green, or the
  countdown below. A long wait with nothing to see is the Level check’s <i>Long waits</i>.</p>
  <p>A clock can also be staggered. One of RSD’s own 1.0 samples paints a whole icy floor with
  one picture drawn on a dozen block numbers. Each is solid, and each has its own <i>Becomes
  block</i> and <i>Time</i>: 110 ticks, 400, 1,000, 2,000, and on up past 5,000 (about six
  seconds to five and a half minutes). They turn into look-alikes that sink in further steps,
  slush, then a hole that hurts. Because the blocks look alike, the player can’t tell which tile
  is next: the floor breaks up across the map over minutes, with no monster and no script. The
  same recipe makes a bridge that fails piece by piece or a flood that creeps in. Keep the
  numbers apart (a long wait with nothing to see is still a long wait), and leave a few tiles
  on the longest delay near the exit.</p>
  <h2>A countdown you can read</h2>
  <p>Ten digit blocks in a ring, each showing for 18 ticks, count down one second at a time.
  Beside them, a chain of ten blocks each lasting 180 ticks counts the tens. Both start when the
  scene does, so the pair reads 99 down to 00 for as long as the round lasts. At the same tick,
  the floor can turn into look-alikes that slide the hero to the exit, and a timed round ends
  itself. It costs twenty of the scene’s 150 blocks, so it suits a boss room or a minigame.</p>
  <p>The archive’s one-on-one fighting game shows how far it goes. After an arrow picks the
  fighter, the arena puts the clock at the top center of the screen, counting down from 99 like an
  arcade fighter’s. The opponent’s lifetime is set 45 ticks short of the clock, so he goes down
  just before time runs out, and at 99 seconds the floor and sky turn into look-alikes that slide
  the winner to the exit. The round has a time limit the player can see, and it ends by itself.</p>
  <h2>Punches with reach</h2>
  <p>The same game makes a blow land a beat after the key and a block in front of the fighter.
  Each attack key gives birth to an invisible monster at power 255. It becomes a second invisible
  one that steps a block ahead, and that becomes a visible spark lasting 3 to 5 ticks where the
  hit lands. A punch or kick then feels like it has wind-up and reach, not a touch at arm’s
  length, and each of the four attacks can have its own delay and spark.</p>
  <h2>Cutscenes that end themselves</h2>
  <p>Park the hero beside the scene’s link, on a block that, after a few seconds, turns into a
  look-alike that pulls him onto the link. Any hero file works, nobody has to press a key, and a
  key sequence that walks onto the link still lets the impatient skip. With two links, one
  reached by a key and one by waiting, the scene becomes a choice. The same block, solid at
  first and opening after a moment, holds a hero still while a level begins.</p>
  <h2>Really invisible</h2>
  <p>Monsters touch the hero pixel by pixel, and see-through pixels never touch. A sequence that
  shows a character block made all of see-through color makes the hero untouchable to every
  monster for as long as it plays: a ghost power, a dodge roll, a ninja’s dash. Blocks still
  touch him by cell, so spikes still hurt. Give the move limited uses, and some sign he is
  there (a shadow block, a sound), or the player loses track of him too.</p>
  <h2>A world copied per upgrade</h2>
  <p>A scene can’t remember what happened in it, but a copy of it can stand for “after”. One of
  the archive’s games keeps every scene of its world in five versions, one for each boss beaten,
  all on the same maps. The links of each version lead into the same version, so backtracking
  always lands in the right state of the world, with the bosses gone and the new doors open.
  Upgrades are sequences before the plain moves on the same keys, each needing the block the
  boss leaves, so a better jump replaces the old one. It costs scenes, not maps: edit a map once
  and every version changes.</p>
  <h2>Difficulty buttons</h2>
  <p>A start room with three one-time blocks lets the player pick: one adds 60 hit points and 12
  lives, one adds 2 lives, one takes some away. Each becomes a plain look-alike when touched, and
  a slope funnels all three into the one way out. Lives and hit points carry on, so the choice
  lasts the whole game. (The first character still sets where they start, Chapter 4.)</p>
  <h2>A diagonal track on the wrap</h2>
  <p>One of the archive’s racers turns the map 45 degrees. Its speeder bike course is drawn
  corner to corner: lanes of dirt between tree lines that run up and to the right across the
  whole 100 by 100 map. The bike’s standing sequence moves it 10 right and 10 up every tick, and
  the dirt pulls up and to the right too, so the course rushes at the player and the screen
  scrolls both ways at once. It looks like a three-quarter view, though every block is a plain
  square.</p>
  <ul>
    <li><b>Keys turned with the view.</b> Up is a boost along the track (30 right and 30 up),
    Down nearly stops, and Left and Right step to the next lane (30 up, or 30 right). The arrows
    mean what they look like they mean on the slanted course.</li>
    <li><b>Lanes that step over at the seam.</b> Riding off the top comes back at the bottom,
    and off the right at the left. Drawn straight through, a 45-degree lane would meet itself
    after 100 steps, about 141 blocks of road. Instead, the track jogs over by one lane where
    the map wraps from side to side, so each lane runs on into the next one down. The course
    passes through every lane before it comes back to the start: with five lanes, that’s
    about 700 blocks of road on one map, with never an edge or a turn-around to give it away.</li>
    <li><b>The finish in another lane.</b> The course’s exit isn’t on the lane the bike starts
    in, so the player has to change lanes on purpose to finish; riding along only loops.</li>
  </ul>
  <p>A skiing game in the archive runs the same idea downhill: the skier drifts 19 right and 20
  down every frame, the view scrolls only down and to the right so it never turns back, and the
  slope wraps under him. A solid gate opens by itself after about 55 seconds, so the run has a
  set length however the player steers.</p>
  <h2>A road that comes at you</h2>
  <p>A screen that doesn’t scroll can still look like an arcade racer seen from behind. One of the
  archive’s flight games paints the ground in perspective out of plain blocks: bands of sand that
  get a block wider on each side with every row down, and lighter as they come, meeting at a point
  on the horizon. Then it makes the world rush past with nothing but block timers:</p>
  <ul>
    <li><b>Rocks along the roadside.</b> Down each edge of the road, one cell per row and each a
    step further out, every cell gets its own block, drawn as plain ground, with a timer one tick
    longer than the row above: 1, 2, 3, 4. All of them turn into the same pair, a rock for 1 tick
    and ground for 6, round and round. Every copy of a block shares one clock that starts with the
    scene, so the rock shows at the horizon, then a row lower and further out each tick, and again
    every 7 ticks: rocks whipping past on both sides.</li>
    <li><b>Things that grow as they come.</b> Down the middle, each row’s pair shows a bigger
    picture than the row above, a twig at the horizon and a whole bush at the bottom, with the same
    staggered start. It grows as it comes closer, and touching it costs a hit point.</li>
    <li><b>Clouds flying over.</b> A cloud two blocks wide is a ring of pictures, from a wisp to a
    big puff, 2 ticks each, then plain sky for 10. Every cloud on the map uses the same ring but
    starts on a different block of it, so they swell and vanish at different times.</li>
  </ul>
  <p>The author drew the numbers 1 to 6 on the start blocks to keep them straight in the editor,
  and the numbers flash on the screen for the first few ticks. Draw the start blocks as the
  ground they stand for, and keep the numbers in a notebook.</p>
  ${e("HORIZON")}
  <h2>An end to a road that never ends</h2>
  <p>A road like that goes nowhere: the hero only moves left and right. The Cloud Lane in
  <i>In The Year 2000!</i> gives it a destination, an idea from this edition’s maintainer:</p>
  <ul>
    <li><b>Always pushing forward.</b> Every sequence the hero has, the standing one too, moves
    it 5 pixels up the screen. The row above it is a wall of look-alikes, solid blocks drawn as the
    road, so the push holds it on its row and only steering does anything. Left and Right move it a
    whole lane, four frames of 10 pixels (under the 11-pixel cap), in a sequence keys can’t
    interrupt, so it always ends up in a lane.</li>
    <li><b>The way out opens on a clock.</b> One block of the wall, over the right lane, turns
    after 990 ticks into a look-alike that pulls up (Doors on a clock, above). The push carries the
    hero through it onto the scene’s link. A sign counts the miles down, a chain of digit blocks on
    the same clock, and the destination grows on the horizon as they go by.</li>
    <li><b>Traffic on a timetable.</b> A block gives birth on its birth time and every multiple
    of it after the scene starts, but only in cells that show it at that tick. So a cell whose
    chain shows a different block around each tick the level needs, each with that tick for its
    birth time, gives birth exactly once each time: a timetable, with a different monster at each
    entry. Cars come first, then trucks, two lanes at once, with a page in the lane left clear.</li>
    <li><b>Monsters that grow.</b> Each monster’s pictures run from a dot to full size, timed to
    its path, and its path slides outward along its lane: a block in 20 ticks, the next in 10,
    then 4 pixels a tick, faster as it nears. Only the nearest pictures hurt, and a bump turns it
    into a puff of cloud.</li>
    <li><b>Spawners nobody sees.</b> PLAYGAME gives birth up to half a screen past the edges, so
    the spawner chains sit just off the screen and need no pictures. Each path starts with one
    leap, 240 pixels in a tick, onto the horizon, so nothing is ever seen arriving from the side.
    Two more spawners give birth to the lane dashes every 8 ticks, forever.</li>
  </ul>
  <h2>A room seen from a corner</h2>
  <p>An isometric room needs no new engine. Paint a floor of diamonds 20 pixels wide and 10 high
  (it repeats every 20 pixels, so every plain floor cell is the same block), draw cubes as a
  diamond top with two darker sides, and cut the picture into blocks. The hero still walks the
  square grid and is drawn over everything: he cannot go behind a tower, and a tower taller
  than one block is solid in every block its picture covers. To walk the drawn diagonals, give
  each arrow's sequence a frame that moves him across and down at once (4 and 2 pixels fit
  diamonds twice as wide as high), and draw him only on the four diagonal facings.</p>
  ${e("CORNER")}
  <h2>Choices you walk into</h2>
  <p>A menu doesn’t have to be a menu. Start the game in a small room with two or three doors,
  each a link to a different scene, and label the floor in front of each: the player picks by
  walking in. Two of the archive’s games do it:</p>
  <ul>
    <li><b>Skill by door.</b> A first scene called “skill” has two doors side by side, Cadet and
    Commando. Each leads into its own copy of the next level: the same map, so it costs a scene,
    not new art, and the copies can differ in their monsters. They lead on to an easier and a
    harder build of the last map, so the choice holds to the end.</li>
    <li><b>Play or watch.</b> RSD’s own sample starts in a sealed nook at the bottom of its first
    level’s map, with a Play Game door into that level and a Demo door into a separate guided
    tour. The nook needs no map of its own: a few walled-off rows of a map the game already has
    will do, with the scene starting the hero inside them.</li>
  </ul>
  <p>Put the doors a few blocks apart so one step can’t take the wrong one, and keep the room
  free of foes. A choice the player hasn’t read yet shouldn’t cost a life.</p>
  <p>A party pack in the archive turns the choice room into a board game. After a coin cursor
  picks one of three heroes, the hero walks a winding path of spaces in a room of their own.
  Doors along the path lead into that hero’s copies of the minigames (archery, a kart race, a
  remote-control car, a duel), and two more lead across to the other heroes’ rooms, so changing
  heroes is just another stop on the path. Every minigame sends the player back to the room it
  came from, so the room becomes a hub to wander, not a menu passed through once.</p>
  <ul>
    <li><b>Copies per hero.</b> Each minigame is one map with a scene per hero, each scene with
    that hero’s character file: the same course plays differently with each.</li>
    <li><b>Give the hub an end.</b> That pack never reaches Game Won; it’s a party game you quit
    from. To finish one, give each minigame’s win a counter the hub keeps, and open a last door
    on the path once every counter is paid.</li>
  </ul>
  <h2>Parallax on a screen that doesn’t scroll</h2>
  <p>An unfinished monster-movie game in the archive keeps its giant standing still while the city
  goes by behind him. Two rows of the map are skyline, and each row’s block is a ring of ten
  pictures of the same buildings, each shifted 2 pixels left of the one before, showing 2 ticks
  apiece. Every copy of a block shares one clock, so the whole row slides together, 1 pixel a
  tick, and after ten pictures it is back where it began, 20 pixels on: the width of a block, so
  the seam never shows. The sky above and the street below stay put, and he seems to stride
  through town.</p>
  <ul>
    <li><b>Give each band its own speed for depth.</b> That game moves both rows at the same rate,
    so they read as one moving skyline. Slow the far hills, speed up the near fence, and the
    screen gets deep: far hills 2 pixels every 4 ticks, the town 2 pixels every 2, the fence by
    the road 4 pixels every tick.</li>
    <li><b>Count the blocks.</b> A ring needs 20 ÷ the shift pictures to come back round: 20
    blocks for 1 pixel a step, 10 for 2, 5 for 4. Slow a band with a longer timer rather than a
    smaller step, and it costs no more blocks.</li>
    <li><b>Draw each band to repeat every 20 pixels,</b> so its right edge meets its left. A
    band taller than a block is a stack of rings, one per row, with the same timers so they stay
    lined up.</li>
    <li><b>Make the stillness the point.</b> A hero who can’t move is a runner on a treadmill:
    foes and prizes come in from the right, and he jumps or ducks. Or turn the bands round, and a
    vehicle that only steers up and down flies through a world that scrolls by itself.</li>
  </ul>
  <p>Teddy’s Little Biggest Adventure has a level built this way: Teddy’s Dream Run, with the
  three speeds above. Balls, puddles, branches and treats are born off the right edge, one block
  of a timed chain each, and when the paw prints in the sky fill in, the path pulls him to the
  finish.</p>
  ${e("PARALLAX","BELTWAY")}
  <h2>A pass code to get through</h2>
  <p>A short puzzle in the archive locks its exit behind a word. The screen is a wall of carved
  letter tiles, eight across and three rows high, with the hero below. He walks left and right and
  hops up a row with Space. All the tiles look alike, but only one in each row is a real block:
  Y in the top row, E in the middle, K at the bottom. Each of those says its letter aloud when he
  touches it. Every other letter is a monster drawn as a tile, which nothing can kill and which
  takes 1,100 hit points. Hop up through K, E and Y and he reaches the exit; touch a wrong letter
  and he dies.</p>
  <ul>
    <li><b>The same trick for any code.</b> Make the rows a keypad and the safe path a PIN for an
    ATM, a phone number to dial, or a lock’s combination. One row per digit, in order.</li>
    <li><b>Say each right key.</b> A sound on each true block (a spoken letter, a beep, a dial
    tone) tells the player they’re on the path, so a long code can be learned a step at a time.</li>
    <li><b>Hide the code somewhere else.</b> Put it on an earlier level’s sign, in the
    instructions or in the hint book, and the wall becomes a door only a player who paid
    attention can open. Warn players that a wrong key costs a life, and give them more than one
    so a slip isn’t the end of the game.</li>
  </ul>
  <h2>A mouse pointer to pick with</h2>
  <p>Game-Maker has no mouse, but a hero can look like one. One of the archive’s games opens on a
  select screen whose hero is an arrow pointer, drawn the way a desktop draws it, sitting over a
  grid of doors: one per ship, plus an advanced mode. Each door is a link to that choice’s first
  scene, so landing on a door picks it.</p>
  <ul>
    <li><b>Steps the size of the grid.</b> Each arrow key’s sequence moves the pointer 10 pixels
    a frame for 10 frames: exactly 100 pixels, five blocks, a press. With the doors five blocks
    apart, one press always lands on the next door, never between two. Home, Page Up, End and
    Page Down move it diagonally the same distance, so all eight neighbors are one press away.</li>
    <li><b>A pointer that shines.</b> The standing sequence shows ten pictures of the same arrow
    with a highlight sliding across it, and the moving sequences show the same ten pictures
    forward or backward, so the arrow glints as it glides.</li>
    <li><b>Doors two cells wide.</b> Each door is a pair of links on side-by-side cells that go
    to the same place, so a pointer whose tip sits a little off center still gets in.</li>
  </ul>
  <p>Another of the archive’s games points with a hand instead, and moves it the other way. Its
  hero select is a room that doesn’t scroll sideways, with four links in a row overhead, one per
  hero. The hand slides left and right 10 pixels a step, and Space hops it 75 pixels up into the
  link above it. The doors don’t need a grid, only a row, and a pick takes a deliberate press,
  never a stray step. A snowboarding sequel picks its hero the same way: the pointer slides along
  a row of two links, and Up or Space hops it onto one, the game’s own seal or a guest from
  another studio’s game, each with its own copy of the courses.</p>
  <p>A third game gives its pointer a big stage: large portraits of the four heroes, picked with a
  little creature that walks left and right below them and steps up onto a link with Space. The
  whole select screen is one picture cut into blocks. A screen that doesn’t scroll is 16 blocks
  by 10, and this one uses 108 different blocks, each placed once, plus one plain block for the
  rest, well inside a set’s 150. Paint the screen as a single picture, cut it into 20 by 20
  blocks, and lay them out in order on the map: the picture comes back whole, with links for the
  pointer to step onto.</p>
  <p>It’s one of the archive’s favorite front ends: many games pick a hero, a level or an episode
  this way, with an arrow, a hand, a triangle or a little creature for the pointer. One unfinished
  episode select shows the catch to watch for. Its pointer steps three frames of 20 to 30 pixels a
  press, but PLAYGAME moves a hero at most 11 pixels a tick, so a press goes 33 pixels, not the 60
  between its markers, and the pointer never lands on the next one. Keep each frame of a step at
  11 pixels or less and make the frames add up to the spacing exactly, as the arrow above does
  with ten frames of 10.</p>
  <p>Leave the level flat, with nothing that pulls, so the pointer stays where it is put, and
  label each door on the map so the choice reads before it is made.</p>
  <h2>A shareware cut from a second .gam</h2>
  <p>A transferred game’s player opens the <code>.GAM</code> named after its own
  <code>.EXE</code>. So one set of data files can carry two games: copy the <code>.GAM</code>, and
  in the copy empty the later scenes and point the last free level’s exit at the won scene, whose
  picture says how to get the rest. Copy the <code>.EXE</code> under the copy’s name, and ship that
  pair with the free levels’ files only. Nothing else changes, and the full game is the same
  files plus the rest.</p>
  ${o("Credit where it’s due:","These come from games kept in the Internet Archive’s Game-Maker Archive collection, opened only with this edition’s readers. The guide describes the ideas in its own words; the games, their art, music and words belong to their authors.")}`,F=t=>t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"),R={id:"shareware",title:"Tricks From the Shareware Authors",head:"17. Shareware Tricks",html:`${a(17,"Tricks From the Shareware Authors","Game-Maker’s first authors had no guide like this one, and they found their own way to bosses, secret doors and cutscenes. These are their best ideas, from games kept in the Internet Archive’s Game-Maker Archive collection. Every one is plain Game-Maker data that PLAYGAME plays as described.")}
  <h2>A boss with hit points</h2>
  <p>A monster dies at one hit, but its <b>Becomes</b> monster takes its place. Chain them: a
  monster the hero’s shots can hit (its power below theirs) becomes, when hit, a copy with power
  255 that no shot can hurt, a flashing animation and a lifetime of 30 to 50 ticks; when that runs
  out it becomes the next hittable link. Five links make a boss that takes five hits, with a
  breather after each. Put the big score on the last link’s kill score. Make each invulnerable
  window a little longer, or each phase a little faster, and the fight climbs: <i>Blinky 3</i>
  stretches its windows from 57 to 207 ticks, <i>Crystal Mania 4</i>’s boss flees faster after
  every hit, and <i>Blinky 2</i> and <i>Ninja Tuck</i> build whole fights this way.</p>
  <h2>Rings of blocks as timers and brains</h2>
  <p>A block that animates into another, and that one into the next and back round, is a clock
  that runs all level. Give each block of the ring a different monster to give birth to and a boss
  room’s attacks take turns by themselves (<i>Blinky 2</i>). A plain block that turns, after a
  long wait, into a look-alike that hurts is a level timer (<i>Parsec Man 3D</i>), and a slow ring
  with one frame that hurts is a fire that pulses (<i>Thal’s Quest for the Crystals</i>).</p>
  <h2>Look-alike blocks as secret doors</h2>
  <p>Two blocks with the same picture can do different things. A copy of the wall that isn’t solid
  is a secret door; a copy of the sky that is solid is an invisible bridge;
  a copy with a gravity is a hidden slide or current. Copies that look like empty space but stand
  in the way, and change when bumped, make the invisible maze of <i>Parsec Man 3D</i>. Hint at
  them fairly: a crack, a different echo, a coin that leads the way.</p>
  ${e("LOOKWALL")}
  <h2>Touch chains</h2>
  <p>A block that turns into another block when touched can do more than vanish. Chain eleven of
  them whose solidity goes from none up to full and back down, and a door slides open a step each
  time the hero walks into it (<i>Orb: the Derelict Planet</i>). Walls that become their open copies
  one bump at a time (<i>Shanna</i>) and crates that turn into prizes work the same way.</p>
  <h2>Cutscenes and menus as tiny levels</h2>
  <p>A scene can be one screen with no scrolling and a character file of its own whose standing
  sequence waits a while and then walks the hero onto a link. Add a key sequence that walks onto
  it at once, and the player can skip it. That is an intermission with music, sound and moving
  actors, built from parts you already know (<i>Andy in Asunderland</i>, <i>Builder</i>, and
  <i>Blinky 2</i>’s intro and ending, which share one map).</p>
  <p>The same one-screen room with several doors is a level select, a hub of minigames or a
  music room: each door a link to its own scene, and each scene its own song.</p>
  ${e("CUTSCENE")}
  <h2>Choosing a hero by link</h2>
  <p>Leave a scene’s character slot empty and PLAYGAME keeps the character it already has. So a
  select screen whose links each lead into a copy of the first level with a different character
  file sets the hero for the whole game, as long as every later level leaves the slot empty
  (<i>Blinky 3</i>). Make the heroes really differ (jump, speed, voice) or the choice is only a
  costume. And only the first character’s starting values count (Chapter 4): a ship that “takes
  less damage” can’t be made from its own hit points, so let the heroes differ in what they do,
  not in what they can take.</p>
  ${e("CHOOSE")}
  <h2>Physics by changing the character</h2>
  <p>The same hero with a slower walk and jumps made of momentum is a moon level; with gentle
  steps in every direction, a swim. Give those scenes their own character file (<i>Ninja Tuck</i>’s
  moon, <i>Thal’s Quest for the Crystals</i>’ swimming and climbing elf) and add gravity blocks for
  currents.</p>
  <h2>A standing sequence that moves</h2>
  <p>The standing sequence plays whenever no key is down, and its frames move the hero like any
  other. Make them move and the hero never stops: an auto-runner (<i>Hurdles</i>) or a sled that
  always slides downhill while the keys steer and speed it (<i>Seal Boarders</i>). Scroll the
  scene one way only, so there is no going back.</p>
  ${e("RIDEALNG")}
  <h2>One key, many weapons</h2>
  <p>Several sequences can share a key. PLAYGAME starts the first one that is switched on and has
  uses left, so give each weapon its own sequence, each needing the pickup that switches it on,
  and put a last sequence with no frames on the same key whose sound says <i>I don’t have
  that</i> (<i>A-J’s Quest</i>). Its use counter is the ammunition.</p>
  <h2>Short-lived monsters</h2>
  <p>A monster with a lifetime of three ticks, born from the hero’s sequence beside him, is a sword
  swipe that kills what it touches (<i>Ninja Tuck</i>). A monster that rises a little and vanishes
  after 30 ticks, as the <b>Becomes</b> of each enemy, is a score that pops up where the enemy fell
  (<i>Shanna</i>). Both use monster slots, so keep count on a busy screen.</p>
  <p><i>Ricci’s Cow Hunt</i> shows the recipe for the pop-up whole. Each cow is worth 100 points and
  a hit point, and its <b>Becomes</b> is a second monster: a “100” that flashes red, black and white so it shows on any ground, at power 255 so
  nothing can knock it out of the air, whose path floats it up 1 pixel a tick and whose lifetime
  ends it 30 ticks later. Walk over a cow and its score drifts up from the spot and fades out. Give
  each prize its own pop-up picture (10, 100, a heart for a life) and the player reads what they
  just got without looking at the status line.</p>
  <h2>Timing by hand</h2>
  <p>Even steps look mechanical. A jump whose frames rise fast and slow at the top
  (<i>Ninja Tuck</i>), a patrol that slows into each corner by giving each leg its own speed, and a
  crowd of the same creature with slightly different picture times so they never move in step
  (<i>Penguin Pete</i>) all look alive for no extra pictures.</p>
  ${e("CLOCK","COUNTDWN","BLOCKBRN")}
  ${e("TWINKLE")}
  <p>Rain on the Path uses different starting pictures of one loop for scattered falling streaks, more loops for splashes and puddle rings, and a second scene palette for storm colors.</p>
  ${e("RAIN")}
  <p>Snowflakes that sway in a loop, a drift that grows in steps and bootprints left by a touch:</p>
  ${e("SNOW")}
  ${e("FLICKER")}
  ${e("HEATWAVE")}
  ${e("LIGHTOUT")}
  ${e("SHADOWS")}
  ${e("BEAMS")}
  ${e("LITEBUGS")}
  ${e("FIREWORK")}
  ${e("LEAVES")}
  ${e("LIGHTNIN")}
  <h2>Transitions with the palette</h2>
  <p>An animation frame that changes only the palette costs a few hundred bytes, however big the
  picture. Fade a picture in or out, flash it or cycle its colors that way, and the whole
  animation stays tiny and plays on any PC (RSD’s own text-box animations in <i>Penguin Pete</i>).
  Fade-in and fade-out animations round a text screen in a slide list make a cheap page turn.</p>
  ${G}
  <h2>Customizing the player’s own words</h2>
  <p>A transferred game’s <code>.EXE</code> is Game-Maker’s own <code>XFERPLAY.EXE</code>, renamed
  after the game by Transfer (or by this edition’s DOS download). PLAYGAME’s built-in words live
  inside it as plain text: the menu’s six choices, the save and load lines, the high-score screen.
  A hex editor can change them. <i>Builder</i> did: its author overwrote every menu word with
  spaces, so its own menu picture shows clean with nothing written over it. The choices still
  work; only the words are gone. The same author’s unfinished <i>Rōdïp: Rover of the Deep</i>
  renamed the status line’s Hitpoints and Lives to Energy and Failsafes, and cleared the
  high-score words. These two games led this edition to map every word the player shows.</p>
  <p><b>The safe way now:</b> open your game’s <code>.gam</code> and press <b>DOS player</b> in the
  integrator’s toolbar (on the desk PC, <code>PLAYHACK</code> from the BBS’s Warez area does the same).
  It changes the words, and the player’s colors, frames, positions, waits and the F5, F6 and F9
  keys, but only in ways the <code>.EXE</code> can take, with a preview of each screen as you type.
  The DOS download writes your changes into its copy of the player and lists them in its
  <code>README.TXT</code>; Play and the web-page download show them too. Import a game folder
  whose player was hand-edited, and its changes come into the panel. By hand, the rules are
  these:</p>
  <ul>
    <li><b>Back up first.</b> Edit a copy, never the only one.</li>
    <li><b>Same length only.</b> Type over the letters, and pad a shorter word with spaces. Never
    insert or delete a byte: everything after it would move.</li>
    <li><b>Preserve the terminating zero byte</b> (00 in the hex editor) after each word: it marks
    where the word ends.</li>
    <li><b>Keep every <code>%</code> placeholder exactly.</b> The F2 status lines are formats such as
    <code>Hitpoints: %d</code>: the player fills in the number where the <code>%d</code> is. Change
    only the words before the placeholder, and keep the placeholder (<code>%d</code>,
    <code>%ld</code>, <code>%02ld</code>) byte for byte, in the same place, with the line the same
    length. That is how <i>Rōdïp</i> made <code>Hitpoints: %d</code> into
    <code>Energy:    %d</code>. A changed placeholder reads the wrong value and can crash the
    player.</li>
    <li><b>Plain ASCII text only.</b> Letters, digits, punctuation and spaces are safe; no accents or
    line drawing, which the player can’t draw.</li>
    <li><b>Leave the credits alone.</b> The F10 box’s version line and RSD’s lines stay as they
    are, out of respect, and because Game-Maker’s license notice should travel with the player.</li>
    <li><b>Test in DOSBox</b> after every change: the menu, F1, F5, F6, a drop and a high score.</li>
  </ul>
  ${e("UNDRHOOD")}
  <p>A hand edit changes only that one <code>.EXE</code>: the web player and the other downloads
  don’t read it, and every DOS download starts from a fresh copy of the CD’s player. The DOS
  player panel’s changes travel with the game instead. The desk’s <code>HEXEDIT</code> can’t do
  it either: the <code>.EXE</code> on a transfer disk is only a name there (the desk plays the
  game in this edition’s player), and it answers <i>File not found</i>.</p>
  <p><b>Other extensions.</b> Acord Games went further: their player looked for
  <code>.Z0G</code>, <code>.Z0N</code> and the like in place of <code>.GAM</code>, <code>.GIF</code>
  and the rest, and their games’ files were renamed to match, so another copy of Game-Maker 3.0
  couldn’t open them. The panel’s <b>Files</b> tab does the same for the DOS download only. The
  kinds the player finds by their extension (the game file, pictures, backdrops, animations, text
  pages, slide lists, recordings, voices, high scores and saves) are patched in its
  <code>.EXE</code>; the kinds the <code>.gam</code> names (palettes, maps, blocks, monsters,
  characters, sound sets and songs) are only renamed, with their names in the <code>.gam</code>,
  slide lists and backdrops rewritten. Each new extension keeps three letters or digits, and no two
  kinds share one. Your project, Play and the other downloads keep Game-Maker’s own names. It isn’t
  real protection: this edition’s import reads the player and renames the files back.</p>
  <p>Here is where the words are in the CD’s <code>XFERPLAY.EXE</code>: ${r.bytes.toLocaleString("en-US")} bytes, SHA-256
  <code class="ug-hash">${r.sha256}</code>. Check both before you edit: the offsets belong to
  that file only. Lines marked with a <code>%</code> are formats (see above).</p>
  <table class="ug-words">
    <tr><th>Offset</th><th>Bytes (without the 00)</th><th>Text</th><th>Shown</th></tr>
    ${P.map(t=>`<tr><td><code>${t.offset.toString(16).toUpperCase()}</code></td><td>${t.length}</td><td><code>${F(t.text)}</code></td><td>${t.where}</td></tr>`).join(`
    `)}
  </table>
  <p>Offsets are in hex, counted from the first byte of the file. The F9 joystick screens’ lines
  follow <code>MORE...</code>, most of them padded with spaces to 29 or 30 characters.</p>
  ${o("Before 3.00:","Earlier players would not start a game without <code>GMTITLE.GIF</code>, a “Recreational Software Designs’ Game-Maker Presents:” card shown first, and authors redrew it as their own studio’s card. The 3.00 player never looks for it: your opening is the title slide list, and in this edition the start scene’s Opening sting.")}
  <h2>Recipes for bigger ideas</h2>
  <p>Players watching Game-Maker games have cheered for digging, sneaking, swinging and rolling
  dice, sometimes in games, sometimes in a demo made to show them off. Here is how each can be
  built from the rules in this guide. Where Game-Maker can’t do the real thing, the recipe says
  so and fakes it.</p>
  <h2>Ground you can dig</h2>
  <p>Background blocks change only when the hero himself touches them, so dirt that a tool digs is
  made of monsters. Fill the ground with solid monsters that stay put (power 103, say), and give
  the dig key a sequence that fires a short-lived monster at the hero’s feet with more power
  (105). The dig wins, the dirt <b>becomes</b> a puff with a few points on it, and a hole is
  left. For stone, use a tougher monster (110) and a second dig sequence on the same key that
  needs the pick in the inventory, in a lower-numbered slot than the plain one so it is chosen
  first (One key, many weapons, above). This is how Teddy digs in Teddy’s Little Big Adventure. Two things to
  plan for: every clod is one of the map’s 200 monsters, so dig fields stay small, and monsters
  feel no gravity, so nothing above a hole ever falls in.</p>
  ${e("DIGIT")}
  <h2>Searchlights and sneaking</h2>
  <p>A guard’s light is a monster on a path: a pale beam, power 100 or more so it stays,
  sweeping its corridor on a steady loop. Draw it as a light dither: its see-through pixels let
  the floor show through, and only its colored ones can catch the hero. Its picture takes all
  the hero’s hit points, so being caught starts the scene over at the door. The shadows are
  simply the places its path never reaches: draw them dark, so the player can read where to
  wait. A guard that notices the hero is an attack path, but its range is a box round the guard
  (Appendix A) that ignores walls and the way he faces, so put such guards where that box is the
  room he watches.</p>
  <h2>A grappling swing</h2>
  <p>Nothing can hang the hero from a point, but a fling looks the part. Give the grapple key a
  sequence, needing the hook in the inventory, that fires a hook monster ahead for show, then
  feeds momentum forward and up through a few frames. The hero sails out over the gap, and the
  block’s gravity brings him down on the far side. Test it at every height the player might use
  it from, and keep a ledge to catch him.</p>
  <h2>A trail of light</h2>
  <p>A torch that lights the blocks around the hero can’t be done: only the hero touches
  background blocks, and only 50 monsters are drawn at once, too few to cover a dark screen.
  Two things work instead. Draw the cave floor dark, with each block becoming its lit copy when
  touched, and the hero leaves a trail of light wherever he has been (it fades when he leaves
  the scene, since the map comes back fresh). Or let him find the lamp: put it on a link to a
  scene that uses the same map with a bright palette (Chapter 1), landing beside the spot, so
  the whole cave lights up at once.</p>
  <h2>Dice and chance</h2>
  <p>A touch takes the block an animation is showing at that moment, so a ring of blocks whose
  frames last one tick each is a die: nobody can time a bump to an eighteenth of a second. Give
  each face its own touch (points, a prize, a small hurt) and make each face <b>become</b> a still
  block showing the roll, so it can’t be thrown twice. Let the faces add 1 to 6 to a special
  counter, and gates further on that take 4 or 6 make a board game: how far the player gets
  depends on the roll.</p>
  ${e("ROLLDICE")}
  <h2>A friend who follows</h2>
  <p>A monster that moves toward the hero a little slower than his walk, with harmless pictures
  and power 100 or more, trots along behind him. Give it more power than the enemies and it
  beats any it bumps into, a guard dog that clears the way. It beats moving prizes just as
  surely, since they stay under 100 for the hero to collect them, so leave the friend at home in
  levels that have them.</p>
  ${e("FOLLOWME")}
  <h2>A key to start over</h2>
  <p>When a puzzle can be ruined, a start-over key saves the player from quitting. Its sequence
  fires a slow monster with a lifetime of one tick, too short to go anywhere, that
  <b>becomes</b> a second monster: a full block of pixels, power under 100, whose picture takes 30,000 hit points and gives one life. A shot
  can’t touch the hero who fired it, but its next form can. The hero dies, the life it gave pays
  for the death, and the scene starts over from the door. Put it on a key nobody presses by
  accident, and say so in the instructions.</p>
  <h2>Quick-time scenes</h2>
  <p>A one-screen scene with no scrolling and a character of its own makes a moment where the
  right key matters. Each key’s sequence walks the hero onto a link: the right one to the next
  scene, the wrong ones to a scene where things go comically wrong. A standing sequence that
  waits a few seconds and then walks onto the wrong link is the timer. A flashing block can show
  which key to press, and the scene’s intro picture can say what is happening. The next scene
  names the hero’s usual character file again.</p>
  ${o("Where these came from:","The games named here were looked at in the Internet Archive’s Game-Maker Archive collection, opened only with this edition’s file readers. Their ideas are described in the guide’s own words; their art, music and words belong to their authors. The recipes were suggested by games and a techniques demo seen in levelengine’s livestream “RSD Game Maker Binge” (2020), and are built here from PLAYGAME’s own rules.")}`},B=""+new URL("installLabel-Ex8c58Rs.png",import.meta.url).href,N=[String.raw`@ECHO OFF
IF NOT "%2"=="" GOTO usage
SET GMIDIR=C:\SANDBOX
IF NOT "%GMIDIR%"=="C:\SANDBOX" GOTO failed
IF "%1"=="" GOTO begin
IF "%1"=="GAMES" GOTO games
IF "%1"=="games" GOTO games
GOTO usage
:games
SET GMIDIR=C:\GAMES\SANDBOX
IF NOT "%GMIDIR%"=="C:\GAMES\SANDBOX" GOTO failed
:begin
ECHO Installing to %GMIDIR%
ECHO Same-name files will be overwritten. Back up saves first.
ECHO Ctrl+C, then Y cancels. Any other key continues.
PAUSE`,String.raw`IF NOT EXIST C:\NUL GOTO failed
IF "%1"=="" GOTO root
IF EXIST C:\GAMES\NUL GOTO root
MD C:\GAMES
IF NOT EXIST C:\GAMES\NUL GOTO failed
:root
IF EXIST %GMIDIR%\NUL GOTO disk1
MD %GMIDIR%
IF NOT EXIST %GMIDIR%\NUL GOTO failed`,String.raw`:disk1
ECHO Insert disk 1 of 2 in the CURRENT source drive A: or B:.
PAUSE
IF EXIST DISK1.ID GOTO copy1
ECHO Wrong disk. Need DISK1.ID. Try again or press Ctrl+C.
GOTO disk1
:copy1
COPY /B *.* %GMIDIR% /V
FOR %%F IN (*.*) DO IF NOT EXIST %GMIDIR%\%%F GOTO failed
ECHO Any COPY error? Ctrl+C, then Y. Otherwise press a key.
PAUSE`,String.raw`REM Disk 2 is ONLY an example of multi-disk installation.
:disk2
ECHO Insert disk 2 of 2 in the CURRENT source drive A: or B:.
PAUSE
IF EXIST DISK2.ID GOTO copy2
ECHO Wrong disk. Need DISK2.ID. Try again or press Ctrl+C.
GOTO disk2
:copy2
COPY /B *.* %GMIDIR% /V
FOR %%F IN (*.*) DO IF NOT EXIST %GMIDIR%\%%F GOTO failed
ECHO Any COPY error? Ctrl+C, then Y. Otherwise press a key.
PAUSE`,String.raw`ECHO Copy passes ended. Check that NEITHER pass had errors.
ECHO Only then type these commands:
ECHO C:
ECHO CD %GMIDIR%
ECHO CONFIG
ECHO SANDBOX.EXE
GOTO end
:failed
ECHO INSTALL STOPPED. Check environment, drive, space and disk errors.
ECHO Files already copied remain. The game may be incomplete.
GOTO end
:usage
ECHO Use INSTALL or INSTALL GAMES from the source disk root.
:end
SET GMIDIR=`],i=t=>`<pre><code>${N[t]}</code></pre>`,W=String.raw`
  <h2>Give the player an INSTALL command</h2>
  <p>Don’t make the player copy a game by hand. Put an <code>INSTALL.BAT</code> beside the
  game’s files and offer a short directory such as <code>C:\SANDBOX</code>, or
  <code>C:\GAMES\SANDBOX</code> for someone who keeps games together. Replace <code>SANDBOX</code>
  with your game’s DOS name, one to eight plain letters or digits. Keep the player and all its
  resources together in that directory; the game itself does not swap installation disks.</p>
  <p><b>Disk two below is only an example of multi-disk installation.</b> A game that fits on
  one disk needs only one. The two-disk lesson uses the same conventions as a DOS export’s
  numbered disk set: flat files, <code>DISKn.ID</code> markers, a prompt for each disk, and
  the same installer on every disk. This hand-written version adds the <code>GAMES</code>
  choice; it is not an extra argument for an exported installer’s <code>INSTALL [drive]</code>.</p>
  <h3>Pack the disks</h3>
  <table>
    <tr><th>Disk</th><th>Files in its root directory</th></tr>
    <tr><td>1</td><td><code>INSTALL.BAT</code>, <code>INSTALL.TXT</code>, <code>DISK1.ID</code>,
    <code>SANDBOX.EXE</code> (the transferred player), <code>SNDBLAST.DRV</code>,
    <code>CONFIG.BAT</code>, <code>CONFIG.HLP</code> when supplied, <code>SANDBOX.GAM</code>,
    and the first group of game resources.</td></tr>
    <tr><td>2 (example only)</td><td>An identical <code>INSTALL.BAT</code>, <code>DISK2.ID</code>,
    and the remaining resources.</td></tr>
  </table>
  <p>The marker files must contain a short line, such as <code>SANDBOX disk 1</code> or
  <code>SANDBOX disk 2</code>: old DOS COPY skips empty files. Make them in a text editor and check their exact names.
  Put only <code>DISK1.ID</code> on disk 1 and only <code>DISK2.ID</code> on disk 2. They identify
  a disk number, not a game or release, so label the disks and never mix sets. Divide complete
  files, not pieces of a file. Every resource named by the game must appear on one disk; only
  the identical installer is repeated. Allow room for it when filling each disk. A ZIP must
  first be unpacked; copying the ZIP alone does not install a game.</p>
  <h3>Start from disk 1</h3>
  <p>Tell the player to put disk 1 in A:, type <code>A:</code>, then <code>CD \</code>, then
  <code>A:INSTALL</code> for <code>C:\SANDBOX</code> or <code>A:INSTALL GAMES</code> for
  <code>C:\GAMES\SANDBOX</code>. For B:, select <code>B:</code>, type <code>CD \</code>,
  then <code>B:INSTALL</code> or <code>B:INSTALL GAMES</code>. Keep that source drive current
  and swap disks in that same drive. A:INSTALL does not change the current drive or A:'s
  remembered directory. Selecting the floppy and its root first makes the relative source
  names read the floppy, not C:. Do not skip those first two commands, even if the label
  only has room for the install line. Starting <code>A:INSTALL</code> or <code>A:\INSTALL</code>
  while C: is current is not equivalent.</p>
  <figure class="ug-install-label">
    <img src="${B}" alt="Snowbound: The $89 Shovel floppy label, with its snowy game scene, shovel-carrying hero, and To install: A:INSTALL footer">
    <figcaption>Figure 18-1. Snowbound: The $89 Shovel’s label, rendered with the disk box’s
    normal label artwork and an installation footer. This is a label example, not the SANDBOX example’s game files.
    Select A: and its root first, as above; the short footer is a reminder, not the whole procedure.</figcaption>
  </figure>
  <p>Save the following five parts, in order, as <b>one</b> plain ASCII file named
  <code>INSTALL.BAT</code>, with DOS CRLF line endings. Copy the finished file byte for byte
  onto both disks: COMMAND.COM may reopen it after a swap and must find the same listing at
  the same place. Do not put the explanations or listing headings in the batch file.</p>
  <h3>1. Choose the destination</h3>
  <p>No argument means the short directory; <code>GAMES</code> adds the parent directory.
  Other arguments print usage without copying. The first pause warns about overwriting.
  Use a new directory for a different game or release, and back up saves and sound settings
  before reinstalling. The script uses and clears the environment variable <code>GMIDIR</code>;
  if DOS cannot make room for it in the environment, the value check stops the installation.</p>
  ${i(0)}
  <h3>2. Make the directories</h3>
  <p>Check the hard disk, make <code>GAMES</code> first if needed, then make the game’s
  directory. Existing directories are kept. The <code>\NUL</code> checks are the old DOS
  directory test; a missing directory after <code>MD</code> goes to the failure message.</p>
  ${i(1)}
  <h3>3. Ask for disk 1 and copy it</h3>
  <p>A missing marker repeats the prompt without copying. <code>COPY /B</code> copies binary
  files intact and <code>/V</code> asks DOS to verify writes. The destination must already be
  a directory; leave off its trailing backslash, which DOS 3.3 COPY rejects. <code>*.*</code> copies all files in the current root, including the
  installer and marker, but not subdirectories. Nothing from an earlier disk is erased.</p>
  ${i(2)}
  <h3>4. Show how another disk follows</h3>
  <p>Disk 2 repeats the same steps with its own marker. For a one-disk game, omit this entire
  fourth part, including its comment, and change <code>1 of 2</code> in
  the third part to <code>1 of 1</code>. Keep a <code>DISK1.ID</code> on that one disk.</p>
  ${i(3)}
  <h3>5. Explain what to do next</h3>
  <p>The script only prints the launch commands; it does not run the game after an unchecked
  copy. After both passes have copied without errors, change to C: and the chosen directory,
  run <code>CONFIG</code> once for sound and video, then <code>SANDBOX.EXE</code>. Remove the
  installation disk and test that the whole game plays from the hard disk.</p>
  ${i(4)}
  <h3>Do not hide a copy error</h3>
  <p>The <code>FOR</code> line catches a missing destination file, not a truncated file or a
  failed overwrite of a file already there. Old DOS <code>COPY</code> does not give this
  script a dependable automatic success test. Read <b>every</b> COPY message. If it reports
  disk full, access denied, a read or write error, or any other failure, press
  <kbd>Ctrl+C</kbd> at the next pause and answer <kbd>Y</kbd> to end the batch job. If DOS
  offers Abort, Retry, Ignore for a media error, do not choose Ignore. Correct the problem and
  start again with disk 1. Copied files are left in place; there is no rollback.</p>
  <p>Put those warnings, the two destination choices, the disk order and the launch commands
  in <code>INSTALL.TXT</code> too. Include a manual fallback: make the chosen directory
  (and <code>C:\GAMES</code> first if needed), then type
  <code>COPY /B A:\*.* C:\SANDBOX /V</code> for each disk, substituting the chosen directory
  and B: when needed. Check each copy before going on. Do not copy from the destination onto
  itself. Try the script on a clean DOS 3.3 machine: both choices, a wrong disk, an existing
  directory and a full hard disk. This listing uses COMMAND.COM commands, not later
  <code>CHOICE</code>, <code>SET /P</code>, <code>COPY /Y</code> or Windows CMD extensions.</p>`,z={id:"box",title:"What Goes in the Box",head:"18. In the Box",html:`${a(18,"What Goes in the Box","A game on a disk is a game. A game in a box with a map, a wheel and a little plastic something is an occasion. Here is what authors packed with their games, what each piece adds, what it costs to make, and how to build the puzzle that needs it.")}
  <h2>Why put paper in the box</h2>
  <p>Three reasons, in order of how much they matter. Paper makes the world bigger than the
  screen: a map you can unfold, a letter from a character, a wheel that reads a dead language. It
  gives players a reason to register: shareware gives the game away, so the paper is what a
  registered player finds in the mailbox. And it gets in the way of casual copying, a little.
  Plan for the first two. The third is a bonus, and a small one.</p>
  <h2>Code wheels</h2>
  <p>Two or three discs of card on one fastener. Turn the small disc until one symbol sits against
  another, and the answer shows in a window. The game asks; the wheel answers. Quest for the
  Round Tuit’s Royal Code Wheel turns Old Procrastian runes into letters, and its three windows
  show the miners’ marks that tell you which door in the mines to take.</p>
  <p>A wheel is the fanciest paper in the box and the hardest to make. The discs must be cut
  round and the windows cut clean, and a wheel cut by machine needs a die made for it. A wheel
  meant to be printed at home should say where to cut and come out right with scissors: square
  windows, symbols of even width, a big center hole for a paper fastener. Odd-shaped windows and
  symbols of different widths look grand, and make a wheel very hard to copy by hand, for the
  same reason they are hard to cut out.</p>
  <h2>Code sheets</h2>
  <p>A look-up grid: find the row, find the column, read the square. The cheapest protection
  there is, one ink on colored card. The card’s color does the work. Dark red paper comes out of
  a photocopier nearly black, print and all, and light cyan barely comes out at all. A sheet
  that is all letters and numbers can still be copied out by hand, so keep the grid big and the
  answers short and many.</p>
  <h2>Cloth maps</h2>
  <p>A map on cloth folds a hundred times and still looks like treasure. It is also the dearest
  piece per copy, so most authors print paper and call it cloth: Quest for the Round Tuit’s map
  of Procrastia is printed on genuine imitation cloth. Whatever it is printed on, put on it what
  the screen can’t show: the names of places, which way is north, how far the road runs, and one
  joke in the margin.</p>
  <h2>Hint books and red film</h2>
  <p>Write the book as you test (Chapter 10, “Writing a hint book”). Then hide the answers: print
  them in very pale cyan under a mesh of red lines, and put a sheet of red film in the box. Through
  the film the red mesh vanishes and the cyan reads dark, one answer at a time, so nobody reads
  the next answer by accident. The film is cheap, and players remember it.</p>
  <h2>Plastic trinkets</h2>
  <p>A coin, a badge, the hero’s ball: something from the world to keep on the desk. A molded
  piece is cheap per copy and dear to start, since the mold costs more than a whole run of
  paper, so it only pays on a big run. In this edition the Sandbox games’ trinkets come as files
  for a 3D printer, in the Library’s toy box.</p>
  <h2>What each piece costs</h2>
  <p>From cheapest to dearest: one ink on plain paper; one ink on colored card; full color; card
  cut to a shape (a wheel, a punch-out); film; cloth; anything molded. The first copy of any of
  them costs the most, since the setup is paid once and the paper a little at a time. So print
  the extras for the registered players you have, not the ones you hope for, and make the next
  batch when the first runs out.</p>
  <h2>Copy protection that doesn’t punish</h2>
  <p>A copied floppy without its paper gets stuck at the first gate that needs it. But paper
  doesn’t stop a library photocopier, or a friend with a pencil and a free afternoon. So never let a lost wheel end a
  paying player’s game.</p>
  <ul>
    <li><b>Wrong costs a little.</b> A wrong door sends the hero back a room or shows a sigh; it
    never takes the last life. Maximus’s clearance gate has three hatches, and the wrong two only
    sigh.</li>
    <li><b>Say what you need.</b> The manual names the piece a puzzle uses and where it is, so a
    player knows what to look for in the box.</li>
    <li><b>Offer a spare.</b> Print the address for a replacement in the manual. A player who
    writes in for a lost wheel is a player who cares.</li>
  </ul>
  <h2>Paper puzzles in Game-Maker</h2>
  <p>Game-Maker has no box to type an answer into, so the game shows the question and the answer
  is a place. Put the question in the level: a carving, a sign, a symbol over a door. The paper
  turns it into an answer: a letter, a number, a mark. Then the answer is which way to go: one door
  of three (each a link, Chapter 5), one block of a row to touch, one path out of a crossroads.
  Look-alike blocks make the doors match (Chapter 2), and a counter can count a run of right
  answers before the last gate opens (Chapter 4).</p>
  ${o("Test it without the paper.","Play the puzzle once with the wheel in a drawer. If it is only slower, it is fair. If it is impossible, add a way round: a longer road, or a hint in the level for players who look hard.")}
  ${W}
  <h2>Make it a keepsake</h2>
  <p>Write every piece in the world’s own voice: the king’s seal on the map, a stamp on the
  sheet, a note from the hero’s friend tucked into the manual. Long after the last level, the
  paper is what stays on the shelf.</p>`},q=[p,u,m,w,f,b,g,y,k,v,T,x,O,C,M,D,R,z,A,S];function H(t){const s=2+Math.max(1,t)+1,n=c(s);return{notes:n-s,total:n}}function j(t,s){const n=new Array(s).fill(0);return t.forEach((h,l)=>h.forEach(d=>n[d]||=l+2)),n}export{q as CHAPTERS,j as chapterStarts,H as planBook};
