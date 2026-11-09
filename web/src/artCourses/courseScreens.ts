// Art course 7, "Screens with words: titles, cartoons and talk": the words of its lessons. Its figures are the real screens of
// three Starters and a drawn sign, made by scripts/artCourseFigures7.ts.
import type { Course } from './courses';

export const SCREENS: Course = {
  id: 'screens',
  no: 7,
  title: 'Screens with words: titles, cartoons and talk',
  about:
    'The screens between the levels: a title picture with room for the game’s words, a cartoon of a few held poses, signs that fit and talk that sounds like somebody.',
  starters: ['Make a Title', 'Pictures and Cartoons', 'Everybody Talks'],
  lessons: [
    {
      id: 'title',
      title: '1. A title picture leaves room for words',
      parts: [
        {
          p: 'A title screen is one picture, 320 pixels wide and 200 tall, drawn once and shown whole. It is the first thing a player sees, so it gets the biggest drawing in the game: the hero, a stage, the game’s name in letters bigger than any in the levels.',
        },
        {
          fig: 'screen-title',
          alt: 'The title picture of Make a Title: red stage curtains on both sides, the words MAKE A TITLE in yellow letters across the top under a row of lights, a hero in a blue beanie and red jacket standing on the stage, a framed picture and a computer screen behind him, and the word COURSE and a number lettered on the floor.',
          caption: 'A title picture: a big hero, a stage, the name across the top.',
        },
        {
          p: 'But the picture is not the whole screen. The menu is lettered on top of it by the game, in the same 8 x 8 letters as the rest of the text. That means the picture has to leave the board under the menu plain, with no detail that the words would cross.',
        },
        {
          fig: 'screen-board',
          alt: 'A blueprint-style template of the menu picture, with a ruler along the top and left. Hatched boxes mark where the game writes: a red strip for a missing page, a blue strip for the game’s name, a column for the marker, and six choices (Play, Read Instructions, Read Storyline, See Credits, See Highest Scores, Quit) in a blue box.',
          caption: 'The template that comes with the Starter. The game writes in the hatched boxes, so the picture draws around them.',
        },
        {
          ul: [
            'Find the boxes first, then draw. Put the big art where the words are not.',
            'Draw the words’ area as a calm, flat color, or a quiet pattern: a board, a banner, a stage floor.',
            'Never put the menu words on a busy spot, such as a face or fine stripes. The letters are one color, and they will be lost.',
          ],
        },
      ],
    },
    {
      id: 'colors',
      title: '2. A few colors, chosen on purpose',
      parts: [
        {
          p: 'The screen shows at most 256 colors at a time, and a picture can ask for fewer. A title that uses most of them will look rich for the first minute and muddy next to the next picture, so a title is built from ramps: a few colors in each family, from dark to light.',
        },
        {
          fig: 'screen-colors',
          alt: 'The Make a Title picture again, with a gray panel beside it holding a grid of small squares, each a color used in the picture: dark blues and blacks, a column of light blues, browns, golds, yellows, reds, purples and pinks, and a few grays.',
          caption: 'The same title and, beside it, every color it uses: 52.',
        },
        {
          ul: [
            'Count your ramps rather than your colors. Here there are a handful of families, each with a few steps.',
            'A color that appears once is a color to look at again. Cut it, or fold it into a neighbor.',
            'Dithering, the speckled blend of two colors, is cheap in colors and busy to look at. Use it on backdrops, never behind the words.',
          ],
        },
      ],
    },
    {
      id: 'cartoons',
      title: '3. A cartoon is a few held poses',
      parts: [
        {
          p: 'A cartoon is a file of full-screen frames, played once between two levels. It has no sound, and PLAYGAME plays all of it before it looks for a key. Each frame waits a fixed time before the next. The one below has 40 frames at a sixth of a second each, about three seconds and a half.',
        },
        {
          fig: 'screen-cartoon',
          alt: 'Six frames of a cartoon, two rows of three. A traveler in a pink beanie stands beside a mound of soil with a seed. A sprout grows in the second frame, taller in the third, tall with a bud in the fourth. In the fifth a white daisy has opened and the word BLOOM! is lettered across the top, and in the sixth the traveler has arms down and the daisy is bigger.',
          caption: 'Frames 0, 10, 20, 30, 33 and 39 of a 40-frame cartoon.',
        },
        {
          ul: [
            'Change one thing at a time. The hero stands still, and only the plant grows. A frame that changes a little costs a few bytes; a whole new picture costs the screen.',
            'Draw the backdrop in flat bands, not dither. The cartoon above is about 36 KB for 40 frames. Dithered sky would have made every frame large.',
            'Hold the pose that matters. The flower is open for the last seven frames, and the eye reads it as the end.',
            'Let a caption carry the joke. Pictures can say what happens, but a word such as BLOOM! says how to feel about it, and it appears with the last pose so that it is read while the picture is still.',
          ],
        },
        {
          p: 'Pick a spot for the caption as you plan the frames, and keep it plain, as in the first lesson. The letters are the biggest on the screen, with a dark outline so that they read against any sky.',
        },
      ],
    },
    {
      id: 'signs',
      title: '4. A sign has only so much room',
      parts: [
        {
          p: 'A sign is a few blocks wide with words lettered on it in the same 8 x 8 font. The letters do not shrink to fit, so the board decides how much can be said. A board of three blocks holds six letters across, and four blocks hold nine. A board one block high holds one line, and two blocks hold four.',
        },
        {
          fig: 'screen-signs',
          alt: 'Four wooden signs on two posts each. In the first row, EXIT on a short board, WATCH OUT on a board a little wider, and a bigger board with MIND THE on one line and GAP on a second. Below, a board with MIND THE GAP on a single line that is longer than the board: the M and the P stick out on the sky on each side.',
          caption: 'Three signs that fit, and one, below, where the words are wider than the board.',
        },
        {
          ul: [
            'Count the letters. Each is 8 pixels, and a space is one too.',
            'Break lines at spaces, so a word never splits in two. MIND THE and GAP is better than MIND THE G and AP.',
            'A word that is too long for the board needs a wider board. It cannot be broken.',
            'Say it in as few words as you can. The player is walking past.',
          ],
        },
      ],
    },
    {
      id: 'talk',
      title: '5. Talk: lines that fit, a voice for each',
      parts: [
        {
          p: 'Talk is a picture with the words laid over it. PLAYGAME writes a text file over the picture in rows of 8 pixels, starting 40 pixels in from the left and 40 down, one color for all of it, and sixteen rows at most. So the picture draws the bubbles and the names, and the text file holds only what is said.',
        },
        {
          fig: 'screen-talk',
          alt: 'A picture of a meadow and hills with four people standing in a column at the right edge. Three speech boxes sit across the screen. PIP says: Moss! Dot! Look who it is. MOSS says: Kit! Just in time. Dot has a riddle. DOT says: What has a lid and a spout, and never goes anywhere?',
          caption: 'A talk card: bubbles and names are in the picture, the words in the bubbles come from a text file.',
        },
        {
          ul: [
            'Fit the bubble. Here a line holds 28 letters, and a turn holds the rows between its name and the next. A long turn runs to a second card.',
            'Break lines at the places a person pauses: at a comma, or before a long word.',
            'Give each character one voice and keep it. Pip is quick and says very little. Moss is steady and explains. Dot asks the riddles. Cover the names with your hand: if you can still tell who is talking, the voices are right.',
            'Short turns, and plenty of them. A talk of two long speeches is not a talk.',
          ],
        },
        {
          p: 'Keep the words and the picture in step. If the bubble is a color and a mood, the person speaking should sound like that. A bubble the same shape for everyone makes everyone sound the same.',
        },
      ],
    },
  ],
};
