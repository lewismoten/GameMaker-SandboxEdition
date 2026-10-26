// The map editor's link markers: a button on the map for every way in (where one of the
// integrator's links lands the hero on this map) and every exit (where touching a block follows
// a link out). Drag one, or nudge it with the arrow keys, to move its block; click it, or press
// Enter, for its details (linkPopover.ts, loaded when first opened). Every change is a change to
// the .gam through Project.saveGame, the integrator's own way, and the map editor's Undo takes
// it back (map.ts keeps the .gam's bytes in that step).
import './linkMarkers.css';
import { h, toast } from '../../../core/ui';
import type { Project } from '../../../core/project';
import type { Game, Point } from '../../../../formats/game';
import { addLink, nextScene, setFrom, setTo } from '../../integrator/linkEdits';
import { waysInto } from '../../integrator/linkSpots';
import { cellAtPoint, mapMarkers, markerBox, nudge, stackIndex, type Marker } from './markerMath';

interface MarkersHost {
  project: Project;
  /** The scenes that play this map. */
  scenes: readonly number[];
  /** What the markers sit over: the map canvas, in its positioned wrapper. */
  canvas: HTMLCanvasElement;
  /** A block's size on screen now. */
  block(): number;
  /** Called just before a link changes: the map editor keeps an Undo step (map and .gam). */
  remember(): void;
  /** The links changed: redraw the map's squares under the markers. */
  redraw(): void;
}

/** What the popover needs to change links (linkPopover.ts). */
export interface LinkEditor {
  project: Project;
  scenes: readonly number[];
  /** Changes the .gam as one Undo step (steps with the same key in quick succession join). */
  edit(key: string, fn: (game: Game) => void): void;
  readonly locked: boolean;
}

/** How long apart two changes with the same key may come and still be one Undo step. */
const JOIN_MS = 700;

export function linkMarkers(host: MarkersHost) {
  const { project } = host;
  const locked = !!project.readOnly;
  const layer = h('div', { class: 'lk-layer' });
  host.canvas.parentElement?.append(layer);
  const els = new Map<string, HTMLButtonElement>();
  let marks: Marker[] = [];
  let shown = true;
  let last = { key: '', at: 0 };
  let popover: { close(): void; refresh(): void } | undefined;

  const editor: LinkEditor = {
    project,
    scenes: host.scenes,
    locked,
    edit(key, fn) {
      if (locked) return;
      const game = structuredClone(project.game());
      fn(game);
      const now = Date.now();
      if (key !== last.key || now - last.at > JOIN_MS) host.remember();
      last = { key, at: now };
      project.saveGame(game);
    },
  };

  const place = (el: HTMLElement, at: Point, stack: number) => {
    const b = markerBox(at, host.block(), stack);
    Object.assign(el.style, { left: `${b.left}px`, top: `${b.top}px`, width: `${b.size}px`, height: `${b.size}px` });
  };

  /** Moves a marker's block: a way in's To, an exit's From. */
  const moveTo = (m: Marker, at: Point) =>
    editor.edit(`move:${m.key}`, (g) => (m.kind === 'in' ? setTo(g, m.way.from, m.way.link, at) : setFrom(g, m.exit.scene, m.exit.link, at)));

  function render(): void {
    marks = shown ? mapMarkers(project.game(), host.scenes) : [];
    const keep = new Set(marks.map((m) => m.key));
    for (const [k, el] of els)
      if (!keep.has(k)) {
        el.remove();
        els.delete(k);
      }
    marks.forEach((m, i) => {
      let el = els.get(m.key);
      if (!el) {
        el = button(m.key);
        els.set(m.key, el);
        layer.append(el);
      }
      const won = m.kind === 'out' && m.exit.ending === 'won';
      el.className = `lk-mark lk-${m.kind}${m.kind === 'in' && m.start ? ' lk-start' : ''}${won ? ' lk-won' : ''}${
        m.kind === 'out' && m.exit.shadowedBy !== undefined ? ' lk-hidden' : ''
      }`;
      el.textContent = m.kind === 'in' ? (m.start ? '★' : '↘') : won ? '⚑' : '↗';
      el.setAttribute('aria-label', m.label);
      el.title = `${m.label}${locked ? '' : '. Drag or use the arrow keys to move it'}; click or Enter for details`;
      place(el, m.at, stackIndex(marks, i));
    });
    popover?.refresh();
  }

  /** One marker's button; it finds its marker by key each time (the links change under it). */
  function button(key: string): HTMLButtonElement {
    const el = h('button', { type: 'button', class: 'lk-mark' });
    const mark = () => marks.find((m) => m.key === key);
    el.addEventListener('pointerdown', (e) => {
      const m = mark();
      if (!m || e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      el.focus({ preventScroll: true });
      el.setPointerCapture(e.pointerId);
      const from = m.at;
      let to = from;
      const move = (ev: PointerEvent) => {
        if (locked) return;
        to = cellAtPoint(ev.clientX, ev.clientY, host.canvas.getBoundingClientRect());
        place(el, to, 0);
        el.classList.toggle('lk-dragging', to.x !== from.x || to.y !== from.y);
      };
      const up = () => {
        el.removeEventListener('pointermove', move);
        el.removeEventListener('pointerup', up);
        el.removeEventListener('pointercancel', up);
        el.classList.remove('lk-dragging');
        if (to.x !== from.x || to.y !== from.y) moveTo(m, to);
        else void open(key, el);
      };
      el.addEventListener('pointermove', move);
      el.addEventListener('pointerup', up);
      el.addEventListener('pointercancel', up);
    });
    el.addEventListener('keydown', (e) => {
      const m = mark();
      if (!m) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        void open(key, el);
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const at = nudge(m.at, e.key, e.shiftKey);
      if (!at && !e.key.startsWith('Arrow')) return;
      // arrows move the marker, never scroll the map under it
      e.preventDefault();
      e.stopPropagation();
      if (at && !locked) moveTo(m, at);
    });
    return el;
  }

  async function open(key: string, anchor: HTMLElement): Promise<void> {
    popover?.close();
    const { linkPopover } = await import('./linkPopover');
    const p = linkPopover(editor, key, {
      find: (k) => marks.find((m) => m.key === k),
      anchor: (k) => els.get(k) ?? anchor,
      closed: () => {
        if (popover === p) popover = undefined;
      },
    });
    popover = p;
  }

  const off = project.onChange((name) => {
    if (name !== project.gam) return;
    render();
    host.redraw();
  });

  return {
    render,
    /** Shows or hides the markers. */
    setShown(on: boolean): void {
      shown = on;
      layer.hidden = !on;
      if (!on) popover?.close();
      render();
    },
    /** Adds an exit at `at` from the map's first scene to the next level (else Game won), and puts the keyboard on it. */
    addExit(at: Point): void {
      const scene = host.scenes[0];
      if (scene === undefined) return toast('No scene plays this map yet: add it to a level in the integrator first.', 'error');
      const add = (g: Game) => {
        const to = nextScene(g, scene);
        return addLink(g, scene, to, at, waysInto(g, [to])[0]?.at ?? { x: 50, y: 50 });
      };
      // not right beside where the hero arrives (touching it there would leave at once)
      const near = (p: Point) =>
        mapMarkers(project.game(), host.scenes).some((m) => m.kind === 'in' && Math.abs(m.at.x - p.x) <= 2 && Math.abs(m.at.y - p.y) <= 2);
      for (let i = 0; i < 4 && near(at); i++) at = { x: at.x < 90 ? at.x + 4 : at.x - 4, y: at.y };
      if (add(structuredClone(project.game())) < 0) return toast('This level already has 20 exits, the most a scene can have.', 'error');
      let link = -1;
      editor.edit(`add:${Date.now()}`, (g) => (link = add(g)));
      const el = els.get(`out:${scene}:${link}`);
      el?.focus();
      if (el) void open(`out:${scene}:${link}`, el);
    },
    dispose(): void {
      off();
      popover?.close();
      layer.remove();
    },
  };
}
