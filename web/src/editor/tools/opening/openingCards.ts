// The cards of a new game's opening: the "Made with Game-Maker: Sandbox Edition" sting
// (made once by games/kit/madewith.ts and shipped in public/opening/, as an animation or a
// still picture) and the "<name> PRESENTS" card, drawn here with the Scene maker's renderer
// in the sting's colors: the name in gold over a navy sky with the icon's faint block grid,
// fitted inside 320x200 the Scene maker's way (wrapped, then smaller).
import { encodeGif } from '../../../formats/gif';
import type { Palette } from '../../../formats/palette';
import { SCENE_H, SCENE_W, emptyScene, textItem, type Scene, type TextItem } from '../../editors/animation/scene/sceneModel';
import { fitText, textSize } from '../../editors/animation/scene/sceneText';
import { renderFrame, renderScene, sceneFli } from '../../editors/animation/scene/sceneRender';
import type { SceneAssets } from '../../editors/animation/scene/sceneAssets';
import type { Scene as GameScene } from '../../../formats/game';
import { PRESENTS_STEM, STILL_SECONDS, STING_STEM, addOpening, removeOpening, type OpeningCard, type OpeningProject, type OpeningStyle } from './openingWire';

// The card's palette: black, a navy ramp for the sky, gold, white and a dark outline.
const RAMP = 48;
const GOLD = 60;
const WHITE = 61;
const INK = 62;
const GRID = 64; // the ramp again, a little lighter, for the block lines

function cardPalette(): Palette {
  const p = new Uint8Array(768);
  for (let i = 0; i < RAMP; i++) {
    const t = i / (RAMP - 1);
    // #00002a at the top to the icon's #1d3fbf at the bottom (6-bit)
    const c = [Math.round(7 * t), Math.round(15 * t), Math.round(10 + 37 * t)];
    p.set(c, (1 + i) * 3);
    p.set([Math.min(63, c[0] + 4), Math.min(63, c[1] + 6), Math.min(63, c[2] + 8)], (GRID + i) * 3);
  }
  p.set([63, 53, 0], GOLD * 3); // #ffd400
  p.set([63, 63, 63], WHITE * 3);
  p.set([0, 0, 6], INK * 3);
  return p;
}

/** The sky behind the card: the navy ramp top to bottom, with 20x20 block lines. */
function cardBackground(): Uint8Array {
  const px = new Uint8Array(SCENE_W * SCENE_H);
  for (let y = 0; y < SCENE_H; y++) {
    const r = Math.min(RAMP - 1, Math.floor((y * RAMP) / SCENE_H));
    for (let x = 0; x < SCENE_W; x++) px[y * SCENE_W + x] = (x % 20 === 0 || y % 20 === 0 ? GRID : 1) + r;
  }
  return px;
}

const MARGIN = 12;
const GAP = 10;

/** The name and PRESENTS, fitted and centered together inside the frame. */
export function presentsText(name: string): { name: TextItem; presents: TextItem } {
  const presents = textItem('PRESENTS', { x: SCENE_W / 2, scale: 2, color: WHITE, outline: INK, motion: 'type', rate: 1, start: 10 });
  let item = textItem(name.trim(), { x: SCENE_W / 2, y: 0, scale: 3, color: GOLD, outline: INK, motion: 'slide-down', rate: 10 });
  for (let scale = 3; scale >= 1; scale--) {
    item = fitText({ ...item, text: name.trim(), scale }, MARGIN);
    if (textSize(item).h + GAP + textSize(presents).h <= SCENE_H - 2 * MARGIN) break;
  }
  const total = textSize(item).h + GAP + textSize(presents).h;
  const top = Math.max(MARGIN, Math.round((SCENE_H - total) / 2));
  return { name: { ...item, y: top }, presents: { ...presents, y: top + textSize(item).h + GAP } };
}

/** The card as a scene: about three seconds, fading in and out like the sting. */
export function presentsScene(name: string): Scene {
  const s = emptyScene();
  s.frames = 40;
  s.speed = 6;
  s.fadeIn = 6;
  s.fadeOut = 6;
  const t = presentsText(name);
  s.tracks.push({
    name: 'Card',
    items: [
      { ...t.name, end: s.frames },
      { ...t.presents, end: s.frames },
    ],
  });
  return s;
}

function cardAssets(scene: Scene): SceneAssets {
  return {
    segments: [{ start: 0, end: scene.frames, pixels: cardBackground(), palette: cardPalette(), actors: new Map(), blocks: new Map() }],
    problems: [],
  };
}

/** PRESENTS.FLI, or PRESENTS.GIF (the card at rest) for a still opening. */
export function presentsCard(name: string, still: boolean): OpeningCard {
  const scene = presentsScene(name);
  const assets = cardAssets(scene);
  if (!still) return { name: `${PRESENTS_STEM}.fli`, bytes: sceneFli(scene, renderScene(scene, assets)), pause: 0 };
  const px = renderFrame(scene, assets, scene.frames - scene.fadeOut - 1);
  return { name: `${PRESENTS_STEM}.gif`, bytes: encodeGif({ width: SCENE_W, height: SCENE_H, pixels: px, palette: cardPalette() }), pause: STILL_SECONDS };
}

/** The sting's file for a style, as the site ships it. */
export const stingFile = (style: OpeningStyle): string | undefined =>
  style === 'animation' ? `${STING_STEM}.fli` : style === 'still' ? `${STING_STEM}.gif` : undefined;

/** The cards for a style and name, given the sting's bytes (fetched by the caller). */
export function openingCards(style: OpeningStyle, name: string, sting: Uint8Array | undefined): OpeningCard[] {
  const out: OpeningCard[] = [];
  const file = stingFile(style);
  if (file && sting) out.push({ name: file, bytes: sting, pause: style === 'still' ? STILL_SECONDS : 0 });
  if (name.trim()) out.push(presentsCard(name, style === 'still'));
  return out;
}

/** Fetches the shipped sting (undefined when it cannot be had, e.g. offline before it was cached). */
export async function fetchSting(style: OpeningStyle): Promise<Uint8Array | undefined> {
  const file = stingFile(style);
  if (!file) return undefined;
  try {
    const res = await fetch(new URL(`opening/${file}`, document.baseURI));
    return res.ok ? new Uint8Array(await res.arrayBuffer()) : undefined;
  } catch {
    return undefined;
  }
}

/** Replaces the game's opening with this one (none when the style is 'none' and no name is given). Says whether the sting could not be had. */
export async function applyOpening(p: OpeningProject, start: GameScene, scenes: GameScene[], style: OpeningStyle, name: string): Promise<{ noSting: boolean }> {
  const sting = await fetchSting(style);
  removeOpening(p, start, scenes);
  addOpening(p, start, openingCards(style, name, sting), style, name.trim());
  return { noSting: !!stingFile(style) && !sting };
}
