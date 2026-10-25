// The Ultimate Owner's Guide, chapter 11 and appendix B: designing with a goal (what makes players
// stay, put in terms of Game-Maker's own settings) and the checklist before a game goes out.
// The engine facts are checked against web/src/engine (character.ts, monsters.ts, touch.ts,
// scroll.ts, scene.ts); the advice is our own.
import { opening, tip, type Chapter } from './chapter';

export const CRAFT: Chapter = {
  id: 'craft',
  title: 'Designing With a Goal',
  head: '11. Designing With a Goal',
  html: `${opening(11, 'Designing With a Goal', 'Every tool in this guide can make a game more impressive. This chapter is about making it more fun, which is not always the same thing, and is the only thing a player will remember.')}
  <h2>Fun first, fireworks second</h2>
  <p>Before you build the clever part, write one sentence: what does the player <i>do</i>, and
  why is it fun to do it again? A clever trick or a forty-block boss earns its place
  only if it serves that sentence. Play your first level before you draw the tenth. If it
  isn’t fun with plain blocks, prettier blocks won’t save it.</p>
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
    <li><b>Momentum</b> for ice, space or a vehicle, where a little slide is the point.</li>
  </ul>
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
  </ul>
  <h2>Fair enemies</h2>
  <ul>
    <li><b>Few at a time.</b> Two or three enemies on the screen at once is usually plenty: the
    player can read each one. Eight at once tends to blur into noise, but a swarm can be the
    point of a level, a wave to survive or a shooter’s big moment. Count them on the map with
    the 16 by 10 view in mind, and decide which you mean.</li>
    <li><b>Births that stop.</b> A birth block keeps giving birth for as long as the hero is
    near. Unless a flood is the idea, give it a long time between births, or let its block
    animate to a quiet one after a while. Don’t make a killed enemy turn into another hostile one by accident: “becomes” is
    for stages, not for multiplying.</li>
    <li><b>Easy to see.</b> Draw enemies from ramps the background doesn’t use, with a dark
    outline, so none of them hides against the scenery by accident. A camouflaged foe can be a
    fair trick when the game hints at it first.</li>
    <li><b>One hit, one hurt.</b> A strong monster hurts on every tick it overlaps the hero, so
    a slow escape costs many hit points. Keep the hurt small and give the Hurt sequence frames
    that move the hero back a few pixels, out of reach.</li>
    <li><b>Chasers that let go.</b> A monster that chases forever turns a level into a race.
    If a race isn’t what you want, give chasers a lifetime, or a chase speed a little slower
    than the hero’s walk.</li>
  </ul>
  <h2>A final boss worth the trip</h2>
  <p>End on an event. Build the boss as a chain of monsters joined by “becomes”, one stage per
  hit, each a little faster or with a new attack path, so the player sees the fight turning.
  Give him a shape and colors nothing else in the game has, room to dodge, and a reward:
  a big score, an exit picture, a won screen that says thank you.</p>
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
  </ul>
  <h2>Finish the idea</h2>
  <p>A game that stops early, or whose last level is a sketch, leaves players remembering the
  gap. Fill in the storyline, instructions and credits; make the won screen; play it through
  from the title one last time. Then hand it to friends and watch without helping. Every place
  they frown is your to-do list.</p>
  ${tip('Rules of thumb, not rules:', 'Everything in this chapter is a habit that makes most games better, and every one of them can be broken on purpose. If you have to explain it, the game hasn’t; put the explanation in the level.')}`,
};

export const UPLOAD: Chapter = {
  id: 'upload',
  title: 'Before You Upload',
  head: 'Appendix B',
  newPage: true,
  html: `${opening('Appendix B', 'Before You Upload', 'Tear this page out, or copy it. Tick every box before your game leaves your hard disk. A line you broke on purpose counts as ticked.')}
  <table class="ug-check">
    <tr><th aria-label="Done"></th><th>Check</th></tr>
    <tr><td>☐</td><td>The first minute is fun; the hero’s speed feels right to someone new, and a tap moves him once</td></tr>
    <tr><td>☐</td><td>The hero faces the way he walks; pacing monsters turn round</td></tr>
    <tr><td>☐</td><td>Every jump has a block to spare; every landing is in sight before the jump</td></tr>
    <tr><td>☐</td><td>Each level asks a little more; the last is the best, not the meanest</td></tr>
    <tr><td>☐</td><td>Long levels are split into scenes, so a death costs little</td></tr>
    <tr><td>☐</td><td>Every danger shows before it can kill; hazard blocks fill their cells; the start is safe</td></tr>
    <tr><td>☐</td><td>Nowhere to get stuck: every pit has a way out, every lock its key, and nothing needed is left behind a one-way spot</td></tr>
    <tr><td>☐</td><td>Two or three enemies on a screen, each with a job, unless a crowd is the point; birth blocks rest</td></tr>
    <tr><td>☐</td><td>Enemies stand out in every palette; a touch costs little and pushes clear</td></tr>
    <tr><td>☐</td><td>Every item can be reached and no scenery looks like one; mazes have landmarks; no wait over 3 seconds</td></tr>
    <tr><td>☐</td><td>Someone with slower hands can finish: one key at a time, no split-second timing</td></tr>
    <tr><td>☐</td><td>The final boss has stages; the ending is a real scene, not an ad</td></tr>
    <tr><td>☐</td><td>Something new every level or two; the gimmick has its own level</td></tr>
    <tr><td>☐</td><td>Any key beyond the arrows and fire is taught in the game itself, near the start, and sits under the left hand</td></tr>
    <tr><td>☐</td><td>Animations loop smoothly and play in real DOS; menu, <kbd>F2</kbd> and text screens are readable</td></tr>
    <tr><td>☐</td><td>Frequent sounds are short; no voice line is cut off; music fits</td></tr>
    <tr><td>☐</td><td>Storyline, instructions, credits, won and lost screens are filled in</td></tr>
    <tr><td>☐</td><td>The demo plays the same way twice</td></tr>
    <tr><td>☐</td><td>Three friends played it through, and you fixed where they got stuck</td></tr>
  </table>`,
};
