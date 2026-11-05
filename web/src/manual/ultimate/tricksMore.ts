// The Ultimate Owner's Guide, chapter 13's later tricks: a pod of monsters that keeps its
// shape, a pulse that sweeps down a ring, locks on a power ladder, and a block set copied for one
// level. Checked against the games' sources: maximus levels/flock.ts (one species, one path, one
// start, equal powers), blaster bus/busBlocks.ts (a ring of 2 lit and 6 dark blocks a tick each,
// each row entering it later), teddy levels/level5Beasts.ts (locks 108 to 125 against tricks of
// 110 to 130) and snowbound blocks/hill.ts (JAMIE.BBL). Monster against monster is code/GM
// PLAYGAME.C DoCollision (equal powers pass, the stronger kills, KillMon gives its "becomes").
import { onCd } from './chapter';

export const MORE_TRICKS = `<h2>A flock that holds its shape</h2>
  <p>Maximus has pods of star whales that spell a word or draw a picture on the galaxy chart.
  Each whale is one monster on one cell. Every whale of a kind walks the same path at the same
  speed from the moment the scene starts, so they all move together and the letters never
  smear. They also share one power, and monsters of equal power pass through each other, so
  the pod never thins itself out. Leave the space a pod swims through empty of other
  monsters, and count it against the map’s 200.</p>
  ${onCd('FLOCK')}
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
  ${onCd('POWERKEY')}
  <p>A price can also be paid in coins. Give a coin the Money counter (number 3) and a stall block the same counter with a negative amount: touching it takes the price, and with too few coins nothing happens. The stall turns into a block that hands over the item.</p>
  ${onCd('BUYIT')}
  <h2>A set copied for one level</h2>
  <p>Snowbound’s long sled run needed more blocks than its full 150. The answer was a copy of
  the set for that one scene, with the blocks the hill never shows (the houses, the mall, the
  arcade) drawn over as snowbanks, birches and distance boards. Every block it shares with the
  other levels keeps its number, so the sled and the snow behave the same. Any scene can load
  its own set this way (Chapter 2).</p>
  <p>The same trick keeps keys apart. Counters carry from level to level, so a spare gold key is
  still in the pocket two levels later. A level whose doors must not take it gets keys and doors
  on another special counter, in a copy of the set made for that level.</p>
  ${onCd('SPECCNTR')}`;
