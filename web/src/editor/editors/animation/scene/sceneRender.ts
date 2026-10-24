// Draws a scene frame by frame: the background, then each track's items that are on at that
// frame (text by its motion, characters and monsters stepping through their own pictures
// along their path, blocks where they were put), and the fades as palette changes: each
// background fades in from black and out to black, so a change of pictures (and palettes)
// happens in the dark. The
// frames become an .FLI through the shared writer, which stores only what changed.
import { encodeFli } from '../../../../formats/fli';
import type { Palette } from '../../../../formats/palette';
import { SCENE_H, SCENE_W, actorAt, allItems, type Scene } from './sceneModel';
import { drawText, textAt } from './sceneText';
import type { ActorArt, Pic, SceneAssets, Segment } from './sceneAssets';

/** PLAYGAME's clock ticks a second (the 18.2 Hz PC timer) and the FLI's retraces a second. */
const TICKS = 18.2;
const RETRACE = 70;

export interface RenderedScene {
  frames: Uint8Array[];
  palettes: Palette[];
}

/** Draws a picture at (x, y), each pixel `s` square, mirrored left to right when asked. */
export function drawPic(px: Uint8Array, w: number, h: number, pic: Pic, x: number, y: number, s = 1, mirror = false): void {
  for (let py = 0; py < pic.h; py++)
    for (let pxl = 0; pxl < pic.w; pxl++) {
      const v = pic.px[py * pic.w + (mirror ? pic.w - 1 - pxl : pxl)];
      if (v < 0) continue;
      for (let yy = 0; yy < s; yy++) {
        const ty = y + py * s + yy;
        if (ty < 0 || ty >= h) continue;
        for (let xx = 0; xx < s; xx++) {
          const tx = x + pxl * s + xx;
          if (tx >= 0 && tx < w) px[ty * w + tx] = v;
        }
      }
    }
}

/** The actor's picture at frame `f` of its item: its own frames, each for its ticks. */
export function actorFrame(art: ActorArt, f: number, speed: number): Pic {
  const total = art.frames.reduce((n, x) => n + x.ticks, 0);
  let t = ((f * Math.max(1, speed) * TICKS) / RETRACE) % total;
  for (const fr of art.frames) {
    if (t < fr.ticks) return fr.pic;
    t -= fr.ticks;
  }
  return art.frames[art.frames.length - 1].pic;
}

/** Whether a sprite facing `faces` is drawn mirrored while moving `dx` sideways. */
export const mirrored = (faces: 'right' | 'left', dx: number, mirror: boolean): boolean =>
  mirror && ((faces === 'right' && dx < 0) || (faces === 'left' && dx > 0));

/** One frame's pixels. */
export function renderFrame(scene: Scene, assets: SceneAssets, f: number): Uint8Array {
  const seg = segmentAt(assets, f);
  const px = seg.pixels.slice();
  for (const { item } of allItems(scene)) {
    if (f < item.start || f >= item.end) continue;
    const local = f - item.start;
    if (item.kind === 'text') {
      const at = textAt(item, local);
      drawText(px, SCENE_W, SCENE_H, item, at.x, at.y, at.letters);
    } else if (item.kind === 'block') {
      const pic = seg.blocks.get(item.id);
      if (pic) drawPic(px, SCENE_W, SCENE_H, pic, item.x, item.y, item.scale);
    } else {
      const art = seg.actors.get(item.id);
      if (!art) continue;
      const at = actorAt(item.path, local);
      drawPic(px, SCENE_W, SCENE_H, actorFrame(art, local, scene.speed), at.x, at.y, item.scale, mirrored(item.faces, at.dx, item.mirror));
    }
  }
  return px;
}

const segmentAt = (a: SceneAssets, f: number): Segment => a.segments.find((s) => f >= s.start && f < s.end) ?? a.segments[a.segments.length - 1];

/** The palette at frame `f`: its background's, faded in from black at its start and out to black at its end. */
export function framePalette(scene: Scene, assets: SceneAssets, f: number): Palette {
  const seg = segmentAt(assets, f);
  let light = 1;
  const fromStart = f - seg.start;
  const fromEnd = seg.end - 1 - f;
  if (scene.fadeIn > 0 && fromStart < scene.fadeIn) light = (fromStart + 1) / (scene.fadeIn + 1);
  if (scene.fadeOut > 0 && fromEnd < scene.fadeOut) light = Math.min(light, fromEnd / scene.fadeOut);
  return light >= 1 ? seg.palette : seg.palette.map((v) => Math.round(v * light));
}

export function renderScene(scene: Scene, assets: SceneAssets): RenderedScene {
  const frames: Uint8Array[] = [];
  const palettes: Palette[] = [];
  for (let f = 0; f < scene.frames; f++) {
    frames.push(renderFrame(scene, assets, f));
    palettes.push(framePalette(scene, assets, f));
  }
  return { frames, palettes };
}

/** The .FLI PLAYGAME plays: 320x200, the scene's speed, palette changes where the fades are. */
export function sceneFli(scene: Scene, r: RenderedScene): Uint8Array {
  return encodeFli(r.frames, r.palettes[0], { width: SCENE_W, height: SCENE_H, speed: scene.speed, palettes: r.palettes, runs: true });
}
