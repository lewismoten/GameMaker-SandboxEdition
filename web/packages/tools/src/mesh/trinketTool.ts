// The command-line side of a game's 3D-print trinkets, shared by every game that has them: makes each trinket
// (a FieldTrinket), checks it is closed and printable, writes <id>.stl, <id>.3mf (one body per color) and, where it
// leans out, <id>-supports.stl, then manifest.json with a `key` of the sources, so an unchanged game is skipped.
// With --workers N under a plain-node bundle (scripts/build-games.mjs) the trinkets are made in worker threads.
// Lifted from Depth Perception's trinket tool; its output is byte for byte what it was.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Worker, isMainThread, parentPort } from 'node:worker_threads';
import { deflateRawSync } from 'node:zlib';
import type { FieldTrinket } from './fieldTrinket';
import { inspectMesh } from './meshCheck';
import { writeStl } from './stl';
import { write3mf } from './threeMf';

type Item = Record<string, unknown> & { id: string; log: string };

export interface TrinketToolDef {
  id: string;
  title: string;
  blurb: string;
  /** Printed height and width in mm, only to start the biggest first. */
  height: number;
  maxWidth: number;
  /** How many separate solids it is (default 1), such as a coin printed in three pieces. */
  pieces?: number;
}

export interface TrinketTool<D extends TrinketToolDef> {
  /** The folder id in web/public/trinkets and the manifest's `game`. */
  game: string;
  /** The game's title, in the STL and 3MF names. */
  gameTitle: string;
  out: string;
  /** The files, and folders (each file in them, sorted), the trinkets are made from: the key of the manifest. */
  keyFiles: string[];
  defs: D[];
  make: (def: D) => FieldTrinket;
  args: string[];
}

/** A hash of the sources, so an up-to-date set of trinkets is not made again. */
export function sourceKey(entries: string[]): string {
  const h = createHash('sha1');
  const files = entries.flatMap((e) =>
    statSync(e).isDirectory()
      ? readdirSync(e)
          .sort()
          .map((n) => join(e, n))
      : [e],
  );
  for (const f of files) h.update(f.slice(f.lastIndexOf('/'))).update(readFileSync(f));
  return h.digest('hex').slice(0, 16);
}

const flag = (args: string[], name: string) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);

export async function runTrinketTool<D extends TrinketToolDef>(tool: TrinketTool<D>): Promise<void> {
  const { game, gameTitle, out, defs, args } = tool;
  /** One trinket: its kinds of file written, its manifest entry returned. */
  const build = (def: D): Item => {
    const t0 = Date.now();
    const { mesh, report, erodedPieces, erodedSpecks, overhang, support, bodies, wholeVolume } = tool.make(def);
    const pieces = def.pieces ?? 1;
    if (report.badEdges || report.flippedEdges || report.pieces !== pieces)
      throw new Error(`trinket ${def.id} is not ${pieces} closed solid(s): ${JSON.stringify(report)}`);
    if (erodedPieces !== pieces)
      throw new Error(`trinket ${def.id} has parts joined by less than a millimeter (${erodedPieces} bodies when eroded by half a millimeter)`);
    const file = writeStl(mesh, { name: `${gameTitle}: ${def.title}, mm` });
    writeFileSync(join(out, `${def.id}.stl`), file);
    const size = report.max.map((v, i) => +(v - report.min[i]).toFixed(1));
    // the colors: one closed body each, together the same solid as the STL
    const reports = bodies.map((b) => inspectMesh(b.mesh));
    if (reports.some((r) => r.badEdges || r.flippedEdges)) throw new Error(`trinket ${def.id}: a color body is not closed`);
    if (bodies.length > 4) throw new Error(`trinket ${def.id}: ${bodies.length} colors`);
    const bodyVolume = reports.reduce((n, r) => n + r.volume, 0);
    if (Math.abs(bodyVolume / wholeVolume - 1) > 0.02)
      throw new Error(`trinket ${def.id}: its colors fill ${bodyVolume.toFixed(0)} mm3, its solid ${wholeVolume.toFixed(0)}`);
    // the file's colors against the viewer's: how far each triangle's color is from the nearest color in the file
    let off = 0;
    const tc = mesh.colors!;
    for (let t = 0; t < tc.length; t += 3)
      off += Math.min(...bodies.map((b) => Math.hypot(b.color[0] - tc[t], b.color[1] - tc[t + 1], b.color[2] - tc[t + 2])));
    const colorError = Math.round(off / (tc.length / 3));
    const colored = write3mf(
      bodies.map((b, i) => ({ name: `Color ${i + 1}`, mesh: b.mesh, color: b.color })),
      `${gameTitle}: ${def.title}`,
      { deflate: (d) => deflateRawSync(d, { level: 9 }) },
    );
    writeFileSync(join(out, `${def.id}.3mf`), colored);
    let supports;
    if (support) {
      const sr = inspectMesh(support);
      if (sr.badEdges || sr.flippedEdges) throw new Error(`trinket ${def.id}: the supports are not closed`);
      const sfile = writeStl(support, { name: `${gameTitle}: ${def.title}, supports, mm` });
      writeFileSync(join(out, `${def.id}-supports.stl`), sfile);
      supports = { file: `${def.id}-supports.stl`, triangles: support.indices.length / 3, bytes: sfile.length };
    }
    return {
      id: def.id,
      title: def.title,
      blurb: def.blurb,
      file: `${def.id}.stl`,
      triangles: report.triangles,
      bytes: file.length,
      mm: size,
      thinSpecks: erodedSpecks,
      colors: { file: `${def.id}.3mf`, bytes: colored.length, palette: bodies.map((b) => b.color), meanColorError: colorError },
      overhangMm2: Math.round(overhang.area),
      overhangShare: +overhang.share.toFixed(3),
      supports: supports ?? null,
      log: `trinket ${def.id}: ${report.triangles} triangles, ${size.join(' x ')} mm, colors ${bodies.length} (error ${colorError}), overhang ${Math.round(overhang.area)} mm2${support ? ' (supports file)' : ''}, ${((Date.now() - t0) / 1000).toFixed(1)} s`,
    };
  };

  if (!isMainThread) {
    // a worker thread of the bundle: makes the trinkets it is sent, one at a time
    parentPort!.on('message', (id: string) => {
      try {
        parentPort!.postMessage(build(defs.find((d) => d.id === id)!));
      } catch (error) {
        parentPort!.postMessage({ id, error: String(error instanceof Error ? error.stack : error) });
      }
    });
    return;
  }
  const key = sourceKey(tool.keyFiles);
  const manifestFile = join(out, 'manifest.json');
  if (!args.includes('--force') && existsSync(manifestFile) && JSON.parse(readFileSync(manifestFile, 'utf8')).key === key) {
    process.stdout.write(`${'trinkets: up to date'}\n`);
    process.exit(0);
  }
  mkdirSync(out, { recursive: true });
  const began = Date.now();
  const entry = process.argv[1] ?? '';
  const workers = Math.min(defs.length, Math.max(1, Math.floor(Number(flag(args, '--workers'))) || 1));
  const results = new Map<string, Item>();
  // slowest first keeps the last worker busy
  const order = [...defs].sort((a, b) => b.height * b.maxWidth - a.height * a.maxWidth).map((d) => d.id);
  if (workers > 1 && entry.endsWith('.mjs') && !entry.includes('vite-node')) {
    await Promise.all(
      Array.from({ length: workers }, () => {
        const worker = new Worker(entry, { argv: process.argv.slice(2) });
        return new Promise<void>((done, fail) => {
          const next = () => {
            const id = order.shift();
            if (id) worker.postMessage(id);
            else void worker.terminate().then(() => done());
          };
          worker.on('message', (m: Item & { error?: string }) => {
            if (m.error) fail(new Error(m.error));
            else {
              results.set(m.id, m);
              next();
            }
          });
          worker.on('error', fail);
          next();
        });
      }),
    );
  } else {
    for (const id of order) results.set(id, build(defs.find((d) => d.id === id)!));
  }
  const items = defs.map((d) => results.get(d.id)!);
  for (const item of items) {
    process.stdout.write(`${item.log}\n`);
    delete (item as { log?: string }).log;
  }
  writeFileSync(manifestFile, JSON.stringify({ key, game, items }, null, 1) + '\n');
  process.stdout.write(`${`trinkets: ${items.length} made in ${((Date.now() - began) / 1000).toFixed(1)} s`}\n`);
}
