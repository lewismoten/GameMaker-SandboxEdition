// The art courses (#/art-courses): the course list and the words of each lesson. A lesson is a list of blocks: paragraphs,
// bullet lists and figures (real blocks drawn in code by scripts/artCourseFigures.ts, with alt text and a caption).
export type Part = { p: string } | { ul: string[] } | { fig: string; alt: string; caption: string };

export interface Lesson {
  id: string;
  title: string;
  parts: Part[];
}

export interface Course {
  id: string;
  /** Its place in the planned list of seven courses (the contents page lists only the written ones). */
  no: number;
  title: string;
  about: string;
  /** Written and shown; the others are planned and listed on the contents page. */
  lessons: Lesson[];
  /** Starters on the Sample CD that cover the editor side of the same ideas. */
  starters: string[];
}

import { CHARACTERS } from './courseCharacters';
import { SCREENS } from './courseScreens';
import { SHADOWS } from './courseShadows';
import { WORDS } from './courseWords';

export const BOOK_TITLE = 'Art courses';

export const COURSES: Course[] = [
  {
    id: 'blocks',
    no: 1,
    title: 'Blocks: cut, repeat, reuse',
    about: 'Cut a picture into 20 x 20 blocks, make edges that meet, reuse one block many times and keep grass from showing a pattern.',
    starters: ['150 Blocks', 'Little Shadows'],
    lessons: [
      {
        id: 'cut',
        title: '1. Draw big, then cut',
        parts: [
          {
            p: 'Every picture in a level is made of blocks, and every block is 20 pixels wide and 20 pixels tall. A house is not one block. It is a few of them side by side, like tiles on a floor.',
          },
          {
            p: 'The easy way to draw one is to draw it whole. Make the canvas a multiple of 20 (here 60 x 40, which is three blocks by two), draw the house, then cut the canvas along a 20-pixel grid. Each square becomes one block, and the map puts them back in the same order.',
          },
          {
            fig: 'cut-whole',
            alt: 'Two copies of a small brown house with a red roof on a green lawn. The second has pink lines cutting it into three squares across and two down.',
            caption: 'The same 60 x 40 picture, whole, and with the 20-pixel cuts marked in pink.',
          },
          {
            fig: 'cut-apart',
            alt: 'The six pieces of the house picture, pulled apart with a gap between each one.',
            caption: 'Six blocks. Nothing is lost: put them back together and it is the same house.',
          },
          {
            p: 'Plan the cuts before you draw. Keep a window or a door from straddling a cut when you can, and let the roof line cross it only where you do not mind. Cuts that fall in plain wall are easy to reuse later.',
          },
        ],
      },
      {
        id: 'seams',
        title: '2. Edges that meet',
        parts: [
          {
            p: 'A ground block gets placed over and over, so its left edge sits against its own right edge. If you draw a light line along the top and left and a dark line along the bottom and right (a bevel), every block gets its own frame, and a field of them becomes a grid of lines.',
          },
          {
            fig: 'seam-bad-good',
            alt: 'Two fields of grass, five blocks wide and three high. The left field has a visible grid of light and dark lines at every block edge. The right field is one even stretch of grass.',
            caption: 'Left: a bevel on every block. Right: the same texture with no edge work.',
          },
          {
            p: 'A block that tiles has no edge of its own. The texture is just the same kind of speckle all the way to the border. The test is simple: put the block next to a copy of itself and look for the join. If you can find it, the block does not tile yet.',
          },
          {
            ul: [
              'Draw texture with no pattern that stops at the border: speckles, not outlines.',
              'If a detail touches an edge, draw its other half on the opposite edge so they join when blocks sit side by side.',
              'Keep the average color the same all over the block. A block that is darker at the bottom will stripe.',
            ],
          },
        ],
      },
      {
        id: 'groups',
        title: '3. Groups that fit: 2 x 2 and bigger',
        parts: [
          {
            p: 'A stone wall with bricks bigger than 10 pixels does not fit in one block, so draw it as a group, such as 2 x 2 blocks (40 x 40 pixels). The edges of the group have to meet the edges of the next group in the same way a single tile does.',
          },
          {
            fig: 'group-bad-good',
            alt: 'Left: a stone wall made of four-by-three little squares, each with a dark frame, so it reads as a grid. Right: a stone wall with bricks in a running bond that goes on without any frame.',
            caption: 'Left: each block framed as if it stood alone. Right: one 40 x 40 wall, cut into four, with mortar lines that continue over the cuts.',
          },
          {
            p: 'The rule is to make the pattern repeat inside the group size. In the wall on the right the courses are 10 pixels tall and the joints come every 20 pixels, so a cut at 20 or 40 pixels lands on a joint, and a group set beside another looks like more of the same wall.',
          },
          {
            ul: [
              'Choose a repeat that divides the block: 5, 10 or 20 pixels fit one block; 40 fits a 2 x 2 group.',
              'Draw the whole group first, then cut. Do not decorate the blocks one at a time.',
              'Save the frame (a dark outline or a highlight) for the blocks at the outside of a picture, such as a doorway or a window.',
            ],
          },
        ],
      },
      {
        id: 'reuse',
        title: '4. Use a block again',
        parts: [
          {
            p: 'A game gets 150 blocks. A block you place twenty times still counts once, so the cheapest picture is one built from a few blocks repeated. The Programmer’s Guide explains where the limit comes from; here it is a drawing rule: ask of every new block whether an old one would do.',
          },
          {
            fig: 'reuse-four',
            alt: 'Four blocks of stone wall in a row: the original, a mirrored copy, a blue copy, and a copy shifted sideways by half a block.',
            caption: 'One drawing, four blocks: the original, mirrored, recolored, and slid half a block sideways.',
          },
          {
            p: 'Be honest about the count. Mirroring, recoloring or shifting a block makes a new block that happens to take little time to draw. It does not make a block free. A block is free only when you place the very same one again.',
          },
          {
            fig: 'sign-two-and-one',
            alt: 'Two signboards on posts, side by side. On the left the posts are at the far ends and slightly off center. On the right the posts are centered in their blocks.',
            caption: 'Left: a left post and a right post, two blocks. Right: one post drawn in the middle of its block, used at both ends.',
          },
          {
            p: 'Signs show the idea well. If the post is drawn off to one side you need a left post and a right post. If it is drawn in the middle of its block, one block serves both ends, and the board in the middle is a block you repeat for as long as the sign needs to be. Think of a kit of parts: a post, a board, a corner, a cap. Draw symmetric parts and you can build many things from them.',
          },
        ],
      },
      {
        id: 'variants',
        title: '5. Variants, so the ground does not pattern',
        parts: [
          {
            p: 'A player’s eyes find repeats quickly. One grass block with a tuft in the same place makes a lattice of tufts across the whole screen, and the player sees the lattice instead of the game. The cure is a few variants of the same block.',
          },
          {
            fig: 'grass-bad-good',
            alt: 'Two fields of grass, eight blocks wide and five high. In the left field a small dark tuft repeats in the same spot of every block, forming a grid of dots. In the right field the tufts and one flower are rare and scattered, and the grass reads as one even meadow.',
            caption: 'Left: one block repeated. Right: five blocks used with rules.',
          },
          {
            fig: 'grass-set',
            alt: 'Five blocks of grass side by side: two plain ones, two with a single tuft in different places, and one with a tiny yellow flower.',
            caption: 'The whole set: two plain blocks, two tufts, one flower. Five blocks, not fifty.',
          },
          {
            ul: [
              'Make most of the variants plain. The plain ones carry the field, and the details are the sprinkle on top.',
              'Give the details different places in their blocks, so two of them side by side do not line up.',
              'Never put two detail blocks next to each other. A crowded spot becomes the new pattern.',
              'Two or three plain blocks with different speckle are better than one. It costs two blocks and breaks the repeat more than any tuft.',
            ],
          },
          {
            p: 'The same trick works for dirt with stones, water with a glint, a path with pebbles and a wall with a crack. A handful of blocks per surface, used with a light hand, is much cheaper than drawing a larger picture.',
          },
        ],
      },
    ],
  },
  SHADOWS,
  CHARACTERS,
  WORDS,
  SCREENS,
];

export const courseById = (id: string): Course | undefined => COURSES.find((c) => c.id === id);

/** Courses that are planned and not written yet, for the contents page. */
export const COMING: { title: string; about: string }[] = [
  { title: 'Palettes', about: 'Colors in a ramp, one palette to a scene, and how a game spends its 256 colors.' },
  { title: 'Block animation', about: 'Water, torches and doors from a few frames, looping without a jump.' },
];
