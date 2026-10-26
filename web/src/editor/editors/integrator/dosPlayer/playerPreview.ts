// The DOS player panel's previews: one of XFERPLAY's own screens drawn by the web engine's own
// drawing code (engine/menus.ts, engine/funcKeys.ts) with the patches applied, over the game's
// own pictures and palettes, as the player would show it: the menu over the menu picture, the
// high scores over theirs, F2 and the drop picker in the first level's palette, and so on.
import { Screen } from '../../../../gfx/screen';
import type { GameFiles } from '../../../../project/files';
import type { Game } from '../../../../formats/game';
import { decodeGif, isGif } from '../../../../formats/gif';
import { applyFliFrame, isFli, newFliCanvas, parseFli } from '../../../../formats/fli';
import { parseBackdrop, parseSlideList, textLines } from '../../../../formats/graphicScripts';
import { defaultPalette, parsePalette, PALETTE_SIZE } from '../../../../formats/palette';
import { parseHighScores } from '../../../../formats/highscore';
import { drawDefaultScreen, drawHighScores, drawMenu, drawNewHighScore, drawNoFile, menuMarker } from '../../../../engine/menus';
import { drawAbout, drawDropPicker, drawLoadHeading, drawSaveHeading, drawSaveSlots, drawStatus, type InventoryWorld } from '../../../../engine/funcKeys';
import { BACKBL } from '../../../../engine/world';
import type { PlayerLook } from '../../../../engine/playerLook';
import type { PatchScreen } from '../../../../dosPlayer/patchTable';
import { mulberry32 } from '../../../../seededRandom';

/** The screens a preview can show (every patch's screen but 'all' and 'play'). */
export type PreviewScreen = Exclude<PatchScreen, 'all' | 'play'>;

const slot = (game: Game, scene: number, i: number) => game.scenes[scene]?.files[i] || undefined;

/** Draws a picture file (.gif, .bkd, .fli's frames, a .lst's first) and returns its palette, or undefined. */
function drawPicture(screen: Screen, files: GameFiles, name: string | undefined, depth = 0): Uint8Array | undefined {
  if (!name || depth > 3) return undefined;
  const bytes = files.get(name);
  if (!bytes) return undefined;
  const ext = name.toLowerCase().replace(/^.*\./, '');
  try {
    if (ext === 'gif' && isGif(bytes)) {
      const img = decodeGif(bytes);
      screen.drawImage(img.pixels, img.width, img.height, 0, 0);
      return img.palette.slice(0, PALETTE_SIZE);
    }
    if (ext === 'bkd') {
      const b = parseBackdrop(bytes);
      const gif = files.get(b.gif);
      if (!gif || !isGif(gif)) return undefined;
      const img = decodeGif(gif);
      screen.drawImage(img.pixels, img.width, img.height, b.x, b.y);
      return img.palette.slice(0, PALETTE_SIZE);
    }
    if (ext === 'fli' && isFli(bytes)) {
      const anim = parseFli(bytes);
      const canvas = newFliCanvas(anim);
      for (let f = 0; f < anim.frameCount; f++) applyFliFrame(anim, f, canvas);
      screen.drawImage(canvas.pixels, anim.width, anim.height);
      return canvas.palette.slice();
    }
    if (ext === 'lst') return drawPicture(screen, files, parseSlideList(bytes)[0]?.name, depth + 1);
  } catch {
    /* a damaged picture: the screen stays black */
  }
  return undefined;
}

/** The first level's palette (the one F2, the drop picker and load/save without a picture match against). */
function levelPalette(files: GameFiles, game: Game): Uint8Array {
  const first = game.scenes[0]?.links[0]?.toScene;
  const pal = first === undefined ? undefined : files.get(slot(game, first, 0) ?? '');
  try {
    if (pal) return parsePalette(pal);
  } catch {
    /* fall through */
  }
  return defaultPalette();
}

/** The menu screen: its picture (scene 0 slot 2), else DrawDefaultScrn's random frames (the same ones each time here). */
function menuBack(screen: Screen, files: GameFiles, game: Game): Uint8Array {
  const pal = drawPicture(screen, files, slot(game, 0, 2));
  if (pal) return pal;
  const colors = new Uint8Array(PALETTE_SIZE);
  drawDefaultScreen({ screen }, colors, mulberry32(1994));
  return colors;
}

const SAMPLE_WORLD = (palette: Uint8Array): InventoryWorld => ({
  palette,
  bg: [],
  clock: 18 * 95,
  ci: { inv: new Array(10).fill(BACKBL), score: 1250, meter: [0, 0, 0, 26], hitpts: 9, lives: 3 },
});

const SAMPLE_SLOTS = ['Before the bridge', 'Second level', '', '', '', '', '', '', '', ''];

/** A patch of the menu's "No game-specific ..." line (shown in the menu preview only while one is edited). */
const NO_FILE = /noInstructions|noStoryline|noCredits|noFile|menuMessages/;

/** Draws `which` with `look` into `screen` and shows it; `focused` is the patch being edited. */
export function drawPreview(screen: Screen, files: GameFiles, game: Game, gameName: string, look: PlayerLook, which: PreviewScreen, focused = ''): void {
  screen.setPalette(new Uint8Array(PALETTE_SIZE));
  screen.clear(0);
  let pal: Uint8Array;
  const marker = (x: number, y: number, col: number) => screen.boxFill(x, y, x + look.num('border.marker.width'), y + 4, col);
  switch (which) {
    case 'menu':
    case 'text': {
      pal = menuBack(screen, files, game);
      if (which === 'menu') {
        const col = drawMenu(screen, look, pal, game.scenes[0]?.desc ?? '');
        const m = menuMarker(look);
        marker(m.x, m.y, col);
        if (NO_FILE.test(focused))
          drawNoFile(screen, look, pal, focused.includes('Storyline') ? 'noStoryline' : focused.includes('Credits') ? 'noCredits' : 'noInstructions');
      } else {
        // a text page over the menu picture: the instructions' first page, then MORE...
        const instr = slot(game, 0, 6);
        const bytes = instr?.toLowerCase().endsWith('.txt') ? files.get(instr) : undefined;
        const lines = bytes ? textLines(bytes) : ['These are the instructions,', 'one line after another, in the', 'text pages color.'];
        const col = look.color(pal, 'color.select.textPages');
        lines.slice(0, 16).forEach((l, i) => screen.write(40, (5 + i) * 8, col, l));
        screen.write(224, 168, look.color(pal, 'color.select.textMissing'), look.text('str.text.more'));
      }
      break;
    }
    case 'hiscores': {
      pal = drawPicture(screen, files, slot(game, 0, 8)) ?? menuBack(screen, files, game);
      const his = files.get(`${gameName}.his`);
      let top = his ? parseHighScores(his) : [];
      if (!top.some((t) => t.score))
        top = [5000, 3200, 1800, 900, 450, 0, 0, 0, 0, 0].map((score, i) => ({
          score,
          name: score ? ['Doc Leo', 'Teddy', 'Gwinn', 'A player', 'Another'][i] : '',
        }));
      drawHighScores(screen, look, pal, top, 1250);
      break;
    }
    case 'newHiscore': {
      pal = levelPalette(files, game);
      const col = drawNewHighScore(screen, look, pal, 3);
      screen.write(136, 120, col, 'Teddy');
      break;
    }
    case 'status':
    case 'drop':
    case 'help':
    case 'about':
      pal = levelPalette(files, game);
      if (which === 'status') drawStatus(screen, SAMPLE_WORLD(pal), look);
      else if (which === 'drop') drawDropPicker(screen, SAMPLE_WORLD(pal), look);
      else if (which === 'about') drawAbout(screen, pal, look);
      else screen.write(40, 80, look.color(pal, 'color.select.helpNone'), look.text('str.help.none'));
      break;
    case 'load':
    case 'save': {
      const saving = which === 'save';
      const picture = drawPicture(screen, files, slot(game, 0, saving ? 10 : 9));
      pal = picture ?? levelPalette(files, game);
      if (!picture) (saving ? drawSaveHeading : drawLoadHeading)(screen, look, pal);
      drawSaveSlots(screen, look, pal, SAMPLE_SLOTS, saving);
      marker(60, 35, look.color(pal, saving ? 'color.select.saveMarker' : 'color.select.loadMarker'));
      const msg = look.color(
        pal,
        saving ? (picture ? 'color.select.saveTextPic' : 'color.select.saveText') : picture ? 'color.select.loadTextPic' : 'color.select.loadText',
      );
      if (saving) screen.write(112, 185, msg, look.text('str.save.done'));
      else screen.write(88, 185, msg, look.text('str.load.done'));
      break;
    }
    case 'missing': {
      pal = new Uint8Array(PALETTE_SIZE);
      for (let n = 1; n <= 4; n++) pal.set(look.rgb(`color.missing.${n}`), n * 3);
      const [a, b, c, d] = look.frame('border.missing.outer');
      const [e, f, g, h] = look.frame('border.missing.inner');
      screen.box(a, b, c, d, 4);
      screen.box(e, f, g, h, 4);
      screen.write(40, 20, 1, look.text('str.missing.title'));
      ['LEVEL2.MAP', 'LEVEL2.BBL'].forEach((n, i) => screen.write(32, (9 + i) * 8, 2, n));
      screen.write(120, 168, 3, look.text('str.missing.anyKey'));
      break;
    }
  }
  screen.setPalette(pal);
  screen.present();
}
