# artCourses/

The art courses (`#/art-courses`, a card on the Library shelf): how to draw the art for a game.

- `courses.ts`: the course list and every lesson's words (paragraphs, lists, figures with alt text and caption), plus `COMING`, the planned courses.
- `artCoursesPage.ts` and `artCourses.css`: the contents page and a page for each course (`#/art-courses/<course>`). Loaded when first opened (`main.ts`).
- `figures/*.png`: real indexed blocks drawn in code by `../../scripts/artCourseFigures.ts` (`cd web && npx vite-node scripts/artCourseFigures.ts`). Redraw them after changing that script and commit the PNGs.

Course 1, "Blocks: cut, repeat, reuse", has five lessons: draw big then cut, edges that meet, 2 x 2 groups, reusing blocks (one centered post for a sign), variants against patterns.

Course 2, "Shadows and depth" (`courseShadows.ts`, figures by `../../scripts/artCourseFigures2.ts`), has five lessons: a shadow is the ground one step darker, solid or dithered, one shadow block reused along an edge, light from one side, how few blocks it costs (the figure script counts them).

Course 4, "Characters that move" (`courseCharacters.ts`, figures by `../../scripts/artCourseFigures4.ts`), has five lessons: frames, four facings and a climb view, a four-frame walk cycle, mirroring and what it costs, keeping 20 x 20 readable. The shared palette and helpers for the three figure scripts are in `../../scripts/artCourseKit.ts`.

Course 6, "Words as monsters" (`courseWords.ts`, figures by `../../scripts/artCourseFigures6.ts`), has five lessons: why a word reads backwards (PLAYGAME turns a chasing monster's block left for right), the letters that turn around cleanly, making the turn part of the joke (AH and HA), a word across two monsters (each block turns where it stands), keeping a word readable as a monster.

Course 7, "Screens with words: titles, cartoons and talk" (`courseScreens.ts`, figures by `../../scripts/artCourseFigures7.ts`), has five lessons: a title picture leaves room for the game's words, a few colors chosen on purpose, a cartoon is a few held poses, a sign has only so much room, talk that fits with a voice for each. Its figures are the real screens of three Starters read from their built disks (`GM_GAMES` picks another games folder) and a drawn sign.
