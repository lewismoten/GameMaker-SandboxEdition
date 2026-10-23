// "What uses this?": which scenes use a file, where a block appears (maps, monsters, the hero,
// other blocks), and which blocks paint with a palette color. Read only: nothing is changed.
import { normalize } from '../../project/files';
import { parseBlocks, BLOCK_COUNTS, BLOCK_SIZE, MONBL, type BlockKind } from '../../formats/blocks';
import { parseMap } from '../../formats/map';
import { parseMonsters } from '../../formats/monster';
import { parseCharacter, frameCount } from '../../formats/character';
import { ADVTYPE, ADV_FILES, START_FILES, END_FILES } from '../../formats/game';
import type { Project } from './project';
import { formatHash } from '../../urlState';

/** Opens another of the project's files in the workspace (as following a link to it would). */
export function openInEditor(project: Project, file: string): void {
  location.hash = formatHash(['p', project.id, file]);
}

export interface Use {
  /** The file it is found in (open it to see). */
  file: string;
  /** What it is, in a few words: "level 3 · map: 42 cells". */
  text: string;
  count: number;
}

/** A scene's name as the integrator shows it. */
export function sceneName(project: Project, i: number): string {
  const s = project.game().scenes[i];
  return s?.desc?.trim() || (i === 0 ? 'Start scene' : i === 1 ? 'End scene' : `Scene ${i}`);
}

/** The slot's name ("Map", "Title song"…) for a scene of its kind. */
export function slotName(project: Project, scene: number, slot: number): string {
  const s = project.game().scenes[scene];
  const names: readonly string[] = s?.gametype === ADVTYPE ? ADV_FILES : scene === 0 ? START_FILES : END_FILES;
  return names[slot] ?? `File ${slot + 1}`;
}

/** Every scene slot that names the file, as readable lines. */
export function sceneUses(project: Project, file: string): Use[] {
  return project.usesOf(file).map((u) => ({ file: project.gam, text: `${sceneName(project, u.scene)} · ${slotName(project, u.scene, u.slot).toLowerCase()}`, count: 1 }));
}

/** The level scenes that use `file` in `slot`, with the file each has in `other`. */
function partners(project: Project, file: string, slot: number, other: number): { scene: number; file: string }[] {
  const n = normalize(file);
  const out: { scene: number; file: string }[] = [];
  project.game().scenes.forEach((s, i) => {
    const f = s.files[other] && normalize(s.files[other]);
    if (s.gametype === ADVTYPE && normalize(s.files[slot] ?? '') === n && f && project.files.has(f) && !out.some((o) => o.file === f)) out.push({ scene: i, file: f });
  });
  return out;
}

/** A monster's animation blocks, up to the end marker (100 or more). */
const picsOf = (pic: [number, number][]) => {
  const end = pic.findIndex(([b]) => b >= MONBL);
  return (end < 0 ? pic : pic.slice(0, end)).map(([b]) => b);
};

function tryParse<T>(fn: () => T): T | undefined {
  try {
    return fn();
  } catch {
    return undefined;
  }
}

/** Where block `index` of a block set is used: the maps, monsters or heroes of the scenes that use the set, and its own set's chains. */
export function blockUses(project: Project, file: string, index: number): Use[] {
  const kind = file.split('.').pop()!.toLowerCase() as BlockKind;
  const out: Use[] = [];
  const get = (f: string) => project.files.get(f)!;
  if (kind === 'bbl') {
    for (const p of partners(project, file, 2, 1)) {
      const m = tryParse(() => parseMap(get(p.file)));
      const count = m ? m.blocks.reduce((n, b) => n + (b === index ? 1 : 0), 0) : 0;
      if (count) out.push({ file: p.file, text: `${p.file} (${sceneName(project, p.scene)}): ${count} cell${count === 1 ? '' : 's'}`, count });
    }
    const raw = get(file);
    const blocks = parseBlocks(raw, Math.max(BLOCK_COUNTS.bbl, Math.ceil(raw.length / BLOCK_SIZE)));
    blocks.forEach((b, i) => {
      if (i === index) return;
      const how = [b.nextBl === index && 'changes into it', b.touchBl === index && 'becomes it when touched'].filter(Boolean).join(', ');
      if (how) out.push({ file, text: `Block ${i} ${how}`, count: 1 });
    });
    for (const p of partners(project, file, 2, 5)) {
      const c = tryParse(() => parseCharacter(get(p.file)));
      const inv = c ? [...c.inv].filter((v) => v === index).length : 0;
      if (inv) out.push({ file: p.file, text: `${p.file}: in the starting inventory`, count: inv });
    }
  } else if (kind === 'mbl') {
    for (const p of partners(project, file, 4, 3)) {
      const mons = tryParse(() => parseMonsters(get(p.file))) ?? [];
      const which = mons.flatMap((m, i) => (m.used && picsOf(m.pic).includes(index) ? [i] : []));
      if (which.length) out.push({ file: p.file, text: `${p.file}: monster${which.length === 1 ? '' : 's'} ${which.join(', ')}`, count: which.length });
    }
  } else if (kind === 'cbl') {
    for (const p of partners(project, file, 6, 5)) {
      const c = tryParse(() => parseCharacter(get(p.file)));
      let count = 0;
      c?.sequences.forEach((s) =>
        s.frames.slice(0, frameCount(s)).forEach((f) => {
          if (f.pic2 === MONBL) return; // fires a monster
          count += (f.pic1 === index ? 1 : 0) + (f.pic2 === index ? 1 : 0);
        }),
      );
      if (count) out.push({ file: p.file, text: `${p.file}: ${count} frame part${count === 1 ? '' : 's'}`, count });
    }
  }
  return out;
}

/** The block sets shown with a palette: those of the scenes that use it, else every set it is the fallback for. */
export function blockSetsFor(project: Project, pal: string): string[] {
  const n = normalize(pal);
  const sets = new Set<string>();
  for (const s of project.game().scenes)
    if (s.gametype === ADVTYPE && normalize(s.files[0] ?? '') === n) for (const slot of [2, 4, 6]) s.files[slot] && project.files.has(normalize(s.files[slot])) && sets.add(normalize(s.files[slot]));
  if (!sets.size)
    for (const k of ['bbl', 'mbl', 'cbl'] as const) for (const f of project.files.byExtension(k)) if (project.paletteFor(f).source === n) sets.add(f);
  return [...sets];
}

/** Which blocks paint with `color`, set by set, among those shown with the palette. */
export function colorUses(project: Project, pal: string, color: number): Use[] {
  const out: Use[] = [];
  for (const f of blockSetsFor(project, pal)) {
    const kind = f.split('.').pop() as BlockKind;
    const raw = project.files.get(f)!;
    const blocks = parseBlocks(raw, Math.max(BLOCK_COUNTS[kind], Math.ceil(raw.length / BLOCK_SIZE)));
    const which = blocks.flatMap((b, i) => (b.pixels.includes(color) ? [i] : []));
    if (which.length) out.push({ file: f, text: `${f}: block${which.length === 1 ? '' : 's'} ${listRuns(which)}`, count: which.length });
  }
  return out;
}

/** 1, 2, 3, 7, 9, 10 → "1–3, 7, 9–10". */
export function listRuns(ns: number[]): string {
  const parts: string[] = [];
  for (let i = 0; i < ns.length; ) {
    let j = i;
    while (j + 1 < ns.length && ns[j + 1] === ns[j] + 1) j++;
    parts.push(j > i ? `${ns[i]}–${ns[j]}` : String(ns[i]));
    i = j + 1;
  }
  return parts.join(', ');
}
