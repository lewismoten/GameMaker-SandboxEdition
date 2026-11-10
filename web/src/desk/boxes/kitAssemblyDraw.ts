// Software 3D feelie renderer: extrude the real cut loops, including hole walls, with an even-odd face.
// Shares the turntable's camera interface; no WebGL is needed for plywood assembly views.
import type { TrinketView } from './trinketGl';
import { offsetAt, type AssemblyModel, type V3 } from './kitAssemblyModel';

export function assemblyView(canvas: HTMLCanvasElement, model: AssemblyModel): TrinketView & { step: number } {
  const ctx = canvas.getContext('2d')!;
  const view = { yaw: 0.6, pitch: 0.6, zoom: 1, step: model.parts.length, fixed: undefined as number | undefined, dispose() {}, draw };
  function draw() {
    const width = view.fixed ?? Math.max(1, canvas.clientWidth);
    const height = view.fixed ?? Math.max(1, canvas.clientHeight);
    const dpr = devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);
    const project = ([x, y, z]: V3): V3 => {
      const a = x * Math.cos(view.yaw) - y * Math.sin(view.yaw);
      const b = x * Math.sin(view.yaw) + y * Math.cos(view.yaw);
      const pitch = Math.max(0.15, view.pitch);
      return [a, b * Math.sin(pitch) - z * Math.cos(pitch), b * Math.cos(pitch) + z * Math.sin(pitch)];
    };
    const faces: { loops: V3[][]; depth: number; fill: string; edge: boolean }[] = [];
    const face = (loops: V3[][], fill: string, edge = true) => {
      const pts = loops.flat();
      faces.push({ loops, fill, edge, depth: pts.reduce((n, p) => n + p[2], 0) / pts.length });
    };
    model.parts.forEach((p, i) => {
      const off = offsetAt(p, i, view.step);
      const point = ([x, y]: number[], z: number): V3 => project(p.origin.map((v, k) => v + off[k] + x * p.right[k] + y * p.down[k] + z * p.normal[k]) as V3);
      const active = Math.ceil(view.step) === i + 1;
      for (const z of [0, model.thickness])
        face(
          p.cut.map((loop) => loop.map((q) => point(q, z))),
          active ? '#f2cb75' : '#debf8b',
        );
      for (const loop of p.cut)
        loop.forEach((q, j) => {
          const r = loop[(j + 1) % loop.length];
          face([[point(q, 0), point(r, 0), point(r, model.thickness), point(q, model.thickness)]], '#967044');
        });
      // Engraving sits on the sheet's outside face (the lid is read from above).
      if (p.art.length)
        face(
          p.art.map((loop) => loop.map((q) => point(q, model.thickness + 0.02))),
          '#48341e',
          false,
        );
    });
    const pts = faces.flatMap((f) => f.loops.flat());
    const xs = pts.map((p) => p[0]),
      ys = pts.map((p) => p[1]);
    const x0 = Math.min(...xs),
      x1 = Math.max(...xs),
      y0 = Math.min(...ys),
      y1 = Math.max(...ys);
    const scale = Math.min((width * 0.9) / (x1 - x0), (height * 0.9) / (y1 - y0)) * view.zoom;
    ctx.translate(width / 2 - ((x0 + x1) / 2) * scale, height / 2 - ((y0 + y1) / 2) * scale);
    ctx.scale(scale, scale);
    faces.sort((a, b) => a.depth - b.depth);
    for (const f of faces) {
      ctx.beginPath();
      for (const loop of f.loops) {
        loop.forEach((q, j) => (j ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])));
        ctx.closePath();
      }
      ctx.fillStyle = f.fill;
      ctx.fill('evenodd');
      if (f.edge) {
        ctx.strokeStyle = '#694b2d';
        ctx.lineWidth = 0.35 / scale;
        ctx.stroke();
      }
    }
  }
  return view;
}
