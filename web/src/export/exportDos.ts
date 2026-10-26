// Builds a ZIP that runs under DOS/DOSBox: the game's files in their original formats,
// the CD's stand-alone player (XFERPLAY.EXE) renamed after the .gam file, the Sound
// Blaster voice driver, a CONFIG.BAT and instructions.
import { createZip, type ZipEntry } from '../project/zip';
import { cdName, normalize, type GameFiles } from '../project/files';
import { textBytes } from '../formats/binary';
import { parseGame } from '../formats/game';
import { parseBackdrop, parseSlideList } from '../formats/graphicScripts';
import { parseSoundSet } from '../formats/sound';
import { recordedAudioNotice, recordedClips } from './recordedAudio';
import { applyPlayerPatches } from '../dosPlayer/applyPatches';
import type { PlayerPatches } from '../dosPlayer/patchRules';
import { playerChanges } from '../dosPlayer/describePatches';

interface DosExportOptions {
  title: string;
  gam: string;
  /** Where the built Game-Maker: Sandbox Edition app is served from (its dos/ folder is used). */
  appBase?: string;
  /** The project's DOS player customizations (dosPlayer/playerRecord.ts), written into its copy of XFERPLAY.EXE. */
  player?: PlayerPatches;
}

/** DOS 8.3 names that FAT and Game-Maker accept. */
const DOS_NAME = /^[A-Z0-9_\-~!@#$%^&()]{1,8}(\.[A-Z0-9_\-~!@#$%^&()]{1,3})?$/;
// Our saved games are JSON, which DOS Game-Maker can't read; SAVNAMES.DAT lists them.
// A .gmx is the editor's companion (project/companion.ts), never one of the game's files.
export const WEB_ONLY = /^(game\d\.sav|savnames\.dat|.*\.gmx)$/i;

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
  const changes = playerChanges(opts.player ?? {});
  if (changes.length) player = applyPlayerPatches(player, opts.player!);
  // the setup screen's Help (CONFIG.BAT) reads CONFIG.HLP, which RSD's Transfer copied beside
  // the player; a build made before it was copied simply goes without. (XFERPLAY's F1 shows the
  // game's instructions and never reads GMHELP.TXT: only PLAYGAME.EXE, in Game-Maker, does.)
  const help: ZipEntry[] = [];
  if (!names.some((n) => n.toUpperCase() === 'CONFIG.HLP')) {
    const data = await fetchBytes(new URL('dos/config.hlp', base).href).catch(() => undefined);
    if (data) help.push({ name: 'CONFIG.HLP', data });
  }

  const entries: ZipEntry[] = [
    { name: exe, data: player },
    { name: 'SNDBLAST.DRV', data: driver },
    // Playgame shows its sound/video setup screen when run with "config".
    { name: 'CONFIG.BAT', data: textBytes(`@ECHO OFF\r\n${stem} config\r\n`) },
    ...help,
    ...stored.map((n) => ({ name: (renamed.get(n) ?? n).toUpperCase(), data: files.get(n)! })),
    // (beside the game's own README.TXT, if it has one, under another name)
    {
      name: names.some((n) => n.toUpperCase() === 'README.TXT') ? 'PLAYER.TXT' : 'README.TXT',
      data: textBytes(readme(opts.title, stem, recordedAudioNotice(recordedClips(files), 78, '  '), changes).replace(/\n/g, '\r\n')),
    },
  ];
  return { name: `${stem.toLowerCase()}-dos.zip`, zip: await createZip(entries), exe };
}

function readme(title: string, stem: string, audio: string | undefined, changes: string[]): string {
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
  F1 the game's instructions, F2 status, F3 music on/off, F4 sound on/off,
  F5 save, F6 load, Esc leaves a level. The game's own keys are in its
  instructions.

Made with Game-Maker by Recreational Software Designs, exported by Game-Maker: Sandbox Edition
(a modified fork of RSD Game-Maker 3.0: https://github.com/lewismoten/GameMaker-SandboxEdition).

Notices
  ${
    changes.length
      ? `${stem}.EXE is Game-Maker 3.00's XFERPLAY.EXE from the Game-Maker CD, customized
  by this game's author in Game-Maker: Sandbox Edition's DOS player panel. Only these
  changed (each the same length or shorter, in place):
${changes.map((c) => `    - ${c}`).join('\n')}
  CONFIG.HLP is its setup screen's help text, from the same CD.`
      : `${stem}.EXE is Game-Maker 3.00's XFERPLAY.EXE as it came on the Game-Maker CD, and
  CONFIG.HLP its setup screen's help text, from the same CD.`
  }
  Game-Maker's source code was released under the MIT License:

${MIT_NOTICE}

  ${stem}.EXE also holds Borland C++'s run-time library (Copyright 1991 Borland
  Intl.) and Creative's Sound Blaster FM music functions (Copyright (c) Creative
  Technology Pte Ltd, 1990), which it was built with. SNDBLAST.DRV is Creative's
  Sound Blaster voice driver (Copyright (c) Creative Technology Pte Ltd.,
  1989-1990. All rights reserved), included as Game-Maker's Transfer utility
  included it with every game. These parts are their owners' and are not
  covered by the MIT License. Sound Blaster is a trademark of Creative
  Technology Ltd.
${audio ? `\n${audio}\n` : ''}`;
}

/** Game-Maker's MIT License, as Andy Stone released the source (LICENSE). */
const MIT_NOTICE = `  Copyright (c) 2014 gandrewstone

  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in
  all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
  SOFTWARE.`;
