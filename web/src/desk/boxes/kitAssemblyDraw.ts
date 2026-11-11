// Software 3D feelie renderer: extrude the real cut loops, including hole walls, with an even-odd face.
// Shares the turntable's camera interface; no WebGL is needed for plywood assembly views.
// A glued sub-assembly (kits with groups) is drawn as one solid once its "finished" step is done: no seams between its slices.
// While a group is being built or shown, the other groups are left out and the view fits that group.
import type { TrinketView } from './trinketGl';
import { poseAt, type AssemblyModel, type V3 } from './kitAssemblyModel';

export function assemblyView(canvas: HTMLCanvasElement, model: AssemblyModel): TrinketView & { step: number } {
  const ctx = canvas.getContext('2d')!;
  const view = { yaw: 0.6, pitch: 0.6, zoom: 1, step: model.steps.length, fixed: undefined as number | undefined, dispose() {}, draw };
  const doneAt = new Map(model.steps.map((s, i) => [s.kind === 'done' ? s.group : '', i]));
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
    const now = model.steps[Math.min(model.steps.length, Math.ceil(view.step)) - 1];
    const focus = now && (now.kind === 'part' || now.kind === 'done') ? now.group : undefined;
    const [mx, my] = model.center;
    // a point of part `p` at pose (off, spin): turned about the kit's middle, then moved
    const place = (i: number, off: V3, spin: number) => {
      const p = model.parts[i];
      const a = (spin * Math.PI) / 180;
      return ([x, y]: number[], z: number): V3 => {
        const q = p.origin.map((v, k) => v + x * p.right[k] + y * p.down[k] + z * p.normal[k]);
        const dx = q[0] - mx,
          dy = q[1] - my;
        return project([mx + dx * Math.cos(a) - dy * Math.sin(a) + off[0], my + dx * Math.sin(a) + dy * Math.cos(a) + off[1], q[2] + off[2]]);
      };
    };
    const bounds = (loops: number[][][]) => {
      const f = loops.flat();
      return [Math.min(...f.map((q) => q[0])), Math.min(...f.map((q) => q[1])), Math.max(...f.map((q) => q[0])), Math.max(...f.map((q) => q[1]))];
    };
    const faces: { loops: V3[][]; depth: number; fill: string; edge: boolean; group?: string; slab: number; rank: number }[] = [];
    let slab = 0;
    const face = (loops: V3[][], fill: string, edge: boolean, group: string | undefined, rank: number) => {
      const pts = loops.flat();
      faces.push({ loops, fill, edge, group, slab, rank, depth: pts.reduce((n, p) => n + p[2], 0) / pts.length });
    };
    model.parts.forEach((p, i) => {
      const { off, spin } = poseAt(model, i, view.step);
      const point = place(i, off, spin);
      // each slab is drawn whole, in the order of its middle: a stack paints from the bottom up, whatever the holes
      const [bx0, by0, bx1, by1] = bounds(p.cut.slice(0, 1));
      if (model.groups.length) slab = point([(bx0 + bx1) / 2, (by0 + by1) / 2], model.thickness / 2)[2];
      const active = Math.ceil(view.step) === (model.steps.findIndex((s) => s.part === i) + 1 || -1) || (!!now && now.kind === 'move' && now.group === p.group);
      const solid = p.group !== undefined && doneAt.has(p.group) && view.step >= doneAt.get(p.group)! + 1;
      // inside a solid, no bottoms, and no top that another slice of the group covers completely
      const covered =
        solid &&
        model.parts.some((o) => {
          if (o.group !== p.group || Math.abs(o.origin[2] - p.origin[2] - model.thickness) > 0.01) return false;
          const [a, b, c, d] = bounds(o.cut.slice(0, 1).map((l) => l.map(([x, y]) => [x + o.origin[0], y + o.origin[1]])));
          const [e, f, g, h] = bounds(p.cut.slice(0, 1).map((l) => l.map(([x, y]) => [x + p.origin[0], y + p.origin[1]])));
          return a <= e + 0.01 && b <= f + 0.01 && c >= g - 0.01 && d >= h - 0.01;
        });
      for (const z of [0, model.thickness]) {
        if (solid && (z === 0 || covered)) continue;
        face(
          p.cut.map((loop) => loop.map((q) => point(q, z))),
          active ? '#f2cb75' : '#debf8b',
          true,
          p.group,
          z ? 2 : 0,
        );
      }
      for (const loop of p.cut)
        loop.forEach((q, j) => {
          const r = loop[(j + 1) % loop.length];
          face([[point(q, 0), point(r, 0), point(r, model.thickness), point(q, model.thickness)]], solid ? '#a07a4c' : '#967044', !solid, p.group, 1);
        });
      // Engraving sits on the sheet's outside face (the lid is read from above).
      if (p.art.length)
        face(
          p.art.map((loop) => loop.map((q) => point(q, model.thickness + 0.02))),
          '#48341e',
          false,
          p.group,
          3,
        );
    });
    // the view fits the focused group both exploded and seated, so it does not jump while parts arrive
    let pts = faces.filter((f) => !focus || f.group === focus).flatMap((f) => f.loops.flat());
    if (focus)
      for (const i of model.groups.find((g) => g.id === focus)!.parts)
        for (const q of model.parts[i].cut.flat())
          for (const e of [model.parts[i].explode, [0, 0, 0] as V3]) {
            const g = model.groups.find((x) => x.id === focus)!;
            pts.push(
              place(i, e.map((v, k) => v + g.shift[k]) as V3, g.spin)(q, 0),
              place(i, e.map((v, k) => v + g.shift[k]) as V3, g.spin)(q, model.thickness),
            );
          }
    pts = pts.length ? pts : faces.flatMap((f) => f.loops.flat());
    const xs = pts.map((p) => p[0]),
      ys = pts.map((p) => p[1]);
    const x0 = Math.min(...xs),
      x1 = Math.max(...xs),
      y0 = Math.min(...ys),
      y1 = Math.max(...ys);
    const scale = Math.min((width * 0.9) / (x1 - x0), (height * 0.9) / (y1 - y0)) * view.zoom;
    ctx.translate(width / 2 - ((x0 + x1) / 2) * scale, height / 2 - ((y0 + y1) / 2) * scale);
    ctx.scale(scale, scale);
    faces.sort((a, b) => a.slab - b.slab || (model.groups.length ? a.rank - b.rank : 0) || a.depth - b.depth);
    for (const f of faces) {
      if (focus && f.group !== focus) continue;
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
    ctx.globalAlpha = 1;
    // sub-assembly IDs: over each finished group that is not yet in the kit (or has been lifted out of it)
    ctx.font = `bold ${13 / scale}px sans-serif`;
    ctx.textAlign = 'center';
    const drawn: [number, number][] = [];
    for (const g of model.groups) {
      const done = doneAt.get(g.id);
      if (done === undefined || view.step < done + 1) continue;
      const mid = g.parts[g.parts.length - 1];
      const { off, spin } = poseAt(model, mid, view.step);
      if (focus ? g.id !== focus || now.kind !== 'done' : Math.hypot(off[0], off[1], off[2]) < 1) continue;
      const top = Math.max(...g.parts.map((i) => model.parts[i].origin[2] + model.thickness));
      const at = place(
        mid,
        off,
        spin,
      )(
        [
          model.parts[mid].cut[0].reduce((s, q) => s + q[0], 0) / model.parts[mid].cut[0].length,
          model.parts[mid].cut[0].reduce((s, q) => s + q[1], 0) / model.parts[mid].cut[0].length,
        ],
        top - model.parts[mid].origin[2] + 8,
      );
      while (drawn.some(([x, y]) => Math.hypot(x - at[0], y - at[1]) < 14 / scale)) at[1] += 18 / scale;
      drawn.push([at[0], at[1]]);
      ctx.fillStyle = 'rgba(18,22,27,0.8)';
      ctx.fillRect(at[0] - 9 / scale, at[1] - 14 / scale, 18 / scale, 18 / scale);
      ctx.fillStyle = '#f2cb75';
      ctx.fillText(g.id, at[0], at[1]);
    }
  }
  return view;
}
