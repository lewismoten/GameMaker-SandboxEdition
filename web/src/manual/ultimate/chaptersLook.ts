// The Ultimate Owner's Guide, chapters 1 and 2: palettes, and blocks that behave. Every claim
// is checked against PLAYGAME (code/GM/PLAYGAME.C) and its port (web/src/engine).
import { opening, tip, type Chapter } from './chapter';

export const PALETTES: Chapter = {
  id: 'palettes',
  title: 'Palettes: One Map, Many Moods',
  head: '1. Palettes',
  html: `${opening(1, 'Palettes: One Map, Many Moods', 'The cheapest special effect in Game-Maker costs 768 bytes. Swap a scene’s palette and every block in it changes its look, without redrawing a single pixel.')}
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
  already built (grays, a sickly green and one red you keep for eyes).</p>
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
  ${tip('Troubleshooting: my high score screen is hard to read.', 'Open the palette of the game’s last level and select color 0. If it isn’t black, that color is the screen’s background. Make it black. If blocks use color 0 as a color of their own, first copy it into a spare entry and repaint those pixels with it, so the level looks the same.')}
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
  ${tip('Pro tip:', 'Check a new palette on the menu and the <kbd>F2</kbd> screen, not just in the level. That is where a missing blue shows up first.')}`,
};

export const BLOCKS: Chapter = {
  id: 'blocks',
  title: 'Blocks That Behave',
  head: '2. Blocks',
  html: `${opening(2, 'Blocks That Behave', 'A background block is more than a picture. It has solid sides, a gravity, a reward or a price, a block it turns into when touched and a block it turns into over time. Most of a game’s cleverness lives here.')}
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
    <li><b>Only the hero feels it.</b> Monsters ignore gravity and go where their movement
    takes them, so a monster walking off a ledge walks on through the air. Keep walkers on paths
    that stay on the ground, and let things that should fall do it with a path that goes down.</li>
  </ul>
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
  ${tip('Pro tip:', 'Leaving a scene and coming back loads its map fresh from the disk: every coin is back, every door shut again. Score, counters and inventory come along with the hero. Plan for it, or a player will farm your coins.')}`,
};
