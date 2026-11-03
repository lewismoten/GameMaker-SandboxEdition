// Software renders of a trinket for a quick look: orthographic, flat-shaded triangles with a z-buffer,
// colored per body, written as PNG. Used by pixelTrinkets.ts for its front, three-quarter and contact sheet.
import { deflateSync } from 'node:zlib';
import type { Mesh } from '@lewismoten/gamemaker-sandbox-tools/mesh/mesh';

export interface Body {
  color: [number, number, number];
  mesh: Mesh;
}
export interface Image {
  w: number;
  h: number;
  rgba: Uint8Array;
}

/** Draw the bodies seen from `yaw` degrees around the up (z) axis and `pitch` degrees above the horizon; 0,0 is the front (looking along +y). */
export function renderBodies(bodies: Body[], yaw: number, pitch: number, w: number, h: number, bg: [number, number, number] = [236, 232, 224]): Image {
  const rgba = new Uint8Array(w * h * 4);
  for (let i = 0; i < w * h; i++) rgba.set([...bg, 255], i * 4);
  const depth = new Float32Array(w * h).fill(Infinity);
  const ya = (yaw * Math.PI) / 180;
  const pa = (pitch * Math.PI) / 180;
  // view space: x right, y up, z away
  const project = (x: number, y: number, z: number): [number, number, number] => {
    const rx = x * Math.cos(ya) - y * Math.sin(ya);
    const ry = x * Math.sin(ya) + y * Math.cos(ya);
    return [rx, z * Math.cos(pa) - ry * Math.sin(pa), ry * Math.cos(pa) + z * Math.sin(pa)];
  };
  let lo = [Infinity, Infinity],
    hi = [-Infinity, -Infinity];
  for (const b of bodies)
    for (let i = 0; i < b.mesh.positions.length; i += 3) {
      const q = project(b.mesh.positions[i], b.mesh.positions[i + 1], b.mesh.positions[i + 2]);
      lo = [Math.min(lo[0], q[0]), Math.min(lo[1], q[1])];
      hi = [Math.max(hi[0], q[0]), Math.max(hi[1], q[1])];
    }
  const scale = Math.min((w * 0.88) / (hi[0] - lo[0]), (h * 0.88) / (hi[1] - lo[1]));
  const ox = w / 2 - ((lo[0] + hi[0]) / 2) * scale;
  const oy = h / 2 + ((lo[1] + hi[1]) / 2) * scale;
  const light = (() => {
    const l = project(-0.4, -0.6, 0.7);
    const m = Math.hypot(...l);
    return l.map((v) => v / m);
  })();
  for (const b of bodies) {
    const { positions: p, indices: ix } = b.mesh;
    for (let t = 0; t < ix.length; t += 3) {
      const v = [0, 1, 2].map((k) => {
        const i = ix[t + k] * 3;
        return project(p[i], p[i + 1], p[i + 2]);
      });
      const n = [
        (v[1][1] - v[0][1]) * (v[2][2] - v[0][2]) - (v[1][2] - v[0][2]) * (v[2][1] - v[0][1]),
        (v[1][2] - v[0][2]) * (v[2][0] - v[0][0]) - (v[1][0] - v[0][0]) * (v[2][2] - v[0][2]),
        (v[1][0] - v[0][0]) * (v[2][1] - v[0][1]) - (v[1][1] - v[0][1]) * (v[2][0] - v[0][0]),
      ];
      // the view is a mirror image of the world (y and z swapped), which flips the cross product
      for (let k = 0; k < 3; k++) n[k] = -n[k];
      const nl = Math.hypot(...n) || 1;
      // the camera looks along +z (away); a face is seen when its normal points toward the camera (-z)
      if (n[2] / nl > -1e-6) continue;
      const shade = 0.45 + 0.55 * Math.max(0, -(n[0] * light[0] + n[1] * light[1] + n[2] * light[2]) / nl) * 0.9 + 0.1;
      const s = v.map((q) => [ox + q[0] * scale, oy - q[1] * scale, q[2]]);
      const minX = Math.max(0, Math.floor(Math.min(s[0][0], s[1][0], s[2][0])));
      const maxX = Math.min(w - 1, Math.ceil(Math.max(s[0][0], s[1][0], s[2][0])));
      const minY = Math.max(0, Math.floor(Math.min(s[0][1], s[1][1], s[2][1])));
      const maxY = Math.min(h - 1, Math.ceil(Math.max(s[0][1], s[1][1], s[2][1])));
      const area = (s[1][0] - s[0][0]) * (s[2][1] - s[0][1]) - (s[2][0] - s[0][0]) * (s[1][1] - s[0][1]);
      if (Math.abs(area) < 1e-9) continue;
      for (let y = minY; y <= maxY; y++)
        for (let x = minX; x <= maxX; x++) {
          const px = x + 0.5,
            py = y + 0.5;
          const w0 = ((s[1][0] - px) * (s[2][1] - py) - (s[2][0] - px) * (s[1][1] - py)) / area;
          const w1 = ((s[2][0] - px) * (s[0][1] - py) - (s[0][0] - px) * (s[2][1] - py)) / area;
          const w2 = 1 - w0 - w1;
          if (w0 < -1e-6 || w1 < -1e-6 || w2 < -1e-6) continue;
          const z = w0 * s[0][2] + w1 * s[1][2] + w2 * s[2][2];
          if (z >= depth[y * w + x]) continue;
          depth[y * w + x] = z;
          rgba.set([...b.color.map((c) => Math.min(255, c * shade)), 255], (y * w + x) * 4);
        }
    }
  }
  return { w, h, rgba };
}

/** Images side by side with a gap. */
export function sheet(images: Image[], gap = 8, bg: [number, number, number] = [236, 232, 224]): Image {
  const h = Math.max(...images.map((i) => i.h));
  const w = images.reduce((n, i) => n + i.w, 0) + gap * (images.length + 1);
  const rgba = new Uint8Array(w * (h + 2 * gap) * 4);
  for (let i = 0; i < rgba.length; i += 4) rgba.set([...bg, 255], i);
  let x = gap;
  for (const im of images) {
    for (let y = 0; y < im.h; y++) rgba.set(im.rgba.subarray(y * im.w * 4, (y + 1) * im.w * 4), ((y + gap) * w + x) * 4);
    x += im.w + gap;
  }
  return { w, h: h + 2 * gap, rgba };
}

const CRC = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc = (b: Uint8Array) => {
  let c = ~0;
  for (const v of b) c = CRC[(c ^ v) & 255] ^ (c >>> 8);
  return ~c >>> 0;
};

/** An 8-bit RGBA PNG. */
export function encodePng(im: Image): Uint8Array {
  const raw = new Uint8Array((im.w * 4 + 1) * im.h);
  for (let y = 0; y < im.h; y++) raw.set(im.rgba.subarray(y * im.w * 4, (y + 1) * im.w * 4), y * (im.w * 4 + 1) + 1);
  const chunk = (type: string, data: Uint8Array) => {
    const out = new Uint8Array(12 + data.length);
    const dv = new DataView(out.buffer);
    dv.setUint32(0, data.length);
    out.set(new TextEncoder().encode(type), 4);
    out.set(data, 8);
    dv.setUint32(8 + data.length, crc(out.subarray(4, 8 + data.length)));
    return out;
  };
  const head = new Uint8Array(13);
  const hv = new DataView(head.buffer);
  hv.setUint32(0, im.w);
  hv.setUint32(4, im.h);
  head.set([8, 6, 0, 0, 0], 8);
  const parts = [new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', head), chunk('IDAT', deflateSync(raw)), chunk('IEND', new Uint8Array(0))];
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.length;
  }
  return out;
}
