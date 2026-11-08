// Packs the trinket files the site serves (web/public/trinkets/<game>/), so the Pages deploy carries a few MB
// instead of tens: each STL a manifest lists (the print, its colored preview, its supports) becomes <file>.pack, a
// lossless pack (web/packages/tools/src/pack/meshPack.ts) raw-deflated, and the STL goes; each 3MF likewise
// (pack/threeMfPack.ts). The manifest's `packed` names them; the site makes the real file back in the browser
// (desk/boxes/trinketData.ts): an STL byte for byte, a 3MF with the same files inside (its own deflate may differ).
// Run by scripts/build-games.mjs after the trinkets are made; a folder already packed costs one manifest read.
// The trinket builders' own up-to-date checks accept a packed file (trinketTool.ts keys on its sources;
// pixelTrinkets.ts looks for either), and a remade folder is simply packed again. It also packs the phone kit's 3D
// parts for the box's phone viewer (below).
//   cd web && npx vite-node ../games/kit/trinketPacks.ts
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { deflateRawSync, inflateRawSync } from 'node:zlib';
import { packFloatsAndIndices, packStl } from '@lewismoten/gamemaker-sandbox-tools/pack/meshPack';
import { pack3mf } from '@lewismoten/gamemaker-sandbox-tools/pack/threeMfPack';

const root = resolve(import.meta.dirname, '../..');
const trinkets = join(root, 'web/public/trinkets');

interface Manifest {
  items: { file: string; preview?: string; supports?: { file: string } | null; colors?: { file: string } }[];
  packed?: string[];
}

const PACKERS: Record<string, (data: Uint8Array) => Uint8Array> = { '.stl': packStl, '.3mf': (data) => pack3mf(data, { inflate: (d) => inflateRawSync(d) }) };
const packer = (name: string) => PACKERS[name.slice(name.lastIndexOf('.'))];

let packed = 0;
let before = 0;
let after = 0;
for (const game of existsSync(trinkets) ? readdirSync(trinkets).sort() : []) {
  const dir = join(trinkets, game);
  const manifestFile = join(dir, 'manifest.json');
  if (!existsSync(manifestFile)) continue;
  const manifest = JSON.parse(readFileSync(manifestFile, 'utf8')) as Manifest;
  const names = manifest.items.flatMap((i) => [i.file, i.preview, i.supports?.file, i.colors?.file]).filter((n): n is string => !!n && !!packer(n));
  const done = new Set(manifest.packed ?? []);
  let changed = false;
  for (const name of names) {
    const file = join(dir, name);
    if (!existsSync(file)) {
      if (done.has(name) && existsSync(`${file}.pack`)) continue;
      throw new Error(`trinkets/${game}: ${name} is in the manifest but neither it nor its pack is there`);
    }
    const data = new Uint8Array(readFileSync(file));
    let pack: Uint8Array;
    try {
      pack = deflateRawSync(packer(name)(data), { level: 9 });
    } catch (error) {
      // served as it is; the site reads either
      console.log(`trinkets/${game}/${name}: kept unpacked (${error instanceof Error ? error.message : String(error)})`);
      continue;
    }
    writeFileSync(`${file}.pack`, pack);
    rmSync(file);
    done.add(name);
    changed = true;
    packed++;
    before += data.length;
    after += pack.length;
  }
  // a pack the manifest no longer lists (a remade folder's earlier design) goes with it
  for (const name of readdirSync(dir)) if (name.endsWith('.pack') && !names.includes(name.slice(0, -5))) rmSync(join(dir, name));
  if (changed) {
    manifest.packed = names.filter((n) => done.has(n));
    writeFileSync(manifestFile, JSON.stringify(manifest, null, 1) + '\n');
  }
}

// The phone kit's 3D parts (games/year2000/phone/viewer, committed; the deluxe build's in deluxe/viewer) for the box's
// phone viewer (web/src/desk/boxes/phone/phoneData.ts): its parts.json, naming parts.bin.pack, and the parts.bin packed
// (float32 corners in byte planes, each part's uint32 corner numbers as varints). Made again when either file changes.
for (const [from, to] of [
  ['viewer', 'phone'],
  ['deluxe/viewer', 'phone/deluxe'],
]) {
  const src = join(root, 'games/year2000/phone', from);
  if (!existsSync(join(src, 'parts.json'))) continue;
  const out = join(trinkets, to);
  const json = readFileSync(join(src, 'parts.json'), 'utf8');
  const bin = new Uint8Array(readFileSync(join(src, 'parts.bin')));
  const source = createHash('sha1').update(json).update(bin).digest('hex').slice(0, 16);
  try {
    if (JSON.parse(readFileSync(join(out, 'parts.json'), 'utf8')).packSource === source && existsSync(join(out, 'parts.bin.pack'))) continue;
  } catch {
    // not made yet
  }
  const meta = JSON.parse(json) as { floats?: number; parts: { idx: { offset: number } }[] };
  const pack = deflateRawSync(
    packFloatsAndIndices(
      bin,
      meta.floats ?? bin.length / 4,
      meta.parts.map((p) => p.idx.offset),
    ),
    { level: 9 },
  );
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, 'parts.bin.pack'), pack);
  rmSync(join(out, 'parts.bin'), { force: true });
  writeFileSync(join(out, 'parts.json'), JSON.stringify({ ...meta, packed: 'parts.bin.pack', packSource: source }));
  packed++;
  before += bin.length;
  after += pack.length;
}
console.log(packed ? `Trinket packs: ${packed} files, ${(before / 1e6).toFixed(1)} MB to ${(after / 1e6).toFixed(1)} MB` : 'Trinket packs: up to date');
