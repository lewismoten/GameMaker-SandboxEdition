// The Ultimate Owner's Guide, chapter 12: level design, the part of a game players judge
// hardest (getting stuck, blind drops, hazards that hurt where nothing is drawn, padding,
// mazes with no landmarks). The engine facts are checked against web/src/engine
// (touch.ts getTouchBlocks: a block touches through its whole cell; monsters.ts PicChkTouch:
// a monster only by its drawn pixels; character.ts moveCharGrav: gravity gains a pixel a tick
// every tick, up to 44; monsters.ts chkMonChr: only a monster on screen touches the hero; KillMon:
// "becomes" is born on the same spot); the advice is our own, and the lessons on fair danger,
// look-alike blocks and finding the way draw on watching players in two videos (NOTICE.md).
import { opening, tip, type Chapter } from './chapter';

export const LEVELS: Chapter = {
  id: 'levels',
  title: 'Levels Players Forgive',
  head: '12. Levels Players Forgive',
  html: `${opening(12, 'Levels Players Forgive', 'Players forgive a plain-looking game. They don’t forgive a level that traps them, kills them without warning or wastes their evening. Here is how to build maps that are hard in the right way.')}
  <h2>Teach, test, twist</h2>
  <p>Give each level one new idea and walk it through three beats. First show it where a
  mistake is cheap: the first spring sits over flat floor. Then ask for it under a little
  pressure: a spring over a pit. Then turn it: a spring that throws the hero past a key they
  must come back for. A mechanic used once, in its plainest form, often feels like an idea left
  half explored, so ask whether it could come back with a twist. Sometimes the answer is no: a
  one-off surprise, a single silly level, a joke told once can be the best moment in a game. The
  last level is a fine place for every idea to come back together.</p>
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
  <h2>Opposites apart</h2>
  <p>Two blocks that do opposite things (a lift up and a lift down, ice beside glue, a push
  left beside a push right) should never touch, and should never share a color. Put a block of
  plain ground between them, so one tap too many isn’t the difference between the way on and
  the bottom of the map.</p>
  <h2>Everything on the map has a job</h2>
  <ul>
    <li><b>Reachable treasure.</b> Collect every item in your own game at least once. A coin
    sealed behind a log reads as a mistake, not a secret; if it is scenery, draw it as
    scenery. An extra life in plain view that no route reaches is worse: it is a joke at the
    player’s expense.</li>
    <li><b>Shots that spare the prizes.</b> A prize that moves is a monster, and the hero’s shot
    kills a monster weaker than itself. Give moving prizes at least the shot’s power (still under
    100, so the hero’s touch collects them), or a stray shot can destroy the very thing the
    level asks for.</li>
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
    <li><b>Make the exit a beacon.</b> Draw the way out unlike anything else in the level, and
    animate it: every copy of an animated block changes at once, so a doorway that glows or a
    flag that waves catches the eye from across the screen.</li>
    <li><b>Signs at the turns.</b> An arrow block at a crossroads costs one block of the 150.
    Letter a few words on a sign where the level asks for something new.</li>
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
  <h2>Detours worth taking</h2>
  <p>The best levels offer a choice: the safe way on, or a risky side path with a prize. Keep
  the side path optional, and its way back as fair as its way in; an extra life that costs two
  on the return trip is a trap with a bow on it. A quiet, easy level just before the last
  stretch lets the player catch their breath and feel how far they have come.</p>
  <h2>Controls the level teaches</h2>
  <p>Arrow keys and a fire key need no lesson; anything more does. Put the lesson in the level:
  a sign that says <i>Press Space to dig</i> right where the first digging is. And make every
  key answer quickly: a sequence whose first frame waits half a second can feel broken, however
  good it looks, unless the wind-up is the point of a heavy move. A key kept secret on purpose is
  a different thing, and a fine one: then let a clue lead to it.</p>
  <h2>An ending, not an ad</h2>
  <p>The last screen the player sees is the one they will tell friends about. Make it a real
  scene with its own music and a thank-you, so nobody has to ask whether they won. If you want to
  sell a sequel, say so after the ending, never instead of it. Make the lost screen worth seeing
  too: it is the one players see most, and a friendly joke there sends them back for another
  try.</p>
  ${tip('Play it badly:', 'Your own test runs are too good. Once a level is done, play it again making every mistake you can think of. Each one that leaves you stuck, blind or bored is a fix.')}`,
};
