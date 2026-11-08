# artCourses/

The art courses (`#/art-courses`, a card on the Library shelf): how to draw the art for a game.

- `courses.ts`: the course list and every lesson's words (paragraphs, lists, figures with alt text and caption), plus `COMING`, the planned courses.
- `artCoursesPage.ts` and `artCourses.css`: the contents page and a page for each course (`#/art-courses/<course>`). Loaded when first opened (`main.ts`).
- `figures/*.png`: real indexed blocks drawn in code by `../../scripts/artCourseFigures.ts` (`cd web && npx vite-node scripts/artCourseFigures.ts`). Redraw them after changing that script and commit the PNGs.

Course 1, "Blocks: cut, repeat, reuse", has five lessons: draw big then cut, edges that meet, 2 x 2 groups, reusing blocks (one centered post for a sign), variants against patterns.
