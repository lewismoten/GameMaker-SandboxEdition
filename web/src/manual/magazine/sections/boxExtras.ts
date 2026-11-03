// What's in the Box?: a feature on the paper and plastic extras that come with games (code
// wheels, code sheets on dark red or light cyan card, cloth maps, hint books under red film,
// plastic trinkets) and why they are there, and Wheel Mail, readers' letters about them: a
// wheel fan, a cloth map through the wash, a lost red film and a lost Royal Code Wheel. The
// Sandbox facts are the games' own: Quest for the Round Tuit (November 1994) registers for $15
// and sends the Cloth Map of Procrastia ("genuine imitation cloth"), the Royal Hint Book with
// red film, the Royal Code Wheel and A Royal Decree (games/realm/manual.json, printables.json);
// a wrong pick in the Putoff Mines is a cupboard that puts you back in the passage (its hint
// book); Maximus's Courier's Star Wheel has three discs (games/maximus/printables.json). The
// print shop is made up. Readers are made up: a handle and a town.
import { a, cols, head, list, note, p, side } from '../blocks';
import type { Block, MagSection } from '../types';

interface Letter {
  title: string;
  text: string;
  from: string;
  reply: string;
}

const LETTERS: Letter[] = [
  {
    title: 'Three discs!',
    text: 'The Courier’s Star Wheel that came with Maximus has THREE discs. I spin it during math. I have not finished Maximus, because I keep spinning the wheel instead. Please tell Sandbox Software to make a four-disc one.',
    from: 'SPINDLE, Frostburg, Md.',
    reply: 'We passed it along. Their answer was a long silence and the sound of a calculator. Do your math, then spin.',
  },
  {
    title: 'Imitation cloth',
    text: 'My Cloth Map of Procrastia went through the wash in my jeans. It is now a soft gray ball. Is there a Pulp Map of Procrastia?',
    from: 'LAUNDRY DAY, Romney, W.Va.',
    reply:
      'The box does say genuine imitation cloth, and imitation cloth is paper with ambitions. Write to Sandbox Software for a new one, and check your pockets. The ball might make a fine paperweight for the Royal Decree.',
  },
  {
    title: 'Seeing red',
    text: 'I lost the red film from my hint book. I tried a red pop bottle, a red crayon and my sister’s sunglasses. Only the pop bottle worked, and only a little, and now the hint book is sticky.',
    from: 'STICKY FINGERS, Morgantown, W.Va.',
    reply:
      'A red plastic report cover from the school supply aisle works like the real thing. So does red cellophane from the craft store. Rinse the bottle first.',
  },
  {
    title: 'The wheel is gone',
    text: 'I registered Quest for the Round Tuit and got everything: the map, the decree, the hint book and the Royal Code Wheel. Then my cousins came over for the holidays. The wheel did not leave with my cousins, but it did leave. Now I am in the Putoff Mines in front of a row of doors and I have no idea which one is right.',
    from: 'WHEEL-LESS IN WAYNESBORO, Pa.',
    reply:
      'Breathe. A wrong door in the mines is only a cupboard: you come out in the passage and walk back up to try again, so you can’t lose anything but time. The Royal Hint Book has the right door under its red film. And write to Sandbox Software at P.O. Box 000 to ask about a new wheel. Meanwhile, look under the couch cushions first. Cousins love couch cushions.',
  },
];

const letter = (l: Letter): Block[] => [head(l.title, { size: 's', level: 3 }), p(l.text), p(`*— ${l.from}*`), a('TB', l.reply)];

export const BOX_EXTRAS: MagSection = {
  id: 'box-extras',
  title: 'What’s in the Box?',
  blurb: 'Code wheels, cloth maps and red film: why games come with paper, and a reader who lost one',
  dept: 'FEATURE',
  pages: () => [
    {
      kind: 'article',
      tone: 'white',
      blocks: [
        head('What’s in the Box?', {
          kicker: 'Feature',
          size: 'l',
          level: 2,
          deck: 'The disk is the game. So why does the box rattle? A tour of the wheels, sheets, maps and little plastic things that come with games, and what they are really for.',
        }),
        cols(2, [
          p(
            'Open a registered game and the disks are the least exciting thing in the box. There is a map. There is a book with its answers hidden under a red haze. There is a wheel of card that turns. Sometimes there is a little plastic something that has no business being in a box of software, and you keep it on your monitor for years.',
            { drop: true },
          ),
          p(
            '**Code wheels.** Two or three discs on a rivet. Line up two symbols and the answer shows through a window. The game asks, the wheel answers. Quest for the Round Tuit’s Royal Code Wheel turns Old Procrastian runes into plain letters, and its three windows tell you which door the miners meant. Maximus’s Courier’s Star Wheel has three discs, which is one more than most of us can keep straight.',
          ),
          p(
            '**Code sheets.** A grid of letters and numbers: find the row, find the column, type what you find. They come printed on dark red or light cyan card for a reason. A photocopier sees dark red as black, so the copy comes out a black square, and it hardly sees light cyan at all, so that copy comes out blank.',
          ),
          p(
            '**Cloth maps.** A map you can fold a hundred times and still spread out on the floor. Real cloth costs the most of anything in the box, so plenty of “cloth” is paper with a good texture. The Round Tuit’s map of Procrastia says so right on the box: genuine imitation cloth.',
          ),
          p(
            '**Hint books and red film.** The answers are printed in pale blue under a mess of red lines. Lay the red film over them and the red melts away and the answer turns dark. You read only the answer you meant to read, and the next one stays a surprise.',
          ),
          p(
            '**Plastic trinkets.** A coin, a badge, a tiny figure. A plastic mold costs more than a whole printing of maps, so trinkets mostly turn up in big-publisher boxes on the store shelf, where the runs are big enough to pay for the mold.',
          ),
          p(
            '**Why bother?** Ask a shareware author and you hear three answers. The paper makes the world bigger than the screen. It gives you a reason to register, since the game itself is already on your hard disk. And a game that needs its wheel is a little harder to pass around. That last one is the weakest: a pencil and a patient friend beat most wheels. The first one is why you still have that map pinned over your desk.',
          ),
        ]),
        side(
          'The price of paper',
          [
            p('A print shop owner in Cumberland walked us through what costs what, cheapest first:'),
            list(
              [
                'one ink on white paper',
                'one ink on colored card (code sheets)',
                'full color (box art, posters)',
                'card cut to a shape (wheels, punch-outs)',
                'red film, by the sheet',
                'cloth, folded and stitched',
                'anything molded in plastic',
              ],
              true,
            ),
            p(
              '“The first copy costs the most,” she told us. “After that it’s paper and ink.” Which is why shareware authors print in small batches and tell you to allow four to six weeks.',
            ),
          ],
          'yellow',
        ),
        p('Making a game with Game-Maker and want paper of your own? [The Ultimate Owner’s Guide](go:ultimate/box) has a chapter on it.'),
      ],
    },
    {
      kind: 'dept',
      tone: 'white',
      head: 'WHEEL MAIL',
      blocks: [
        head('Wheel Mail', {
          kicker: 'Letters',
          size: 'm',
          level: 2,
          deck: 'We asked what you keep in your game boxes. You told us, and a few of you told us what you lost.',
        }),
        cols(2, LETTERS.flatMap(letter)),
        side(
          'Keep your paper safe',
          [
            list([
              'Keep the wheel in the box, not on the desk.',
              'Check your pockets on laundry day.',
              'Write your name on the back of everything.',
              'Lost it anyway? Write to the author. Most will send a new one to a registered player.',
            ]),
          ],
          'cyan',
        ),
        note('Readers, handles and hometowns are part of the story the 1994 desk tells.'),
      ],
    },
  ],
};
