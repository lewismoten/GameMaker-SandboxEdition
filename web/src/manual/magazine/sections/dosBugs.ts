// The feature on Lewis testing the games in real DOS (DOSBox): the web engine copies PLAYGAME
// closely, but the files still have to work with RSD's own programs. Each case is what Lewis saw,
// its cause and its fix, from the commits and the code: FLI chunks and FileRead
// (code/DRV/FILECLSS.CPP, web/src/formats/fli.ts FLI_CHUNK_MAX), DoLineCompress's signed count
// and the AllBlack chunk's BoxFill (code/Image/FLI/FLI.CPP, code/DRV/VGAOBJ.ASM), the palette
// last in a split frame, the help files beside a DOS export (export/exportDos.ts), Transfer's
// path (retro/gm.ts), the CP437 glyphs (retro/text/cp437.ts, cd/gm/about.hlp) and Carl's buzz
// (games/carl/src/sound/sounds.ts). dosBugs.test.ts checks what the code can show. DESIGN lists
// the design problems his play turned up; give one its `fix` once its commit is in.
import { art, button, cols, grid, head, list, note, p, pull, side } from '../blocks';
import type { MagSection } from '../types';

/**
 * A design problem Lewis's play turned up: the game, what happened, and its fix once the fix's
 * commit is in (until then the list says it is being fixed).
 */
interface DesignFind {
  game: string;
  what: string;
  fix?: string;
}

export const DESIGN: DesignFind[] = [
  {
    game: 'KEEP IT BRIEF!',
    what: 'a quick tap of an arrow walked two blocks: the walk was shorter than a tap, so PLAYGAME played it twice',
    fix: 'a tap walks one block', // 298647c9
  },
  { game: 'Snowbound', what: 'the sled sat on flat snow at the top of the hill, one shove per press of Down', fix: 'one push starts the run' }, // 9160dd70
  { game: 'Sandcastle Knight', what: 'nothing at the start said G picks things up; only the manual did' },
  {
    game: 'Teddy’s Little Big Adventure',
    what: 'in the drive between levels, Teddy’s head floated behind THE CHEZ',
    fix: 'he rides up front, head out of the door window', // db7344e8
  },
  { game: 'Teddy’s Little Bigger Adventure', what: 'once over the kitchen fridge, there was no way back', fix: 'a step stool beside it' }, // 54bd7170
  { game: 'Teddy’s Little Biggest Adventure', what: 'outside without the keys, with no way back in' },
  { game: 'In The Year 2000!', what: 'at the Science Fair, short of pages, with none left to find after a life was lost' },
];

/** A design find's line in the list. */
export const designLine = (d: DesignFind): string => `**${d.game}:** ${d.what}. ${d.fix ? `Fixed: ${d.fix}.` : 'Being fixed.'}`;

export const DOS_BUGS: MagSection = {
  id: 'dos-bugs',
  title: 'Feature: Bugs Only DOS Could Find',
  blurb: 'The web version copies PLAYGAME closely. Lewis played every game in DOSBox anyway, and here is what turned up',
  dept: 'FEATURE',
  pages: () => [
    {
      kind: 'article',
      blocks: [
        head('Bugs Only DOS Could Find', {
          kicker: 'Feature',
          size: 'xl',
          level: 1,
          deck: 'The Sandbox Edition’s engine copies PLAYGAME closely. Lewis Moten played the games in DOSBox anyway, on RSD’s own programs, and found what a copy can’t show.',
        }),
        cols(2, [
          p(
            'The web engine reads RSD’s source and does what it says, so a game that plays in a browser should play in DOS. *Should.* The games ship as real Game-Maker files, and those files still have to work with RSD’s real programs, in 640K. So Lewis set up DOSBox with Game-Maker and every game on its C: drive and played them, one by one. Here is his bug list: what he saw, why, and the fix.',
            { drop: true },
          ),
          head('A Fly Named Carl, smeared', { size: 's', level: 2 }),
          p(
            '**Saw:** Carl’s cover came up streaked and speckled, then healed over the next seconds. **Why:** its first frame was one 63,446-byte chunk. RSD’s FileRead reads an animation into a buffer of up to 65,520 bytes, smaller when memory is short, and a game run through its own player is short. When a chunk doesn’t fit, FileRead quietly hands over less; the decoder draws the rest from whatever was left in memory. Each later frame’s small changes painted over some of the junk. **Fix:** big frames are now bands, no chunk over 16,000 bytes. Same pictures, frame for frame.',
          ),
        ]),
        grid(
          [
            [
              art(
                'dos-carl',
                'A Fly Named Carl’s cover in DOSBox: the title and the line The Bard of Bizarre, 1995 - Shareware are sharp, but the room behind them is smeared with stripes and specks of junk',
                'Lewis’s own DOSBox screenshot. The title and the bottom line came in later, small chunks that fit, so they drew right; the room behind them is the first frame, decoded from stale memory.',
              ),
            ],
            [
              head('Virus Blaster, frozen', { size: 's', level: 2 }),
              p(
                '**Saw:** a black screen, then a hang, the music stuck on one note. **Why:** the same trouble with a 64,806-byte chunk, the biggest in any of the games. **Fix:** the same bands.',
              ),
              head('The fix that needed a fix', { size: 's', level: 2 }),
              p(
                '**Saw:** after that, KEEP IT BRIEF! and Virus Blaster went black. **Why:** the first bands sat on an AllBlack chunk, the format’s “clear the screen.” RSD’s player clears with the screen’s BoxFill, and PLAYGAME’s VGA screen has none: a call to a null pointer. **Fix:** no AllBlack chunks; a frame that starts from nothing draws every pixel.',
              ),
            ],
          ],
          0.4,
        ),
        cols(2, [
          head('Third Goat from the Left, “4. The Stable”', { size: 's', level: 2 }),
          p(
            '**Saw:** the card for the fourth act broke. **Why:** one line had 128 changes on it. RSD’s decoder reads that count as a signed byte, so 128 is −128: more than 65,000 changes for one line. **Fix:** no line over 127.',
          ),
          head('The flash before the intro', { size: 's', level: 2 }),
          p(
            '**Saw:** between the Sandbox logo and an intro, the faded logo flashed up in the wrong colors. **Why:** PLAYGAME shows each chunk as it reads it, and the new palette came first, lighting up the old picture. **Fix:** the palette comes last.',
          ),
        ]),
        side(
          'The test it left behind',
          [
            p(
              'Every .FLI in every game now plays through a copy of RSD’s FileRead and decoders with a 16,000-byte buffer, frame for frame against the web’s own player. A chunk too big, or a line of 128 changes, fails the tests.',
            ),
            button('go:ultimate/limits', 'The Ultimate Owner’s Guide: Where Game-Maker Runs Out'),
          ],
          'cyan',
        ),
      ],
    },
    {
      kind: 'article',
      blocks: [
        head('Real Habits, Real Files', { kicker: 'Bugs Only DOS Could Find, continued', size: 'l', level: 2 }),
        cols(2, [
          head('No help in a DOS export', { size: 's', level: 3 }),
          p(
            '**Saw:** in a game exported for DOS, Help on the setup screen and the in-game help found no text. **Why:** the games RSD’s Transfer made carry CONFIG.HLP and GMHELP.TXT beside the player, and the export left them out. **Fix:** Export for DOS puts them in.',
          ),
          head('Transfer, too fussy', { size: 's', level: 3 }),
          p(
            '**Saw:** on the 1994 desk, Utilities ▸ Transfer turned down A:\\BLASTER, the path Lewis would type on a real PC, and stopped cold with a game disk still in drive A:. **Fix:** any path on A: will do, and since the game is already read in, a blank disk from the disk box can go in its place.',
          ),
          head('Boxes for music notes', { size: 's', level: 3 }),
          p(
            '**Saw:** Game-Maker’s About screen, on the desk, had empty boxes where DOS shows ♫ in its corners and ◘ beside its title. **Fix:** the desk’s font now has all 256 characters of the PC’s code page 437. And its **Version 2.00** is no typo: RSD’s own ABOUT.HLP on the 3.0 CD says so, and so does the desk.',
          ),
          head('Carl’s beep', { size: 's', level: 3 }),
          p(
            '**Saw:** Carl beeped, high and sharp, at every press of an arrow. **Fix:** a low, rough buzz, pitches round 115 Hz that jump every step, about 70 ms, like a fly’s wings. It stays on the PC speaker on purpose: a digitized sound there would cut off a lyric.',
          ),
        ]),
        pull('“The web reads RSD’s code. DOSBox runs it.”'),
        side(
          'Not bugs, but…',
          [p('Playing every game to the end, Lewis also found design problems, the same on the web as in DOS:'), list(DESIGN.map(designLine))],
          'yellow',
        ),
        p(
          'The moral, if your game is headed for a floppy: export it for DOS and play it in DOSBox before you pass it around. The web can tell you a level works. Only DOS can tell you it fits.',
        ),
        grid([[note('Found by Lewis Moten in DOSBox 0.74-3-3; fixed with Claude.')], [button('go:guide/export', 'The Guide: export for DOS')]], 0.3),
      ],
    },
  ],
};
