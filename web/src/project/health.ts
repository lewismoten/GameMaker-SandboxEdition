// Game health check: finds what would stop a game from playing as intended — files its
// scenes name that are not there, links into scenes that don't exist, names DOS can't
// use, empty files, and (deep check) files that can't be read. Used by the home page's
// ⚠ badges and report; pure, so it is tested in test/health.test.ts.
import { fileSlotsFor, GRAPHIC_EXTS, NOSCENE, parseGame, sceneKind, slotExtensions, type Game } from '../formats/game';
import { parseBackdrop, parseSlideList } from '../formats/graphicScripts';
import { parsePalette } from '../formats/palette';
import { parseBlocks } from '../formats/blocks';
import { parseMonsters } from '../formats/monster';
import { parseCharacter } from '../formats/character';
import { parseMap } from '../formats/map';
import { parseSoundSet } from '../formats/sound';
import { decodeGif } from '../formats/gif';
import { parseFli } from '../formats/fli';
import { parseCmf } from '../formats/cmf';
import { decodeVoc } from '../formats/voc';
import { parseRecording } from '../formats/recording';
import { cdName, normalize } from './files';

export type Severity = 'error' | 'warning';

export interface Issue {
  severity: Severity;
  /** What kind of problem, for grouping in the report. */
  kind: 'missing' | 'link' | 'name' | 'empty' | 'unreadable' | 'game';
  /** The file the problem is in or about. */
  file?: string;
  message: string;
}

/** What the check needs to know about a game's files. Contents may be partial (see `get`). */
export interface FileSource {
  names(): string[];
  /** Contents, when known. A quick check only loads the .gam, .lst and .bkd files. */
  get(name: string): Uint8Array | undefined;
  /** Size in bytes, when known without loading. */
  byteSize?(name: string): number | undefined;
}

/** The files a game might need to be checked quickly: the .gam and graphic scripts. */
export const QUICK_CHECK_FILE = /\.(gam|lst|bkd)$/i;

/** DOS 8.3 names (the CD's underscore spellings are fine too). */
export function validDosName(name: string): boolean {
  return /^[a-z0-9_\-~!@#$%^&()']{1,8}\.[a-z0-9_]{0,3}$/i.test(name) || /^[a-z0-9_\-~!@#$%^&()']{1,8}$/i.test(name);
}

/** The stored file a game's reference opens, the way GameFiles.resolve finds it. */
function resolver(src: FileSource): (name: string) => string | undefined {
  const names = new Set(src.names());
  return (name) => {
    const n = normalize(name);
    if (names.has(n)) return n;
    const c = cdName(name);
    return names.has(c) ? c : undefined;
  };
}

const PARSERS: Record<string, (b: Uint8Array) => unknown> = {
  pal: parsePalette,
  bbl: (b) => parseBlocks(b, 150),
  mbl: (b) => parseBlocks(b, 100),
  cbl: (b) => parseBlocks(b, 50),
  mon: parseMonsters,
  chr: parseCharacter,
  map: parseMap,
  snd: parseSoundSet,
  gif: decodeGif,
  fli: parseFli,
  cmf: parseCmf,
  voc: decodeVoc,
  rec: parseRecording,
  lst: parseSlideList,
  bkd: parseBackdrop,
};

const ext = (name: string) => (/\.([^.]+)$/.exec(name)?.[1] ?? '').toLowerCase();

function sceneName(game: Game, i: number): string {
  const s = game.scenes[i];
  const kind = sceneKind(s);
  if (kind === 'start') return 'the title scene';
  if (kind === 'end') return 'the game-over scene';
  return `scene ${i}${s.desc ? ` “${s.desc}”` : ''}`;
}

/**
 * Checks a game. `deep` also reads every file with its format's reader (needs all
 * contents in `src`); without it only names, sizes and the .gam/.lst/.bkd files are used.
 */
export function checkGame(src: FileSource, gam: string | undefined, opts: { deep?: boolean } = {}): Issue[] {
  const issues: Issue[] = [];
  const find = resolver(src);
  const names = src.names();
  /** Files the game opens (by stored name). */
  const used = new Set<string>();

  for (const n of names) {
    if (!validDosName(n))
      issues.push({
        severity: 'warning',
        kind: 'name',
        file: n,
        message: `“${n}” is not a DOS file name (up to 8 letters, a dot, up to 3 more); DOS Game-Maker can’t open it.`,
      });
    const size = src.byteSize?.(n) ?? src.get(n)?.length;
    if (size === 0) issues.push({ severity: 'warning', kind: 'empty', file: n, message: `${n} is empty (0 bytes).` });
  }

  const gamFile = gam ? find(gam) : names.find((n) => n.endsWith('.gam'));
  if (!gamFile) {
    issues.push({
      severity: 'error',
      kind: 'game',
      file: gam,
      message: gam ? `The game file ${gam} is missing.` : 'There is no .gam file, so the game can’t be played.',
    });
    return issues;
  }
  const gamBytes = src.get(gamFile);
  let game: Game | undefined;
  if (gamBytes) {
    try {
      game = parseGame(gamBytes);
    } catch (e) {
      issues.push({ severity: 'error', kind: 'unreadable', file: gamFile, message: `${gamFile} can’t be read: ${(e as Error).message}` });
    }
  }

  if (game) {
    if (!game.scenes.length || sceneKind(game.scenes[0]) !== 'start')
      issues.push({ severity: 'error', kind: 'game', file: gamFile, message: `${gamFile} has no title scene, so the game can’t start.` });
    game.scenes.forEach((s, i) => {
      if (sceneKind(s) === 'unused') return;
      const slots = fileSlotsFor(s);
      const exts = slotExtensions(s);
      s.files.forEach((f, slot) => {
        const name = f?.trim();
        if (!name || slot >= slots.length) return;
        const where = `${sceneName(game!, i)}, ${slots[slot].toLowerCase()}`;
        const hit = find(name);
        if (hit) used.add(hit);
        if (!hit) {
          issues.push({ severity: 'error', kind: 'missing', file: normalize(name), message: `${normalize(name)} is missing (${where}).` });
          return;
        }
        const want = exts[slot];
        const e = ext(name);
        if (want && !(want === 'graphic' ? GRAPHIC_EXTS.includes(e) : e === want))
          issues.push({
            severity: 'warning',
            kind: 'game',
            file: normalize(name),
            message: `${normalize(name)} is in the ${slots[slot].toLowerCase()} slot of ${sceneName(game!, i)}, which expects a .${want === 'graphic' ? 'gif/.fli/.lst/.txt/.bkd' : want} file.`,
          });
      });
      s.links.forEach((l, li) => {
        if (l.toScene === NOSCENE || li >= s.numLinks) return;
        const to = game!.scenes[l.toScene];
        if (!to || sceneKind(to) === 'unused')
          issues.push({
            severity: 'error',
            kind: 'link',
            file: gamFile,
            message: `Link ${li + 1} of ${sceneName(game!, i)} leads to scene ${l.toScene}, which doesn’t exist.`,
          });
      });
    });
  }

  // Graphic scripts name other pictures.
  for (const n of names) {
    const bytes = src.get(n);
    if (!bytes) continue;
    try {
      if (n.endsWith('.lst')) {
        for (const entry of parseSlideList(bytes))
          if (find(entry.name)) used.add(find(entry.name)!);
          else
            issues.push({
              severity: 'error',
              kind: 'missing',
              file: normalize(entry.name),
              message: `${normalize(entry.name)} is missing (shown by the slide list ${n}).`,
            });
      } else if (n.endsWith('.bkd')) {
        const { gif } = parseBackdrop(bytes);
        if (gif && find(gif)) used.add(find(gif)!);
        else if (gif) issues.push({ severity: 'error', kind: 'missing', file: normalize(gif), message: `${normalize(gif)} is missing (drawn by ${n}).` });
      }
    } catch {
      /* reported by the deep check */
    }
  }

  if (opts.deep) {
    for (const n of names) {
      const parse = PARSERS[ext(n)];
      const bytes = src.get(n);
      if (!bytes) {
        issues.push({ severity: 'error', kind: 'unreadable', file: n, message: `${n} could not be loaded.` });
        continue;
      }
      if (!parse || !bytes.length || n === gamFile) continue;
      try {
        parse(bytes);
      } catch (e) {
        // Leftovers the game never opens (the CD has a few) can't break it.
        const note = used.has(n) ? '' : ' The game doesn’t use it.';
        issues.push({
          severity: used.has(n) ? 'error' : 'warning',
          kind: 'unreadable',
          file: n,
          message: `${n} can’t be read: ${(e as Error).message.replace(/\.$/, '')}.${note}`,
        });
      }
    }
  }

  // The same missing file named in several places: keep one line per place, but no exact repeats.
  const seen = new Set<string>();
  return issues.filter((i) => !seen.has(i.message) && !!seen.add(i.message));
}

export function worstSeverity(issues: Issue[]): Severity | undefined {
  return issues.some((i) => i.severity === 'error') ? 'error' : issues.length ? 'warning' : undefined;
}
