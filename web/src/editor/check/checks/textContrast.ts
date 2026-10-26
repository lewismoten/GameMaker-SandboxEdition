// The level check's text-screen contrast: each text page drawn over a picture the check can know
// (textScreens.ts), its text color (the palette's nearest deep purple, as PLAYGAME picks it)
// against the picture under each letter; and the menu's blue words against the menu picture.
// It measures with the WCAG contrast ratio (sceneData.ts), letter by letter.
import type { Game } from '../../../formats/game';
import { match, RGB_BLUE } from '../../../engine/showGraphic';
import type { Finding } from '../findings';
import { contrastRatio, luminance } from '../sceneData';
import type { FileSource } from '../sim';
import { menuScreen, textPages, type Backdrop, type TextPage, type TextRole } from '../textScreens';

/** A letter is hard to read below this ratio against the picture under it (WCAG's floor for large text). */
export const MIN_RATIO = 3;
/** A page is reported when at least this share of its letters is hard to read. */
const HARD_SHARE = 0.2;

interface Letters {
  /** Letters drawn, and how many are hard to read. */
  total: number;
  hard: number;
  /** The median ratio of the letters. */
  median: number;
}

/** Each letter's ratio against the mean light of the 8 × 8 cell under it. */
function measure(under: Backdrop, color: number, words: { x: number; y: number; text: string }[]): Letters {
  const lum = new Float64Array(256);
  for (let i = 0; i < 256; i++) lum[i] = luminance(under.palette, i);
  const ink = lum[color];
  const ratios: number[] = [];
  for (const w of words)
    [...w.text].forEach((ch, i) => {
      if (ch === ' ' || ch < ' ') return;
      const x0 = w.x + i * 8;
      if (x0 + 8 > 320 || w.y + 8 > 200) return;
      let sum = 0;
      for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) sum += lum[under.pixels[(w.y + y) * 320 + x0 + x]];
      ratios.push(contrastRatio(ink, sum / 64));
    });
  ratios.sort((a, b) => a - b);
  return { total: ratios.length, hard: ratios.filter((r) => r < MIN_RATIO).length, median: ratios[Math.floor(ratios.length / 2)] ?? 21 };
}

const ROLE_WORD: Record<TextRole, string> = {
  title: 'title screen',
  menu: 'menu',
  story: 'storyline',
  instructions: 'instructions',
  credits: 'credits',
  scores: 'high scores',
  won: 'won screen',
  lost: 'lost screen',
  intro: 'level card',
  exit: 'level exit screen',
};

const pageWords = (p: TextPage) => p.lines.map((text, i) => ({ x: 40, y: (5 + i) * 8, text }));

/** The menu's words as PLAYGAME writes them (engine/game.ts): the game's name and six choices. */
const menuWords = (name: string) => [
  { x: 96, y: 104, text: name },
  ...['Play', 'Read Instructions', 'Read Storyline', 'See Credits', 'See Highest Scores', 'Quit'].map((text, i) => ({ x: 80, y: (15 + i) * 8, text })),
];

export function textContrast(game: Game, files: FileSource): Finding[] {
  const out: Finding[] = [];
  const pages = textPages(game, files);
  const seen = new Set<string>();
  for (const p of pages) {
    if (!p.under) continue;
    // a page shared by several scenes (one level card for all) is judged once
    const key = `${p.file}|${p.page}|${p.color}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const m = measure(p.under, p.color, pageWords(p));
    if (!m.total || m.hard < m.total * HARD_SHARE) continue;
    out.push({
      check: 'text-contrast',
      severity: 'warning',
      title: `${m.hard} of ${m.total} letters on the ${ROLE_WORD[p.role]}${p.pages > 1 ? ` (page ${p.page + 1})` : ''} are hard to read against the picture`,
      detail: `${p.file}: the text is drawn in color ${p.color}, the picture’s nearest deep purple, and the middle letter stands ${m.median.toFixed(1)} : 1 against what is under it (${MIN_RATIO} : 1 or more reads well). Keep a plain light area under the 16 text lines (from 40 pixels in, 40 down), or give the picture a deep purple that stands out.`,
      where: { scene: p.scene, file: p.file },
    });
  }
  // the menu: blue words over the menu picture
  const menuFile = game.scenes[0]?.files[2];
  const menu = menuFile ? menuScreen(game, files) : undefined;
  if (menuFile && menu) {
    const blue = match(menu.palette, RGB_BLUE);
    const m = measure(menu, blue, menuWords(game.scenes[0].desc));
    if (m.total && m.hard >= m.total * HARD_SHARE)
      out.push({
        check: 'text-contrast',
        severity: 'warning',
        title: `${m.hard} of ${m.total} letters of the menu’s choices are hard to read against the menu picture`,
        detail: `${menuFile}: PLAYGAME writes the menu in color ${blue}, the picture’s nearest blue, and the middle letter stands ${m.median.toFixed(1)} : 1 (${MIN_RATIO} : 1 or more reads well). Keep a plain light box behind the choices (from 80 pixels in, 104 to 168 down), or give the picture a blue that stands out.`,
        where: { scene: 0, file: menuFile },
      });
  }
  return out;
}
