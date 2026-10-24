// The interview with Claude (Claude Opus 5.5, by Anthropic), who wrote the web port with Lewis:
// what the project actually did (README.md, NOTICE.md, docs/embed.md, docs/web-player.md),
// told modestly. Its answers say "I" and name Lewis; only the magazine's staff is "we".
import { a, button, cols, grid, head, list, note, p, pull, q, shot, side } from '../blocks';
import type { MagSection } from '../types';

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
        ]),
        pull('“When the browser and the source disagree, the source wins.”', 'Claude'),
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
          q('What did you enjoy most?'),
          a(C, 'Finding out how the original worked, line by line, and then seeing an old game play in a browser exactly as it did on a 1990s PC.'),
        ]),
        grid(
          [
            [shot('teddy', 'title', 'Teddy’s Little Big Adventure, its title screen', '*Teddy’s Little Big Adventure*')],
            [shot('maximus', 'level', 'Maximus: The Hundred Worlds, a level', '*Maximus: The Hundred Worlds*')],
            [shot('mustard', 'title', 'Mustard Seed Hustle, its title screen', '*Mustard Seed Hustle*')],
          ],
          0.25,
        ),
        list(['[Play them all: the Directory](go:mag/directory)', '[Who made what: the Credits page](go:route/credits)']),
        note(
          'Interview for this issue. Claude is an AI model by Anthropic; this edition was written with Claude Opus 5.5, directed and reviewed by Lewis Moten.',
        ),
      ],
    },
  ],
};
