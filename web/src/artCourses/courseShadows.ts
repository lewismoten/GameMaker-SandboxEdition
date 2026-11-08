// Art course 2, "Shadows and depth": the words of its lessons. Its figures are drawn by scripts/artCourseFigures2.ts.
import type { Course } from './courses';

export const SHADOWS: Course = {
  id: 'shadows',
  no: 2,
  title: 'Shadows and depth',
  about: 'A shadow under a bridge or a building, solid or dithered, drawn once and reused along an edge, with the light always from one side.',
  starters: ['Little Shadows', 'Near and Far'],
  lessons: [
    {
      id: 'step',
      title: '1. A shadow is the ground, one step darker',
      parts: [
        {
          p: 'A bridge with nothing under it looks like it is floating a little. The cure is cheap: the ground under the deck gets darker. A shadow is not a new color to invent. It is the same ground, one or two steps further down its own color ramp.',
        },
        {
          fig: 'shadow-bridge',
          alt: 'Two copies of a wooden bridge with rails over a green lawn. In the left one the lawn under the deck is plain. In the right one a dark green band lies on the lawn under the deck, and the bridge sits on the ground.',
          caption: 'Left: a deck over plain grass. Right: the grass under it is two steps darker.',
        },
        {
          p: 'Take each grass pixel and swap it for the darker one in the same ramp. The speckle stays, so the shadow still looks like grass, only in the dark. A shadow of flat black would look like a hole.',
        },
        {
          ul: [
            'Keep the shadow in the same hue as the ground. A hint toward blue or green is fine, a gray patch is not.',
            'Make it a few pixels tall. The ground under a deck only needs a band to say that the deck is above it.',
          ],
        },
      ],
    },
    {
      id: 'dither',
      title: '2. Solid, or dithered',
      parts: [
        {
          p: 'There are two ways to fill a shadow. Solid means every pixel takes the darker color. Dithered means every other pixel does, in a checkerboard, and the eye mixes the two colors into a shade in between.',
        },
        {
          fig: 'shadow-solid-dither',
          alt: 'Three strips of five grass blocks, each with a dark band along the top. The first band is solid dark green. The second is a fine checkerboard of dark and normal green. The third is solid at the top with a two-pixel checkerboard fringe under it.',
          caption: 'Top to bottom: solid, dithered, and a solid core with a dithered fringe.',
        },
        {
          p: 'Solid is crisp and reads from far away. Dithered is lighter, which suits a soft shade or a light that is far off, but it adds a texture of its own, and next to grass speckle it can look like noise. A solid core with a short dithered fringe is a good middle: a firm shadow with a soft edge.',
        },
        {
          p: 'Whichever you pick, use it for every shadow in the level. Two kinds of shadow on one screen look like two different lights.',
        },
      ],
    },
    {
      id: 'edge',
      title: '3. One shadow block, used along an edge',
      parts: [
        {
          p: 'A wall or a bridge has a long edge, and the shadow under it is a long strip. Do not draw that strip. Draw one block of it and place the block again and again, the same way as a block of plain ground.',
        },
        {
          fig: 'shadow-edge-set',
          alt: 'Three grass blocks side by side: a plain one, one with a dark band along its top, and one with the dark band only in its top left corner.',
          caption: 'The whole kit: plain ground, a band, and a band that stops after six pixels.',
        },
        {
          fig: 'shadow-wall',
          alt: 'Two copies of a stone wall with a red roof beside it. In the left one the grass at the foot of the wall is plain. In the right one a dark band runs along the foot of the wall, past its right end by a few pixels.',
          caption: 'The band goes under every block of the wall. The end block takes the shadow a little past the corner.',
        },
        {
          p: 'The band is drawn so that its left and right edges meet, as in lesson 2 of the first course, so any number of them make one unbroken strip. The end block is the same band cut short. With the light on the left, the shadow runs out a little past the right-hand end of the wall, and one end block covers that.',
        },
      ],
    },
    {
      id: 'light',
      title: '4. The light comes from one place',
      parts: [
        {
          p: 'Pick a direction for the light and keep it. If the sun is up and to the left, every shadow in the level falls down and to the right. This matters more than how well the shadow is drawn: a perfect shadow on the wrong side makes the whole picture feel odd, and a player will notice before they can say why.',
        },
        {
          fig: 'shadow-direction',
          alt: 'Two scenes of two small houses with a yellow sun in the upper left corner. In the left scene each house has its dark shadow on the grass to its right. In the right scene the first house has its shadow on its right and the second house has its shadow on its left.',
          caption: 'Left: one sun, both shadows fall right. Right: the second house has a shadow on the sunny side.',
        },
        {
          ul: [
            'Decide the direction once, before drawing any shadow, and write it on a note by your screen.',
            'A shadow on the left of one thing and the right of another is the common slip. Check every pair.',
            'Highlights go on the side facing the light and darker colors on the other side, by the same rule.',
          ],
        },
      ],
    },
    {
      id: 'cost',
      title: '5. How few blocks a shadow costs',
      parts: [
        {
          p: 'Blocks are limited, so count. A shadow made as lesson 3 describes costs only the blocks of the kit, however long the wall is.',
        },
        {
          fig: 'shadow-cost',
          alt: 'Two copies of a stone hut with a red roof and a door, on a lawn. The left one has no shadow. The right one has a dark band at its foot.',
          caption: 'The same hut. Without a shadow it takes 5 blocks. With one it takes 7.',
        },
        {
          p: 'The hut has sky, roof, wall, door and grass, which is 5 blocks. Its shadow adds two: the band and the band cut short. That is the whole price, and a wall twice as long would still cost 7. Two blocks is a small price for one of the most noticeable changes in a picture.',
        },
        {
          p: 'Be careful where the shadow crosses detail. A band that lies over ground with a tuft or a flower needs its own copy of that block, so keep the ground under a shadow plain. The plain ground the shadow does not touch stays as it was.',
        },
      ],
    },
  ],
};
