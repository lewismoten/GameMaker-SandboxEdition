// The Ultimate Owner's Guide, chapters 15 and 16: designing for every player (a tap that moves
// twice, scenery that looks like a prize, a safe start, keys taught in the first room, ways
// back and things left behind, slower hands), and where Game-Maker runs out (an .FLI under DOS
// memory, its other faults and the workarounds, tips for animators, and what Maximus found at
// the ceiling). The engine facts are checked against web/src/engine (character.ts moveChars: a
// sequence starts again while its key is down; keys.ts: letting go ends one that can be
// interrupted) and the FLI facts against code/Image/FLI/FLI.CPP and code/DRV/FILECLSS.CPP as
// formats/fliPlaygame.test.ts ports them, the CMF clock against code/GM/SBMUSIC.C load_file
// (HDRCLK 146 in SOUND.H), and the archive counts are the survey's (.for-lewis/archive/NOTES.md);
// the Maximus findings are TURBO BUTTON's
// (manual/magazine/sections/maximus.ts). The DOSBox screenshot is Lewis's (NOTICE.md).
import { opening, tip, type Chapter } from './chapter';

export const PLAYERS: Chapter = {
  id: 'players',
  title: 'Designing for Every Player',
  head: '15. Every Player',
  html: `${opening(15, 'Designing for Every Player', 'You know your game by heart and your fingers know its keys. The player meets it cold, perhaps with slower hands. Here is how to keep the small surprises from turning into a reason to quit.')}
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
    <li><b>A course to practise on.</b> A short training level, or a first level the instructions
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
  <h2>Designing for slower hands</h2>
  <p>The bot presses keys to the tick. A jump that needs <kbd>↑</kbd> and <kbd>→</kbd> at the
  same moment, a key let go within a tenth of a second or a hold of exactly so long are easy for
  it and hard for many people. Tick <b>Steady hands</b> in the Level check and the bot plays
  again with one key at a time and at least 300 thousandths of a second between changes (set
  your own pace beside it); where it can no longer finish, it says where. The fixes are usually
  small: a jump that already carries sideways, a step to climb instead of a leap, a ledge a
  block wider, a lift that waits.</p>
  ${tip('Hand it over:', 'Watch someone who has never seen the game play the first level without a word from you. Every place they hesitate is a sign, a step or a safer start you still need.')}`,
};

export const LIMITS: Chapter = {
  id: 'limits',
  title: 'Where Game-Maker Runs Out',
  head: '16. Where It Runs Out',
  html: `${opening(16, 'Where Game-Maker Runs Out', 'Some of Game-Maker’s limits are printed on the box. Others show only on a real PC with real memory, or when a game fills every slot. These are the ones the Sandbox games ran into, and the ways round them.')}
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
    platforms a block clear of walls.</li>
    <li><b>A one-tick scene still flashes.</b> PLAYGAME fades every scene in and out; give a
    pass-through scene an all-black palette.</li>
    <li><b>Twenty sequences go fast.</b> Three play themselves, so a hero has 17 keys at most.
    List them before you draw.</li>
  </ul>
  ${tip('Test on the real thing:', 'An emulator such as DOSBox, set to a modest machine, finds what no editor can: memory, timing and the sound card. Play every animation and every scene in it once before you upload.')}`,
};
