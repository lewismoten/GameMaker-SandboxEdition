// Art course 3, "Palettes": the words of its lessons. Its figures are drawn by scripts/artCourseFigures3.ts. The counts come from a
// survey of the built games and the CD (colors in a scene's block sets, palettes per game); the figure script redoes the two
// per-game ones (Pass the Pie's colors by who uses them, the Carl day and night pair).
import type { Course } from './courses';

export const PALETTES: Course = {
  id: 'palettes',
  no: 3,
  title: 'Palettes',
  about: 'Colors in a ramp, one palette to a scene, how a game spends its 256 colors, and one set of blocks given a new look.',
  starters: ['Colors That Work', 'Day and Night'],
  lessons: [
    {
      id: 'ramps',
      title: '1. A ramp is a color family, dark to light',
      parts: [
        {
          p: 'A scene has 256 colors to spend, so the first habit is to spend them in families. A ramp is one color in a few steps from dark to light: four or five greens, three or four browns. A pixel that is lit takes a light step, a pixel in shade takes a dark one, and the picture gets its shape from the steps and not from outlines.',
        },
        {
          fig: 'pal-ramps',
          alt: 'Six rows of colored squares. Row one is five greens, from dark forest green to bright lime. Row two is four browns. Row three is four grays. Row four is four tans. Row five is three reds. Row six is three blues. Each row goes from dark on the left to light on the right.',
          caption: 'The ramps behind these courses: grass, soil, stone, wood, roof and water. Dark on the left, light on the right.',
        },
        {
          p: 'The number of steps is the budget. One step makes a flat disc, two make a disc with a shadow, and four make something round. More steps than that cost colors without the eye noticing.',
        },
        {
          fig: 'pal-balls',
          alt: 'Two rows of three balls on a blue sky. The top row is brown, the bottom row is green. In each row the left ball is one flat color, the middle ball has two shades with a light patch and a dark crescent, and the right ball has four shades and looks round.',
          caption: 'One, two and four steps of the same ramp. Four steps (right) read as a ball; the flat ones (left) are a disc.',
        },
        {
          ul: [
            'Give each family its own run of palette numbers, in order from dark to light. A ramp you can find again is a ramp you can edit.',
            'Three to five steps is plenty for 20 x 20 blocks.',
            'Reuse a ramp for more than one thing. Grass, a hedge and a leaf can share greens.',
          ],
        },
      ],
    },
    {
      id: 'hue',
      title: '2. Shades that lean',
      parts: [
        {
          p: 'The simplest ramp keeps the hue and changes only the brightness. It works, and it tends to look flat and muddy. Painters have long let shade lean cool and light lean warm: the dark steps drift toward blue or purple, the light steps toward yellow. The picture gets a mood for the price of choosing the steps with a little more care.',
        },
        {
          fig: 'pal-hue',
          alt: 'Two copies of a small tan house with a dark roof and a door on a blue sky, each with its five-color ramp as squares below. In the left house the shades are all the same brown-tan, just darker and lighter. In the right house the dark steps lean purple and the light steps lean yellow.',
          caption: 'The same house and the same five steps. Left: only brightness changes. Right: the dark steps lean purple and the light ones lean yellow.',
        },
        {
          p: 'Each color is three numbers from 0 to 63 for red, green and blue (six bits each), so a lean is a small change: raise the blue of a dark step, raise the red and green of a light one. The edit costs nothing, because it is the same five palette entries either way.',
        },
        {
          ul: [
            'Pick the middle step first, then lean the ends away from it.',
            'Lean the same way in every ramp of a scene, or two ramps will look lit by different lamps.',
            'Keep a few steps that do not lean: skin, a white, a black. A lean on every color of a scene is a tint.',
          ],
        },
      ],
    },
    {
      id: 'scene',
      title: '3. One palette to a scene, and who shares it',
      parts: [
        {
          p: 'A scene names one palette (file slot 0 of the scene). Its ground blocks, its monsters and its hero are all drawn with the same 256 colors, because there is only one set of colors on the screen at a time. The Programmer’s Guide gives the sources (PLAYGAME line 4244, chapter 11); here it is a drawing rule: every picture in a scene has to be drawn from the same palette.',
        },
        {
          p: 'That makes the palette a shared pantry. The first level of Pass the Pie, the yard, uses 80 of its 255 usable colors. The ground blocks use 53 of them, the monsters 37 and the hero 33, and some are the same entries in two places: blocks and monsters share 27, blocks and hero 16, monsters and hero 12.',
        },
        {
          fig: 'pal-spend',
          alt: 'Three grids of 16 by 16 squares, labeled BLOCKS, MONSTERS and HERO. Each grid shows the same 256 palette entries, and only the entries that group uses are colored; the rest are dark gray. The block grid has the most colored squares, in oranges, creams, reds and a few greens and blues. The monster grid has oranges, browns and purples. The hero grid has browns, golds, greens and a blue.',
          caption: 'Pass the Pie, level one: the same 256 palette entries three times. Colored means the group paints with it.',
        },
        {
          p: 'Sharing is fine for the colors that belong to everything: an outline, a white, a skin tone. A color that a hero needs to stand out against the ground is another matter. A hero in the same greens as the grass vanishes when it walks over it, and a monster in the ground’s browns looks like a bump. In the yard, 17 of the hero’s 33 colors are used by no ground block, which is why the hero reads on any of them.',
        },
        {
          ul: [
            'Draw the ground first, then pick the hero’s and the foes’ main colors from outside the ground’s ramps.',
            'Color 255 is the clear color in a hero or monster, so only 255 colors are left for them (Guide chapter 11). In a ground block, 255 is an ordinary color.',
            'Leave a clear blue, a red and a yellow in the palette. The inventory screen and the error boxes ask for those and take the nearest color the scene has (Guide chapter 11, PLAYGAME lines 287 to 290).',
          ],
        },
      ],
    },
    {
      id: 'series',
      title: '4. How the games spend their 256 colors',
      parts: [
        {
          p: 'Here is what a scene of each kind of game actually paints with. These come from reading every game on the Sample CD and in the Library: for each scene, how many different colors its ground, monster and hero block sets use together (a set counts all of its blocks, whether or not the map uses them).',
        },
        {
          fig: 'pal-series',
          alt: 'A bar chart. Six bars of green, longest first, each labeled and numbered: gameware 160, shareware 112, bizarre 111, sandbox 106, special 84 and starters 78. A pink line marks the 256 colors a palette holds, at the far right.',
          caption: 'Average colors used by a scene’s block sets. The pink line is the 256 a palette holds, and no scene comes near filling it on average.',
        },
        {
          ul: [
            'The Gameware games on the CD are the most colorful: 160 colors on average, and up to 227 in one scene. They also keep one palette for the whole game in 13 of 17 cases, which is how they stay under 256.',
            'The Shareware games average 112 and have one palette in 8 of 12 games.',
            'The retail Sandbox games and the Bizarre games sit near 110. They give most scenes a palette of their own, 13 per game on average in the Sandbox games (one game has 99), and 5 per game in the Bizarre ones.',
            'The specials average 84, with one palette per scene: 6 palettes for 6 levels in Pass the Pie.',
            'The Starters need only 78. They teach one idea each, in a few colors.',
          ],
        },
        {
          p: 'Two lessons come out of the numbers. A big palette is for a game that keeps it for every scene. A game with a new look in every scene can only afford a small one, because each scene’s hero, foes and ground are all counted again. If every scene needs 150 colors, the scenes will look alike or the blocks will have to be redrawn for each.',
        },
      ],
    },
    {
      id: 'swap',
      title: '5. A new look from the same blocks',
      parts: [
        {
          p: 'A palette swap gives a block set a new look without touching a pixel. The blocks and the map stay as they are, only the 256 entries change, and the same scene is day, then night.',
        },
        {
          fig: 'pal-swap',
          alt: 'Two copies of the same living room scene side by side. On the left it is day: pale green wallpaper with white daisies, a window with blue sky, brown wood paneling and an orange sofa with a person sitting on it. On the right it is night: the same wallpaper and sofa in dark blue and brown, with a dark window and stars.',
          caption: 'One screen of A Fly Named Carl, drawn with its couch palette (left) and its bed palette (right). The map and the blocks are the same.',
        },
        {
          p: 'A Fly Named Carl draws its house with one set of blocks under four palettes (couch, walls, bed and a cord scene), and the first palette and the last agree on only 152 of their 256 entries. Third Goat from the Left does the same with a field, a town, a caravan and a stable. It is common in the Bizarre games: 11 of the 12 do it, so a four-level game costs one set of blocks and four small palette files.',
        },
        {
          p: 'The same trick can be used for a whole run of scenes. Pass the Pie has six levels, each with its own palette, and every one of them keeps the same hero and monster sets, so its first and last palettes agree on 238 of 256 entries. The hero looks like the hero in every level while the ground changes.',
        },
        {
          ul: [
            'Draw with ramps and the swap is easy: change the five entries of a ramp and everything that uses it changes together.',
            'Swap the colors a scene is made of and leave the hero’s alone, or the hero changes too.',
            'Make the night darker and bluer, and keep a clear light (a window, a lamp) at a bright index, so the scene still has something to read by.',
            'The Day and Night Starter has one map and two looks, and is the quickest way to try it.',
          ],
        },
      ],
    },
  ],
};
