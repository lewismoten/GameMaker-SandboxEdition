// The monster path editor's shared state: which path is open, the corner picked, the map and
// start it is drawn on, the walking preview, the panels' elements, and the calls each part makes
// back into the editor (monsterPathEditor.ts makes one per editor).
import type { Block } from '../../../formats/blocks';
import type { GameMap } from '../../../formats/map';
import { pathKind, type PathKind, type PathWalker } from './monsterPath';
import type { mapChoices, PathEditorOptions } from './monsterPathView';

export interface PathEd {
  readonly o: PathEditorOptions;
  /** 0: the path; 1: the attack path. */
  tab: 0 | 1;
  /** The picked corner's march index (-1 for none). */
  selected: number;
  playing: boolean;
  mapIdx: number;
  choices: ReturnType<typeof mapChoices>;
  map?: GameMap;
  bg: Block[];
  mapImgs: HTMLCanvasElement[];
  start: { x: number; y: number };
  walker?: PathWalker;
  hover?: { x: number; y: number };
  /** The map under the drawing, made again when the view, map or start changes. */
  mapLayer?: HTMLCanvasElement;
  spriteCache: Map<string, HTMLCanvasElement>;
  /** Draw again on the next frame. */
  dirty: boolean;
  /** The part of the drawing box on screen (blocks from the origin). */
  viewRect: { x0: number; y0: number; w: number; h: number };

  readonly canvas: HTMLCanvasElement;
  readonly pop: HTMLElement;
  readonly readout: HTMLElement;
  readonly tabsEl: HTMLElement;
  readonly toolbar: HTMLElement;
  readonly notice: HTMLElement;
  readonly side: HTMLElement;

  /** After a change to the monster: saved, the walk started over (unless `restart` is false) and the panels drawn again. */
  changed(restart?: boolean): void;
  restartWalker(): void;
  renderAll(): void;
  renderSide(): void;
  renderNumbers(): void;
  /** Zooms so the whole path (and the origin) fits, or to `width` blocks around `center`. */
  fitView(width?: number, center?: { x: number; y: number }): void;
  loadMap(): void;
  /** The start: where this monster is placed, unless one was picked for it. */
  defaultStart(): void;
}

export const mon = (ed: PathEd) => ed.o.monsters[ed.o.index()];
export const kind = (ed: PathEd): PathKind => pathKind(mon(ed), ed.tab);
export const path = (ed: PathEd) => mon(ed).march[ed.tab];

/** Where this monster sits on the map (every placed copy). */
export function placed(ed: PathEd): { x: number; y: number }[] {
  if (!ed.map) return [];
  return ed.map.monsters.filter((p) => p.monnum === ed.o.index()).map((p) => ({ x: p.curx, y: p.cury }));
}
