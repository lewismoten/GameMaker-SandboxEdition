// THE BIG NEWS: Game-Maker's source code set free. Facts from the repository's README.md,
// code/README.md and NOTICE.md: RSD's Game-Maker 1.0–3.0 (1991–1995), its source released by
// Andy Stone under the MIT License in 2014, and this fork, Game-Maker: Sandbox Edition.
import { a, button, cols, grid, head, list, note, p, pull, shot, side } from '../blocks';
import type { MagSection } from '../types';

const SOURCE = 'go:url/https://github.com/lewismoten/GameMaker-SandboxEdition';
const ORIGINAL = 'go:url/https://github.com/gandrewstone/GameMaker';

export const NEWS: MagSection = {
  id: 'news',
  title: 'Game-Maker’s Source Code Set Free',
  blurb: 'The whole program, in C and assembly, under the MIT License. What it means for you',
  dept: 'THE BIG NEWS',
  pages: () => [
    {
      kind: 'article',
      tone: 'news',
      blocks: [
        head('GAME-MAKER’S SOURCE CODE SET FREE', {
          kicker: 'The Big News',
          size: 'xl',
          level: 1,
          deck: 'The kit that let a whole generation build DOS games without programming now comes with its own insides. Anyone may read it, change it and pass it on.',
        }),
        cols(3, [
          p(
            'For years it was the program on the shelf that made the promise every kid wanted to hear: **create your own computer games**, with no programming. RSD Game-Maker gave you a block designer, a monster designer, a map maker, a sound designer and a way to stitch it all into a game that ran on any DOS PC with VGA.',
            { drop: true },
          ),
          p(
            'Now the program itself is out in the open. Andy Stone of Recreational Software Designs released the C, C++ and assembly source of Game-Maker 3.0 under the **MIT License**, one of the most generous licenses there is. You may use it, copy it, change it, and share what you make, as long as the copyright notice and the license travel with it.',
          ),
          p(
            'Game-Maker was the work of a family: **G. Andrew Stone, G. Oliver Stone, Oliver Stone Jr. and Joan Stone**. Versions 1.0 through 3.0 came out from 1991 to 1995. **Peter Savage** wrote its Sound Blaster voice routines and its joystick code, and the Sound Designer’s digitized speech with Andy Stone.',
          ),
          p(
            'The release is the program as it was built, folder for folder: the designers, PLAYGAME, the file formats, even the sample games’ data. A few pieces belonged to other companies, such as the compiler maker’s runtime library and the sound card maker’s developer kit. Those are not covered by the MIT License, so copies made from the release leave them out.',
          ),
        ]),
        pull('“Anyone may read it, change it and pass it on.”'),
      ],
    },
    {
      kind: 'article',
      tone: 'news',
      blocks: [
        head('From the shelf to your browser', { kicker: 'Source code set free, continued', size: 'l', level: 2 }),
        cols(2, [
          p(
            'Within reach of that source, something new could be built. **Game-Maker: Sandbox Edition** is a fork of the release kept by Lewis Moten, one of the program’s original buyers. It runs Game-Maker and its PLAYGAME player right in a web browser, rewritten from the released C source rather than run in an emulator.',
          ),
          p(
            'The Sandbox Edition reads and writes the original files byte for byte: .GAM, .MAP, .BBL, .MON, .CHR, .CMF, .FLI and the rest. A game made there still runs in DOS Game-Maker, and the old games open in it unchanged.',
          ),
          p(
            'It comes two ways. The **1994 desk** is a whole room: a PC to switch on, a DOS prompt, Game-Maker’s own menus and designers, a modem to call the BBSes, and the boxes, disks and manuals on the shelf. **Today’s web** has point-and-click editors for every part of a game.',
          ),
          p(
            'And it comes with games: the CD’s samples and shareware, plus new ones from Sandbox Software and The Bard of Bizarre, built with the program’s own file formats. [Every one is in our Directory](go:mag/directory).',
          ),
        ]),
        side(
          'Game-Maker through the years',
          [
            list([
              '**1991** Game-Maker’s first version, with the sample games Houses, Nebula, Penguin Pete and Pipemare',
              '**October 1992** a magazine ad lists it for $89 plus $4 shipping',
              '**1995** the end of Game-Maker’s run, at version 3.0',
              '**2014** Andy Stone releases the source under the MIT License',
              '**Today** Game-Maker: Sandbox Edition plays it all in a web browser',
            ]),
          ],
          'yellow',
        ),
        grid([
          [shot('nebula', 'level', 'Nebula, one of the sample games that came with Game-Maker', '*Nebula*, a sample game from 1991.')],
          [shot('penguin', 'level', 'Penguin Pete, another of the original sample games', '*Penguin Pete*, by Joan Stone.')],
        ]),
      ],
    },
    {
      kind: 'article',
      tone: 'news',
      blocks: [
        head('What you can do with it', { kicker: 'Source code set free, continued', size: 'l', level: 2 }),
        grid([
          [
            side(
              'Make a game tonight',
              [
                p('No compiler and no floppies needed. Open Game-Maker on the web, start a new game, and draw your first block.'),
                button('go:editor', 'Start a new game'),
                button('go:dos', 'Open DOS Game-Maker'),
              ],
              'cyan',
            ),
          ],
          [
            side(
              'Read the source',
              [
                p('The original C source is in the Sandbox Edition’s code folder, kept as it was published.'),
                button(SOURCE, 'Sandbox Edition source'),
                button(ORIGINAL, 'The original 2014 release'),
              ],
              'pink',
            ),
          ],
        ]),
        head('The MIT License, in plain words', { size: 's', level: 3 }),
        list([
          'You may use the software for anything, free.',
          'You may copy it, change it and give it away, or sell what you build.',
          'Keep the copyright notice and the license with every copy.',
          'It comes as it is, with no warranty.',
        ]),
        head('Ask the experts', { size: 's', level: 3 }),
        a('Q', 'Will my old games still work?'),
        a('A', 'Yes. The Sandbox Edition keeps the file formats exactly, so a game folder from a 1990s disk opens and plays as it is.'),
        a('Q', 'Do I need DOS?'),
        a('A', 'No. Everything runs in the browser, and a game can be exported to run in DOSBox, on a Mac, Windows or Linux, or as a web page.'),
        note('[Who made what: the Credits page](go:route/credits) · [The Guide’s notes on the source and licenses](go:guide/credits)'),
      ],
    },
  ],
};
