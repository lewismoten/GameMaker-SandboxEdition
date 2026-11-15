# artCourses/

The art courses (`#/art-courses`, a card on the Library shelf): how to draw the art for a game.

- `courses.ts`: the course list, the first course's words and the shared lesson types (paragraphs, lists, figures with alt text and caption). It imports courses 2–7 from the `course*.ts` files below. `COMING` holds the planned courses (none left: all seven are written).
- `artCoursesPage.ts` and `artCourses.css`: the contents page and a page for each course (`#/art-courses/<course>`). Loaded when first opened (`main.ts`).
- `figures/*.png`: figures drawn in code or read from built game disks by `../../scripts/artCourseFigures.ts` (course 1) and `artCourseFigures2.ts` through `artCourseFigures7.ts` (courses 2–7). From the repository root, `cd web && npx vite-node scripts/artCourseFigures.ts` redraws only course 1; use the matching numbered script for another course. Redraw the affected figures after changing their script and commit the PNGs. Courses 3, 5 and 7 need built disks; prepare them from the root with `npm run heavy -- npm run build:games`.

Course 1, "Blocks: cut, repeat, reuse", has five lessons: draw big then cut, edges that meet, 2 x 2 groups, reusing blocks (one centered post for a sign), variants against patterns.

Course 2, "Shadows and depth" (`courseShadows.ts`, figures by `../../scripts/artCourseFigures2.ts`), has five lessons: a shadow is the ground one step darker, solid or dithered, one shadow block reused along an edge, light from one side, how few blocks it costs (the figure script counts them).

Course 3, "Palettes" (`coursePalettes.ts`, figures by `../../scripts/artCourseFigures3.ts`), has five lessons: a ramp is a color family dark to light, shades that lean cool and warm, one palette to a scene and who shares it, how each series spends its 256 colors (counts from a survey of every non-secret game and the CD), a new look from the same blocks. Its swap, spend and series figures are read from built disks (`GM_GAMES` picks another games folder).

Course 4, "Characters that move" (`courseCharacters.ts`, figures by `../../scripts/artCourseFigures4.ts`), has five lessons: frames, four facings and a climb view, a four-frame walk cycle, mirroring and what it costs, keeping 20 x 20 readable. The shared palette and helpers for the figure scripts are in `../../scripts/artCourseKit.ts`.

Course 5, "Block animation" (`courseAnimation.ts`, figures by `../../scripts/artCourseFigures5.ts`), has five lessons: a block that turns into another (a ring of `nextbl` and `ntime`), water that closes its loop, fire and torches, doors and levers (a swap when touched), timing and what each frame costs. It states what PLAYGAME's `changeblks` does (`code/GM/PLAYGAME.C:2322`) and the Guide's chapter 5; the Heat Waves ring, door and lever are real blocks read from built disks.

Course 6, "Words as monsters" (`courseWords.ts`, figures by `../../scripts/artCourseFigures6.ts`), has five lessons: why a word reads backwards (PLAYGAME turns a chasing monster's block left for right), the letters that turn around cleanly, making the turn part of the joke (AH and HA), a word across two monsters (each block turns where it stands), keeping a word readable as a monster.

Course 7, "Screens with words: titles, cartoons and talk" (`courseScreens.ts`, figures by `../../scripts/artCourseFigures7.ts`), has five lessons: a title picture leaves room for the game's words, a few colors chosen on purpose, a cartoon is a few held poses, a sign has only so much room, talk that fits with a voice for each. Its figures are the real screens of three Starters read from their built disks (`GM_GAMES` picks another games folder) and a drawn sign.
