// A course through the wrap as a poster (a map printable whose panel says `course`, such as
// Snowbound's sled run poster): the run as the player rides it, unrolled through the wrap as on
// the Level Maps (levelCourse.ts), stitched into one continuous picture, with the start, the finish and
// the laps marked. Undefined when the map isn't a course the Level Maps know.
import { el } from './worldMapArt';
import { COLORS, loadLevels, markText } from './levelMaps';
import { levelsOf } from './levelMapLayout';
import { listedSecrets } from './levelSecrets';
import { listedCourses } from './levelViews';
import { listedRoomHints } from './levelRoomHints';
import { GUTTER, PANEL_GAP, PANEL_HEAD, coursePanelUrls, dataUrl, wholeCourseSvg, wholeCourseSize } from './levelCourseSvg';
import type { CatalogEntry } from '../../project/files';

/** The course on `map` drawn to fit a `box` (paper units) without cutting the route, as an SVG. */
export async function coursePosterSvg(entry: CatalogEntry, map: string, box: { w: number; h: number }): Promise<SVGElement | undefined> {
  const secret = listedSecrets(entry.id);
  const x = secret && (await loadLevels(entry));
  if (!x) return undefined;
  const levels = levelsOf(x.game, x.files, secret, {}, {}, listedRoomHints(entry.id), listedCourses(entry.id), {
    pageW: box.w,
    pageH: box.h,
    padW: 2 * GUTTER + PANEL_GAP,
    padH: 2 * PANEL_HEAD + PANEL_GAP,
    most: 2,
    least: 0.1,
    growth: 1,
    stack: true,
  });
  const l = levels.find((v) => v.course && v.group.map === map.toLowerCase());
  if (!l?.course) return undefined;
  const urls = await coursePanelUrls(x.game, x.files, l, dataUrl);
  const size = wholeCourseSize(l.course);
  return el(
    'svg',
    { xmlns: 'http://www.w3.org/2000/svg', viewBox: `0 0 ${box.w} ${box.h}`, role: 'img', 'aria-label': `${l.name}, the whole run in order` },
    el(
      'svg',
      { width: box.w, height: box.h, viewBox: `0 0 ${size.w} ${size.h}` },
      wholeCourseSvg(x.game, l, urls, 0, 0, COLORS, (m) => markText(x.game, m)),
    ),
  );
}
