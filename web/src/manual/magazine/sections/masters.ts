// Tricks of the Shareware Masters: a one-page feature on techniques other Game-Maker authors used,
// each credited to its game by title, and a "did you know" box of limits they pushed. From Lewis's
// survey of the Game-Maker Archive's featured games at the Internet Archive (read with the
// site's own file parsers). It describes the tricks only: no art, music or text from those games.
import { cols, head, list, note, p, side } from '../blocks';
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
  ],
};
