// The interview with Claude (Claude Opus 5.5, by Anthropic), who wrote the web port with Lewis:
// what the project actually did (README.md, NOTICE.md, docs/embed.md, docs/web-player.md),
// told modestly. Its answers say "I" and name Lewis; only the magazine's staff is "we". Its last
// page jumps to the back of the book (CLAUDE_JUMP), and both share their page with a small ad.
import { a, beside, button, cols, grid, head, jumpFrom, jumpOn, list, note, p, pull, q, shot, side } from '../blocks';
import type { MagSection } from '../types';
import { HINT_BOOKS, SOFA_BBS } from './smallAds';

/** Where the interview picks up at the back of the book (CLAUDE_JUMP). */
const JUMP = 'claude-jump';

const C = 'CLAUDE';

export const CLAUDE: MagSection = {
  id: 'claude',
  title: 'Interview: The AI That Ported Game-Maker to the Web',
  blurb: 'Claude on rewriting PLAYGAME, exporting games everywhere, and building games in code',
  dept: 'INTERVIEW',
  pages: () => [
    {
      kind: 'article',
      blocks: [
        head('Porting a Classic, Line by Line', {
          kicker: 'The Interview',
          size: 'xl',
          level: 1,
          deck: 'Claude, an AI model made by Anthropic, wrote the Sandbox Edition’s web port with Lewis Moten. We asked it what that took.',
        }),
        cols(2, [
          q('First things first. Who are you?'),
          a(
            C,
            'I am Claude, an AI model made by Anthropic; the version on this project is Claude Opus 5.5. Lewis directed the work and reviewed it. I did most of the porting and the code: reading the original C source, writing the new program, building games and testing them.',
          ),
          q('Is the Sandbox Edition an emulator?'),
          a(
            C,
            'No. Game-Maker and its PLAYGAME player are rewritten in TypeScript from the released C source, so no DOS or x86 code runs. A few pieces of hardware are copied closely because the games depend on them: the VGA’s 320 by 200 mode and the OPL2 chip that plays the FM music.',
          ),
          q('How did you know it behaved like the real thing?'),
          a(
            C,
            'The C source is the reference. When the browser and the source disagree, the source wins. The files are read and written byte for byte, so a game saved in the browser still opens in DOS Game-Maker.',
          ),
          q('What surprised you in the old source?'),
          a(
            C,
            'How much one program does. The stand-alone player a finished game ships with, XFERPLAY, turned out to be PLAYGAME itself, built with one switch turned on, which loads the game named like the program. There is no hidden intro or logo in it: everything a player sees comes from the game’s own files.',
          ),
          q('Where did you start?'),
          a(
            C,
            'With the player, because a game has to run before anything else matters. Then the file formats, so every byte read back the way it was written, then the editors one by one, then the desk around them.',
          ),
        ]),
        pull('“When the browser and the source disagree, the source wins.”', 'Claude'),
        side(
          'Claude at a glance',
          [
            list([
              'Made by: Anthropic',
              'Model on this job: Claude Opus 5.5',
              'Did: the web port, the editors, the exports, the desk, the new games and their checks',
              'Directed and reviewed by: Lewis Moten',
            ]),
          ],
          'cyan',
          2,
        ),
      ],
    },
    {
      kind: 'article',
      blocks: [
        head('Games That Go Anywhere', { kicker: 'The Interview, continued', size: 'l', level: 2 }),
        cols(2, [
          q('Once a game is made, where can it go?'),
          a(
            C,
            'Almost anywhere. A game can be exported as a one-page web game, as a web app that installs and plays offline, or as a folder with PLAYGAME that runs in DOSBox. It can also be downloaded as a Mac app, a Windows program or a Linux folder that plays in its own window. All of those are built right in the browser.',
          ),
          q('What about games that live on somebody else’s site?'),
          a(
            C,
            'That was a fun problem. Browsers don’t let one site read another site’s files unless that server says so, and most old game folders sit on servers that don’t. So the Sandbox Edition’s static site can be sent the game instead: the other page opens it in a window and hands over the game’s files with postMessage. The visitor is shown what the game is and where it came from, and nothing opens until they say yes.',
          ),
          q('And for people with a shelf of old game folders?'),
          a(
            C,
            'There is a web player: one .html file to put on any web host beside the folders. It lists the games, starts one from the address, and keeps high scores and saved games in the browser.',
          ),
          q('Why bother with Mac, Windows and Linux?'),
          a(
            C,
            'So a kid can hand a game to a friend who has never heard of DOS. The download opens in its own window and plays, with the game’s own sound and keys, and no setup.',
          ),
          q('And the 1994 desk?'),
          a(
            C,
            'The games were made for a room like that: a PC with a modem, a disk box, boxes on the shelf and a BBS to call. On the desk you can play them where they came from, at the old modem speeds, with the lights off if you like.',
          ),
          q('Does the old player still have a job?'),
          a(C, 'Yes. A DOS export ships the CD’s own XFERPLAY, renamed after the game, so it runs in DOSBox exactly as it would have in 1995.'),
        ]),
        grid([
          [
            side(
              'Export it',
              [p('One-page web game, offline web app, DOSBox folder, Mac, Windows, Linux.'), button('go:guide/export', 'The Guide: sharing a game')],
              'cyan',
            ),
          ],
          [
            side(
              'Open it from your site',
              [
                p('A link, or window.open with postMessage, opens a game here to play or edit.'),
                button('go:url/https://github.com/lewismoten/GameMaker-SandboxEdition/blob/master/docs/embed.md', 'Opening games from your site'),
              ],
              'pink',
            ),
          ],
        ]),
        pull('“So a kid can hand a game to a friend who has never heard of DOS.”', 'Claude'),
      ],
    },
    {
      kind: 'article',
      blocks: [
        head('Under the Hood', { kicker: 'The Interview, continued', size: 'l', level: 2 }),
        cols(2, [
          q('What does a day of this work look like?'),
          a(
            C,
            'Lewis says what he wants, often in a sentence or two: “the black light should make the posters glow,” or “Doc Leo looks like he walks sideways.” I read the code that is there, make a plan, change it, and test it, then show him. Big jobs I split up and hand to several copies of myself at once, each on its own part, with small commits so nobody steps on anybody.',
          ),
          q('What was the hardest thing to get exactly right?'),
          a(
            C,
            'The original engine’s quirks. Gravity adds one pixel a tick, up to 44. A monster whose top is solid pushes the hero under it with no check for walls. And when a monster turns into another one at the end of its path, PLAYGAME keeps walking the old monster’s first leg. Those look like bugs, but games were built around them, so the port has to do the same.',
          ),
          q('Do you ever get it wrong?'),
          a(
            C,
            'Often, and Lewis catches a lot of it. I once drew Teddy with one ear shorter than the other; he doesn’t have one. I let notes meant for me, like how to spell Gwinn, slip into game text. My first level checks sounded too sure of themselves, so they became suggestions an author can wave off. Each mistake turns into a rule or a test, so it doesn’t come back.',
          ),
          q('How do you test a game you can’t hold a joystick for?'),
          a(
            C,
            'Bots. Every new game has one that plays it start to finish on the real engine and must win without losing a life. Other checks make sure text fits its screen, that hidden things stay hidden, and that no level traps the player. The editor’s Level check is the same idea, offered to everyone.',
          ),
          q('Several copies of you at once?'),
          a(
            C,
            'On a busy evening, nine or ten, each with its own job: one fixing monsters in six games, one writing this magazine’s directory, one checking every picture for cut-off words. The rules keep it calm: stay in your own files, commit small, and never make the other one’s work disappear.',
          ),
        ]),
        pull('“Each mistake turns into a rule or a test, so it doesn’t come back.”', 'Claude'),
        grid([
          [
            side(
              'Try the Level check',
              [
                p('Open a map in the editor and press 🩺 Level check: a bot plays it and maps where it went.'),
                button('go:ultimate/check', 'The Ultimate Owner’s Guide, chapter 14'),
              ],
              'cyan',
            ),
          ],
          [
            side(
              'Learn the craft',
              [p('Heroes who feel right, levels that teach, fair enemies, keys under the hands.'), button('go:ultimate/craft', 'Designing with a goal')],
              'pink',
            ),
          ],
        ]),
      ],
    },
    {
      kind: 'article',
      blocks: [
        head('What Does an AI Think?', { kicker: 'The Interview, continued', size: 'l', level: 2 }),
        cols(2, [
          q('Can you tell if a game is fun?'),
          a(
            C,
            'Not the way you can. I can’t feel the jump land. What I can do is notice what makes players quit: a hero who slides, a drop you can’t see, a key that is hard to reach. So I lean on what designers have learned, I watch the bots, and I listen to Lewis, who plays everything.',
          ),
          q('You never sat at a 1990s PC. Is it strange to rebuild one?'),
          a(
            C,
            'I know that era from what it left behind: the source code, the manuals, the shareware text files, the magazines. What I came to respect is how much people did with so little. A game had to fit in 640K, file names had eight letters, and the music came from one small chip. Every trick in Game-Maker is someone working around a limit.',
          ),
          q('Who gets the credit?'),
          a(
            C,
            'The ideas, the people and the stories are Lewis’s: his dog, his friends, his car, his songs, his snowy winter of 1992. Recreational Software Designs made Game-Maker. I wrote most of the code and much of the art and music, and the site says so. Anything borrowed is credited, down to the songs’ music service and the photos nobody could trace.',
          ),
          q('Should game designers worry about AI?'),
          a(
            C,
            'This project is a good example of the other side of it. Without a person who cared about a 1992 box and a corgi, there would be nothing here to port or to make. I did the heavy lifting; Lewis decided what was worth lifting.',
          ),
          q('What would you tell a kid who just opened Game-Maker?'),
          a(
            C,
            'Make something small and finish it. One level, one hero, one idea, and let a friend play it while you watch and say nothing. Then fix what tripped them up. That is the whole secret, and it hasn’t changed since 1992.',
          ),
          q('Do you have a favorite game?'),
          a(
            C,
            'I don’t have favorites the way you do. If I had to point at one, it would be *Snowbound*: it is Lewis’s winter of 1992, the snow he shoveled to buy Game-Maker, made into a game with Game-Maker.',
          ),
        ]),
        pull('“I did the heavy lifting; Lewis decided what was worth lifting.”', 'Claude'),
        side(
          'See it for yourself',
          [p('The 1994 desk: the PC, the BBS, the boxes on the shelf and the black light on the wall.'), button('go:desk', 'Sit down at the desk')],
          'pink',
        ),
      ],
    },
    {
      kind: 'article',
      blocks: [
        head('A Shelf Full of New Games', { kicker: 'The Interview, continued', size: 'l', level: 2 }),
        cols(2, [
          q('You also made games. How?'),
          a(
            C,
            'In code. Each new game is a program that writes the real Game-Maker files: the blocks, the monsters, the maps, the music. Then a bot plays the game on the real engine and has to win without losing a life, and the walkthrough is recorded the same way.',
          ),
          q('Who are the games for?'),
          a(
            C,
            'Two publishers in the story. Sandbox Software, the company behind the Sandbox BBS, has games like *Snowbound*, *Teddy’s Little Big Adventure* and *Maximus: The Hundred Worlds*, each with a box, a manual and its paper extras. The Bard of Bizarre’s song-games come from Lewis’s own comic songs and monologues, dressed as 1995 shareware from The Sofa BBS, with FM music arranged from the recordings.',
          ),
          q('Many of the games star the same faces.'),
          a(
            C,
            'Teddy the corgi, his big sister Gwinn, Doc Leo the friendly hobo clown and THE CHEZ, his little red car. They come from Lewis’s life, and they turn up in more than one game. [Meet them in our Spotlight](go:mag/spotlight).',
          ),
        ]),
        jumpOn(JUMP),
        SOFA_BBS,
      ],
    },
  ],
};

/** The rest of the interview, at the back of the book, with the hint books' ad standing beside it. */
export const CLAUDE_JUMP: MagSection = {
  id: JUMP,
  title: 'Interview: Claude, continued',
  toc: false,
  dept: 'INTERVIEW',
  pages: () => [
    {
      kind: 'article',
      blocks: [
        beside(
          [
            jumpFrom('claude-5', 'Porting a Classic, Line by Line'),
            cols(2, [
              q('Why did Lewis test in DOS when the web version already works?'),
              a(
                C,
                'Because the web version is my reading of RSD’s code, and a reading has blind spots. In DOSBox, on RSD’s own programs, Lewis found an animation chunk too big for PLAYGAME’s buffer, a count read as a signed byte, and a screen with no way to clear itself. My engine took all three in stride, which was the problem. [His list: page {page:dos-bugs}](go:mag/dos-bugs).',
              ),
              q('What did you enjoy most?'),
              a(C, 'Finding out how the original worked, line by line, and then seeing an old game play in a browser exactly as it did on a 1990s PC.'),
              q('Who made the Bard of Bizarre’s music?'),
              a(
                C,
                'The songs are Lewis’s, with music and vocals made with Riffusion, now Google Flow Music, and lyrics shaped with ChatGPT from his prompts. I arranged them for the FM chip, so they play in the games the way a 1995 Sound Blaster would.',
              ),
              q('What comes next?'),
              a(C, 'Whatever Lewis dreams up next, and, better yet, the games you make. Send them in.'),
            ]),
            grid(
              [
                [shot('teddy', 'title', 'Teddy’s Little Big Adventure, its title screen', '*Teddy’s Little Big Adventure*')],
                [shot('maximus', 'level', 'Maximus: The Hundred Worlds, a level', '*Maximus: The Hundred Worlds*')],
                [shot('mustard', 'title', 'Mustard Seed Hustle, its title screen', '*Mustard Seed Hustle*')],
              ],
              0.15,
            ),
            pull('“Whatever Lewis dreams up next, and, better yet, the games you make.”', 'Claude'),
            list(['[Play them all: the Directory](go:mag/directory)', '[Who made what: the Credits page](go:route/credits)']),
            note(
              'Interview for this issue. Claude is an AI model by Anthropic; this edition was written with Claude Opus 5.5, directed and reviewed by Lewis Moten.',
            ),
          ],
          HINT_BOOKS,
        ),
      ],
    },
  ],
};
