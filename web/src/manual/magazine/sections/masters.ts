// Tricks of the Shareware Masters: a three-page feature on techniques other Game-Maker authors used,
// each credited to its game by title, with a diagram of the boss chain (bossChain.ts), and a "did
// you know" box of limits they pushed, and a third page from a second, wider dig through the
// archive (its tricks told without naming games, the Ultimate Owner's Guide chapter 17's "More
// from the archive" in the zine's voice). From Lewis's
// survey of the Game-Maker Archive's featured games at the Internet Archive (read with the
// site's own file parsers). It describes the tricks only: no art, music or text from those games.
import { art, cols, head, list, note, p, pull, side } from '../blocks';
import type { MagSection } from '../types';

export const MASTERS: MagSection = {
  id: 'masters',
  title: 'Tricks of the Shareware Masters',
  // it follows The Shareware Shelf, whose line on the contents page names it
  toc: false,
  dept: 'DESIGN WORKSHOP',
  pages: () => [
    {
      kind: 'article',
      tone: 'white',
      blocks: [
        head('Tricks of the Shareware Masters', {
          kicker: 'Design workshop',
          deck: 'We pulled apart the best shareware on the boards to see how they did it. No hacks and no patches: every trick below is plain Game-Maker, used cleverly.',
          size: 'l',
          level: 2,
        }),
        cols(2, [
          p(
            '**Bosses with hit points.** Game-Maker’s monsters die in one hit, so how does *Blinky 2*’s boss take six? It’s a chain. The boss you can hit turns, when hit, into an identical copy that can’t be hurt and flashes for 50 ticks, which then turns back into the next hittable copy, and so on down the line. The big points sit on the last link. *Blinky 3* makes each flash last longer than the one before (57, 107, 157, 207 ticks), so the fight gets harder as it goes.',
            { drop: true },
          ),
          art(
            'bosschain',
            'A boss with six hit points as a chain: each hittable boss, when hit, becomes a flashing copy that can’t be hurt, which turns into the next hittable boss 50 ticks later; the last one carries the big points.',
            'The chain: hit the boss and it swaps for a flashing copy; 50 ticks later the next link is back. Six links, six hits.',
          ),
          p(
            '**A timer made of blocks.** In *Parsec Man 3D*, empty space on the map screen is an animated block. After 488 ticks it turns into a block that looks exactly the same but hurts. Dawdle, and space itself gets you.',
          ),
          p(
            '**Look-alike secret doors.** Two blocks with the same picture don’t need the same rules. Make a copy of a wall that isn’t solid and you have a secret passage; a copy of air that hurts is a pit you never see coming. More than twenty of the games we opened do it.',
          ),
          p(
            '**Pick your hero.** *Blinky 3* opens on a one-screen room with three doors, and each door starts the first level with a different character file. Every level after that leaves its character slot empty, so whoever you picked comes along. Each jumps, walks and takes hits differently.',
          ),
          p(
            '**Moon physics and a sword.** *Ninja Tuck* has a moon level where the hero walks at a third of his usual speed and jumps drift. The trick: a second copy of his character file, slowed down, loaded for that one scene. His sword is a monster that lives for three ticks right in front of him: one quick swipe, and gone.',
          ),
          p(
            '**Games that play themselves forward.** The resting animation doesn’t have to stand still. In *Hurdles* it runs 20 to 30 pixels a tick, so the athlete never stops and the keys jump, duck and brake. *Seal Boarders* drifts it down and sideways, and you’re sledding downhill on 33 courses.',
          ),
        ]),
      ],
    },
    {
      kind: 'article',
      tone: 'white',
      blocks: [
        head('More tricks of the masters', { kicker: 'Design workshop', size: 's', level: 2 }),
        cols(2, [
          p(
            '**One key, a whole arsenal.** *A-J’s Quest* puts four weapons on the Space bar: each is its own move, switched off until you pick that weapon up. One more Space move with no pictures just plays a voice saying you’ve got nothing to throw.',
          ),
          p(
            '**Score pop-ups.** Beaten enemies in *Shanna* turn into little monsters that float up 15 pixels and vanish after 30 ticks, so the points rise off the screen. Its author warns that they use up monster slots, so spend them wisely.',
          ),
          p('**Timing by hand.** RSD’s own *Penguin Pete* gives a crowd of one creature slightly different frame times, so they never blink in step.'),
          p(
            '**A fade for next to nothing.** RSD’s text box animation changes only the colors, never the pixels: 40 frames in 27 KB. A full-screen animation can run a megabyte.',
          ),
        ]),
        pull('“Every trick here is plain Game-Maker, used cleverly.”'),
        side(
          'Did you know?',
          [
            list([
              'The scene list goes well past 20. *A-J 3* has 81 scenes, *Taken by a Vampire One Night* 80 and *Blinky 3* 60.',
              '*Ninja Tuck* places all 200 monsters a map can hold on one level.',
              '*Badman III* has a boss 31 stages long.',
              'PLAYGAME plays a song only if its tempo clock is 146. Songs on another clock play silence: *Crystal Quest*’s win song is one. *A-J’s Quest* ships the same tune with that one byte fixed.',
              'Even RSD’s own text box animations hold pictures bigger than DOS likes to read in one piece. With plenty of free memory, they play fine.',
            ]),
          ],
          'yellow',
        ),
        note(
          'From the games’ own files in the Game-Maker Archive’s collection at the Internet Archive (archive.org). These games belong to their authors: we describe the tricks, and show none of their pictures, music or words. Every title is on [The Shareware Shelf](go:mag/shelf).',
        ),
      ],
    },
    {
      kind: 'article',
      tone: 'white',
      blocks: [
        head('Masters, the next disk box', {
          kicker: 'Design workshop',
          deck: 'We went back to the boards for another two hundred games. Same rules: plain Game-Maker, no patches, and every trick one you can wire up tonight.',
          size: 's',
          level: 2,
        }),
        cols(2, [
          p(
            '**Dirt that runs on a meter.** A block that takes from a counter gets refused when you’re broke, and a refused touch does nothing. So make earth that costs one shovel-charge and turns into tunnel: dig till you’re out, then it’s rock again. Do it with sky that turns into an updraft and you’ve got a jetpack with fuel.',
            { drop: true },
          ),
          p(
            '**The gate is the exit.** Put the level’s only link right on a gate that takes exactly as many dots as the maze holds. Eat the last one and the door swings open. Count twice: we found one gate asking for 19 keys on a level with 18.',
          ),
          p(
            '**An AND gate made of monsters.** Equal powers pass through each other; higher kills lower. Make the right setting of each dial weaker than the wrong ones, then send a checker monster down the row. It only reaches the lamp at the end when every dial is right. Yes, logic. In Game-Maker.',
          ),
          p(
            '**Aim with your feet.** A shot that chases instead of following a path flies whichever way the hero last moved. One monster, eight directions. Got four fire keys? Make each one nudge the hero a pixel first, or they all fire the same way.',
          ),
          p(
            '**Doors on a timer.** A wall that turns into an open look-alike after 1,000 ticks makes a “hold out till the door opens” room. Put a ring of digit blocks beside it, 18 ticks a number, and the player can watch it count down.',
          ),
          p(
            '**The ghost move.** Monsters only hit the hero where his pixels touch theirs, and see-through pixels never touch. Show a frame that’s all see-through and nothing can lay a finger on him. Spikes still sting, though: blocks hit by the square.',
          ),
          p(
            '**One world, five copies.** One author kept a copy of every scene for each boss beaten. The links in each copy lead to the same copy, so when you go back, the world remembers. It costs scenes, not maps.',
          ),
        ]),
        side(
          'Did you know?',
          [
            list([
              'PLAYGAME moves the hero 11 pixels a tick, tops. Draw a 30-pixel leap and he still goes 11. About twenty of the games we opened jump short because of it.',
              'Two links on one square? Only the first one ever fires. One game’s level select lost a whole level that way.',
              'Some authors hex-edit the player itself, to rename Lives or to keep Game-Maker from opening their files. Older players even carry the registered owner’s name inside.',
              'The player opens the .GAM named after its own .EXE, so a second copy of both makes a shareware cut from the same files.',
            ]),
          ],
          'yellow',
        ),
        note(
          'From the games’ own files in the Game-Maker Archive’s collection at the Internet Archive, retold in our words. How to build each one is in [The Ultimate Owner’s Guide](go:ultimate/shareware).',
        ),
      ],
    },
  ],
};
