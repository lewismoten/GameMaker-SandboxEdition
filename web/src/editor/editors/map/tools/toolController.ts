// The map editor's newer tools: line, rectangle, select (copy, cut, paste), terrain, stamp and building, with their side panel.
import { h, clear, promptText, toast } from '../../../core/ui';
import { blockCanvas } from '../../../core/draw';
import type { Project } from '../../../core/project';
import { newId } from '../../../../project/storage';
import { MLEN } from '../../../../formats/map';
import type { Block } from '../../../../formats/blocks';
import type { Palette } from '../../../../formats/palette';
import { lineCells, rectCells, spanRect, type Cell, type CellRect } from './cellOps';
import { paintTerrain, pickBlock, type Terrain } from './autotile';
import { assembleBuilding, placeGrid, type Building } from './building';
import { captureStamp, mirrors, stampRows, transformStamp, type Mirrors, type Stamp, type Transform } from './stamps';
import { getClip, setClip } from './clipboard';
import { loadBrushes, saveBrush } from './brushStore';
import { renderBrushPanel } from './brushPanel';
import { editTerrain } from './terrainSetup';
import { editBuilding } from './buildingSetup';
import { drawPreview, type SetupCtx } from './setupKit';
import type { OverlayState } from './overlay';

export type ToolMode = 'line' | 'rect' | 'select' | 'terrain' | 'stamp' | 'building' | 'paste';

/** What the tools need from the map editor. */
export interface MapHost {
  project: Project;
  blocksArr: Uint8Array;
  bbl: () => string;
  blocks: () => Block[];
  palette: () => Palette;
  imgs: () => HTMLCanvasElement[];
  brush: () => number;
  /** Call before a change, for undo. */
  remember: () => void;
  /** Cells changed (indexes): draw them and save. */
  changed: (cells: number[]) => void;
  overlay: OverlayState;
  drawOverlay: () => void;
  /** Switch the editor to a tool (the toolbar follows). */
  setMode: (m: ToolMode) => void;
}

type Shape = Pick<Stamp, 'w' | 'h' | 'cells'>;

export class MapTools {
  mode: ToolMode | undefined;
  private start?: Cell;
  private last?: Cell;
  private down = false;
  private erase = false;
  private outline = false;
  private terrainId?: string;
  private stampId?: string;
  private buildingId?: string;
  /** The stamp (or pasted blocks) as it will be placed: flipped or turned. */
  private held?: Shape;
  private mirrorCache?: { blocks: Block[]; m: Mirrors };

  constructor(
    private host: MapHost,
    readonly panel: HTMLElement,
  ) {}

  private get ctx(): SetupCtx {
    return { blocks: this.host.blocks(), palette: this.host.palette(), imgs: this.host.imgs() };
  }

  private get mirrors(): Mirrors {
    const blocks = this.host.blocks();
    if (this.mirrorCache?.blocks !== blocks) this.mirrorCache = { blocks, m: mirrors(blocks) };
    return this.mirrorCache.m;
  }

  terrains = () => loadBrushes<Terrain>(this.host.project, this.host.bbl(), 'terrains');
  stamps = () => loadBrushes<Stamp>(this.host.project, this.host.bbl(), 'stamps');
  buildings = () => loadBrushes<Building>(this.host.project, this.host.bbl(), 'buildings');

  /** Called when the editor switches tools (undefined: a tool of its own). */
  enter(mode: ToolMode | undefined): void {
    this.mode = mode;
    this.start = this.last = undefined;
    this.down = false;
    if (mode === 'stamp') this.held = this.stamps().find((s) => s.id === this.stampId);
    if (mode === 'paste') this.held = getClip();
    if (mode !== 'select') this.host.overlay.selection = undefined;
    this.host.overlay.ghost = undefined;
    this.host.overlay.outline = undefined;
    this.host.drawOverlay();
    this.renderPanel();
  }

  // ---- pointer -------------------------------------------------------------------------

  pointerDown(p: Cell, button: number): void {
    const m = this.mode;
    if (!m) return;
    this.down = true;
    this.start = this.last = p;
    if (m === 'terrain') {
      const t = this.terrain();
      if (!t) return this.noBrush();
      this.host.remember();
      this.host.changed(paintTerrain(this.host.blocksArr, t, [p], this.erase || button === 2));
    } else if (m === 'stamp' || m === 'paste') {
      if (!this.held) return this.noBrush();
      this.ghostAt(p);
    } else this.preview(p);
  }

  pointerMove(p: Cell, buttons: number): void {
    const m = this.mode;
    if (!m) return;
    if (!this.down) {
      if ((m === 'stamp' || m === 'paste') && this.held) this.ghostAt(p);
      return;
    }
    if (m === 'terrain') {
      const t = this.terrain();
      if (t && this.last) this.host.changed(paintTerrain(this.host.blocksArr, t, lineCells(this.last, p).slice(1), this.erase || (buttons & 2) !== 0));
    } else if (m === 'stamp' || m === 'paste') this.ghostAt(p);
    else this.preview(p);
    this.last = p;
  }

  pointerUp(p: Cell): void {
    const m = this.mode;
    if (!m || !this.down) return;
    this.down = false;
    const a = this.start ?? p;
    const r = spanRect(a, p);
    const blocks = this.host.blocksArr;
    if (m === 'line' || m === 'rect') {
      this.host.remember();
      const cells = m === 'line' ? lineCells(a, p) : rectCells(r, this.outline);
      const changed: number[] = [];
      for (const c of cells) {
        const i = c.y * MLEN + c.x;
        if (blocks[i] !== this.host.brush()) ((blocks[i] = this.host.brush()), changed.push(i));
      }
      this.host.overlay.outline = undefined;
      this.host.changed(changed);
    } else if (m === 'select') {
      this.host.overlay.outline = undefined;
      this.host.overlay.selection = r;
      this.renderPanel();
    } else if (m === 'building') {
      const b = this.building();
      this.host.overlay.ghost = undefined;
      if (!b) return this.noBrush();
      this.host.remember();
      this.host.changed(placeGrid(blocks, assembleBuilding(b, r.w, r.h), r.x, r.y));
    } else if ((m === 'stamp' || m === 'paste') && this.held) {
      const at = this.anchor(p, this.held);
      this.host.remember();
      this.host.changed(placeGrid(blocks, stampRows(this.held), at.x, at.y));
      this.ghostAt(p);
      return;
    }
    this.host.drawOverlay();
  }

  /** The pointer left the map: drop the ghost. */
  leave(): void {
    if (this.down) return;
    this.host.overlay.ghost = undefined;
    this.host.drawOverlay();
  }

  private preview(p: Cell): void {
    const a = this.start ?? p;
    const r = spanRect(a, p);
    const o = this.host.overlay;
    if (this.mode === 'line') o.outline = { cells: lineCells(a, p) };
    else if (this.mode === 'rect' || this.mode === 'select') o.outline = { rect: r };
    else if (this.mode === 'building') {
      const b = this.building();
      o.ghost = b ? { x: r.x, y: r.y, rows: assembleBuilding(b, r.w, r.h), ok: true } : undefined;
      o.outline = { rect: r };
    }
    this.host.drawOverlay();
  }

  private anchor(p: Cell, s: Shape): Cell {
    return { x: p.x - ((s.w - 1) >> 1), y: p.y - ((s.h - 1) >> 1) };
  }

  private ghostAt(p: Cell): void {
    if (!this.held) return;
    const at = this.anchor(p, this.held);
    this.host.overlay.ghost = { ...at, rows: stampRows(this.held), ok: true };
    this.host.drawOverlay();
  }

  private noBrush(): void {
    this.down = false;
    const what = this.mode === 'terrain' ? 'a terrain' : this.mode === 'building' ? 'a building' : this.mode === 'paste' ? 'something copied' : 'a stamp';
    toast(`Choose or make ${what} first (in the panel beside the map).`, 'error');
  }

  private terrain = () => this.terrains().find((t) => t.id === this.terrainId);
  private building = () => this.buildings().find((b) => b.id === this.buildingId);

  // ---- selection -----------------------------------------------------------------------

  get selection(): CellRect | undefined {
    return this.host.overlay.selection;
  }

  copy(cut = false): void {
    const r = this.selection;
    if (!r) return toast('Select an area first (the Select tool).', 'error');
    setClip({ ...captureStamp(this.host.blocksArr, r), bbl: this.host.bbl() });
    if (cut) this.fillSelection();
    toast(`${cut ? 'Cut' : 'Copied'} ${r.w}×${r.h} blocks. Paste them on any map with Ctrl+V.`);
  }

  paste(): void {
    if (!getClip()) return toast('Nothing copied yet: select an area and copy it first.', 'error');
    this.host.setMode('paste');
  }

  /** Fills the selection with the chosen block (cut, Delete). */
  fillSelection(): void {
    const r = this.selection;
    if (!r) return;
    this.host.remember();
    const g = Array.from({ length: r.h }, () => Array<number>(r.w).fill(this.host.brush()));
    this.host.changed(placeGrid(this.host.blocksArr, g, r.x, r.y));
  }

  async saveStamp(): Promise<void> {
    const r = this.selection;
    if (!r) return toast('Select an area first, then save it as a stamp.', 'error');
    const name = await promptText('Save as a stamp', 'Name (e.g. House, Tree)', 'Stamp');
    if (!name) return;
    const s: Stamp = { id: newId(), name, ...captureStamp(this.host.blocksArr, r) };
    saveBrush(this.host.project, this.host.bbl(), 'stamps', s);
    this.stampId = s.id;
    toast(`Saved the stamp “${name}”. Place it with the Stamp tool.`);
    this.host.setMode('stamp');
  }

  /** Esc: drop the selection or what is being placed. */
  cancel(): boolean {
    if (this.mode === 'paste') {
      this.host.setMode('select');
      return true;
    }
    if (this.host.overlay.selection || this.host.overlay.ghost) {
      this.host.overlay.selection = this.host.overlay.ghost = undefined;
      this.host.drawOverlay();
      this.renderPanel();
      return true;
    }
    return false;
  }

  turn(t: Transform): void {
    if (!this.held) return;
    const next = transformStamp(this.held, t, this.mirrors);
    if (!next) return toast('Some of these blocks have no mirror image in this set, so it can only be placed as it is.', 'error');
    this.held = next;
    this.host.overlay.ghost = undefined;
    this.host.drawOverlay();
  }

  // ---- the side panel ------------------------------------------------------------------

  renderPanel(): void {
    const m = this.mode;
    const p = this.panel;
    p.hidden = !m || m === 'line';
    if (p.hidden) return clear(p);
    const head = (t: string) => h('strong', null, t);
    if (m === 'rect') {
      const box = h('input', { type: 'checkbox', checked: this.outline, onchange: () => (this.outline = box.checked) });
      return clear(p, head('Rectangle'), h('label', { class: 'check' }, box, h('span', null, 'Outline only')));
    }
    if (m === 'select' || m === 'paste') {
      const has = !!this.selection;
      return clear(
        p,
        head(m === 'paste' ? 'Paste' : 'Selection'),
        h(
          'p',
          { class: 'meta' },
          m === 'paste'
            ? 'Click where the copied blocks go (Esc stops).'
            : has
              ? `${this.selection!.w}×${this.selection!.h} blocks selected.`
              : 'Drag over the map to select blocks.',
        ),
        h(
          'div',
          { class: 'toolbar mt-brush-actions' },
          h('button', { type: 'button', disabled: !has, onclick: () => this.copy(), title: 'Copy (Ctrl+C)' }, '⧉ Copy'),
          h('button', { type: 'button', disabled: !has, onclick: () => this.copy(true), title: 'Cut (Ctrl+X): leaves the chosen block' }, '✂ Cut'),
          h('button', { type: 'button', disabled: !getClip(), onclick: () => this.paste(), title: 'Paste (Ctrl+V), on this map or another' }, '📋 Paste'),
          h(
            'button',
            { type: 'button', disabled: !has, onclick: () => void this.saveStamp(), title: 'Keep these blocks as a stamp to place again' },
            '★ Save as stamp',
          ),
          h('button', { type: 'button', disabled: !has, onclick: () => this.fillSelection(), title: 'Fill with the chosen block (Delete)' }, '▣ Fill'),
        ),
        m === 'paste' ? this.turnBar() : null,
      );
    }
    if (m === 'terrain') {
      const list = this.terrains();
      if (!list.some((t) => t.id === this.terrainId)) this.terrainId = list[0]?.id;
      const box = h('input', { type: 'checkbox', checked: this.erase, onchange: () => (this.erase = box.checked) });
      const host = h('div', { class: 'stack' });
      renderBrushPanel(host, {
        kind: 'terrains',
        items: list,
        selected: this.terrainId,
        empty: 'No terrains yet. Make one from blocks you have: its fill, edges and corners.',
        thumb: (t) => this.thumb(t.tiles[t.kind === 'edges' ? 4 : 0] >= 0 ? t.tiles[t.kind === 'edges' ? 4 : 0] : pickBlock(t, 0xff)),
        onSelect: (t) => ((this.terrainId = t.id), this.renderPanel()),
        onNew: () => void this.editTerrain(),
        onEdit: (t) => void this.editTerrain(t),
        onDelete: (t) => (saveBrush(this.host.project, this.host.bbl(), 'terrains', t, true), this.renderPanel()),
      });
      return clear(
        p,
        head('Terrains'),
        host,
        h('label', { class: 'check', title: 'Or right-click' }, box, h('span', null, 'Erase (back to the ground block)')),
      );
    }
    if (m === 'stamp') {
      const list = this.stamps();
      if (!list.some((s) => s.id === this.stampId)) {
        this.stampId = list[0]?.id;
        this.held = list[0];
      }
      const host = h('div', { class: 'stack' });
      renderBrushPanel(host, {
        kind: 'stamps',
        items: list,
        selected: this.stampId,
        empty: 'No stamps yet. Use Select to drag over a house or a tree, then “Save as stamp”.',
        thumb: (s) => this.shapeThumb(s),
        onSelect: (s) => ((this.stampId = s.id), (this.held = s), this.renderPanel()),
        onNew: () => this.host.setMode('select'),
        onEdit: async (s) => {
          const name = await promptText('Rename stamp', 'Name', s.name);
          if (name) (saveBrush(this.host.project, this.host.bbl(), 'stamps', { ...s, name }), this.renderPanel());
        },
        onDelete: (s) => (saveBrush(this.host.project, this.host.bbl(), 'stamps', s, true), this.renderPanel()),
      });
      return clear(p, head('Stamps'), host, this.turnBar());
    }
    if (m === 'building') {
      const list = this.buildings();
      if (!list.some((b) => b.id === this.buildingId)) this.buildingId = list[0]?.id;
      const host = h('div', { class: 'stack' });
      renderBrushPanel(host, {
        kind: 'buildings',
        items: list,
        selected: this.buildingId,
        empty: 'No buildings yet. Make one from its parts (roof, walls, door, window), then drag out a rectangle to build it any size.',
        thumb: (b) => this.shapeThumb({ w: 3, h: 3, cells: assembleBuilding(b, 3, 3).flat() }),
        onSelect: (b) => ((this.buildingId = b.id), this.renderPanel()),
        onNew: () => void this.editBuilding(),
        onEdit: (b) => void this.editBuilding(b),
        onDelete: (b) => (saveBrush(this.host.project, this.host.bbl(), 'buildings', b, true), this.renderPanel()),
      });
      return clear(p, head('Buildings'), host);
    }
  }

  private turnBar(): HTMLElement {
    const can = (t: Transform) => !!this.held && !!transformStamp(this.held, t, this.mirrors);
    const btn = (t: Transform, label: string, title: string) =>
      h(
        'button',
        {
          type: 'button',
          disabled: !can(t),
          title: can(t) ? title : `${title}: these blocks have no mirror images in this set`,
          onclick: () => (this.turn(t), this.renderPanel()),
        },
        label,
      );
    return h(
      'div',
      { class: 'toolbar mt-brush-actions', role: 'group', 'aria-label': 'Flip or turn before placing' },
      btn('flipH', '⇋ Flip', 'Flip left to right'),
      btn('flipV', '⇵ Flip', 'Flip upside down'),
      btn('rotate', '↻ Turn', 'Turn a quarter clockwise'),
    );
  }

  private thumb(block: number): HTMLCanvasElement {
    const b = this.host.blocks()[block];
    return b ? blockCanvas(b.pixels, this.host.palette()) : h('canvas', { width: 20, height: 20 });
  }

  private shapeThumb(s: Shape): HTMLCanvasElement {
    const c = h('canvas', { class: 'pixel' });
    drawPreview(c, this.ctx, stampRows(s), 0, Math.max(2, Math.floor(40 / Math.max(s.w, s.h))));
    return c;
  }

  /** The block erasing a terrain should leave: the most common block on the map. */
  private ground(): number {
    const n = new Uint32Array(256);
    for (const b of this.host.blocksArr) n[b]++;
    return n.indexOf(Math.max(...n));
  }

  private async editTerrain(t?: Terrain): Promise<void> {
    const out = await editTerrain(this.ctx, t, this.ground());
    if (!out) return;
    saveBrush(this.host.project, this.host.bbl(), 'terrains', out);
    this.terrainId = out.id;
    this.renderPanel();
  }

  private async editBuilding(b?: Building): Promise<void> {
    const out = await editBuilding(this.ctx, b, this.ground());
    if (!out) return;
    saveBrush(this.host.project, this.host.bbl(), 'buildings', out);
    this.buildingId = out.id;
    this.renderPanel();
  }
}
