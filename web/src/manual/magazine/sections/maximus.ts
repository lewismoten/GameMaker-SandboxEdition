// Feature: Maximus: The Hundred Worlds, the Sandbox game made to fill every slot Game-Maker
// has. Why it exists, a by-the-numbers table of what it uses against each limit, and what
// standing on the limits showed (each with a tip for authors), then the verdict. The counts
// are Maximus's own (maximus.test.ts reads them back from games/maximus/disk) and the limits
// are the file formats' (web/src/formats), which follow code/GM; the findings are the ones its
// build, LIMITS.TXT and commits record, checked against PLAYGAME.C.
import { BACKBL, CHARBL, MONBL } from '../../../formats/blocks';
import { MAXFRAME, MAXINV, MAXSEQ } from '../../../formats/character';
import { MAXSCENELINKS, SCENEFILES } from '../../../formats/game';
import { LASTMM, MLEN, MWID } from '../../../formats/map';
import { LASTMON, LASTSL, MAXMARCH } from '../../../formats/monster';
import { LASTSND } from '../../../formats/sound';
import { button, cols, grid, head, note, p, pull, rows, shot, side } from '../blocks';
import type { Block, ListingRow, MagSection, Tone } from '../types';

const MAX = 'maximus';

/** One scene record in a .GAM, in bytes (GRATOR.H Scene), and the most PLAYGAME holds in its one 64K block. */
export const SCENE_RECORD = 283;
export const SCENE_CAP = Math.floor(0xffff / SCENE_RECORD);
/** PLAYGAME draws this many monsters at most (PLAYGAME.C MaxMonsShown). */
export const SHOWN_CAP = 50;
/** A text screen's lines: fgets(…, 32) reads 31 characters at a time, so a line with its break fits in 30. */
export const TEXT_READ = 31;

/** What Maximus holds, as its disk has it (maximus.test.ts counts each one again). */
export const COUNTS = {
  /** Scene records in MAXIMUS.GAM: title, ending, 98 places and the one-tick Between Worlds. */
  scenes: 101,
  maps: 98,
  /** The most links any one scene uses (each sector chart). */
  links: 20,
  /** The most file slots any one scene fills (the title scene). */
  fileSlots: 12,
  /** Monsters placed on the busiest map (the Maelstrom), and on all maps together. */
  mapMonsters: 200,
  placed: 6693,
  monFiles: 9,
  /** Creatures in each .MON whose animation fills every step. */
  fullAnimations: 44,
  bblFiles: 5,
  mblFiles: 5,
  heroes: 4,
  /** Sequences each hero has on a key (the rest are standing, dying and getting hurt). */
  keyed: 17,
  sounds: 30,
  songs: 15,
  palettes: 99,
  /** Drawable colors in every palette (index 255 is the clear color). */
  colors: 255,
  /** The widest line on any of its text screens. */
  textWidth: 30,
  files: 515,
  /** Megabytes on the disk, to one decimal. */
  megabytes: 7.1,
};

const n = (x: number) => x.toLocaleString('en-US');

/** The table's rows: what, Maximus / the limit, and where it shows. */
const NUMBERS: ListingRow[] = [
  {
    title: 'Scenes in one game',
    price: `${COUNTS.scenes} / ${SCENE_CAP}`,
    blurb: 'Title, ending, a home station, the galaxy, 5 sector charts, 88 worlds, 3 stops at the Core and a one-tick pass between worlds.',
  },
  { title: 'Links out of a scene', price: `${COUNTS.links} / ${MAXSCENELINKS}`, blurb: 'Each sector chart: the warp home, 18 planets and a jump ring onward.' },
  {
    title: 'Maps, 100 × 100 blocks',
    price: `${COUNTS.maps} full size`,
    blurb: `Every one ${MLEN} × ${MWID}, the most a map holds, and every one wraps around.`,
  },
  {
    title: 'Monsters on one map',
    price: `${COUNTS.mapMonsters} / ${LASTMM}`,
    blurb: `The Maelstrom fills every slot. ${n(COUNTS.placed)} placed across the game.`,
  },
  { title: 'Monsters in a .MON', price: `${LASTMON} / ${LASTMON}`, blurb: `In all ${COUNTS.monFiles} files: ${n(COUNTS.monFiles * LASTMON)} monsters.` },
  { title: 'Pictures in an animation', price: `${LASTSL} / ${LASTSL}`, blurb: `Every step, in all ${COUNTS.fullAnimations} creatures of each file.` },
  { title: 'Corners in a path', price: `${MAXMARCH} / ${MAXMARCH}`, blurb: 'Hopping slimes and figure eights.' },
  { title: 'Background blocks', price: `${BACKBL} / ${BACKBL}`, blurb: `In each of ${COUNTS.bblFiles} sets: ${n(COUNTS.bblFiles * BACKBL)} blocks.` },
  { title: 'Monster blocks', price: `${MONBL} / ${MONBL}`, blurb: `In each of ${COUNTS.mblFiles} sets.` },
  { title: 'Hero blocks', price: `${CHARBL} / ${CHARBL}`, blurb: `For each of ${COUNTS.heroes} heroes: Max on foot, the pod, the diving bell and the rover.` },
  { title: 'Hero sequences', price: `${MAXSEQ} / ${MAXSEQ}`, blurb: `${COUNTS.keyed} on keys in each hero; the Nova burst plays all ${MAXFRAME} frames.` },
  { title: 'Inventory', price: `${MAXINV} / ${MAXINV}`, blurb: 'Ten courier modules, from the Plasma Lance to the hover pack.' },
  { title: 'Extra counters', price: '10 / 10', blurb: 'Numbers 20 to 29: one for each star-shard.' },
  { title: 'Sound effects', price: `${COUNTS.sounds} / ${LASTSND}`, blurb: 'Each one a digitized Sound Blaster sound of its own.' },
  {
    title: 'Colors in a palette',
    price: `${COUNTS.colors} / ${COUNTS.colors}`,
    blurb: `Every drawable color, in all ${COUNTS.palettes} palettes. (Color 255 is see-through.)`,
  },
  {
    title: 'File slots in a scene',
    price: `${COUNTS.fileSlots} / ${SCENEFILES}`,
    blurb: 'The title scene fills all 12 that PLAYGAME reads. The other 8 it never opens.',
  },
  { title: 'Text screen width', price: `${COUNTS.textWidth} / ${TEXT_READ}`, blurb: 'Thirty is the real limit. See “Thirty-one means thirty”.' },
  { title: 'The disk', price: `${COUNTS.files} files`, blurb: `${COUNTS.megabytes} MB, with ${COUNTS.songs} songs and 23 animated films.` },
];

/** A finding from the ceiling: what happened, and what to do about it. */
const found = (title: string, what: string, tip: string, tone: Tone = 'white'): Block => side(title, [p(what), p(`**Tip:** ${tip}`)], tone);

const CEILING_A: Block[] = [
  found(
    'The 21st picture never plays',
    `A monster in a .MON file has room for 21 animation pictures, but PLAYGAME stops counting at ${LASTSL} and starts over. The last slot is saved, loaded and never shown.`,
    `plan on ${LASTSL}. Anything in the 21st is wasted work.`,
  ),
  found(
    'Fifty on the screen, at most',
    `A map holds ${LASTMM} monsters, but PLAYGAME sets aside room behind only ${SHOWN_CAP} of them a frame. Put a 51st on the screen and it is still there, still moving and still able to hurt you. You just can’t see it.`,
    'in a crowded spot, count what fits in one screen, not on the map.',
    'cyan',
  ),
  found(
    'Shots are monsters too',
    `Every blaster bolt is born into one of the map’s ${LASTMM} monster slots. The Maelstrom fills all ${LASTMM}, so a shot has nowhere to go and the gun does nothing. Maximus turned that into the story: in the storm, weapons jam.`,
    'leave a dozen slots free on any map where the hero fires. Blocks that give birth to monsters stop too.',
  ),
  found(
    'Thirty-one means thirty',
    `A text screen reads ${TEXT_READ} characters at a time. Write a line exactly ${TEXT_READ} long and its line break is left over for the next read, so a blank line appears under it. Maximus wraps every text file at ${COUNTS.textWidth}.`,
    `count ${COUNTS.textWidth} columns, and 16 lines to a page.`,
    'yellow',
  ),
];

const CEILING_B: Block[] = [
  found(
    'Twenty sequences go fast',
    `A hero has ${MAXSEQ} sequences. Three play themselves (standing, dying and getting hurt), and Maximus puts a key on each of the other ${COUNTS.keyed}: moves, blaster, six module weapons, two dashes, hover, pick up, drop and hail. There was none left for a second set of arrows on W, A, S and D.`,
    'list every key before you draw a single frame.',
  ),
  found(
    'A quick tap that fired nothing',
    'Let go of a key and PLAYGAME drops the sequence it started, unless it is set uninterruptible. A tap ended the blaster’s sequence before the frame that makes the bolt, so a quick tap did nothing at all.',
    'put the shot on the first frame. Make only stand-still moves uninterruptible, or a direction pressed with them is swallowed.',
    'pink',
  ),
  found(
    'One clock for every copy',
    'A block that animates changes everywhere at once: PLAYGAME times the block, not each spot it sits on. Every force field on a world blinks together, and a vending pad can’t restock alone.',
    'to stagger them, draw two look-alike blocks with different timers.',
  ),
  found(
    'Maps forget, counters remember',
    'A scene loads its map fresh every time you come in, so anything you took is back. Maximus keeps its star-shards in counters 20 to 29 instead. PLAYGAME won’t let a block touch one of those counters if it would leave the counter at zero or less, so a gate that adds 0 opens only for a courier holding the shard, and spends nothing.',
    'anything that must stay done belongs in a counter, not on a map.',
    'cyan',
  ),
  found(
    'Pushy platforms',
    'A solid monster that moves can shove the hero right inside a wall. Maximus gives every Ferry Stone and Drift Raft a block of room to turn, or leaves it out.',
    'keep moving platforms a block clear of the walls they pass.',
  ),
  found(
    'A one-tick scene still flashes',
    'Between Worlds is a scene you pass through in one tick, and PLAYGAME fades its map in and out anyway. Maximus gives it an all-black palette, so the fade happens unseen.',
    'give any pass-through scene a palette of black.',
    'yellow',
  ),
  found(
    'Full means every idea costs one',
    `With all ${BACKBL} blocks of the station set in use, a new idea had to evict an old one: when the medbay got a spent look, it took the slot of a chair.`,
    'keep a few blocks free in each set for the ideas that come last.',
  ),
];

export const MAXIMUS: MagSection = {
  id: 'maximus',
  title: 'Feature: Maximus at the Limit',
  blurb: 'One game fills every slot in Game-Maker. What it found at the ceiling',
  dept: 'FEATURE',
  pages: () => [
    {
      kind: 'article',
      tone: 'white',
      blocks: [
        head('Maximus: The Hundred Worlds', {
          kicker: '★ Feature: Game-Maker at the limit ★',
          size: 'xl',
          level: 2,
          deck: `${COUNTS.scenes} scenes, ${COUNTS.mapMonsters} monsters on one map and not one spare block. Sandbox Software set out to fill every slot in Game-Maker™, and we opened the files to see how close they came.`,
        }),
        grid(
          [
            [shot(MAX, 'title', 'Maximus: The Hundred Worlds, its title screen', 'The title screen. One courier, a hundred worlds.', -2)],
            [
              p(
                'The Maximus Core, the forge-star at the heart of the galaxy, has gone dark, and its light lies scattered in ten star-shards. Max is a courier, and couriers deliver. Fly the pod from world to world, then land and go on foot, by rover or in a diving bell, through grasslands, glaciers, lava fields, drowned temples and derelict stations.',
                { drop: true },
              ),
              p('That is the game. The reason for the game is on the back of the box: **“Pushes Game-Maker to every limit.”**'),
            ],
          ],
          0.4,
        ),
        cols(2, [
          p(
            'Every Game-Maker author hits a wall sooner or later: a block set with no room for one more door, a monster file with no slot for the boss. Maximus was built to find every one of those walls on purpose and stand on it, and then to be a real game anyway, with a story, a shop, a final boss and an ending.',
          ),
          p(
            `So it has ${COUNTS.scenes} scenes, ${COUNTS.maps} full-size maps, ${COUNTS.monFiles} monster files, ${COUNTS.bblFiles} background block sets and ${COUNTS.heroes} heroes, and its disk holds ${COUNTS.files} files. For comparison, our Game of the Month crosses England on three block sets. Every world, sprite, song and sound in Maximus was made by a program from a seed.`,
          ),
          p(
            'It comes with **LIMITS.TXT**, a file on the disk that sets each Game-Maker limit beside how much of it the game uses. We counted again from the game’s own files. Where the two disagreed, we went with the files.',
          ),
          p(
            'Pushing that hard turned up things the manual never mentions: limits smaller than they look, slots that are never read, and a few ways the player behaves only when it is full. Those are on the next pages, each with a tip for your own games.',
          ),
        ]),
        grid(
          [
            [
              side(
                'Fact file',
                [
                  p('**From:** Sandbox Software, 1995. Built by Claude.'),
                  p('**Price:** $15 shareware'),
                  p('**Worlds:** 88, in 5 sectors, plus the Maelstrom, the Citadel and the Heart'),
                  p('**Heroes:** Max on foot, the pod, the diving bell and the rover'),
                  p('**Goal:** ten star-shards, to relight the Core'),
                ],
                'cyan',
              ),
            ],
            [pull('“Maximus was built to find the edges of Game-Maker 3.0 and to stand on them.”', 'LIMITS.TXT')],
          ],
          0.4,
        ),
      ],
    },
    {
      kind: 'article',
      tone: 'cyan',
      blocks: [
        head('By the numbers', {
          kicker: 'Maximus against the limits',
          size: 'l',
          level: 2,
          deck: 'What Maximus uses, then the most Game-Maker allows. We counted it all from the game’s files, and every limit comes from Game-Maker’s own file formats and its player, PLAYGAME.',
        }),
        grid([[rows(NUMBERS.slice(0, 9))], [rows(NUMBERS.slice(9))]], 0.4),
        grid(
          [
            [shot(MAX, 'level', 'Max on Maxima Station’s training deck', 'Maxima Station, where every trip begins.', -1.5)],
            [shot(MAX, 'palette', 'Maxima Station’s palette in the palette tool', 'The station’s palette, open in the palette tool.')],
            [
              side(
                'Room to spare',
                [
                  p(
                    `The biggest ceiling Maximus left alone is scenes. A .GAM keeps each scene in a ${SCENE_RECORD}-byte record, and PLAYGAME holds them all in one 64K block of memory: ${SCENE_CAP} at most. Maximus stopped at ${COUNTS.scenes}.`,
                  ),
                ],
                'white',
              ),
            ],
          ],
          0.25,
        ),
      ],
    },
    {
      kind: 'article',
      tone: 'news',
      blocks: [
        head('What we found at the ceiling', {
          kicker: 'Maximus, continued',
          size: 'l',
          level: 2,
          deck: 'Fill a game to the brim and Game-Maker shows you things a small one never would. Here is what Maximus ran into, and what to do about it in your own game.',
        }),
        grid([CEILING_A, CEILING_B.slice(0, 3)], 0.4),
      ],
    },
    {
      kind: 'article',
      tone: 'white',
      blocks: [
        head('At the ceiling, continued', { kicker: 'Maximus at the limit', size: 'm', level: 2 }),
        grid(
          [[CEILING_B[3], shot(MAX, 'monsters', 'Animation frames of the station’s robots', 'The station’s robots, frame by frame.')], CEILING_B.slice(4)],
          0.4,
        ),
        side(
          'The verdict',
          [
            p(
              '**★★★★½ 90/100.** Big enough to get lost in, and it never feels like a test. Maximus fills every slot it can and still plays fair, and it is the best map we know of to where Game-Maker’s walls are.',
            ),
            p('**+** A real trip across a galaxy, four ways to travel. **–** A full set leaves no room for one more idea: each new one cost an old block.'),
            note('Shareware from Sandbox Software. 256-color VGA, Sound Blaster sound and music.'),
            button(`go:play/${MAX}`, 'Play Maximus: The Hundred Worlds'),
            note(`[Read its manual](go:manual/${MAX}) · [The hint book](go:hints/${MAX}) · [Game-Maker’s numbers](go:ultimate/numbers)`),
          ],
          'pink',
        ),
      ],
    },
  ],
};
