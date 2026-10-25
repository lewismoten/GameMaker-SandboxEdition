// The Ultimate Owner's Guide, chapter 11 and appendix B: designing with a goal (what makes players
// stay, put in terms of Game-Maker's own settings) and the checklist before a game goes out.
// The engine facts are checked against web/src/engine (character.ts, monsters.ts, touch.ts,
// scroll.ts, scene.ts) and code/GM/PLAYGAME.C (ChangeScroll's stop lines, CharBirthMon's shot
// row and direction, DoBlockTouchChar taking hit points even while Hurt plays); the advice is
// our own. What players said about Game-Maker games comes from watching levelengine's RSD Game
// Maker Binge and Pixelmusement's ADG Episode 250 (NOTICE.md); nothing of theirs is quoted.
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
  ${tip('Watching people play:', 'Several pieces of advice in this chapter and the next few come from watching other people play Game-Maker games: levelengine’s long livestream “RSD Game Maker Binge” (2020) and Pixelmusement’s “ADG Episode 250 - Game-Maker” (2018). What made players quit, and what made them grin, is retold here in this guide’s own words, with every engine fact checked against PLAYGAME.')}
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
    <li><b>Say how long it is.</b> Players who can see the end keep going. Put “level 3 of 10”
    on each level’s intro picture, and say in the instructions how many levels there are. A
    short game that is finished beats a long one nobody sees the end of.</li>
  </ul>
  <h2>Fair enemies</h2>
  <ul>
    <li><b>Few at a time.</b> Two or three enemies on the screen at once is usually plenty: the
    player can read each one. Eight at once tends to blur into noise, but a swarm can be the
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
    <li><b>Music in every level.</b> A silent level feels unfinished. Players notice music of
    your own, and they recognize a tune lifted from somewhere else, so write your own or credit
    whose it is.</li>
    <li><b>Nothing that flashes fast.</b> A block ring with one-tick frames, or an animation
    that swaps bright and dark, can flash 18 times a second. Keep big bright flashes under three
    a second, for the comfort and safety of every player.</li>
    <li><b>Kind jokes.</b> Funny is good; funny at the expense of a real person, or of a group
    of people, isn’t.</li>
  </ul>
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
    <tr><td>☐</td><td>What the hero can stand on looks solid, and what he falls through doesn’t</td></tr>
    <tr><td>☐</td><td>Nowhere to get stuck: every pit has a way out, every lock its key, and nothing needed is left behind a one-way spot</td></tr>
    <tr><td>☐</td><td>Two or three enemies on a screen, each with a job, unless a crowd is the point; birth blocks rest</td></tr>
    <tr><td>☐</td><td>Enemies stand out in every palette; a touch costs little and pushes clear</td></tr>
    <tr><td>☐</td><td>Solid monsters can’t trap the hero: their paths stop a block short of walls, stay off the map’s top and bottom rows and never close in</td></tr>
    <tr><td>☐</td><td>A few lives, not dozens: a death costs a little, not everything</td></tr>
    <tr><td>☐</td><td>Every item can be reached and no scenery looks like one; mazes have landmarks; no wait over 3 seconds</td></tr>
    <tr><td>☐</td><td>Nothing shown can’t be used: no doors that lead nowhere, no prizes in view but out of reach, no prizes your own shots destroy</td></tr>
    <tr><td>☐</td><td>Someone with slower hands can finish: one key at a time, no split-second timing</td></tr>
    <tr><td>☐</td><td>The final boss has stages; the ending is a real scene, not an ad</td></tr>
    <tr><td>☐</td><td>Something new every level or two; the gimmick has its own level</td></tr>
    <tr><td>☐</td><td>Any key beyond the arrows and fire is taught in the game itself, near the start, and sits under the left hand</td></tr>
    <tr><td>☐</td><td>The help names every key the hero has, and only those</td></tr>
    <tr><td>☐</td><td>The goal fits in one line, and the instructions say it; help and story fit in three pages</td></tr>
    <tr><td>☐</td><td>Every odd rule is explained in the game or the help</td></tr>
    <tr><td>☐</td><td>Players can tell how far they are: level cards say which level of how many</td></tr>
    <tr><td>☐</td><td>Animations loop smoothly and play in real DOS; menu, <kbd>F2</kbd> and text screens are readable</td></tr>
    <tr><td>☐</td><td>Nothing flashes faster than three times a second</td></tr>
    <tr><td>☐</td><td>The title screen shows the game you’ll play</td></tr>
    <tr><td>☐</td><td>Frequent sounds are short; no voice line is cut off; music fits</td></tr>
    <tr><td>☐</td><td>Storyline, instructions, credits, won and lost screens are filled in</td></tr>
    <tr><td>☐</td><td>The first scene’s hero sets the starting hit points, lives and counters for every hero; every hero has a standing picture</td></tr>
    <tr><td>☐</td><td>Nothing in the game mocks a real person or a group</td></tr>
    <tr><td>☐</td><td>The demo plays the same way twice</td></tr>
    <tr><td>☐</td><td>Three friends played it through, and you fixed where they got stuck</td></tr>
  </table>`,
};
