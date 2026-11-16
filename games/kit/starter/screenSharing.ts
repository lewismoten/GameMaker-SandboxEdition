// Repository-only screen sharing: DOS draws each card's words over the same kit-colored GIF.
// PLAYGAME.C ShowGraphic and Display_File support GIF 0 followed by TXT with the original pause.
import { parseSlideList, serializeSlideList, textLines } from '@lewismoten/gamemaker-sandbox-engine/formats/graphicScripts';
import { dosText } from '@lewismoten/gamemaker-sandbox-tools/kit/disk';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { bevel } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { centered } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import { Book } from './book';
import { buildStarterPalette } from './palette';
import { gif, paper, scene, screenRecipes, scoresPicture, slotsPicture, type ScreenRecipe } from './screens';
import { starterStingFli } from './sting';
import { wrap } from './text';

// Palette and visibility lessons keep their own pictures and intro palettes (size-study exclusions).
const OWN_SCREENS = new Set([
  'around-the-room',
  'color-doors',
  'colors',
  'day-night',
  'dialog',
  'fireworks',
  'flicker',
  'leaves',
  'lightning',
  'lightning-bugs',
  'lights-out',
  'near-far',
  'rain',
  'say-something',
  'snow',
  'twinkle',
  'under-the-hood',
  'very-far',
  'heat-waves',
  'same-house',
  'flash-safe',
]);
const pal = buildStarterPalette();
const book = new Book('bbl'); // banded scenes do not read gameplay blocks
const cache = new Map<string, Uint8Array>();
const FIXED_HEADINGS = new Set(['HOW TO PLAY', 'CREDITS']);

/** Fixed kit palette, including index-zero black and PLAYGAME's menu/text color matches. */
function sharedPicture(recipe: ScreenRecipe, keepHeading = false): Uint8Array {
  const heading = keepHeading || FIXED_HEADINGS.has(recipe.words) ? recipe.words : 'STARTER GAME';
  const key =
    recipe.kind === 'slots' || recipe.kind === 'scores' ? `${recipe.kind}:${recipe.words}` : recipe.kind === 'paper' ? `paper:${heading}` : recipe.kind;
  const hit = cache.get(key);
  if (hit) return hit;
  const c = pal.c;
  let p: Pixels;
  if (recipe.kind === 'slots') p = slotsPicture(pal, book, recipe.words);
  else if (recipe.kind === 'paper') p = paper(pal, book, heading);
  else if (recipe.kind === 'scores') p = scoresPicture(pal, book, recipe.words);
  else if (recipe.kind === 'menu') {
    p = scene(pal, book, 170, 7);
    centered(p, 14, 'STARTER GAME', c('gold', 4), 2, c('ink', 0));
    p.rect(56, 46, 208, 132, c('wood', 1)).rect(58, 48, 204, 128, c('wood', 3));
    p.rect(62, 52, 196, 120, c('parch', 4)).frame(62, 52, 196, 120, c('wood', 2));
  } else {
    p = scene(pal, book, 176, 11);
    bevel(p, 22, 0, 276, 138, pal.r('parch'), 3, 2);
    p.rect(26, 4, 268, 130, c('parch', 4));
  }
  const bytes = gif(p, pal);
  cache.set(key, bytes);
  return bytes;
}

/** Share ordinary course screens; leave custom artwork, titles and lesson palettes alone. */
export function shareStarterScreens(files: Map<string, Uint8Array>, id: string): void {
  if (OWN_SCREENS.has(id) || id.startsWith('graduation-')) return;
  const pageTexts = new Map<string, string>();
  for (const [name, bytes] of files) {
    if (!name.endsWith('.lst')) continue;
    const slides = parseSlideList(bytes);
    slides.forEach((slide, i) => {
      const next = slides[i + 1]?.name;
      if (next?.endsWith('.txt') && files.has(next)) pageTexts.set(slide.name, next);
    });
  }
  // A heading may use the spare lines on the existing last page. Keep a full page's own
  // picture instead of adding another timed page (and changing its recorded walkthrough).
  const canSharePage = (name: string, heading: string): boolean => {
    const textName = pageTexts.get(name);
    if (!textName) return false;
    if (FIXED_HEADINGS.has(heading)) return true;
    const bytes = files.get(textName)!;
    const body = new TextDecoder('latin1').decode(bytes);
    if (body.split(/\r?\n/)[0] === heading) return true;
    return Math.ceil(textLines(dosText(wrap(heading) + '\n' + body)).length / 16) <= Math.ceil(textLines(bytes).length / 16);
  };
  const recipes = new Map<string, ScreenRecipe>();
  for (const [name, bytes] of files) {
    const recipe = screenRecipes.get(bytes);
    // This lesson contrasts GIF-only cards with GIF + TXT and FLI sequences.
    if (id === 'pictures-and-cartoons' && recipe?.kind === 'card') continue;
    if (recipe?.kind === 'paper' && !canSharePage(name, recipe.words)) {
      if (pageTexts.has(name)) files.set(name, sharedPicture(recipe, true));
      continue;
    }
    if (recipe) {
      recipes.set(name, recipe);
      files.set(name, sharedPicture(recipe));
    }
  }

  const headed = new Set<string>();
  for (const [name, recipe] of recipes) {
    if (recipe.kind !== 'paper' || FIXED_HEADINGS.has(recipe.words)) continue;
    const textName = pageTexts.get(name)!;
    if (headed.has(textName)) continue;
    const body = new TextDecoder('latin1').decode(files.get(textName)!);
    if (body.split(/\r?\n/)[0] !== recipe.words) files.set(textName, dosText(wrap(recipe.words) + '\n' + body));
    headed.add(textName);
  }
  let serial = 0;
  for (const [name, bytes] of [...files]) {
    if (!name.endsWith('.lst')) continue;
    const slides = parseSlideList(bytes);
    files.set(
      name,
      serializeSlideList(
        slides.flatMap((slide) => {
          const recipe = recipes.get(slide.name);
          if (!recipe) return [slide];
          if (recipe.kind !== 'card' && recipe.kind !== 'end') return [slide];
          let textName: string;
          do {
            textName = `card${serial++}.txt`;
          } while (files.has(textName));
          files.set(textName, dosText(wrap(recipe.words)));
          return [
            { name: slide.name, pause: 0 },
            { name: textName, pause: slide.pause },
          ];
        }),
      ),
    );
  }
  // Branding belongs to Kit rather than each course's playable hero: one palette and payload.
  if (files.has('starter.fli')) files.set('starter.fli', starterStingFli());
}
