// Every picture, cartoon, slide list and page of text on the disk, and the scene that shows
// the felt egg's page.
import { ADVTYPE, MAXSCENELINKS, NOSCENE, emptyScene, type Scene } from '../../../../web/src/formats/game';
import { serializeSlideList } from '../../../../web/src/formats/graphicScripts';
import { matchColor } from '../../../../web/src/formats/palette';
import { SANDLOGO, sandLogoFli } from '../../../kit/sandlogo';
import { farScene, nearScene, type Extra } from '../game';
import type { LevelSet } from '../levels/blocks';
import { rgb } from '../render/tracer';
import type { Picture } from '../render/image';
import type { SpriteSet } from '../sprites/sprites';
import { GM_BLUE, GM_PURPLE, GM_RED, GM_YELLOW, centered, toGif } from './draw';
import { endingFrames } from './ending';
import { introFrames, toFli } from './intro';
import * as P from './pictures';
import { storyPictures, wonPicture } from './story';
import { CREDITS, EGG_TEXT, INSTRUCTIONS } from './text';
import { titlePicture } from './title';

export interface ScreenInput {
  sprites: SpriteSet;
  sets: LevelSet[];
}

/** The scene that shows the egg's page: after all the levels' scenes. */
export const LORE_SCENE = 2 + 6 * 3;

export function buildScreens(input: ScreenInput, fast = false): { files: Record<string, Uint8Array | string>; extra: Extra } {
  const files: Record<string, Uint8Array | string> = {};
  // the pictures take minutes; DEPTH_FAST=1 builds keep the ones already on the disk
  if (fast) return { files, extra: eggScene(input.sets) };
  // PLAYGAME writes in the colors nearest these; keep them exact in every picture
  const fixed = [GM_PURPLE, GM_RED, GM_BLUE, GM_YELLOW];
  const gif = (name: string, pic: Picture) => (files[name] = toGif(pic, fixed));

  // the opening: the Sandbox logo, the cartoon, the title
  files[SANDLOGO] = sandLogoFli();
  const intro = introFrames();
  files['intro.fli'] = toFli(intro.frames, intro.speed);
  const title = titlePicture();
  gif('title.gif', title);
  files['title.lst'] = serializeSlideList([
    { name: SANDLOGO, pause: 0 },
    { name: 'intro.fli', pause: 0 },
    { name: 'title.gif', pause: 12 },
  ]);
  gif('menu.gif', P.menuPicture());

  // the storyline
  storyPictures(title).forEach((p, i) => gif(`story${i + 1}.gif`, p));
  files['story.lst'] = serializeSlideList([1, 2, 3, 4].map((i) => ({ name: `story${i}.gif` })));

  // how to play and the credits: a picture, then the pages over frosted glass
  gif('howto.gif', P.howtoPicture());
  gif('howbg.gif', P.howtoBackground());
  files['howto.txt'] = INSTRUCTIONS;
  files['howto.lst'] = serializeSlideList([{ name: 'howto.gif', pause: 8 }, { name: 'howbg.gif', pause: 0 }, { name: 'howto.txt' }]);
  const cast = P.castPicture();
  gif('cast.gif', cast);
  gif('credbg.gif', P.creditsBackground());
  files['credits.txt'] = CREDITS;
  files['credits.lst'] = serializeSlideList([{ name: 'cast.gif', pause: 8 }, { name: 'credbg.gif', pause: 0 }, { name: 'credits.txt' }]);

  gif('hiscore.gif', P.hiscorePicture());
  gif('loadgame.gif', P.savePicture('LOAD GAME'));
  gif('savegame.gif', P.savePicture('SAVE GAME'));

  // the level cards
  for (const s of input.sets) gif(`card${s.level.n}.gif`, P.cardPicture(s.level.n, s.level.name, s.level.tagline, s.level.advice));

  // the end
  const ending = endingFrames();
  files['ending.fli'] = toFli(ending.frames, ending.speed, 3, 1);
  gif('won1.gif', wonPicture(P.castPicture(false)));
  files['won.lst'] = serializeSlideList([{ name: 'ending.fli', pause: 0 }, { name: 'won1.gif' }]);
  gif('lost.gif', P.lostPicture());
  files['lost.lst'] = serializeSlideList([{ name: 'lost.gif' }]);

  // the felt egg's page
  const egg = P.eggPicture();
  const eggTitled: Picture = { w: egg.w, h: egg.h, rgb: egg.rgb.slice() };
  centered(eggTitled, 10, 'THE PRISM EGG', rgb(255, 255, 255), 2, { outline: rgb(30, 10, 50) });
  centered(eggTitled, 182, 'Behind the two-way mirror...', rgb(220, 200, 255), 1, { outline: rgb(30, 10, 50) });
  gif('egg.gif', eggTitled);
  // PLAYGAME writes the page's MORE... in the color nearest red in the Hall of Mirrors'
  // palette (the scene's), whatever this picture has at that index: keep red there
  const red = matchColor(input.sets[2].pal, 63, 10, 10);
  files['eggbg.gif'] = toGif(P.textPage(egg, rgb(250, 246, 255)), fixed, 1, red < fixed.length ? [] : [[red, GM_RED]]);
  files['egg.txt'] = EGG_TEXT;
  files['egg.lst'] = serializeSlideList([{ name: 'egg.gif' }, { name: 'eggbg.gif', pause: 0 }, { name: 'egg.txt' }]);

  return { files, extra: eggScene(input.sets) };
}

/**
 * The Hall of Mirrors' two-way mirror (only the far plane lets you through): just behind it a link takes Ray to a scene of its own
 * whose intro is the egg's page; it starts him on a link straight back into the far plane,
 * beside the felt egg, one row up so walking out again doesn't show the page twice.
 */
function eggScene(sets: LevelSet[]): Extra {
  const L = 2;
  const b = sets[L].built;
  const spot = b.marks.get('L')?.[0];
  if (!spot) throw new Error('No "L" (the page behind the mirror) in the Hall of Mirrors');
  const at = { x: spot[0], y: spot[1] };
  const back = { x: spot[0] + 1, y: spot[1] - 1 };
  const s: Scene = emptyScene(ADVTYPE);
  s.desc = 'Behind the Mirror';
  s.pos = { x: 140, y: 190 };
  s.files = [`l${L + 1}.pal`, `l${L + 1}far.map`, `l${L + 1}far.bbl`, '', '', 'far.chr', 'ray.cbl', 'depth.snd', '', 'egg.lst', ...new Array(10).fill('')];
  s.links = Array.from({ length: MAXSCENELINKS }, (_, k) => (k === 0 ? { toScene: farScene(L), from: { ...at }, to: back } : { toScene: NOSCENE, from: { x: 0, y: 0 }, to: { x: 0, y: 0 } }));
  return {
    scenes: [s],
    links: [{ level: L, plane: 'far', link: { toScene: LORE_SCENE, from: { ...at }, to: { ...at } } }],
  };
}

export { nearScene };
