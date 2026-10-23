// The Ultimate Owner's Guide, chapter 12: level design, the part of a game players judge
// hardest (getting stuck, blind drops, hazards that hurt where nothing is drawn, padding,
// mazes with no landmarks). The engine facts are checked against web/src/engine
// (touch.ts getTouchBlocks: a block touches through its whole cell; monsters.ts PicChkTouch:
// a monster only by its drawn pixels; character.ts moveCharGrav: gravity gains a pixel a tick
// every tick, up to 44); the advice is our own.
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
  must come back for. A mechanic used once, in its plainest form, is a feature the game forgot
  to finish. The last level is where every idea comes back together.</p>
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
  <h2>Opposites apart</h2>
  <p>Two blocks that do opposite things (a lift up and a lift down, ice beside glue, a push
  left beside a push right) should never touch, and should never share a color. Put a block of
  plain ground between them, so one tap too many isn’t the difference between the way on and
  the bottom of the map.</p>
  <h2>Everything on the map has a job</h2>
  <ul>
    <li><b>Reachable treasure.</b> Collect every item in your own game at least once. A coin
    sealed behind a log reads as a mistake, not a secret; if it is scenery, draw it as
    scenery.</li>
    <li><b>No padding.</b> Every enemy should teach, test or guard something. Three more
    monsters dropped beside the exit don’t make a level harder, only meaner.</li>
    <li><b>Fair speeds.</b> An enemy much faster than the hero has to be easy to read: a
    straight path, a clear warning. Never start a level with a threat already in reach.</li>
  </ul>
  <h2>Mazes with a compass</h2>
  <p>A maze is fun while the player is making choices and miserable once they are only
  guessing. Give it landmarks: a different floor color for each wing, a sign at the
  crossroads, the goal glimpsed through a window early on. Keep dead ends short, or put
  something in them worth the walk. Draw your maze on paper and trace the route; if your
  pencil gets lost, so will the player.</p>
  <h2>Waiting is not a challenge</h2>
  <p>A hazard that blocks the way on a timer (a burst of lightning, a lift, a crusher) should
  open again within about three seconds. Longer, and the player is only standing there. If the
  wait must be long, give them something to do meanwhile: a coin to grab, a foe to dodge.</p>
  <h2>Detours worth taking</h2>
  <p>The best levels offer a choice: the safe way on, or a risky side path with a prize. Keep
  the side path optional, and its way back as fair as its way in; an extra life that costs two
  on the return trip is a trap with a bow on it. A quiet, easy level just before the last
  stretch lets the player catch their breath and feel how far they have come.</p>
  <h2>Controls the level teaches</h2>
  <p>Arrow keys and a fire key need no lesson; anything more does. Put the lesson in the level:
  a sign that says <i>Press Space to dig</i> right where the first digging is. And make every
  key answer at once: a sequence whose first frame waits half a second feels broken, however
  good it looks.</p>
  <h2>An ending, not an ad</h2>
  <p>The last screen the player sees is the one they will tell friends about. Make it a real
  scene with its own music and a thank-you. If you want to sell a sequel, say so after the
  ending, never instead of it.</p>
  ${tip('Play it badly:', 'Your own test runs are too good. Once a level is done, play it again making every mistake you can think of. Each one that leaves you stuck, blind or bored is a fix.')}`,
};
