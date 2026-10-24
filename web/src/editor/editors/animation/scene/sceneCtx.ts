// What the animation maker's parts (stage, timeline, inspector) share: the scene, the
// selection, the frame shown, and one way to change the scene (as one undo step). Also the
// new items it adds, made from the game's own files.
import type { Project } from '../../../core/project';
import type { Palette } from '../../../../formats/palette';
import { parseMonsters } from '../../../../formats/monster';
import { newId, textItem, type ActorItem, type BlockItem, type Item, type Scene, type TextItem } from './sceneModel';

export type Selection = { kind: 'item'; id: string } | { kind: 'bg'; index: number } | { kind: 'scene' };

export interface SceneCtx {
  project: Project;
  scene(): Scene;
  /**
   * Changes the scene as one undo step and saves it. `rebuild` redraws the inspector too
   * (not wanted while typing in it).
   */
  change(fn: (s: Scene) => void, rebuild?: boolean): void;
  selection(): Selection;
  select(s: Selection): void;
  frame(): number;
  seek(f: number): void;
  /** The palette of the background shown at frame `f` (what text colors index). */
  paletteAt(f: number): Palette;
}

/** The item with this id and the track it is on. */
export function findItem(s: Scene, id: string): { item: Item; track: number } | undefined {
  for (let t = 0; t < s.tracks.length; t++) {
    const item = s.tracks[t].items.find((x) => x.id === id);
    if (item) return { item, track: t };
  }
  return undefined;
}

/** The block set a level uses with this file (slot `from` -> slot `to` of its scene), else the first of `ext`. */
export function partnerFile(project: Project, file: string, from: number, to: number, ext: string): string {
  const scene = project.game().scenes.find((s) => s.gametype === 10 && s.files[from]?.toLowerCase() === file.toLowerCase());
  return scene?.files[to] || project.files.byExtension(ext)[0] || '';
}

/** Monsters of a .mon that have a picture. */
export function monstersWithPictures(project: Project, mon: string): number[] {
  const b = project.files.get(mon);
  if (!b) return [];
  try {
    return parseMonsters(b).flatMap((m, i) => (m.pic[0][0] >= 0 && m.pic[0][0] < 100 ? [i] : []));
  } catch {
    return [];
  }
}

const span = (s: Scene, f: number) => ({ start: Math.min(f, s.frames - 1), end: s.frames });

export function newText(s: Scene, f: number, pal: Palette): TextItem {
  const light = brightest(pal);
  return textItem('HELLO!', { ...span(s, f), color: light, outline: darkest(pal), motion: 'slide-down', rate: 12, y: 80 });
}

export function newCharacter(project: Project, s: Scene, f: number): ActorItem | undefined {
  const chr = project.files.byExtension('chr')[0];
  if (!chr) return undefined;
  const { start, end } = span(s, f);
  return {
    id: newId(),
    kind: 'actor',
    start,
    end,
    source: { type: 'chr', chr, cbl: partnerFile(project, chr, 5, 6, 'cbl'), seq: -1 },
    path: [
      { f: 0, x: -20, y: 140 },
      { f: end - start - 1, x: 320, y: 140 },
    ],
    scale: 1,
    faces: 'right',
    mirror: true,
  };
}

export function newMonster(project: Project, s: Scene, f: number): ActorItem | undefined {
  const mon = project.files.byExtension('mon')[0];
  if (!mon) return undefined;
  return {
    id: newId(),
    kind: 'actor',
    ...span(s, f),
    source: { type: 'mon', mon, mbl: partnerFile(project, mon, 3, 4, 'mbl'), index: monstersWithPictures(project, mon)[0] ?? 0 },
    path: [{ f: 0, x: 140, y: 100 }],
    scale: 2,
    faces: 'right',
    mirror: true,
  };
}

export function newBlock(project: Project, s: Scene, f: number): BlockItem | undefined {
  const bbl = project.files.byExtension('bbl')[0];
  if (!bbl) return undefined;
  return { id: newId(), kind: 'block', ...span(s, f), bbl, block: 1, x: 150, y: 90, scale: 2 };
}

const luma = (p: Palette, i: number) => p[i * 3] * 3 + p[i * 3 + 1] * 6 + p[i * 3 + 2];
function brightest(p: Palette): number {
  let best = 0;
  for (let i = 1; i < 256; i++) if (luma(p, i) > luma(p, best)) best = i;
  return best;
}
function darkest(p: Palette): number {
  let best = 0;
  for (let i = 1; i < 256; i++) if (luma(p, i) < luma(p, best)) best = i;
  return best;
}
