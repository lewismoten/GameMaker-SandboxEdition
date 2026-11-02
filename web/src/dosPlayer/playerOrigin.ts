// Where an imported game's player came from: the .gam's "importedPlayer" section of the companion
// (project/companion.ts), written once on import (archives' importPlayer.ts PlayerOrigin) and only
// read after: which Game-Maker build, stock or patched, its About page when its author changed it,
// and the raw bytes no DOS player setting explains. Read-only, because the About text is RSD's or
// the original author's attribution. The DOS export writes a 3.00 player's raw bytes back; Play's
// F10 shows the About page as that player drew it and the build the game was first made with.
import { getSection, type Companion } from '../project/companion';
import type { PlayerAbout } from '@lewismoten/gamemaker-sandbox-engine/engine/playerLook';
import type { PlayerPatches } from '@lewismoten/gamemaker-sandbox-engine/player/patchRules';
import type { PlayerOrigin } from '@lewismoten/gamemaker-sandbox-archives/project/importPlayer';

export const ORIGIN_SECTION = 'importedPlayer';

const isText = (v: unknown): v is string => typeof v === 'string';

/** The section's record, when it is one (a damaged one reads as none). */
export function companionOrigin(c: Companion | undefined, gam: string): PlayerOrigin | undefined {
  const r = c ? getSection<Partial<PlayerOrigin> | undefined>(c, gam, ORIGIN_SECTION, undefined) : undefined;
  if (!r || !isText(r.build) || !isText(r.label) || !isText(r.exe) || typeof r.size !== 'number') return undefined;
  const regions = Array.isArray(r.regions) ? r.regions.filter((x) => x && typeof x.offset === 'number' && isText(x.data)) : [];
  return {
    ...(r as PlayerOrigin),
    reasons: Array.isArray(r.reasons) ? r.reasons.filter(isText) : [],
    regions,
    importPatches: r.importPatches && typeof r.importPatches === 'object' ? r.importPatches : {},
    ...(Array.isArray(r.about) ? { about: r.about.filter(isText) } : {}),
  };
}

/** What the DOS export writes back into its 3.00 player: only a 3.00 import's raw bytes (offsets differ in other builds). */
export function keptParts(o: PlayerOrigin | undefined): { regions: PlayerOrigin['regions']; patches: PlayerPatches } | undefined {
  return o?.build === '3.00' && o.regions.length ? { regions: o.regions, patches: o.importPatches } : undefined;
}

/** "Game-Maker 2.02", or what is known when the build isn't. */
export function originText(o: PlayerOrigin): string {
  if (o.build !== 'unknown') return o.label.replace(/^Game-Maker 3\.00 \(PLAYGAME\.EXE\)$/, 'Game-Maker 3.00');
  return o.aboutAuthor ? 'Game-Maker (version unknown, about text replaced by its author)' : 'Game-Maker (version unknown)';
}

/** Words cut into lines of at most `width` characters. */
function wrap(text: string, width: number): string[] {
  const out: string[] = [];
  let line = '';
  for (const w of text.split(' ')) {
    if (line && line.length + 1 + w.length > width) {
      out.push(line);
      line = w;
    } else line = line ? `${line} ${w}` : w;
  }
  return line ? [...out, line] : out;
}

/** The y of each About line of 3.00's GMabout (PLAYGAME.C), its 22 strings in order: 14 on the first page, 8 on the second. */
const Y_300 = [
  [40, 48, 64, 72, 88, 96, 104, 112, 128, 136, 144, 152, 160, 168],
  [40, 48, 64, 72, 80, 96, 104, 112],
];

/**
 * The imported About page as pages of [y, text]: 3.00's lines where GMabout puts them; an older
 * build's (whose source isn't here) with the same first page and the rest 8 pixels apart, an
 * approximation of where it drew them.
 */
function aboutPagesOf(o: PlayerOrigin): [number, string][][] | undefined {
  const lines = o.about;
  if (!lines?.length) return undefined;
  if (o.build === '3.00' || o.build === '3.00-playgame') {
    let i = 0;
    return Y_300.map((ys) => ys.map((y): [number, string] => [y, lines[i++] ?? '']));
  }
  const first = Y_300[0].map((y, i): [number, string] => [y, lines[i] ?? '']);
  const rest = lines.slice(Y_300[0].length).map((t, i): [number, string] => [40 + i * 8 + (i >= 2 ? 8 : 0), t]);
  return [first, rest];
}

/** What Play's F10 shows of an imported player: its own About page (if changed) and the build the game was first made with. */
export function playerAbout(o: PlayerOrigin | undefined): PlayerAbout | undefined {
  if (!o) return undefined;
  const pages = aboutPagesOf(o);
  return { ...(pages ? { pages } : {}), origin: wrap(`Originally made with ${originText(o)}.`, 30) };
}
