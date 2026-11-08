// Art course 6, "Words as monsters": the words of its lessons. Its figures are drawn by scripts/artCourseFigures6.ts.
import type { Course } from './courses';

export const WORDS: Course = {
  id: 'words',
  no: 6,
  title: 'Words as monsters',
  about: 'A foe made of letters: why a word turns backwards when it walks the other way, which letters survive it, and how to draw around it.',
  starters: ['Meet the Monsters', 'Everybody Talks'],
  lessons: [
    {
      id: 'backwards',
      title: '1. Why a word reads backwards',
      parts: [
        {
          p: 'A monster is one 20 x 20 block, drawn with its feet on the ground. When a monster that chases the hero walks to the left, PLAYGAME draws the same block turned around, left for right. It does this for every monster that chases or runs away, and it does it to the whole block, letters and all.',
        },
        {
          fig: 'word-flip',
          alt: 'Four word monsters, each a blue plate with yellow letters and two feet. The first says NO. The second is the first turned around: the O is on the left and the N is a backwards N. The third says GO. The fourth is turned around: the O is on the left and the G is backwards.',
          caption: 'NO and GO as drawn, each with the picture the game shows when it walks to the left.',
        },
        {
          p: 'Turning a block around does two things at once. The letters swap places, so the word runs the wrong way, and each letter is itself drawn the wrong way. N becomes a backwards N and G a backwards G. That is not a word anymore, it is a puzzle.',
        },
        {
          ul: [
            'The turn happens in the game, not in your picture. There is no copy of the block in the file for the left.',
            'A monster that follows a path is different: you choose, for each leg of the path, whether its picture is turned. Leave every leg unturned and the word never flips.',
            'A monster that wanders from place to place is not turned by the movement code.',
            'A block the hero fires can also be turned on its side, to go up or down. A word on one would be sideways.',
          ],
        },
      ],
    },
    {
      id: 'letters',
      title: '2. The letters that turn around cleanly',
      parts: [
        {
          p: 'Some letters look the same turned around. In the game’s 8 x 8 font, drawn in code here, these eleven do: A, H, I, M, O, T, U, V, W, X and Y. The digit 8 does too. Every other letter changes.',
        },
        {
          fig: 'word-alphabet',
          alt: 'The alphabet in two halves, A to M above and N to Z below. Each letter is shown twice, in a row of its own and in a row turned around beneath it. A, H, I, M, O, T, U, V, W, X and Y are on a green background and look the same turned around. The other letters are on dark red and look different.',
          caption: 'Each letter, and the same letter turned around. Green: no change. Dark red: it changes.',
        },
        {
          p: 'Use the green letters for a word that has to read both ways, and keep the dark red ones for a monster that never turns.',
        },
      ],
    },
    {
      id: 'pairs',
      title: '3. Make the turn part of the joke',
      parts: [
        {
          p: 'Since a turned word runs backwards, pick words that are still words backwards. Made only of green letters, AH turned around says HA, and OH says HO. A monster that sighs one way and laughs the other is a better monster than one that only says one thing.',
        },
        {
          fig: 'word-pairs',
          alt: 'Three word monsters, each shown as drawn and turned around. AH becomes HA. OH becomes HO. AHA, three letters across the whole block in dark letters, looks the same turned around.',
          caption: 'AH and HA, OH and HO, and AHA, which is the same both ways.',
        },
        {
          p: 'A word that is the same turned around is a palindrome, and with green letters it works at any size that fits. AHA is exactly 20 pixels across, with a pixel between the letters. HAH and TAT fit the same way.',
        },
        {
          ul: [
            'Words that survive in one block: AHA, HAH and TAT.',
            'Words that turn into other words: AH and HA, OH and HO, TO and OT.',
            'When it matters which way the word reads, draw it for the way the monster goes most. It will read right then and backwards for the rest.',
          ],
        },
      ],
    },
    {
      id: 'two-blocks',
      title: '4. A word across two monsters',
      parts: [
        {
          p: 'A word wider than one block has to be two monsters side by side. Each is its own block and each turns by itself, where it stands. The two do not trade places.',
        },
        {
          fig: 'word-two-blocks',
          alt: 'Above, a blue plate across two blocks with the word TOOT, which reads the same both ways. Below, the same two blocks each turned around where it stands: the left block shows OT and the right block shows TO, so the plate reads OT TO.',
          caption: 'Top: TOOT across two blocks. Bottom: each block turned in place. The halves did not swap.',
        },
        {
          p: 'TOOT is the same forward and backward, so you would think it is safe. It is not, because the halves stay where they are. The left block, TO, turns into OT, and the right block, OT, turns into TO. The word on the screen is OTTO.',
        },
        {
          ul: [
            'Give a word of two blocks to monsters that never turn: a path with every leg unturned, or monsters that wander.',
            'Or make each half a palindrome on its own, such as a block that holds AHA.',
            'If the two monsters must move together, give them the same path so that they stay side by side.',
          ],
        },
      ],
    },
    {
      id: 'readable',
      title: '5. Keep a word readable as a monster',
      parts: [
        {
          p: 'A word is flat, and a monster has to look like it could walk up to you. Letters in the 8 x 8 font are about 7 pixels across, so two fit in a block with room to spare, and three fit only when they are narrow, with a pixel between.',
        },
        {
          fig: 'word-readable',
          alt: 'Five word monsters. The first is faint: gray letters on the sky, hard to read. The second and third say AH on a blue plate in bright yellow, with two feet, the feet swapped between them. The fourth says AHA in dark letters straight onto the sky with feet. The fifth says OH the same way.',
          caption: 'Faint and flat, then a plate and feet in two frames, then letters with no plate.',
        },
        {
          ul: [
            'Letters need strong contrast with the ground behind them. Light on a dark plate, or dark on light, never gray on sky.',
            'A plate under the word, with a darker row along the bottom, makes it a body. Without it the word is just text that slides.',
            'Feet give the walk. Swap which foot is raised between two frames and the monster steps. A monster can have up to 20 frames, but two are plenty.',
            'Two letters to a block, three only if they fit in 20 pixels. A longer word is two monsters, and the last lesson’s rules apply.',
            'Letters you could not read in the silhouette test of course 4 are letters that will not read on the move.',
          ],
        },
      ],
    },
  ],
};
