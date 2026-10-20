// Builds a ZIP that runs under DOS/DOSBox: the game's files in their original formats,
// the CD's stand-alone player (XFERPLAY.EXE) renamed after the .gam file, the Sound
// Blaster voice driver, a CONFIG.BAT and instructions.
import { createZip, type ZipEntry } from '../project/zip';
import { cdName, normalize, type GameFiles } from '../project/files';
import { textBytes } from '../formats/binary';
import { parseGame } from '../formats/game';
import { parseBackdrop, parseSlideList } from '../formats/graphicScripts';
import { parseSoundSet } from '../formats/sound';

export interface DosExportOptions {
  title: string;
  gam: string;
  /** Where the built Game-Maker Web app is served from (its dos/ folder is used). */
  appBase?: string;
}

/** DOS 8.3 names that FAT and Game-Maker accept. */
const DOS_NAME = /^[A-Z0-9_\-~!@#$%^&()]{1,8}(\.[A-Z0-9_\-~!@#$%^&()]{1,3})?$/;
// Our saved games are JSON, which DOS Game-Maker can't read; SAVNAMES.DAT lists them.
const WEB_ONLY = /^(game\d\.sav|savnames\.dat)$/i;

export function dosNameProblems(names: string[]): string[] {
  return names.filter((n) => !DOS_NAME.test(n.toUpperCase()));
}

/**
 * Names to save files under for DOS: a game copied from the CD may hold A-J.BKD as
 * a_j.bkd (the CD's ISO 9660 name) while the game asks for A-J.BKD. Returns stored name ->
 * the name the game uses, for every such file the game refers to.
 */
export function dosNames(files: GameFiles, gam: string): Map<string, string> {
  const wanted = new Set<string>();
  const add = (n: string | undefined) => n && wanted.add(normalize(n));
  try {
    for (const scene of parseGame(files.get(gam)!).scenes) for (const f of scene.files) add(f);
  } catch {
    /* no or bad .gam: nothing to rename */
  }
  for (const n of [...wanted]) {
    const bytes = files.get(n);
    if (!bytes) continue;
    try {
      if (n.endsWith('.bkd')) add(parseBackdrop(bytes).gif);
      else if (n.endsWith('.lst')) for (const e of parseSlideList(bytes)) add(e.name);
      else if (n.endsWith('.snd')) for (const v of parseSoundSet(bytes).digital) if (v) add(`${v}.voc`);
    } catch {
      /* unreadable: leave its references alone */
    }
  }
  const names = new Set(files.names());
  const out = new Map<string, string>();
  for (const w of wanted) if (!names.has(w) && names.has(cdName(w))) out.set(cdName(w), w);
  return out;
}

async function fetchBytes(url: string): Promise<Uint8Array> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not fetch ${url} (${res.status})`);
  return new Uint8Array(await res.arrayBuffer());
}

export async function exportDos(files: GameFiles, opts: DosExportOptions): Promise<{ name: string; zip: Uint8Array; exe: string }> {
  const stem = opts.gam.replace(/\.gam$/i, '').toUpperCase();
  if (!DOS_NAME.test(stem))
    throw new Error(
      `“${opts.gam}” is not a DOS file name (up to 8 letters or digits), so the game’s .EXE can’t be named after it. Rename the .gam file first.`,
    );
  const renamed = dosNames(files, opts.gam);
  const stored = files.names().filter((n) => !WEB_ONLY.test(n));
  const names = stored.map((n) => renamed.get(n) ?? n);
  const bad = dosNameProblems(names);
  if (bad.length) throw new Error(`These file names won’t work in DOS (use up to 8 letters or digits plus a 3 letter extension): ${bad.join(', ')}`);
  const exe = `${stem}.EXE`;
  if (names.some((n) => n.toUpperCase() === exe || n.toUpperCase() === 'SNDBLAST.DRV' || n.toUpperCase() === 'CONFIG.BAT')) {
    throw new Error(`The game already has a file named ${exe}, SNDBLAST.DRV or CONFIG.BAT; remove it first.`);
  }

  const base = opts.appBase ?? new URL('./', location.href).href;
  let player: Uint8Array;
  let driver: Uint8Array;
  try {
    player = await fetchBytes(new URL('dos/xferplay.exe', base).href);
    driver = await fetchBytes(new URL('dos/sndblast.drv', base).href);
  } catch {
    throw new Error('The DOS player is not part of this build (it is copied from cd/gm by "npm run games").');
  }

  const entries: ZipEntry[] = [
    { name: exe, data: player },
    { name: 'SNDBLAST.DRV', data: driver },
    // Playgame shows its sound/video setup screen when run with "config".
    { name: 'CONFIG.BAT', data: textBytes(`@ECHO OFF\r\n${stem} config\r\n`) },
    ...stored.map((n) => ({ name: (renamed.get(n) ?? n).toUpperCase(), data: files.get(n)! })),
    { name: 'README.TXT', data: textBytes(readme(opts.title, stem).replace(/\n/g, '\r\n')) },
  ];
  return { name: `${stem.toLowerCase()}-dos.zip`, zip: await createZip(entries), exe };
}

function readme(title: string, stem: string): string {
  return `${title}
${'='.repeat(title.length)}

A Game-Maker 3.00 game for DOS. ${stem}.EXE is Game-Maker's stand-alone player;
it plays ${stem}.GAM and the other files in this folder.

Play it in DOSBox (https://www.dosbox.com)
  1. Unzip this folder somewhere, for example C:\\GAMES\\${stem} or ~/games/${stem}.
  2. Start DOSBox and type:
       mount c <the folder you unzipped into>
       c:
       ${stem}
  3. The first time, a setup screen asks about your sound card and VGA card.
     For DOSBox choose "Sound Blaster", port 220, interrupt 7, and leave the
     VGA chip on "Auto-Detect". Run CONFIG to change these later.

Keys
  F1 help, F2 status, F3 music on/off, F4 sound on/off, F5 save, F6 load,
  Esc leaves a level. The game's own keys are in its instructions.

Made with Game-Maker by Recreational Software Designs, exported by Game-Maker: Sandbox Edition
(a modified fork of Game-Maker 3.0: https://github.com/lewismoten/GameMaker).
`;
}
