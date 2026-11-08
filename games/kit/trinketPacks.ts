// Packs the trinket files the site serves (web/public/trinkets/<game>/), so the Pages deploy carries a few MB
// instead of tens: each STL a manifest lists (the print, its colored preview, its supports) becomes <file>.pack, a
// lossless pack (web/packages/tools/src/mesh/meshPack.ts) raw-deflated, and the STL goes. The manifest's
// `packed` names them; the site makes the real file back in the browser, byte for byte (desk/boxes/trinketData.ts).
// Run by scripts/build-games.mjs after the trinkets are made; a folder already packed costs one manifest read.
// The trinket builders' own up-to-date checks accept a packed file (trinketTool.ts keys on its sources;
// pixelTrinkets.ts looks for either), and a remade folder is simply packed again.
//   cd web && npx vite-node ../games/kit/trinketPacks.ts
import { existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { deflateRawSync } from 'node:zlib';
import { packStl } from '@lewismoten/gamemaker-sandbox-tools/mesh/meshPack';

const root = resolve(import.meta.dirname, '../..');
const trinkets = join(root, 'web/public/trinkets');

interface Manifest {
  items: { file: string; preview?: string; supports?: { file: string } | null; colors?: { file: string } }[];
  packed?: string[];
}

const PACKERS: Record<string, (data: Uint8Array) => Uint8Array> = { '.stl': packStl };
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
    const pack = deflateRawSync(packer(name)(data), { level: 9 });
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
console.log(packed ? `Trinket packs: ${packed} files, ${(before / 1e6).toFixed(1)} MB to ${(after / 1e6).toFixed(1)} MB` : 'Trinket packs: up to date');
