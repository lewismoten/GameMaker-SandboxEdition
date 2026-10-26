// The Ultimate Owner's Guide, chapter 17's second survey: techniques found in the rest of the
// Internet Archive's Game-Maker Archive collection (.for-lewis/archive2/NOTES.md), told the
// guide's way, without naming the games: the ideas only (NOTICE.md). Each is checked against
// code/GM/PLAYGAME.C: doblocktouchchar refuses a money or 20-29 counter touch that would leave
// it at 0 or less and then changes nothing (3441), PickupBloc asks the same of a pick-up,
// CharBirthMon launches a chase or flee shot along the hero's last move (ci.netx, ci.nety) and
// never aims it again (fromchar, 3369 and 3035), monster contact is pixel by pixel and skips
// see-through pixels (PicChkTouch), DoCollision kills the lower power (equal powers pass), a
// block's timer turns every copy at once (changeblks), and XFERPLAY opens the .gam named after
// its own .EXE (main, argv[0]).
import { tip } from './chapter';

export const ARCHIVE_TRICKS = `<h2>More from the archive</h2>
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
  ${tip('Credit where it’s due:', 'These come from games kept in the Internet Archive’s Game-Maker Archive collection, opened only with this edition’s readers. The guide describes the ideas in its own words; the games, their art, music and words belong to their authors.')}`;
