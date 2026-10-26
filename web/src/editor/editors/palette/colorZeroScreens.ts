// The player's screens that are drawn on palette color 0 (code/GM/PLAYGAME.C clears the screen
// with BoxFill(..., 0) first): the new-high-score name prompt, the high-score table with no
// high-score picture, F1 with no instructions, F2, F5 with no save picture and F10. Each draws
// with the engine's own functions (engine/menus.ts, engine/funcKeys.ts) and says which color
// selectors (dosPlayer/patchTable.ts color.select.*) its words match, so the palette editor's
// color 0 dialog (colorZeroDialog.ts) can show what really gets matched in a palette.
import type { Screen } from '../../../gfx/screen';
import { drawHighScores, drawNewHighScore } from '../../../engine/menus';
import { drawAbout, drawSaveHeading, drawSaveSlots, drawStatus, type InventoryWorld } from '../../../engine/funcKeys';
import type { PlayerLook } from '../../../engine/playerLook';
import { BACKBL, INF_REPEAT } from '../../../engine/world';
import { PATCHES, type ColorName } from '../../../dosPlayer/patchTable';
import { cleanPatches, type PlayerPatches } from '../../../dosPlayer/patchRules';

export interface ZeroScreen {
  id: string;
  title: string;
  /** The F-key that shows it, when the player's patches can turn it off. */
  fkey?: number;
  /** The color selectors its words are drawn in. */
  selects: string[];
  /** Draws it on `screen` (already cleared to color 0) in `pal`. */
  draw(screen: Screen, pal: Uint8Array, look: PlayerLook): void;
}

const SAMPLE_SCORES = [5000, 4200, 3100, 2500, 1800, 1200, 900, 500, 0, 0].map((score, i) => ({
  score,
  name: score ? ['ALEX', 'SAM', 'JO', 'KIM', 'PAT', 'LEE', 'RAY', 'DEE'][i] : '',
}));

const sampleWorld = (pal: Uint8Array): InventoryWorld => ({
  palette: pal,
  bg: [],
  clock: 18 * 95,
  ci: { inv: new Array<number>(10).fill(BACKBL), score: 1200, meter: new Array<number>(40).fill(INF_REPEAT), hitpts: 100, lives: 3 },
});

export const ZERO_SCREENS: ZeroScreen[] = [
  {
    id: 'newHiscore',
    title: 'New high score: the name prompt',
    selects: ['color.select.hsPrompt', 'color.select.hsName'],
    draw: (screen, pal, look) => {
      const blue = drawNewHighScore(screen, look, pal, 1);
      screen.write(136, 120, blue, 'PLAYER ONE');
    },
  },
  {
    id: 'hiscores',
    title: 'High scores, with no high-score picture',
    selects: ['color.select.hsTitle', 'color.select.hsRows'],
    draw: (screen, pal, look) => drawHighScores(screen, look, pal, SAMPLE_SCORES, 1200),
  },
  {
    id: 'help',
    title: 'F1, with no instructions',
    fkey: 1,
    selects: ['color.select.helpNone'],
    draw: (screen, pal, look) => screen.write(40, 80, look.color(pal, 'color.select.helpNone'), look.text('str.help.none')),
  },
  {
    id: 'status',
    title: 'F2: the status screen',
    fkey: 2,
    selects: ['color.select.status'],
    draw: (screen, pal, look) => drawStatus(screen, sampleWorld(pal), look),
  },
  {
    id: 'save',
    title: 'F5: save, with no save picture',
    fkey: 5,
    selects: ['color.select.saveText', 'color.select.saveSlots', 'color.select.saveMarker'],
    draw: (screen, pal, look) => {
      drawSaveHeading(screen, look, pal);
      drawSaveSlots(screen, look, pal, ['CASTLE GATE', 'THE CAVES', '', '', '', '', '', '', '', ''], true);
      // GVertMenu's marker by the first slot
      const w = look.num('border.marker.width');
      screen.boxFill(60, 41, 60 + w, 45, look.color(pal, 'color.select.saveMarker'));
    },
  },
  {
    id: 'about',
    title: 'F10: about Game-Maker',
    fkey: 10,
    selects: ['color.select.aboutFrame', 'color.select.aboutText'],
    draw: (screen, pal, look) => void drawAbout(screen, pal, look),
  },
];

const BY_ID = new Map(PATCHES.map((e) => [e.id, e]));

export interface Matched {
  /** What the selector colors (the customizer's label). */
  label: string;
  /** The target it looks for, and its levels (0 to 63). */
  target: ColorName;
  rgb: [number, number, number];
  /** The palette index RGBdata::Match found. */
  index: number;
}

/** What each of a screen's selectors matches in `pal`, with the project's DOS player patches. */
export function matchedColors(s: ZeroScreen, pal: Uint8Array, look: PlayerLook, patches?: PlayerPatches): Matched[] {
  const set = cleanPatches(patches);
  return s.selects.map((id) => {
    const e = BY_ID.get(id);
    const target = (set[id] ?? (e?.kind === 'select' ? e.stock : 'blue')) as ColorName;
    return { label: e?.label ?? id, target, rgb: look.rgb(`color.rgb.${target}`), index: look.color(pal, id) };
  });
}
