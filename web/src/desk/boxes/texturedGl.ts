// A small WebGL viewer for models made of flat-shaded, textured pieces: the wooden nickel and the Stage Box
// (coinModel.ts, stageBoxModel.ts). It is trinketGl.ts's sibling: the same camera, turning and lights (so both
// turn the same way under the same Turntable), but each piece has its own texture (a picture laid on a face, such
// as the engraving) or one color, and a soft wood sheen in place of glossy plastic. The model is z up and faces +y.
import type { TrinketView } from './trinketGl';

export interface TexPiece {
  /** Three floats a vertex, three vertices a triangle (no index: each face has its own normals). */
  positions: Float32Array;
  normals: Float32Array;
  /** Two floats a vertex, when `texture` is set. */
  uvs?: Float32Array;
  /** A picture laid on the piece (the engraving); the piece's `color` multiplies it. */
  texture?: TexImageSource;
  color: [number, number, number];
}

const VERT = `
attribute vec3 aPos;
attribute vec3 aNormal;
attribute vec2 aUv;
uniform mat3 uRot;
uniform vec3 uShift;
uniform mat4 uProj;
varying vec3 vN;
varying vec3 vP;
varying vec2 vUv;
void main() {
  vP = uRot * aPos + uShift;
  vN = uRot * aNormal;
  vUv = aUv;
  gl_Position = uProj * vec4(vP, 1.0);
}`;

const FRAG = `
precision mediump float;
varying vec3 vN;
varying vec3 vP;
varying vec2 vUv;
uniform sampler2D uTex;
uniform vec3 uColor;
uniform float uHasTex;
void main() {
  vec3 n = normalize(vN);
  vec3 v = normalize(-vP);
  vec3 key = normalize(vec3(-0.45, 0.65, 0.65));
  vec3 fill = normalize(vec3(0.7, 0.1, 0.5));
  vec3 base = uColor;
  if (uHasTex > 0.5) base = base * texture2D(uTex, vUv).rgb;
  vec3 albedo = pow(base, vec3(2.2));
  float up = n.y * 0.5 + 0.5;
  vec3 ambient = mix(vec3(0.2, 0.17, 0.2), vec3(0.55, 0.55, 0.6), up);
  float dk = max(dot(n, key), 0.0);
  float df = max(dot(n, fill), 0.0);
  vec3 lit = albedo * (ambient + dk * vec3(1.0, 0.96, 0.9) * 0.85 + df * vec3(0.5, 0.6, 0.8) * 0.25);
  float s1 = pow(max(dot(n, normalize(key + v)), 0.0), 40.0) * 0.18;
  gl_FragColor = vec4(pow(lit + vec3(s1), vec3(1.0 / 2.2)), 1.0);
}`;

interface Drawn {
  vbo: WebGLBuffer;
  count: number;
  tex: WebGLTexture | null;
  color: [number, number, number];
}

/** Sets up a viewer for `pieces` on `canvas`, or returns undefined when the browser has no WebGL for it. */
export function createTexturedView(canvas: HTMLCanvasElement, pieces: TexPiece[]): TrinketView | undefined {
  const gl = canvas.getContext('webgl', { antialias: true, alpha: true, premultipliedAlpha: false, preserveDrawingBuffer: false });
  if (!gl) return undefined;
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
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return undefined;
  gl.useProgram(prog);
  const at = (name: string) => gl.getAttribLocation(prog, name);
  const loc = (name: string) => gl.getUniformLocation(prog, name);
  const [uRot, uShift, uProj, uColor, uHasTex] = ['uRot', 'uShift', 'uProj', 'uColor', 'uHasTex'].map(loc);

  const lo = [Infinity, Infinity, Infinity];
  const hi = [-Infinity, -Infinity, -Infinity];
  const drawn: Drawn[] = pieces.map((p) => {
    const n = p.positions.length / 3;
    const data = new Float32Array(n * 8);
    for (let i = 0; i < n; i++) {
      for (let k = 0; k < 3; k++) {
        const v = p.positions[i * 3 + k];
        data[i * 8 + k] = v;
        data[i * 8 + 3 + k] = p.normals[i * 3 + k];
        lo[k] = Math.min(lo[k], v);
        hi[k] = Math.max(hi[k], v);
      }
      data[i * 8 + 6] = p.uvs?.[i * 2] ?? 0;
      data[i * 8 + 7] = p.uvs?.[i * 2 + 1] ?? 0;
    }
    const vbo = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    let tex: WebGLTexture | null = null;
    if (p.texture) {
      tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, p.texture);
      // not a power of two: no mipmaps, and the edges clamp
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }
    return { vbo, count: n, tex, color: p.color };
  });
  const c = lo.map((v, i) => (v + hi[i]) / 2);
  const radius = Math.hypot(hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]) / 2;
  const fov = (28 * Math.PI) / 180;
  const baseDist = (radius / Math.sin(fov / 2)) * 1.02;

  const view: TrinketView = {
    yaw: 0.6,
    pitch: 0.28,
    zoom: 1,
    draw() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = view.fixed ?? Math.max(1, Math.round(canvas.clientWidth * dpr));
      const h = view.fixed ?? Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      const dist = baseDist / view.zoom;
      gl.viewport(0, 0, w, h);
      gl.clearColor(0, 0, 0, 0);
      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.CULL_FACE);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      // the same rotation as trinketGl.ts: tip(pitch) * basis * turn(yaw), the basis (x, y, z) -> (-x, z, y)
      const cy = Math.cos(view.yaw);
      const sy = Math.sin(view.yaw);
      const cp = Math.cos(view.pitch);
      const sp = Math.sin(view.pitch);
      const row0 = [-cy, sy, 0];
      const row1 = [0, 0, 1];
      const row2 = [sy, cy, 0];
      const m = [row0, row1.map((v, i) => cp * v - sp * row2[i]), row1.map((v, i) => sp * v + cp * row2[i])];
      gl.uniformMatrix3fv(uRot, false, [m[0][0], m[1][0], m[2][0], m[0][1], m[1][1], m[2][1], m[0][2], m[1][2], m[2][2]]);
      const rc = m.map((row) => row[0] * c[0] + row[1] * c[1] + row[2] * c[2]);
      gl.uniform3f(uShift, -rc[0], -rc[1], -rc[2] - dist);
      const f = 1 / Math.tan(fov / 2);
      const aspect = w / h;
      const near = Math.max(0.1, dist - radius * 1.5);
      const far = dist + radius * 1.5;
      gl.uniformMatrix4fv(uProj, false, [f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) / (near - far), -1, 0, 0, (2 * far * near) / (near - far), 0]);
      for (const d of drawn) {
        gl.bindBuffer(gl.ARRAY_BUFFER, d.vbo);
        for (const [name, size, offset] of [
          ['aPos', 3, 0],
          ['aNormal', 3, 12],
          ['aUv', 2, 24],
        ] as const) {
          const a = at(name);
          gl.enableVertexAttribArray(a);
          gl.vertexAttribPointer(a, size, gl.FLOAT, false, 32, offset);
        }
        gl.uniform3f(uColor, ...d.color);
        gl.uniform1f(uHasTex, d.tex ? 1 : 0);
        if (d.tex) gl.bindTexture(gl.TEXTURE_2D, d.tex);
        gl.drawArrays(gl.TRIANGLES, 0, d.count);
      }
    },
    dispose() {
      for (const d of drawn) {
        gl.deleteBuffer(d.vbo);
        if (d.tex) gl.deleteTexture(d.tex);
      }
      gl.deleteProgram(prog);
    },
  };
  return view;
}
