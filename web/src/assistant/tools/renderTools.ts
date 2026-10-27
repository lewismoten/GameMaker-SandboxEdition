// The render tool: a part of the game as a PNG the model can look at (an MCP image block). Map
// regions, block sheets, a monster's or the hero's frame, the title and menu screens and any
// picture are drawn as the game draws them (gfx/levelPicture.ts, gfx/titlePicture.ts, the
// engine's drawMenu), with no canvas.
import { ADVTYPE, type Game } from '../../formats/game';
import { BLEN, BLOCK_COUNTS, CHARBL, TRANSPARENT, orientIndex, parseBlocks, type BlockKind } from '../../formats/blocks';
import { parseMonsters, LASTMON } from '../../formats/monster';
import { parseCharacter, MAXSEQ, MAXFRAME } from '../../formats/character';
import { normalize } from '../../project/files';
import { scenePixels } from '../../gfx/levelPicture';
import { defaultPalette, serializePalette } from '../../formats/palette';
import { graphicPixels, titlePixels } from '../../gfx/titlePicture';
import { Screen } from '../../gfx/screen';
import { drawMenu } from '../../engine/menus';
import { playerLook } from '../../engine/playerLook';
import { base64, encodePng, type IndexedPicture } from '../png';
import { FILE, SCENE, clampInt, fileName, gameOf, int, need, paletteFor, sceneOf } from './common';
import { ToolError, type GameContext, type ToolDef, type ToolResult } from './types';

/** Stands in for a level's missing palette. */
const NO_PAL = '\0default.pal';
const W = 320;
const H = 200;

/** A Screen with no page behind it (the engine's drawing, for the menu's words). */
function offscreen(): Screen {
  const ctx = { createImageData: (w: number, h: number) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }), putImageData: () => undefined };
  return new Screen({ width: W, height: H, getContext: () => ctx } as unknown as HTMLCanvasElement);
}

/** The first level scene whose slot holds this file. */
function sceneUsing(game: Game, slot: number, file: string) {
  const n = normalize(file);
  return game.scenes.find((s) => s.gametype === ADVTYPE && s.files[slot] && normalize(s.files[slot]) === n);
}

function blockSheet(ctx: GameContext, file: string): IndexedPicture {
  const kind = file.slice(-3) as BlockKind;
  if (!(kind in BLOCK_COUNTS)) throw new ToolError(`${file} is not a block set.`);
  const blocks = parseBlocks(need(ctx, file), BLOCK_COUNTS[kind]);
  const cols = 10;
  const cell = BLEN + 2;
  const rows = Math.ceil(blocks.length / cols);
  const width = cols * cell;
  const pixels = new Uint8Array(width * rows * cell);
  blocks.forEach((b, i) => {
    const ox = (i % cols) * cell + 1;
    const oy = Math.floor(i / cols) * cell + 1;
    for (let y = 0; y < BLEN; y++) for (let x = 0; x < BLEN; x++) pixels[(oy + y) * width + ox + x] = b.pixels[y * BLEN + x];
  });
  return { width, height: rows * cell, pixels, palette: paletteFor(ctx, file) };
}

/** One sprite block, or two stacked (the hero's top and bottom), each turned by its orientation. */
function sprite(parts: { px: Uint8Array | undefined; orient: number }[], palette: Uint8Array): IndexedPicture {
  const pixels = new Uint8Array(BLEN * BLEN * parts.length);
  parts.forEach(({ px, orient }, p) => {
    for (let y = 0; y < BLEN; y++)
      for (let x = 0; x < BLEN; x++) {
        const c = px ? px[orientIndex(orient, x, y)] : TRANSPARENT;
        pixels[(p * BLEN + y) * BLEN + x] = c === TRANSPARENT ? 0 : c;
      }
  });
  return { width: BLEN, height: BLEN * parts.length, pixels, palette };
}

function monsterFrame(ctx: GameContext, game: Game, file: string, index: number, frame: number): IndexedPicture {
  const m = parseMonsters(need(ctx, file, 'mon'))[index];
  const scene = sceneUsing(game, 3, file);
  if (!scene?.files[4]) throw new ToolError(`No level uses ${file} with a monster block set, so its pictures are unknown.`);
  const blocks = parseBlocks(need(ctx, scene.files[4]), BLOCK_COUNTS.mbl);
  const frames = m.pic.filter(([b]) => b < 100);
  const pic = frames[Math.min(frame, frames.length - 1)];
  if (!pic) throw new ToolError(`Monster ${index} has no animation frames.`);
  const orient = m.march[0][0]?.orient ?? 0;
  return sprite([{ px: blocks[pic[0]]?.pixels, orient }], paletteFor(ctx, scene.files[4]));
}

function heroFrame(ctx: GameContext, game: Game, file: string, seq: number, frame: number): IndexedPicture {
  const c = parseCharacter(need(ctx, file, 'chr'));
  const scene = sceneUsing(game, 5, file);
  if (!scene?.files[6]) throw new ToolError(`No level uses ${file} with a character block set, so its pictures are unknown.`);
  const blocks = parseBlocks(need(ctx, scene.files[6]), BLOCK_COUNTS.cbl);
  const f = c.sequences[seq].frames[frame];
  const px = (n: number) => (n < CHARBL ? blocks[n]?.pixels : undefined);
  return sprite(
    [
      { px: px(f.pic1), orient: f.orient & 15 },
      { px: px(f.pic2), orient: f.orient >> 4 },
    ],
    paletteFor(ctx, scene.files[6]),
  );
}

function menuScreen(ctx: GameContext, game: Game): IndexedPicture {
  const menu = game.scenes[0]?.files[2];
  const back = menu ? graphicPixels(ctx.files, menu) : undefined;
  const screen = offscreen();
  if (back) (screen.pixels.set(back.pixels), screen.setPalette(back.palette));
  const colors = back?.palette ?? screen.palette.slice();
  drawMenu(screen, playerLook(ctx.playerPatches()), colors, game.scenes[0].desc);
  return { width: W, height: H, pixels: screen.pixels.slice(), palette: colors };
}

async function picture(a: Record<string, unknown>, ctx: GameContext): Promise<IndexedPicture> {
  const game = gameOf(ctx);
  switch (a.what) {
    case 'map': {
      const w = clampInt(a.width, 1, 50, 16);
      const h = clampInt(a.height, 1, 50, 10);
      const x = clampInt(a.x, 0, 99, 0);
      const y = clampInt(a.y, 0, 99, 0);
      const scene = typeof a.scene === 'number' ? sceneOf(game, a.scene) : sceneUsing(game, 1, fileName(a.file, 'map'));
      // a level with no palette yet is drawn in the default one, as the editor shows it
      const pal = scene && !scene.files[0] ? { ...scene, files: scene.files.map((f, i) => (i ? f : NO_PAL)) } : scene;
      const files = { get: (n: string) => (n === NO_PAL ? serializePalette(defaultPalette()) : ctx.files.get(n)) };
      const pic = pal && scenePixels(files, pal, x, y, w, h);
      if (!pic) throw new ToolError('That map can’t be drawn: give a level scene (or a map a level uses) with its palette, map and blocks.');
      return pic;
    }
    case 'blocks':
      return blockSheet(ctx, fileName(a.file));
    case 'monster':
      return monsterFrame(ctx, game, fileName(a.file, 'mon'), clampInt(a.index, 0, LASTMON - 1, 0), clampInt(a.frame, 0, 20, 0));
    case 'character':
      return heroFrame(ctx, game, fileName(a.file, 'chr'), clampInt(a.index, 0, MAXSEQ - 1, 0), clampInt(a.frame, 0, MAXFRAME - 1, 0));
    case 'title': {
      const pic = titlePixels(ctx.files, game);
      if (!pic) throw new ToolError('The game has no title or menu picture.');
      return pic;
    }
    case 'menu':
      return menuScreen(ctx, game);
    case 'picture': {
      const pic = graphicPixels(ctx.files, fileName(a.file));
      if (!pic) throw new ToolError(`${fileName(a.file)} has no picture to show (a .txt draws over the screen before it).`);
      return pic;
    }
  }
  throw new ToolError('what must be map, blocks, monster, character, title, menu or picture.');
}

/** A picture as a tool result: the PNG and a line saying what it is. */
export async function imageResult(pic: IndexedPicture, scale: number, caption: string): Promise<ToolResult> {
  const png = await encodePng(pic, scale);
  return {
    content: [
      { type: 'image', data: base64(png), mimeType: 'image/png' },
      { type: 'text', text: `${caption} (${pic.width * scale} x ${pic.height * scale} pixels)` },
    ],
  };
}

const render: ToolDef = {
  name: 'render_png',
  description:
    'Draws part of the game as a PNG: map (a region, by scene or map file), blocks (a block set sheet, 10 a row), monster or character (one frame), title, menu or picture (a .gif/.bkd/.lst/.fli).',
  inputSchema: {
    type: 'object',
    properties: {
      what: { type: 'string', enum: ['map', 'blocks', 'monster', 'character', 'title', 'menu', 'picture'] },
      file: FILE,
      scene: SCENE,
      x: int('Map: left column.', 0, 99),
      y: int('Map: top row.', 0, 99),
      width: int('Map: columns (default 16, at most 50).', 1, 50),
      height: int('Map: rows (default 10, at most 50).', 1, 50),
      index: int('Monster number, or the hero’s sequence.', 0, 63),
      frame: int('Animation frame (default 0).', 0, 20),
      scale: int('Pixel size (1-4, default 2; maps 1).', 1, 4),
    },
    required: ['what'],
  },
  async run(a, ctx) {
    const pic = await picture(a, ctx);
    const scale = clampInt(a.scale, 1, 4, a.what === 'map' || a.what === 'title' || a.what === 'menu' || a.what === 'picture' ? 1 : 2);
    return imageResult(
      pic,
      scale,
      `${String(a.what)}${typeof a.file === 'string' ? ` of ${a.file}` : ''}${typeof a.scene === 'number' ? ` in scene ${a.scene}` : ''}`,
    );
  },
};

export const RENDER_TOOLS: ToolDef[] = [render];
