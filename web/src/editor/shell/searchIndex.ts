// What Overview › Files search looks through, gathered once per open in the background:
// every file's name, the words inside text-bearing files (text screens, slide lists, the .gam's
// scene names, high-score names, the .snd's digital sound names, backdrops), the strings kept in
// the companion (key, joystick, counter and sound names, notes), and the DOS player's fields.
// It is built in slices so a 300-file game never blocks typing, and it is only imported when
// the search box is first used (the parsers and the player's patch table are loaded then).
import { kindOf, type FileKind, type Project } from '../core/project';
import { matchingParts, type Part } from './searchMatch';
import type { SearchGroup } from './searchGroups';

/** One thing a query can find. */
export interface SearchEntry {
  group: SearchGroup;
  /** Unique within the index. */
  id: string;
  title: string;
  parts: Part[];
  /** The file a card opens (files, text); for the companion, the file whose extras hold the string. */
  file?: string;
  kind?: FileKind;
  /** Companion strings the Controls tab edits open there instead of a file. */
  controls?: boolean;
  /** A DOS player field: its patch id and the screen's name. */
  patch?: string;
  screen?: string;
}

const MAX_COMPANION = 1500;
const slice = () => new Promise<void>((r) => setTimeout(r, 0));
const printable = (s: string) => /[\p{L}\p{N}]/u.test(s);

/** Text screens (.txt): one part per non-empty line. */
function textParts(bytes: Uint8Array, lines: (b: Uint8Array) => string[]): Part[] {
  return lines(bytes)
    .map((text, i) => ({ label: `Line ${i + 1}`, text: text.trim() }))
    .filter((p) => p.text);
}

async function fileEntries(project: Project, signal: { stale: boolean }): Promise<SearchEntry[]> {
  const out: SearchEntry[] = [];
  const [gfx, game, scores, sound] = await Promise.all([
    import('@lewismoten/gamemaker-sandbox-engine/formats/graphicScripts'),
    import('@lewismoten/gamemaker-sandbox-engine/formats/game'),
    import('@lewismoten/gamemaker-sandbox-engine/formats/highscore'),
    import('@lewismoten/gamemaker-sandbox-engine/formats/sound'),
  ]);
  let n = 0;
  for (const name of [...project.files.names()].sort()) {
    if (signal.stale) return out;
    const kind = kindOf(name);
    const label = name.toUpperCase();
    out.push({ group: 'files', id: `f:${name}`, title: label, parts: [{ label: 'Name', text: label }], file: name, kind });
    const bytes = project.files.get(name);
    if (bytes) {
      let parts: Part[] = [];
      try {
        if (kind === 'txt') parts = textParts(bytes, gfx.textLines);
        else if (kind === 'lst') parts = gfx.parseSlideList(bytes).map((e, i) => ({ label: `Slide ${i + 1}`, text: e.name }));
        else if (kind === 'bkd') parts = [{ label: 'Picture', text: gfx.parseBackdrop(bytes).gif }];
        else if (kind === 'his') parts = scores.parseHighScores(bytes).map((s, i) => ({ label: `Place ${i + 1}`, text: s.name }));
        else if (kind === 'snd') parts = sound.parseSoundSet(bytes).digital.map((d, i) => ({ label: `Sound ${i + 1}`, text: d }));
        else if (kind === 'gam') {
          parts = game.parseGame(bytes).scenes.map((s, i) => ({ label: `Scene ${i + 1} name`, text: s.desc }));
        }
      } catch {
        parts = [];
      }
      parts = parts.filter((p) => printable(p.text));
      if (parts.length) out.push({ group: 'text', id: `t:${name}`, title: label, parts, file: name, kind });
    }
    if (++n % 25 === 0) await slice();
  }
  return out;
}

const SKIP_SECTIONS = new Set(['controls', 'joystickButtons', 'dosPlayer']);

/** Every readable string in a JSON value, with the path it was found at. */
function strings(value: unknown, path: string, out: Part[], depth = 0): void {
  if (out.length > 200 || depth > 6) return;
  if (typeof value === 'string') {
    const t = value.trim();
    if (t.length > 1 && t.length <= 400 && printable(t) && !(t.length > 40 && !t.includes(' '))) out.push({ label: path, text: t });
  } else if (Array.isArray(value)) value.slice(0, 200).forEach((v, i) => strings(v, `${path} ${i + 1}`, out, depth + 1));
  else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) strings(v, path ? `${path} › ${k}` : k, out, depth + 1);
  }
}

async function companionEntries(project: Project): Promise<SearchEntry[]> {
  const out: SearchEntry[] = [];
  const { gameControls } = await import('../core/gameControls');
  const c = gameControls(project);
  let keyNames = new Map<string, string>();
  try {
    const { gameKeyMap } = await import('../keymap/keyMap');
    keyNames = new Map(gameKeyMap(project.files, project.gam).keys.map((k) => [String(k.scan), k.name]));
  } catch {
    /* keys keep their scan codes */
  }
  const add = (id: string, title: string, parts: Part[]) => {
    parts = parts.filter((p) => p.text.trim());
    if (parts.length) out.push({ group: 'controls', id: `c:${id}`, title, parts, file: project.gam, controls: true });
  };
  for (const [scan, k] of Object.entries(c.keys)) {
    add(`key${scan}`, `${keyNames.get(scan) ?? `Key ${scan}`} key`, [
      { label: 'Short', text: k.short },
      { label: 'Long', text: k.long },
    ]);
  }
  for (const [n, b] of Object.entries(c.joystick)) {
    add(`joy${n}`, `Joystick button ${n}`, [
      { label: 'Short', text: b?.short ?? '' },
      { label: 'Long', text: b?.long ?? '' },
    ]);
  }
  for (const [n, name] of Object.entries(c.counters))
    add(`ctr${n}`, Number(n) < 20 ? `Repetition counter ${Number(n) - 4}` : `Hidden counter ${Number(n) - 19}`, [{ label: 'Name', text: name }]);
  for (const [n, name] of Object.entries(c.sounds)) add(`snd${n}`, `Sound slot ${n}`, [{ label: 'Name', text: name }]);
  for (const [file, extras] of Object.entries(project.companion?.files ?? {})) {
    for (const [section, value] of Object.entries(extras)) {
      if (SKIP_SECTIONS.has(section) || out.length >= MAX_COMPANION) continue;
      const parts: Part[] = [];
      strings(value, '', parts);
      if (parts.length) {
        const kind = kindOf(file);
        out.push({ group: 'controls', id: `x:${file}:${section}`, title: `${file.toUpperCase()} · ${section}`, parts, file, kind });
      }
    }
  }
  return out;
}

async function playerEntries(project: Project): Promise<SearchEntry[]> {
  const [{ PATCHES }, { companionPatches }, { SCREEN_NAMES }] = await Promise.all([
    import('@lewismoten/gamemaker-sandbox-engine/player/patchTable'),
    import('../../dosPlayer/playerRecord'),
    import('../../dosPlayer/describePatches'),
  ]);
  const patches = companionPatches(project.companion, project.gam);
  return PATCHES.map((e) => {
    const stock = 'stock' in e ? String(Array.isArray(e.stock) ? e.stock.join(', ') : e.stock).trimEnd() : '';
    const set = patches[e.id];
    const value = set === undefined ? stock : Array.isArray(set) ? set.join(', ') : String(set);
    const parts: Part[] = [
      { label: 'Field', text: e.label },
      { label: 'Value', text: value },
    ];
    if (value !== stock) parts.push({ label: 'Default', text: stock });
    return { group: 'player', id: `p:${e.id}`, title: SCREEN_NAMES[e.screen], parts, patch: e.id, screen: e.screen } satisfies SearchEntry;
  }).filter((e) => e.parts.some((p) => p.text));
}

/** Builds the index; `signal.stale` set true stops a build whose game has changed. */
export async function buildIndex(project: Project, signal: { stale: boolean }): Promise<SearchEntry[]> {
  const files = await fileEntries(project, signal);
  await slice();
  const companion = await companionEntries(project);
  await slice();
  const player = await playerEntries(project);
  return [...files, ...companion, ...player];
}

/** The entries a query finds, grouped in display order; each hit lists the parts that matched. */
export function search(index: SearchEntry[], words: string[]): Record<SearchGroup, { entry: SearchEntry; hits: Part[] }[]> {
  const out: Record<SearchGroup, { entry: SearchEntry; hits: Part[] }[]> = { files: [], text: [], controls: [], player: [] };
  if (!words.length) return out;
  for (const entry of index) {
    const hits = matchingParts(entry.parts, words);
    if (hits.length) out[entry.group].push({ entry, hits });
  }
  return out;
}
