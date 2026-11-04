// Builds the phone's 3D-printed shell, dial, caps and battery box for both variants and checks them like a trinket:
//   cd web && npx vite-node ../games/year2000/phone/tools/shell.ts      (npm run phone:build does this)
// For each variant it writes printable binary STL files to <variant>/shell/ (one per printed part, in printing orientation,
// mm) and merges every part into <variant>/viewer/parts.json + parts.bin (groups shell, dial, battery, which the desk viewer
// explodes with no code), replacing the board's placeholder battery-holder block. It prints each part's size, triangles,
// pieces, thin specks and overhang, so a print problem shows up before a slicer does. Untested: nothing here was printed.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { meshFieldTrinket } from '@lewismoten/gamemaker-sandbox-tools/mesh/fieldTrinket';
import { writeStl } from '@lewismoten/gamemaker-sandbox-tools/mesh/stl';
import type { Mesh } from '@lewismoten/gamemaker-sandbox-tools/mesh/mesh';
import { loadVariant, type Variant } from './shellInput';
import { buildShell, type ShellPart, type V3 } from './shellParts';
import { LEAD, LEAD_R, MIN_GAP, leadsFrom, measure, regionOf } from './clearance';

const here = resolve(fileURLToPath(new URL('.', import.meta.url)));
const phone = resolve(here, '..');

interface Row {
  id: string;
  kind: string;
  side: string;
  group?: string;
  label?: string;
  made?: string;
  color: number[];
  bbox: number[];
  pos: { offset: number; count: number };
  idx: { offset: number; count: number };
}

const volumeSign = (pos: ArrayLike<number>, idx: ArrayLike<number>): number => {
  let vol = 0;
  for (let t = 0; t < idx.length; t += 3) {
    const a = idx[t] * 3;
    const b = idx[t + 1] * 3;
    const c = idx[t + 2] * 3;
    vol +=
      pos[a] * (pos[b + 1] * pos[c + 2] - pos[b + 2] * pos[c + 1]) -
      pos[a + 1] * (pos[b] * pos[c + 2] - pos[b + 2] * pos[c]) +
      pos[a + 2] * (pos[b] * pos[c + 1] - pos[b + 1] * pos[c]);
  }
  return Math.sign(vol);
};

function det(place: ShellPart['place']): number {
  const o = place(0, 0, 0);
  const sub = (p: V3): V3 => [p[0] - o[0], p[1] - o[1], p[2] - o[2]];
  const a = sub(place(1, 0, 0));
  const b = sub(place(0, 1, 0));
  const c = sub(place(0, 0, 1));
  return Math.sign(a[0] * (b[1] * c[2] - b[2] * c[1]) - a[1] * (b[0] * c[2] - b[2] * c[0]) + a[2] * (b[0] * c[1] - b[1] * c[0]));
}

function buildVariant(id: 'cheap' | 'deluxe', dir: string): void {
  const v: Variant = loadVariant(id, dir);
  const parts = buildShell(v);
  const jsonPath = join(dir, 'viewer/parts.json');
  const file = JSON.parse(readFileSync(jsonPath, 'utf8')) as { floats: number; indices: number; parts: Row[]; [k: string]: unknown };
  const buf = readFileSync(join(dir, 'viewer/parts.bin'));
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  const floats = new Float32Array(ab, 0, file.floats);
  const index = new Uint32Array(ab, file.floats * 4, file.indices);
  // the convention of the file: the sign of the placeholder battery block's signed volume
  const bigBt = file.parts.filter((p) => p.id === 'BT1').sort((a, b) => b.pos.count - a.pos.count)[0];
  const refSign = bigBt
    ? volumeSign(floats.subarray(bigBt.pos.offset, bigBt.pos.offset + bigBt.pos.count), index.subarray(bigBt.idx.offset, bigBt.idx.offset + bigBt.idx.count)) ||
      1
    : 1;
  const keep = file.parts.filter((p) => p !== bigBt && p.made !== 'shell.ts');
  const outDir = join(dir, 'shell');
  mkdirSync(outDir, { recursive: true });

  const placed: { row: Row; pos: Float32Array; idx: Uint32Array }[] = [];
  let printedMm3 = 0;
  console.log(`\n== ${v.name}  (${v.W} x ${v.H} mm board)`);
  console.log('part'.padEnd(16), 'size mm (printed)'.padEnd(22), 'tris'.padStart(7), 'pieces'.padStart(7), 'specks'.padStart(7), 'overhang mm2'.padStart(13));
  for (const p of parts) {
    const t = meshFieldTrinket({ mm: p.field, colorAt: () => [200, 200, 200], box: p.box }, p.cell);
    const m: Mesh = t.mesh;
    if (p.printed) writeFileSync(join(outDir, `${p.id}.stl`), writeStl(m, { name: `${v.subtitle}: ${p.label}` }));
    const flip = det(p.place) * refSign < 0;
    const pos = new Float32Array(m.positions.length);
    for (let i = 0; i < pos.length; i += 3) {
      const q = p.place(m.positions[i], m.positions[i + 1], m.positions[i + 2]);
      pos[i] = Math.round(q[0] * 1000) / 1000;
      pos[i + 1] = Math.round(q[1] * 1000) / 1000;
      pos[i + 2] = Math.round(q[2] * 1000) / 1000;
    }
    const idx = Uint32Array.from(m.indices);
    if (flip) for (let i = 0; i < idx.length; i += 3) [idx[i + 1], idx[i + 2]] = [idx[i + 2], idx[i + 1]];
    const lo = [Infinity, Infinity, Infinity];
    const hi = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < pos.length; i += 3)
      for (let k = 0; k < 3; k++) {
        lo[k] = Math.min(lo[k], pos[i + k]);
        hi[k] = Math.max(hi[k], pos[i + k]);
      }
    const r = t.report;
    if (p.printed) printedMm3 += r.volume;
    const size = [0, 1, 2].map((k) => (r.max[k] - r.min[k]).toFixed(1)).join(' x ');
    console.log(
      p.id.padEnd(16),
      size.padEnd(22),
      String(r.triangles).padStart(7),
      String(r.pieces).padStart(7),
      String(t.erodedSpecks).padStart(7),
      t.overhang.area.toFixed(0).padStart(13),
      r.badEdges ? `  !! ${r.badEdges} bad edges` : '',
    );
    placed.push({
      row: {
        id: p.id,
        kind: 'component',
        side: p.side,
        group: p.group,
        label: p.label,
        made: 'shell.ts',
        color: p.color.map((c) => Math.round(c * 1000) / 1000),
        bbox: [lo[0], lo[1], lo[2], hi[0], hi[1], hi[2]].map((n) => Math.round(n * 100) / 100),
        pos: { offset: 0, count: pos.length },
        idx: { offset: 0, count: idx.length },
      },
      pos,
      idx,
    });
  }

  // repack: kept parts first, then the shell parts
  const vs: Float32Array[] = [];
  const ix: Uint32Array[] = [];
  let fo = 0;
  let io = 0;
  const rows: Row[] = [];
  const add = (row: Row, pos: Float32Array, idx: Uint32Array) => {
    rows.push({ ...row, pos: { offset: fo, count: pos.length }, idx: { offset: io, count: idx.length } });
    vs.push(pos);
    ix.push(idx);
    fo += pos.length;
    io += idx.length;
  };
  for (const p of keep) add(p, floats.slice(p.pos.offset, p.pos.offset + p.pos.count), index.slice(p.idx.offset, p.idx.offset + p.idx.count));
  for (const p of placed) add(p.row, p.pos, p.idx);
  const out = Buffer.alloc((fo + io) * 4);
  let off = 0;
  for (const a of vs) {
    Buffer.from(a.buffer, a.byteOffset, a.byteLength).copy(out, off);
    off += a.byteLength;
  }
  for (const a of ix) {
    Buffer.from(a.buffer, a.byteOffset, a.byteLength).copy(out, off);
    off += a.byteLength;
  }
  // lead and solder clearance: the printed parts against the lead stubs and the part bodies (clearance.ts)
  const placement = JSON.parse(readFileSync(join(dir, 'kicad/placement.json'), 'utf8'));
  const bodies = keep.filter((p) => p.kind === 'component').map((p) => ({ id: p.id, bbox: p.bbox }));
  const gaps = measure(
    placed.filter((_, i) => parts[i].printed).map((p) => ({ id: p.row.id, pos: p.pos, idx: p.idx })),
    leadsFrom(placement),
    bodies,
    regionOf,
  );
  const fmt = (g: { gap: number; other: string }) => (Number.isFinite(g.gap) ? `${g.gap.toFixed(2)} (${g.other})` : '> 3');
  console.log(`clearance (lead stub ${LEAD} mm, fillet radius ${LEAD_R} mm; must stay >= ${MIN_GAP} mm), mm to lead / to a part body:`);
  const bad: string[] = [];
  for (const g of gaps) {
    console.log(
      ' ',
      g.id.padEnd(14),
      fmt(g.lead).padEnd(16),
      fmt(g.body),
      Object.entries(g.regions)
        .map(([k, r]) => `${k}: ${fmt(r)}`)
        .join('  '),
    );
    if (g.lead.gap < MIN_GAP)
      bad.push(`${g.id} is ${g.lead.gap.toFixed(2)} mm from a lead of ${g.lead.other} at ${g.lead.at.map((n) => n.toFixed(1)).join(', ')}`);
    if (g.body.gap < MIN_GAP) bad.push(`${g.id} is ${g.body.gap.toFixed(2)} mm from ${g.body.other} at ${g.body.at.map((n) => n.toFixed(1)).join(', ')}`);
  }
  writeFileSync(join(dir, 'viewer/clearance.json'), JSON.stringify({ lead: LEAD, leadRadius: LEAD_R, min: MIN_GAP, parts: gaps }, null, 1));
  if (bad.length) {
    console.log(`!! clearance below ${MIN_GAP} mm:\n  ${bad.join('\n  ')}`);
    process.exitCode = 1;
  }
  const next = {
    ...file,
    floats: fo,
    indices: io,
    variant: { id, name: v.name, subtitle: v.subtitle, board: { width: v.W, height: v.H }, holder: [v.bt.x0, v.bt.y0, v.bt.z0, v.bt.x1, v.bt.y1, v.bt.z1] },
    parts: rows,
  };
  writeFileSync(join(dir, 'viewer/parts.bin'), out);
  writeFileSync(jsonPath, JSON.stringify(next));
  console.log(
    `printed volume ${(printedMm3 / 1000).toFixed(0)} cm3; about ${((printedMm3 / 1000) * 1.24 * 0.35).toFixed(0)} g of PLA at roughly 35% of solid (walls plus 15% infill; a guess, not a slicer figure)`,
  );
  console.log(`viewer: ${rows.length} parts, ${(out.length / 1e6).toFixed(2)} MB, STL files in ${outDir}`);
}

buildVariant('cheap', phone);
buildVariant('deluxe', join(phone, 'deluxe'));
