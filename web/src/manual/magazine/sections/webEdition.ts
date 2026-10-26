// The feature on the web edition: what Game-Maker: Sandbox Edition adds that RSD's DOS
// Game-Maker 3.0 never had, in the 1995 magazine's voice (with a wink at reviewing a browser
// edition in 1995). Every feature it names is in the code: CHECKLIST gives each one's module,
// and webEdition.test.ts checks that the files are there. Sources: README.md, web/src/README.md,
// docs/embed.md and the original code/GM, which has no undo, no music or FLI maker and reads
// pictures only from GIFs. Its tour page shows today's web in real screenshots (webShots.ts).
// Its last page jumps to the back of the book (WEB_EDITION_JUMP); both halves share a page with a small ad.
import { art, button, cols, grid, head, jumpFrom, jumpOn, list, note, p, pull, rows, side } from '../blocks';
import type { ListingRow, MagSection } from '../types';
import { BLANK_DISKS, MOUSE_PADS } from './smallAds';

/** Where the feature picks up at the back of the book (WEB_EDITION_JUMP). */
const JUMP = 'web-edition-jump';

/** One line of the feature checklist: what it is, whether the 1995 box had it, and the module that does it now. */
interface Feature {
  name: string;
  /** In the 1995 box: yes, in part, or not at all. */
  then: 'yes' | 'part' | 'no';
  /** The module that does it in this edition, from the repository root. */
  module: string;
}

export const CHECKLIST: Feature[] = [
  { name: 'Plays the original game files, byte for byte', then: 'yes', module: 'web/src/engine/game.ts' },
  { name: 'Design tools in DOS (the desk’s PC runs them)', then: 'yes', module: 'web/src/vga/blocedit.ts' },
  { name: 'Point-and-click editors in a browser window', then: 'no', module: 'web/src/editor/editors/registry.ts' },
  { name: 'Undo and Redo', then: 'no', module: 'web/src/editor/core/history.ts' },
  { name: 'Level check: heat map, stuck places, fixes', then: 'no', module: 'web/src/editor/check/explore.ts' },
  { name: 'Facing and key-reach checks', then: 'no', module: 'web/src/editor/check/checks/keyReach.ts' },
  { name: 'Color vision preview of a level', then: 'no', module: 'web/src/editor/editors/palette/colorVision.ts' },
  { name: 'Walkthrough bot, and demos it records', then: 'no', module: 'web/src/editor/check/walk/autoWalk.ts' },
  { name: 'Demo recording (.REC)', then: 'yes', module: 'web/src/editor/editors/recording/botDemoDialog.ts' },
  { name: 'Block groups and mirrored walks', then: 'no', module: 'web/src/editor/editors/character/characterMirror.ts' },
  { name: 'Animation previews at game speed', then: 'no', module: 'web/src/editor/editors/blocks/animClip.ts' },
  { name: 'Scene maker for animated films (.FLI)', then: 'no', module: 'web/src/editor/editors/animation/scene/sceneMaker.ts' },
  { name: 'Music editor, Accompany and Copy tune', then: 'no', module: 'web/src/editor/editors/music/accompanyDialog.ts' },
  { name: 'PC speaker sound drafted from a .VOC', then: 'no', module: 'web/src/audio/vocToSpeaker.ts' },
  { name: 'Pictures from any image file', then: 'part', module: 'web/src/editor/tools/importPicture.ts' },
  { name: 'A DOS folder to share a game', then: 'yes', module: 'web/src/export/exportDos.ts' },
  { name: 'One-file web page and web app', then: 'no', module: 'web/src/export/exportSinglePage.ts' },
  { name: 'Mac, Windows and Linux downloads', then: 'no', module: 'web/src/export/macApp.ts' },
  { name: 'Web player with games.json', then: 'no', module: 'web/src/hostedPlayer/list.ts' },
  { name: 'Opening games from other sites', then: 'no', module: 'web/src/linkIn/protocol.ts' },
  { name: 'Touch controls and on-screen keys', then: 'no', module: 'web/src/player/touch.ts' },
  { name: 'Works offline', then: 'no', module: 'web/src/offline/offlineCopy.ts' },
  { name: 'Achievements', then: 'no', module: 'web/src/achievements/catalog.ts' },
  { name: 'Editor-only notes kept out of DOS files', then: 'no', module: 'web/src/project/companion.ts' },
];

const THEN: Record<Feature['then'], string> = { yes: '1995 box: yes', part: '1995 box: GIF only', no: '1995 box: no' };

const row = (f: Feature): ListingRow => ({ title: f.name, kind: THEN[f.then], price: f.then === 'no' ? 'NEW' : '✓' });

/** The checklist in two columns, the first the longer. */
const half = Math.ceil(CHECKLIST.length / 2);

export const WEB_EDITION: MagSection = {
  id: 'web-edition',
  title: 'Feature: Game-Maker Goes Online',
  blurb: 'We take the browser edition for a spin: level checks, a walkthrough bot, new tools and games that go anywhere',
  dept: 'FEATURE',
  pages: () => [
    {
      kind: 'article',
      blocks: [
        head('Game-Maker Goes Online', {
          kicker: 'Feature',
          size: 'xl',
          level: 1,
          deck: 'Game-Maker™: Sandbox Edition is RSD’s game construction kit rebuilt to run in a web browser, with tools the 1995 box never had. We took it for a spin.',
        }),
        art(
          'desk',
          'The 1994 desk in a browser: a beige PC with Snowbound’s title screen on the monitor, shelves of game boxes, and the TURBO BUTTON magazine and shareware catalog on the desk, a disk box, speakers, a modem, the Game-Maker box, a keyboard and mouse pad, and a snowy window',
          'The 1994 desk, in a browser tab: switch on the PC, pick a disk from the box, dial a BBS on the modem, or open a box on the shelf.',
        ),
        cols(2, [
          p(
            'Yes, we know. It is 1995, and we are reviewing a program that runs in a *web browser*. Our editor says the World Wide Web is a fad. Our art department says a browser is someone who doesn’t buy anything. We booted it up anyway, and we have not given the office PC back since.',
            { drop: true },
          ),
          p(
            'Underneath is Game-Maker 3.0 as you know it: blocks, monsters, a hero, maps, sounds, music and the scenes that tie them together, in the same files. PLAYGAME is rebuilt line by line from RSD’s own source, so your games play the way they always did. What’s new is everything around it: an editor that plays your levels to find the trouble spots, a bot that plays the whole game, tools for music and animated films, and more ways to hand a game to a friend than we have floppies.',
          ),
          p(
            'You can make games two ways. **Today’s web** is a point-and-click editor for every part of a game. The **1994 desk** is a whole PC on a desk: a DOS prompt, Game-Maker’s own menus and designers, a modem to dial a BBS, and the boxes on the shelf. Flip between them as you like.',
          ),
        ]),
        grid([[button('go:editor', 'Open today’s web')], [button('go:desk', 'Sit at the 1994 desk')], [button('go:guide/start', 'Read the Guide')]], 0.25),
      ],
    },
    {
      kind: 'article',
      blocks: [
        head('A Second Pair of Eyes for Your Levels', { kicker: 'Game-Maker Goes Online, continued', size: 'l', level: 2 }),
        cols(2, [
          p(
            'The headline act is the **Level check** in the map editor. Press it and the editor plays your scene on the real engine, trying every move from every place the hero can stand. Then it paints a **heat map** over your map: hot where the hero got to, cold where nobody did. Places a player can fall into and never leave are marked, and so are prizes nobody can reach.',
          ),
          p(
            'Many findings come with a **one-click fix**: a ladder out of a pit, a gap in a wall, a hazard’s drawing stretched to fill the block that hurts. Each writes plain Game-Maker data, and each can be undone. If a trap is meant to be there, mark it as meant and the check stops asking. Play the scene yourself with **Play and record** and you get your own heat map to hold up against the bot’s.',
          ),
          p(
            'The check looks past the map, too. The **facing check** spots a hero who slides sideways with his face to the camera, or a monster that paces without turning round. The **key-reach check** notices an action key the left hand can’t reach while the right is on the arrows. A **color vision** view shows a level in grayscale and with color-vision differences, and lists colors that look alike there.',
          ),
          p(
            'The block, monster and sound editors carry the check’s findings as **badges**, and a **Before You Upload** checklist ticks itself off as you fix things. When the game is done, **Make a walkthrough** sends the **walkthrough bot** through it scene by scene (or uses your own play), and **Let the bot play…** records a demo for you, keys and all.',
          ),
        ]),
        pull('“It won’t tell you whether the game is fun. It will find the trap your best friend would have found first.”'),
        grid(
          [
            [
              side(
                'What the 1995 box couldn’t do',
                [
                  list([
                    'Undo a slip of the mouse: the DOS designers had no Undo',
                    'Play your level for you and draw a heat map',
                    'Write music: the box played .CMF songs but made none',
                    'Make an animated .FLI film: Game-Maker only played them',
                    'Bring in a picture that wasn’t a GIF',
                    'Run on a Mac, a phone or a tablet',
                  ]),
                ],
                'yellow',
              ),
            ],
            [
              side(
                'Read up on it',
                [
                  p('The Ultimate Owner’s Guide in the Game-Maker box has a whole chapter on the check and the bot.'),
                  button('go:ultimate/check', 'The Level Check chapter'),
                ],
                'cyan',
              ),
            ],
          ],
          0.3,
        ),
      ],
    },
    {
      kind: 'article',
      blocks: [
        head('New Tricks in the Workshop', { kicker: 'Game-Maker Goes Online, continued', size: 'l', level: 2 }),
        cols(2, [
          p(
            'The editors have **Undo and Redo**, which alone is worth the price of admission (the price of admission is nothing). The block editor gathers blocks into **block groups**, a picture drawn across several blocks and shown put together, and the block and character editors play **animation previews** of blocks, monsters and heroes at the game’s own speed while you draw.',
          ),
          p(
            'Drawing a hero who walks left *and* right? The character editor **mirrors** a whole walk in one go: every frame’s blocks flipped and every step turned round, and the two walks stay linked. In 1995 you flipped each frame’s blocks by hand.',
          ),
          p(
            'The animation editor’s **Scene maker** builds an animated .FLI from pictures, maps, sprites and text on a timeline, and will even rough out an Intro, a Cast or a Story from your game’s own files. Picture import takes any image you have, and an animated GIF becomes an .FLI.',
          ),
          p(
            'Sound got the most love. A **music editor** shows a .CMF song as tracks and a piano roll, played by the same FM code the games use. **Accompany…** hears your tune’s key and chords and writes bass, chords and drums around it; **Copy tune…** copies one at a new speed and pitch. There is a sound effect maker with sliders and presets, a recorder for your own voice, a sample editor, and a sound set editor that drafts a **PC speaker** version of a digitized sound, so players without a sound card still hear something.',
          ),
        ]),
        side(
          'Your old games still work',
          [
            p(
              'Fear not for that disk of games you made in 1993. The Sandbox Edition reads and writes Game-Maker’s own files byte for byte: .GAM, .MAP, .BBL, .MON, .CHR, .CMF, .FLI and the rest. PLAYGAME is ported from RSD’s C source, and where the two disagree, the source wins. Old games open unchanged, and a game made in the browser still plays in DOS Game-Maker.',
            ),
            p(
              'The new tools’ notes (block groups, mirror links, scenes for the Scene maker, findings you marked as meant) go in a **companion file** kept beside the game, never among its files. DOS never sees it, and the DOS, web page and native exports leave it out.',
            ),
          ],
          'pink',
        ),
        pull('“The price of admission is nothing, and the music editor alone is worth twice that.”'),
        grid(
          [
            [
              side(
                'Try them yourself',
                [p('Choose Look inside on a sample game, then Edit a copy, and every tool above is a click away.'), button('go:guide/editors', 'The editors')],
                'cyan',
              ),
            ],
            [
              side(
                'Making things from scratch',
                [p('Songs, sound effects, voices and pictures from today’s files.'), button('go:guide/tools', 'The tools')],
                'yellow',
              ),
            ],
          ],
          0.3,
        ),
      ],
    },
    {
      kind: 'article',
      blocks: [
        head('The Grand Tour', {
          kicker: 'Game-Maker Goes Online, continued',
          size: 'l',
          level: 2,
          deck: 'We pointed the office camera at the screen. Every picture is the real thing: Snowbound, opened with **Edit a copy**.',
        }),
        grid(
          [
            [
              art(
                'web-games',
                'Today’s web, the Games page: Snowbound’s title screen playing at the left with its Play and Edit a copy buttons, and at the right a shelf of Sandbox Software games, each with its title screen, on tabs for my games, gameware, Sandbox, shareware and Bizarre',
                '**The Games shelf.** Every game on tabs: yours, the CD’s, Sandbox Software’s, the shareware and the Bard of Bizarre’s. Play one, or press **Edit a copy**.',
              ),
            ],
            [
              side(
                'Where everything is',
                [
                  p(
                    'The files of the game run down the left. Click one and its editor opens in the middle: a map, a set of blocks, a hero, a song. **Play test** starts the game from any of them.',
                  ),
                  button('go:editor', 'Open today’s web'),
                ],
                'yellow',
              ),
            ],
          ],
          0.3,
        ),
        grid(
          [
            [
              art(
                'web-map',
                'The map editor on jamie.map: a snowy street lined with pine trees, snowmen and flags, a toolbar of drawing tools above it, and the Level check, the blocks and the monsters at the right',
                '**The map editor.** Jamie Street block by block, the Level check a click away.',
              ),
            ],
            [
              art(
                'web-blocks',
                'The block editor on snow.bbl: the background blocks in a column at the left, block 33, a snowman, blown up for painting in the middle, and the palette and the block’s solid sides at the right',
                '**The block editor.** The snowman, blown up for painting, solid on all four sides.',
              ),
            ],
            [
              art(
                'web-character',
                'The character editor on kid.chr, its Sequences tab: the hero’s moves listed at the left, the Idle sequence playing in a preview, and its four frames along the bottom',
                '**The character editor.** The kid’s moves, frame by frame, playing as you change them.',
              ),
            ],
            [
              art(
                'web-monster',
                'The monster editor on jamie.mon: the monsters in a grid at the left, monster 3, a dog, with its two animation frames, its power and lives, set to wander randomly, and a map to draw its path on',
                '**The monster editor.** A dog that wanders the street: its frames, power and path.',
              ),
            ],
            [
              art(
                'web-music',
                'The music editor on jamie.cmf: the tracks Brass, Lead and Bass at the left, a piano roll of colored notes over five bars, and Play, Loop, Accompany and Copy tune on the toolbar',
                '**The music editor.** Jamie Street’s tune on a piano roll, Accompany… on the toolbar.',
              ),
            ],
            [
              art(
                'web-scene',
                'The scene maker on intro.fli: the kid with his shovel over the name card KID on a black screen, and a timeline below with a bar for the background, each cast member and each name',
                '**The scene maker.** A cast roll it roughed out from Snowbound’s own files.',
              ),
            ],
          ],
          0.28,
        ),
        pull('“Seven windows on one game, in one browser tab, and not a boot disk in sight.”'),
      ],
    },
    {
      kind: 'article',
      blocks: [
        head('The Checklist', {
          kicker: 'Game-Maker Goes Online, continued',
          size: 'l',
          level: 2,
          deck: 'The 1995 box against the Sandbox Edition, feature by feature.',
        }),
        grid([[rows(CHECKLIST.slice(0, half).map(row))], [rows(CHECKLIST.slice(half).map(row))]], 0.4),
        side(
          'The verdict',
          [
            p(
              'Everything we loved about Game-Maker is still here, down to the last byte, and a good deal we wished for is here now. The heat map alone would have saved this reviewer a winter of play-testing. Best of all, it costs nothing: it’s free to use, and the source is under the MIT License.',
            ),
            grid([[button('go:editor', 'Start a game')], [button('go:dos', 'DOS Game-Maker')], [button('go:guide/tools', 'The new tools')]], 0.25),
          ],
          'yellow',
        ),
        note(
          'Game-Maker™ is RSD Game-Maker 3.0 by Recreational Software Designs, whose source Andy Stone released under the MIT License in 2014. The Sandbox Edition is by Lewis Moten; its web port was written with Claude.',
        ),
      ],
    },
    {
      id: 'web-edition-6',
      kind: 'article',
      blocks: [
        head('Games That Go Anywhere', { kicker: 'Game-Maker Goes Online, continued', size: 'l', level: 2 }),
        cols(2, [
          p(
            'One **Download** button hands your game over however you like: a single web page that plays from a double-click, an installable web app, a folder that plays in DOS, or a **Mac app, a Windows program or a Linux folder** that plays in its own window, offline. The native players are built right in the browser.',
          ),
          p(
            'Got a shelf of old Game-Maker games? The **web player** is one .html file to put on a web host beside your game folders. It lists them from an optional games.json, starts one from a link, and keeps high scores and saved games in the browser. Another site can also **link a game in** to be played or edited here, once the visitor says yes.',
          ),
        ]),
        pull('“A game you make tonight can be on a Mac, a PC and a phone by breakfast.”'),
        jumpOn(JUMP),
        MOUSE_PADS,
      ],
    },
  ],
};

/** The rest of the feature, at the back of the book, over Floppy Barn's ad. */
export const WEB_EDITION_JUMP: MagSection = {
  id: JUMP,
  title: 'Feature: Game-Maker Goes Online, continued',
  toc: false,
  dept: 'FEATURE',
  pages: () => [
    {
      kind: 'article',
      blocks: [
        jumpFrom('web-edition-6', 'Game-Maker Goes Online'),
        cols(2, [
          p(
            'Everything you make is **saved in your browser**, and the whole site can be kept for **offline** play. Saved games and high scores have a panel of their own. On a phone or tablet the player puts a **touch pad and buttons** over the screen, a panel of **on-screen keys** sends F1 to F10 even where the computer would rather keep them, and a **gamepad** works as the joystick.',
          ),
          p(
            'The site is built to be used from the keyboard as well as the mouse, with labels for screen readers, and today’s web comes in light and dark. **Achievements** keep score of what you make, play and find. And the 1994 desk is a world of its own: TERMINAL dials [the Sandbox BBS](go:bbs/sandbox) at any modem speed from 300 baud up, and the PC has HEXEDIT, VPIC and other tools for poking around inside game files.',
          ),
        ]),
        grid(
          [
            [
              side(
                'Get it out the door',
                [
                  list([
                    '[Sharing a game](go:guide/export)',
                    '[Playing offline](go:guide/offline)',
                    '[Mac](go:route/mac) · [Windows](go:route/windows) · [Linux](go:route/linux)',
                  ]),
                  button('go:url/https://github.com/lewismoten/GameMaker-SandboxEdition/blob/master/docs/embed.md', 'Opening games from your site'),
                ],
                'cyan',
              ),
            ],
            [
              side(
                'Keep score',
                [p('See what you have earned so far, on the web or with ACHIEVE.EXE on the desk.'), button('go:route/achievements', 'Achievements')],
                'yellow',
              ),
            ],
          ],
          0.3,
        ),
        BLANK_DISKS,
      ],
    },
  ],
};
