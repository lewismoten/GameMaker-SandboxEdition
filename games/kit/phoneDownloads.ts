// The Phone of the Future kit's downloads for the box (web/public/trinkets/phone/, git-ignored build output): a pack of
// the 3D-printer parts (the shell STLs of both builds, pack/meshPack's packFiles, which the site zips on a download), a ZIP of the circuit board files (each build's KiCad project, with
// its Gerbers, which tools/export.sh writes to the tracked gerbers/, and the PIC firmware: phone.asm and its tracked phone.hex
// to assemble it, which the book's "Programming the PIC" chapter loads), the two parts lists (CSV) and the
// kit's README and parts lists as Markdown, which the box reads as its instructions book (manual/printables/phoneBook.ts).
// Run by scripts/build-games.mjs; `cd web && npx vite-node ../games/kit/phoneDownloads.ts` by hand.
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { deflateRawSync } from 'node:zlib';
import { createZip, type ZipEntry } from '@lewismoten/gamemaker-sandbox-archives/zip';
import { packFiles } from '@lewismoten/gamemaker-sandbox-tools/pack/meshPack';

const root = resolve(import.meta.dirname, '../..');
const phone = join(root, 'games/year2000/phone');
const out = join(root, 'web/public/trinkets/phone');

/** The two builds: where each lives under the phone folder and what its folder is called inside a ZIP. */
const BUILDS = [
  { dir: phone, folder: 'junior-lab', out: out },
  { dir: join(phone, 'deluxe'), folder: 'deluxe', out: join(out, 'deluxe') },
];

function* walk(dir: string): Generator<string> {
  for (const name of readdirSync(dir).sort()) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* walk(p);
    else yield p;
  }
}

const entry = (name: string, file: string): ZipEntry => ({ name, data: new Uint8Array(readFileSync(file)) });
/** The firmware as the board ZIP carries it: its source and the hex tools/build_firmware.sh assembles from it (tracked). */
function firmware(dir: string, folder: string): ZipEntry[] {
  return ['phone.asm', 'phone.hex'].flatMap((f) => (existsSync(join(dir, 'firmware', f)) ? [entry(`${folder}/firmware/${f}`, join(dir, 'firmware', f))] : []));
}

const text = (name: string, body: string): ZipEntry => ({ name, data: new TextEncoder().encode(body) });

async function main() {
  if (!existsSync(join(phone, 'kicad'))) return;
  mkdirSync(join(out, 'deluxe'), { recursive: true });
  const stl: ZipEntry[] = [
    text(
      'READ-ME.txt',
      'The Phone of the Future: 3D-printer parts. One STL per printed part, in printing orientation, for each of the two builds\n' +
        '(junior-lab/ and deluxe/). Nothing here has been printed yet: an untested design, so the clearances are starting guesses.\n',
    ),
  ];
  const board: ZipEntry[] = [
    text(
      'READ-ME.txt',
      'The Phone of the Future: circuit board files. Each build has its KiCad 9 project (open phone.kicad_pro) in kicad/ and its\n' +
        'Gerber and drill files in gerbers/, ready for a board house, and the PIC16F628A firmware in firmware/ (phone.asm and\n' +
        'phone.hex, ready for a PIC programmer). An untested design.\n',
    ),
  ];
  for (const b of BUILDS) {
    for (const f of walk(join(b.dir, 'shell'))) if (f.endsWith('.stl')) stl.push(entry(`${b.folder}/${relative(join(b.dir, 'shell'), f)}`, f));
    board.push(...firmware(b.dir, b.folder));
    for (const f of walk(join(b.dir, 'kicad'))) board.push(entry(`${b.folder}/kicad/${relative(join(b.dir, 'kicad'), f)}`, f));
    const gerbers = join(b.dir, 'gerbers');
    if (existsSync(gerbers)) for (const f of walk(gerbers)) board.push(entry(`${b.folder}/gerbers/${relative(gerbers, f)}`, f));
    for (const [from, to] of [
      ['bom.csv', 'parts-list.csv'],
      ['PARTS.md', 'PARTS.md'],
    ]) {
      if (existsSync(join(b.dir, from))) writeFileSync(join(b.out, to), readFileSync(join(b.dir, from)));
    }
  }
  writeFileSync(join(out, 'README.md'), readFileSync(join(phone, 'README.md')));
  // the printer parts are served packed (the site zips them on a download: manual/printables/feelieItems.ts), every STL
  // the same bytes; the board files are not meshes, so their ZIP is served as it is
  writeFileSync(join(out, 'phone-3d-printer-parts.pack'), deflateRawSync(packFiles(stl), { level: 9 }));
  rmSync(join(out, 'phone-3d-printer-parts.zip'), { force: true });
  writeFileSync(join(out, 'phone-circuit-board.zip'), await createZip(board, new Date(2026, 0, 1)));
  console.log(`Phone downloads: ${stl.length} printer files, ${board.length} board files`);
}

await main();
