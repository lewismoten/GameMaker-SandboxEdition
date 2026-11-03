// The WebGL view of the phone kit: many parts, each with its own color, drawn with the trinket viewer's
// shiny-plastic shader (trinketGl.ts). A part moves only by its stack's explode offset along the height
// (phoneExplode.ts), so any parts the data brings are drawn and spread with no change here. The view frames
// what is showing and eases to the new frame when the view or the explosion changes. No 3D library.
import { program } from '../trinketGl';
import { shows, type Part, type ViewFilter } from './phoneData';
import { explodeStacks, moved, stackOf } from './phoneExplode';
import { partVertices } from './phoneMesh';

export interface PhoneView {
  yaw: number;
  pitch: number;
  /** 1 fits the view; more magnifies. */
  zoom: number;
  /** Pan in canvas pixels. */
  panX: number;
  panY: number;
  /** 0 assembled, 1 exploded. */
  explode: number;
  filter: ViewFilter;
  /** True: jump to the framing at once (reduced motion). */
  snap: boolean;
  /** Draws a frame; true while the framing is still easing, so the caller keeps drawing. */
  draw(): boolean;
  dispose(): void;
}

interface Drawn {
  first: number;
  count: number;
  group: string;
  stack: string;
  bbox: Part['bbox'];
}

const FOV = (28 * Math.PI) / 180;

/** Sets up the view on `canvas`, or returns undefined when the browser has no WebGL. */
export function createPhoneView(canvas: HTMLCanvasElement, parts: Part[]): PhoneView | undefined {
  const gl = canvas.getContext('webgl', { antialias: true, alpha: true, premultipliedAlpha: false });
  if (!gl) return undefined;
  const prog = program(gl);
  if (!prog) return undefined;

  const stacks = explodeStacks(parts);
  const offset = new Map(stacks.map((s) => [s.key, s.offset]));
  const chunks: Float32Array[] = [];
  const drawn: Drawn[] = [];
  let at = 0;
  for (const p of parts) {
    const v = partVertices(p.positions, p.indices, p.color);
    chunks.push(v);
    drawn.push({ first: at, count: v.length / 9, group: p.group, stack: stackOf(p), bbox: p.bbox });
    at += v.length / 9;
  }
  const data = new Float32Array(at * 9);
  let o = 0;
  for (const c of chunks) {
    data.set(c, o);
    o += c.length;
  }
  const vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  gl.useProgram(prog);
  for (const [name, off] of [
    ['aPos', 0],
    ['aNormal', 12],
    ['aColor', 24],
  ] as const) {
    const loc = gl.getAttribLocation(prog, name);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 3, gl.FLOAT, false, 36, off);
  }
  const uRot = gl.getUniformLocation(prog, 'uRot');
  const uShift = gl.getUniformLocation(prog, 'uShift');
  const uProj = gl.getUniformLocation(prog, 'uProj');

  // the framing: the middle and reach of what shows (in viewer axes), eased toward its target
  const frame = { c: [0, 0, 0], r: 100, fresh: true };

  const view: PhoneView = {
    yaw: 0.6,
    pitch: -0.25,
    zoom: 1,
    panX: 0,
    panY: 0,
    explode: 0,
    filter: 'all',
    snap: false,
    draw() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, w, h);
      gl.clearColor(0, 0, 0, 0);
      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.CULL_FACE);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      const lo = [Infinity, Infinity, Infinity];
      const hi = [-Infinity, -Infinity, -Infinity];
      const lift = (d: Drawn) => moved(offset.get(d.stack) ?? 0, view.explode);
      for (const d of drawn) {
        if (!shows(view.filter, d.group)) continue;
        const dz = lift(d);
        const b = d.bbox;
        // viewer axes: (x, y, z) -> (x, -z, height)
        const min = [b[0], -b[5], b[1] + dz];
        const max = [b[3], -b[2], b[4] + dz];
        for (let k = 0; k < 3; k++) {
          lo[k] = Math.min(lo[k], min[k]);
          hi[k] = Math.max(hi[k], max[k]);
        }
      }
      if (!isFinite(lo[0])) return false;
      const goal = lo.map((v, k) => (v + hi[k]) / 2);
      const reach = Math.hypot(hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]) / 2;
      let easing = false;
      if (view.snap || frame.fresh) {
        frame.c = goal;
        frame.r = reach;
        frame.fresh = false;
      } else {
        const near = goal.every((v, k) => Math.abs(v - frame.c[k]) < 0.05) && Math.abs(reach - frame.r) < 0.05;
        if (near) {
          frame.c = goal;
          frame.r = reach;
        } else {
          frame.c = frame.c.map((v, k) => v + (goal[k] - v) * 0.18);
          frame.r += (reach - frame.r) * 0.18;
          easing = true;
        }
      }
      const dist = (frame.r / Math.sin(FOV / 2)) * 1.04;

      // R = tip(pitch) * turn(yaw), as rows (the data's axes are already turned by phoneMesh.ts)
      const cy = Math.cos(view.yaw);
      const sy = Math.sin(view.yaw);
      const cp = Math.cos(view.pitch);
      const sp = Math.sin(view.pitch);
      const turn = [
        [cy, 0, sy],
        [0, 1, 0],
        [-sy, 0, cy],
      ];
      const m = [turn[0], turn[1].map((v, i) => cp * v - sp * turn[2][i]), turn[1].map((v, i) => sp * v + cp * turn[2][i])];
      gl.uniformMatrix3fv(uRot, false, [m[0][0], m[1][0], m[2][0], m[0][1], m[1][1], m[2][1], m[0][2], m[1][2], m[2][2]]);
      const f = (1 / Math.tan(FOV / 2)) * view.zoom;
      const near = Math.max(dist * 0.05, dist - frame.r * 1.6);
      const far = dist + frame.r * 1.6;
      gl.uniformMatrix4fv(uProj, false, [f / (w / h), 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) / (near - far), -1, 0, 0, (2 * far * near) / (near - far), 0]);
      // a canvas pixel in mm at the middle's depth
      const mmPerPx = (2 * dist * Math.tan(FOV / 2)) / (h * view.zoom);
      const px = view.panX * dpr * mmPerPx;
      const py = -(view.panY * dpr) * mmPerPx;
      let last = '';
      for (const d of drawn) {
        if (!shows(view.filter, d.group)) continue;
        const dz = lift(d);
        const v = [-frame.c[0], -frame.c[1], -frame.c[2] + dz];
        const t = m.map((row) => row[0] * v[0] + row[1] * v[1] + row[2] * v[2]);
        const shift = `${t[0]},${t[1]},${t[2]}`;
        if (shift !== last) {
          gl.uniform3f(uShift, t[0] + px, t[1] + py, t[2] - dist);
          last = shift;
        }
        gl.drawArrays(gl.TRIANGLES, d.first, d.count);
      }
      return easing;
    },
    dispose() {
      gl.deleteBuffer(vbo);
      gl.deleteProgram(prog);
    },
  };
  return view;
}
