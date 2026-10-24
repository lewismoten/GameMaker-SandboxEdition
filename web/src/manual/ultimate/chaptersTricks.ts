// The Ultimate Owner's Guide, chapter 13: tricks from the Sandbox games (wind, vehicles, two
// planes, timed hazards, word locks, one-time hurts, cameos, bosses in stages), each told in
// the blocks, monsters and settings that really build it. Checked against the games' sources:
// teddy2 levelLotTiles.ts (gusts), realm characters/chez.ts, snowbound blocks/sled.ts and
// characters/kid.ts, maximus characters/vehicleChar.ts, depth game.ts and tiles/ (planes, iso,
// pulse panels), smirked blocks.ts (fog vents), brief levels/wing.ts (word locks), remote and
// tickle sprites (stings, cameos), blaster bosses/, depth and maximus monsters (bosses).
import { opening, tip, type Chapter } from './chapter';

export const TRICKS: Chapter = {
  id: 'tricks',
  title: 'Tricks From the Sandbox Games',
  head: '13. Tricks',
  html: `${opening(13, 'Tricks From the Sandbox Games', 'Every trick here shipped in a Sandbox game, and every one is made of plain Game-Maker parts: block settings, monster settings and character sequences. No special tools, only clever wiring.')}
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
  </ul>
  <h2>Vehicles are characters</h2>
  <p>Game-Maker has no vehicles, but each scene names its own character file in the
  Integrator. A car, a sled or a submarine is just another <code>.CHR</code>, and a link into a
  scene that uses it puts the hero in the driver’s seat. Score, counters and inventory ride
  along.</p>
  <ul>
    <li><b>Driving THE\u00a0CHEZ.</b> In Quest for the Round Tuit, the Dawdle Flats load
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
  <h2>Word locks and counter gates</h2>
  <p>KEEP IT BRIEF! counts the words a reader carries in the money counter, renamed. A word
  lock is a solid turnstile that takes 20 and becomes an open turnstile; walking through the
  open one gives the 20 back. So the lock only <i>looks</i>: it opens for anyone carrying 20
  words, and spends none. A gate that should keep what it takes simply leaves out the refund.
  Counter gates are the same rule from Chapter 4: in Teddy’s Little Bigger Adventure a clue
  adds 1 to a special counter, and the car door takes 1 and swings open.</p>
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
  the sides): he still stands on its back and is pushed off its sides. And keep pacers a block
  clear of walls, or one that walks up against a wall shoves him inside it.</p>
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
  ${tip('Borrow freely:', 'Open any Sandbox game in the editor and look at the blocks and monsters behind a trick you liked. Everything above is there to be read, setting by setting.')}`,
};
