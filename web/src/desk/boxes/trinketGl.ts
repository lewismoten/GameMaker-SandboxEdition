// A small WebGL viewer for a plastic trinket (trinketShelf.ts): one indexed triangle mesh
// (an STL read by the tools package), drawn as shiny plastic in the colors the file carries, with
// smooth normals, two lights, a fake sky reflection and a rim. No 3D library: this is the whole
// renderer. The model is z up and faces +y; `yaw` turns it about the upright axis, `pitch` tips
// it toward the viewer.
import type { Mesh } from '@lewismoten/gamemaker-sandbox-tools/mesh/mesh';

export interface TrinketView {
  yaw: number;
  pitch: number;
  /** Draws the trinket at its current angles (resizes to the canvas first). */
  draw(): void;
  dispose(): void;
}

const VERT = `
attribute vec3 aPos;
attribute vec3 aNormal;
attribute vec3 aColor;
uniform mat3 uRot;
uniform vec3 uShift;
uniform mat4 uProj;
varying vec3 vN;
varying vec3 vP;
varying vec3 vC;
void main() {
  vP = uRot * aPos + uShift;
  vN = uRot * aNormal;
  vC = aColor;
  gl_Position = uProj * vec4(vP, 1.0);
}`;

const FRAG = `
precision mediump float;
varying vec3 vN;
varying vec3 vP;
varying vec3 vC;
void main() {
  vec3 n = normalize(vN);
  vec3 v = normalize(-vP);
  vec3 key = normalize(vec3(-0.45, 0.65, 0.65));
  vec3 fill = normalize(vec3(0.7, 0.1, 0.5));
  vec3 albedo = pow(vC, vec3(2.2));
  float up = n.y * 0.5 + 0.5;
  vec3 ambient = mix(vec3(0.16, 0.14, 0.2), vec3(0.5, 0.55, 0.65), up);
  float dk = max(dot(n, key), 0.0);
  float df = max(dot(n, fill), 0.0);
  vec3 lit = albedo * (ambient + dk * vec3(1.0, 0.96, 0.9) * 0.85 + df * vec3(0.5, 0.6, 0.8) * 0.3);
  // glossy plastic: a tight highlight, a broad sheen, a sky reflection at grazing angles
  float s1 = pow(max(dot(n, normalize(key + v)), 0.0), 70.0);
  float s2 = pow(max(dot(n, normalize(fill + v)), 0.0), 30.0) * 0.25;
  float fres = pow(1.0 - max(dot(n, v), 0.0), 3.0);
  vec3 sky = mix(vec3(0.2, 0.2, 0.28), vec3(0.85, 0.92, 1.0), up);
  vec3 col = lit + vec3(1.0) * (s1 * 0.9 + s2) + sky * fres * 0.4;
  gl_FragColor = vec4(pow(col, vec3(1.0 / 2.2)), 1.0);
}`;

/** Smooth per-vertex normals (area weighted) and per-vertex colors (the mean of the triangles around). */
function vertexData(mesh: Mesh): Float32Array {
  const { positions: p, indices: ix, colors } = mesh;
  const n = p.length / 3;
  const data = new Float32Array(n * 9);
  const count = new Float32Array(n);
  for (let t = 0; t < ix.length; t += 3) {
    const a = ix[t] * 3;
    const b = ix[t + 1] * 3;
    const c = ix[t + 2] * 3;
    const ux = p[b] - p[a];
    const uy = p[b + 1] - p[a + 1];
    const uz = p[b + 2] - p[a + 2];
    const wx = p[c] - p[a];
    const wy = p[c + 1] - p[a + 1];
    const wz = p[c + 2] - p[a + 2];
    const nx = uy * wz - uz * wy;
    const ny = uz * wx - ux * wz;
    const nz = ux * wy - uy * wx;
    for (let k = 0; k < 3; k++) {
      const v = ix[t + k];
      data[v * 9 + 3] += nx;
      data[v * 9 + 4] += ny;
      data[v * 9 + 5] += nz;
      for (let ch = 0; ch < 3; ch++) data[v * 9 + 6 + ch] += colors ? colors[(t / 3) * 3 + ch] / 255 : 0.85;
      count[v]++;
    }
  }
  for (let v = 0; v < n; v++) {
    data[v * 9] = p[v * 3];
    data[v * 9 + 1] = p[v * 3 + 1];
    data[v * 9 + 2] = p[v * 3 + 2];
    const l = Math.hypot(data[v * 9 + 3], data[v * 9 + 4], data[v * 9 + 5]) || 1;
    for (let k = 3; k < 6; k++) data[v * 9 + k] /= l;
    for (let k = 6; k < 9; k++) data[v * 9 + k] /= count[v] || 1;
  }
  return data;
}

function program(gl: WebGLRenderingContext): WebGLProgram | undefined {
  const compile = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : undefined;
  };
  const vs = compile(gl.VERTEX_SHADER, VERT);
  const fs = compile(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return undefined;
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  return gl.getProgramParameter(prog, gl.LINK_STATUS) ? prog : undefined;
}

/** Sets up a viewer on `canvas`, or returns undefined when the browser has no WebGL for it. */
export function createTrinketView(canvas: HTMLCanvasElement, mesh: Mesh): TrinketView | undefined {
  const gl = canvas.getContext('webgl', { antialias: true, alpha: true, premultipliedAlpha: false, preserveDrawingBuffer: false });
  if (!gl || !gl.getExtension('OES_element_index_uint')) return undefined;
  const prog = program(gl);
  if (!prog) return undefined;
  const vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, vertexData(mesh), gl.STATIC_DRAW);
  const ibo = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indices, gl.STATIC_DRAW);
  gl.useProgram(prog);
  for (const [name, offset] of [
    ['aPos', 0],
    ['aNormal', 12],
    ['aColor', 24],
  ] as const) {
    const at = gl.getAttribLocation(prog, name);
    gl.enableVertexAttribArray(at);
    gl.vertexAttribPointer(at, 3, gl.FLOAT, false, 36, offset);
  }
  const uRot = gl.getUniformLocation(prog, 'uRot');
  const uShift = gl.getUniformLocation(prog, 'uShift');
  const uProj = gl.getUniformLocation(prog, 'uProj');

  // the middle of the model and how far round it reaches
  const lo = [Infinity, Infinity, Infinity];
  const hi = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < mesh.positions.length; i++) {
    lo[i % 3] = Math.min(lo[i % 3], mesh.positions[i]);
    hi[i % 3] = Math.max(hi[i % 3], mesh.positions[i]);
  }
  const c = lo.map((v, i) => (v + hi[i]) / 2);
  const radius = Math.hypot(hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]) / 2;
  const fov = (28 * Math.PI) / 180;
  const dist = (radius / Math.sin(fov / 2)) * 1.02;

  const view: TrinketView = {
    yaw: 0.6,
    pitch: 0.28,
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
      // R = tip(pitch) * basis * turn(yaw), as rows. The basis stands the model's z up and puts its +y face toward the
      // viewer: (x, y, z) -> (-x, z, y).
      const cy = Math.cos(view.yaw);
      const sy = Math.sin(view.yaw);
      const cp = Math.cos(view.pitch);
      const sp = Math.sin(view.pitch);
      const row0 = [-cy, sy, 0];
      const row1 = [0, 0, 1];
      const row2 = [sy, cy, 0];
      const m = [row0, row1.map((v, i) => cp * v - sp * row2[i]), row1.map((v, i) => sp * v + cp * row2[i])];
      // column-major mat3
      gl.uniformMatrix3fv(uRot, false, [m[0][0], m[1][0], m[2][0], m[0][1], m[1][1], m[2][1], m[0][2], m[1][2], m[2][2]]);
      const rc = m.map((row) => row[0] * c[0] + row[1] * c[1] + row[2] * c[2]);
      gl.uniform3f(uShift, -rc[0], -rc[1], -rc[2] - dist);
      const f = 1 / Math.tan(fov / 2);
      const aspect = w / h;
      const near = dist - radius * 1.5;
      const far = dist + radius * 1.5;
      gl.uniformMatrix4fv(uProj, false, [f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) / (near - far), -1, 0, 0, (2 * far * near) / (near - far), 0]);
      gl.drawElements(gl.TRIANGLES, mesh.indices.length, gl.UNSIGNED_INT, 0);
    },
    dispose() {
      gl.deleteBuffer(vbo);
      gl.deleteBuffer(ibo);
      gl.deleteProgram(prog);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
  return view;
}
