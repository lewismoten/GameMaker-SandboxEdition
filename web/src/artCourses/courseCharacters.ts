// Art course 4, "Characters that move": the words of its lessons. Its figures are drawn by scripts/artCourseFigures4.ts.
import type { Course } from './courses';

export const CHARACTERS: Course = {
  id: 'characters',
  no: 4,
  title: 'Characters that move',
  about: 'A character in 20 x 20: frames, the four ways it faces and a climb view, a walk cycle, and when to mirror.',
  starters: ['Meet the Monsters', 'Kit’s Moves'],
  lessons: [
    {
      id: 'frames',
      title: '1. A character is a few pictures in turn',
      parts: [
        {
          p: 'Nothing on the screen really moves. A character is a short list of pictures, called frames, and the game shows the next one as the character goes. A character that is standing needs one frame. One that is walking needs a few.',
        },
        {
          fig: 'char-frames',
          alt: 'A small traveler in a blue cap and green jacket, seen from the front, three times: standing with arms down, then with one foot raised and the arms swung, then with the other foot raised and the arms swung the other way.',
          caption: 'Three frames of one traveler: stand, step, step with the other foot.',
        },
        {
          p: 'Each frame is a whole 20 x 20 picture, and every frame is the same size, with the feet at the same height. If the feet jump up or down between frames, the character bobs on the ground like a ball.',
        },
        {
          ul: [
            'Draw the standing frame first. The others are small changes to it.',
            'Change as little as you can between frames: a leg, an arm, a pixel of head. The eye fills in the rest.',
          ],
        },
      ],
    },
    {
      id: 'facings',
      title: '2. Four ways to face, and a climb view',
      parts: [
        {
          p: 'A hero in a game needs to show which way it is going. That takes one picture for each of the four ways it can face: toward you, away from you, to the left and to the right. A ladder or a vine needs one more, a climb view, with the hands reaching up.',
        },
        {
          fig: 'char-directions',
          alt: 'Five frames of the traveler. First, from the front with a yellow pocket. Second, from the back with a red satchel on a strap. Third, facing right. Fourth, facing left, the same as the third turned around. Fifth, from behind on a wooden ladder with one hand up.',
          caption: 'Front, back, right, left (the right one turned around) and climbing.',
        },
        {
          p: 'Front and back look alike in outline but are different drawings: the front has a face, the back has a cap and whatever the character carries, such as the satchel here. The side view is the narrowest. Draw the climb view from behind, so that the arms read as holding on.',
        },
      ],
    },
    {
      id: 'walk',
      title: '3. A walk cycle in four frames',
      parts: [
        {
          p: 'A walk is a loop. In a side view the loop has four frames: a contact with the front foot out, a passing frame with the legs together, a contact with the other foot out, and another passing frame. Play them in order and begin again.',
        },
        {
          fig: 'char-walk',
          alt: 'Four frames of the traveler facing right. In the first his legs are wide apart. In the second the legs are together with one lifted a little. In the third the legs are wide apart with the other foot forward. In the fourth the legs are together with the other leg lifted.',
          caption: 'Contact, passing, contact, passing. The arms swing the opposite way to the legs.',
        },
        {
          ul: [
            'The arms swing against the legs: when the right foot is forward, the right arm is back.',
            'On the passing frames the lifted foot is one pixel higher. That one pixel is what makes it look like a step.',
            'The head stays at the same height, or dips one pixel on the contact frames. Never more.',
            'Keep the loop at four frames. Eight frames are twice the blocks for a small gain at this size.',
          ],
        },
      ],
    },
    {
      id: 'mirror',
      title: '4. Mirroring, and what it costs',
      parts: [
        {
          p: 'The left-facing frames can be the right-facing frames turned around. That saves drawing time, and a side view looks much the same either way.',
        },
        {
          fig: 'char-mirror',
          alt: 'Four frames of the traveler. The first faces right with a red satchel behind him. The second is its mirror image, facing left, with the satchel behind him on the other side. The third is the traveler from the front with a yellow pocket on the left of his chest. The fourth is its mirror image, with the pocket on the right.',
          caption: 'Left pair: a side view mirrors well. Right pair: a pocket on the chest jumps to the other side.',
        },
        {
          p: 'It is not free, though. A mirrored frame is a new block in the game, the same as any other, so you save time, not blocks. And anything that sits on one side of the character changes sides: a pocket, a sword at the hip, a stripe on a sleeve, any lettering. The traveler becomes left-handed.',
        },
        {
          ul: [
            'Mirror the side views. Draw the front and the back by hand.',
            'Keep marks that matter in the middle (a belt buckle, a badge on a cap), or draw them on both sides.',
            'Never put letters on a character that you plan to mirror.',
          ],
        },
      ],
    },
    {
      id: 'readable',
      title: '5. Keep it readable at 20 x 20',
      parts: [
        {
          p: 'Twenty pixels is small, and a player sees the character for a fraction of a second while it moves. Big shapes and strong color differences carry; fine detail turns to noise.',
        },
        {
          fig: 'char-readable',
          alt: 'Three rows of the five traveler frames. The top row is covered in speckled mixed colors and is hard to read. The middle row is the clean drawing: blue cap, skin, green jacket, brown trousers. The bottom row is solid dark silhouettes of the same frames.',
          caption: 'Top: too busy. Middle: the same shapes, flat colors. Bottom: the silhouettes.',
        },
        {
          p: 'Try the silhouette test. Fill the whole character with one dark color. If you can still tell the front from the side, which way it faces and what it is doing, the drawing works. If it is a blob, the shape needs fixing before any color will help.',
        },
        {
          ul: [
            'Use four or five colors for the whole character, with two or three values in each ramp.',
            'Put the lightest color at the head and the hands, where the eye goes.',
            'Pick colors that stand apart from the ground the character walks on.',
            'The same drawing recolored is a different character: a new cap and jacket make a second foe from the same frames, and the extra blocks are only the recolored copies.',
          ],
        },
      ],
    },
  ],
};
