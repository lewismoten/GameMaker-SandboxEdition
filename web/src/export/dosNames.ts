// DOS naming shared by validation and web exports; never imports the DOS ZIP writer.
import { cdName, normalize, type GameFiles } from '../project/files';
import { parseGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { parseBackdrop, parseSlideList } from '@lewismoten/gamemaker-sandbox-engine/formats/graphicScripts';
import { parseSoundSet } from '@lewismoten/gamemaker-sandbox-engine/formats/sound';

/** DOS 8.3 names that FAT and Game-Maker accept. */
export const DOS_NAME = /^[A-Z0-9_'\-~!@#$%^&()]{1,8}(\.[A-Z0-9_'\-~!@#$%^&()]{1,3})?$/;

export function dosNameProblems(names: string[]): string[] {
  return names.filter((n) => !DOS_NAME.test(n.toUpperCase()));
}

/** Stored name -> original DOS name, including the CD's ISO 9660 name substitutions. */
export function dosNames(files: GameFiles, gam: string): Map<string, string> {
  const wanted = gameRefs(files, gam);
  const names = new Set(files.names());
  const out = new Map<string, string>();
  for (const w of wanted) if (!names.has(w) && names.has(cdName(w))) out.set(cdName(w), w);
  return out;
}

/** Every referenced game, backdrop, slide-list and sound-set name, normalized. */
export function gameRefs(files: GameFiles, gam: string): Set<string> {
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
  return wanted;
}
