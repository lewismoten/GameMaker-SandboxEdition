// Sprites rendered from 3D models: the same oblique camera and key light as the blocks, on
// nothing (Game-Maker draws sprites over the map with color 255 left clear), with the shadow
// the model casts on the floor kept as a dithered half-tone, so it reads as see-through.
import { oblique } from '../render/image';
import { HitRec, Sampler, clamp01, intersect, norm, shadeHit, type Shape, type V, type World } from '../render/tracer';
import { KEY_DIR } from '../tiles/cells';
import { studio } from '../render/look';
import { rgb } from '../render/tracer';

/** Sprite shadows fall short (a high light), so they stay under what casts them. */
const SHADOW_DIR = norm([-0.3, -0.18, 1]);

export interface SpritePic {
  /** 20x20 linear RGB, coverage and shadow (0..1 each). */
  rgb: Float32Array;
  alpha: Float32Array;
  shadow: Float32Array;
}

export interface SpriteLook {
  /** A light of its own (the shot, glows). */
  keyColor?: V;
  sky?: V;
  ground?: V;
  /** Drop the floor shadow (things in the air). */
  noShadow?: boolean;
  /** Brighten everything (hurt flash). */
  flash?: number;
  /** Render into a bigger picture (story screens) instead of 20x20. */
  size?: number;
}

export function spriteWorld(shapes: Shape[], look: SpriteLook = {}): World {
  return {
    shapes,
    key: { dir: KEY_DIR, color: look.keyColor ?? rgb(255, 246, 232), soft: 0.05 },
    sky: look.sky ?? rgb(96, 100, 140),
    ground: look.ground ?? rgb(60, 52, 70),
    env: (d) => studio(d, { top: rgb(150, 170, 235), horizon: rgb(255, 230, 210), floor: rgb(90, 80, 100) }),
    maxDepth: 3,
  };
}

/** Renders a model standing in a 20x20 cell (its floor at z = 0). */
export function renderSprite(shapes: Shape[], look: SpriteLook = {}): SpritePic {
  const size = look.size ?? 20;
  const world = spriteWorld(shapes, look);
  const cam = oblique(0, 0, size);
  const n = size * size;
  const out: SpritePic = { rgb: new Float32Array(n * 3), alpha: new Float32Array(n), shadow: new Float32Array(n) };
  const h = new HitRec();
  const spp = 16;
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const rs = new Sampler((x * 7919 + y * 104729 + 17) >>> 0);
      const acc: V = [0, 0, 0];
      let cover = 0;
      let shade = 0;
      for (let s = 0; s < spp; s++) {
        const sx = x + ((s & 3) + rs.next()) / 4;
        const sy = y + ((s >> 2) + rs.next()) / 4;
        const [o, d] = cam.ray(sx, sy, 0, 0);
        if (intersect(world, o, d, h)) {
          const c = shadeHit(world, o, d, h, rs, 0);
          acc[0] += c[0];
          acc[1] += c[1];
          acc[2] += c[2];
          cover++;
        } else if (!look.noShadow && d[2] < 0) {
          const t = -o[2] / d[2];
          const p: V = [o[0] + d[0] * t, o[1] + d[1] * t, 0.001];
          const hh = new HitRec();
          if (intersect(world, p, SHADOW_DIR, hh)) shade++;
        }
      }
      const i = y * size + x;
      out.alpha[i] = cover / spp;
      out.shadow[i] = clamp01(shade / spp);
      const f = look.flash ?? 0;
      for (let c = 0; c < 3; c++) out.rgb[i * 3 + c] = cover ? (acc[c] / cover) * (1 - f) + f * 1.2 : 0;
    }
  return out;
}
