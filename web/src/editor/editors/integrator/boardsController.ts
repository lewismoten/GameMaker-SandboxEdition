// The integrator's boards in use: the tab row (DOS layout and the editor's named boards), the
// group popover (click a stacked card to choose one of its scenes), the suggestions the author
// can accept or dismiss, and the moves between boards and groups. integrator.ts owns the game,
// the selection and the canvas; this owns which board is showing and keeps boardLayout.ts's data
// in the project's companion (editor-only: the .gam and DOS export are never touched).
import type { Game } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { fromCp437 } from '@lewismoten/gamemaker-sandbox-engine/text/cp437';
import { NOSCENE, type Point } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { arrangements, closeGaps, spreadOut, type Arrangement } from './integratorLayout';
import { h, clear, toast } from '../../core/ui';
import type { Project } from '../../core/project';
import { usedScenes, inRect, type BoardView, type Rect } from './board';
import {
  BOARDS_SECTION,
  BOARD_WORLD,
  addBoard,
  addGroup,
  addToGroup,
  clampBoardPos,
  dismiss,
  freeSpotOn,
  moveGroup,
  placeScene,
  readBoards,
  removeBoard,
  renameBoard,
  renameGroup,
  ungroup,
  type BoardNode,
  type BoardsData,
} from './boardLayout';
import { buildModel, nodeRect, paintModel, type BoardsModel, type Stub } from './boardPaint';
import { ACTIVE_BOARD_SECTION, activeBoardId } from './activeBoard';
import { suggestGroups } from './boardSuggest';

interface Host {
  project: Project;
  game: Game;
  board: HTMLCanvasElement;
  selected(): number;
  /** Selects scene `i` (and brings it into view). */
  select(i: number): void;
  draw(): void;
  fit(): void;
  /** The tool row and the side panel may need to change with the mode. */
  modeChanged(): void;
}

export function boardsController(c: Host) {
  const file = c.project.gam;
  const data: BoardsData = readBoards(c.project.extras(file, BOARDS_SECTION, undefined));
  // every game works on boards: one without any gets "All scenes" at its DOS positions (kept once something changes)
  if (!data.boards.length) data.boards.push({ id: 'all', name: 'All scenes' });
  /** What the author last saw, as text: the step Undo goes back to (and Redo forward to). */
  let current = JSON.stringify(data);
  const undoStack: string[] = [];
  const redoStack: string[] = [];
  let animating = false;
  /** The board showing. */
  let mode = activeBoardId(data, c.project.extras(file, ACTIVE_BOARD_SECTION, undefined)) ?? data.boards[0].id;
  let model: BoardsModel | undefined;
  let openGroup: string | undefined;
  /** Set by integrator.ts: the BoardView the canvas paints with. */
  let boardView: (() => BoardView) | undefined;
  const measureCtx = document.createElement('canvas').getContext('2d');
  const measure = (t: string) => {
    if (!measureCtx) return t.length * 6;
    measureCtx.font = '10px ui-monospace, Menlo, Consolas, monospace';
    return measureCtx.measureText(t).width;
  };
  const row = h('div', { class: 'toolbar grator-boards', role: 'group', 'aria-label': 'Boards' });
  const tabStrip = h('div', { role: 'tablist', 'aria-label': 'Boards', class: 'grator-tabs' });
  const pop = h('div', { class: 'grator-pop', role: 'dialog', 'aria-label': 'Scenes in this group', hidden: true });

  const on = () => data.boards.some((b) => b.id === mode);
  const rebuild = () => {
    model = on() ? buildModel(c.game, data, mode, measure) : undefined;
    return model;
  };
  const persist = () => {
    c.project.setExtras(file, BOARDS_SECTION, JSON.parse(JSON.stringify(data)));
    rebuild();
  };
  /** Keeps the change (the boards in the companion) and what Undo goes back to. */
  const save = () => {
    const now = JSON.stringify(data);
    if (now !== current) {
      undoStack.push(current);
      if (undoStack.length > 50) undoStack.shift();
      redoStack.length = 0;
      current = now;
    }
    persist();
  };
  function step(from: string[], to: string[]): void {
    const prev = from.pop();
    if (prev === undefined) return;
    to.push(current);
    current = prev;
    const back = readBoards(JSON.parse(prev));
    Object.assign(data, back);
    if (!data.boards.some((b) => b.id === mode)) mode = data.boards[0].id;
    persist();
    closePop();
    render();
    c.fit();
    c.draw();
  }
  const undoBoards = () => step(undoStack, redoStack);
  const redoBoards = () => step(redoStack, undoStack);
  const nodeAt = (x: number, y: number): BoardNode | undefined => {
    const m = model ?? rebuild();
    const sel = m?.nodeOf.get(c.selected());
    return m && [...m.nodes].sort((a, b) => Number(b === sel) - Number(a === sel)).find((n) => inRect(nodeRect(n), x, y));
  };
  const stubAt = (x: number, y: number): Stub | undefined => (model ?? rebuild())?.stubs.find((s) => inRect(s, x, y));

  function closePop(focus = false): void {
    openGroup = undefined;
    pop.hidden = true;
    if (focus) c.board.focus({ preventScroll: true });
  }
  function switchTo(id: string, scene?: number): void {
    mode = id;
    // remembered for next time (a look-only game keeps nothing; the same board again changes nothing)
    if (!c.project.readOnly && c.project.extras(file, ACTIVE_BOARD_SECTION, undefined) !== id) c.project.setExtras(file, ACTIVE_BOARD_SECTION, id);
    closePop();
    rebuild();
    render();
    c.modeChanged();
    if (scene !== undefined) c.select(scene);
    c.fit();
    c.draw();
  }
  /** Shows scene `i`: switches to its board when it is on another. */
  function reveal(i: number): void {
    const n = rebuild()?.nodeOf.get(i);
    if (n && n.board !== mode) switchTo(n.board);
  }

  /**
   * The scene to start on when the editor opens. A remembered board wins over the address's scene
   * (which usually just says what was last selected): the scene stays if it is on that board, else
   * the board's first card is chosen. Without a remembered board the scene's own board shows.
   */
  function settle(i: number): number {
    const m = rebuild();
    // (the editor is still being built: set the board directly, nothing to redraw yet)
    if (c.project.extras(file, ACTIVE_BOARD_SECTION, undefined) === undefined || !on()) {
      const n = m?.nodeOf.get(i);
      if (n) mode = n.board;
      return i;
    }
    if (m?.nodeOf.get(i)?.board === mode) return i;
    return m?.nodes.find((n) => n.board === mode)?.scenes[0] ?? i;
  }

  function showGroup(n: BoardNode): void {
    const g = n.group;
    if (!g) return closePop();
    openGroup = g.id;
    const r = nodeRect(n);
    const rename = h('input', { type: 'text', value: g.name, 'aria-label': 'Group name', maxLength: 60 });
    rename.addEventListener('change', () => {
      renameGroup(data, g.id, rename.value);
      save();
      c.draw();
    });
    clear(
      pop,
      h('div', { class: 'grator-pop-head' }, rename, h('button', { 'aria-label': 'Close', title: 'Close (Esc)', onclick: () => closePop(true) }, '×')),
      h(
        'ul',
        { class: 'grator-pop-list' },
        ...n.scenes.map((i) =>
          h(
            'li',
            null,
            h(
              'button',
              {
                class: i === c.selected() ? 'primary' : undefined,
                onclick: () => {
                  c.select(i);
                  closePop(true);
                },
              },
              `${i}  ${fromCp437(c.game.scenes[i].desc) || '(untitled)'}`,
            ),
          ),
        ),
      ),
      h(
        'div',
        { class: 'grator-pop-foot' },
        h(
          'button',
          {
            title: 'Show every scene of this group as its own card again',
            onclick: () => {
              ungroup(data, g.id);
              save();
              closePop(true);
              render();
              c.draw();
            },
          },
          'Ungroup',
        ),
      ),
    );
    // beside the card, in the board's corner of the screen
    const wrap = c.board.getBoundingClientRect();
    pop.hidden = false;
    pop.dataset.at = `${r.x},${r.y}`;
    placePop(r, wrap);
    pop.querySelector<HTMLButtonElement>('ul button')?.focus();
  }
  let toScreen: ((p: Point) => Point) | undefined;
  function placePop(r: Rect, wrap: DOMRect): void {
    const p = toScreen?.({ x: r.x + r.w, y: r.y }) ?? { x: 20, y: 20 };
    pop.style.left = `${Math.max(8, Math.min(wrap.width - 250, p.x + 8))}px`;
    pop.style.top = `${Math.max(8, Math.min(wrap.height - pop.offsetHeight - 8, p.y))}px`;
  }
  pop.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') (e.stopPropagation(), closePop(true));
  });
  c.board.addEventListener('keydown', (e) => {
    if (!on()) return;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') (e.shiftKey ? redoBoards : undoBoards)();
    else if (nudge(e)) e.stopImmediatePropagation();
    else if (e.key === 'Escape' && openGroup) closePop();
    else if (e.key === 'Enter') {
      const n = model?.nodeOf.get(c.selected());
      if (n?.group) showGroup(n);
    } else return;
    e.preventDefault();
  });

  function render(): void {
    const ids = data.boards.map((x) => x.id);
    const tabs = data.boards.map((x) =>
      h(
        'button',
        { role: 'tab', id: `grator-tab-${x.id}`, 'aria-selected': String(mode === x.id), tabIndex: mode === x.id ? 0 : -1, onclick: () => switchTo(x.id) },
        x.name,
      ),
    );
    clear(tabStrip, ...tabs);
    tabStrip.onkeydown = (e) => {
      const k = ids.indexOf(mode);
      const to = { ArrowRight: (k + 1) % ids.length, ArrowLeft: (k + ids.length - 1) % ids.length, Home: 0, End: ids.length - 1 }[e.key];
      if (to === undefined) return;
      e.preventDefault();
      switchTo(ids[to]);
      tabStrip.querySelector<HTMLElement>('[aria-selected="true"]')?.focus();
    };
    const tool = (label: string, title: string, run: () => void, face = label) => h('button', { 'aria-label': label, title, onclick: run }, face);
    const kids: (HTMLElement | null)[] = [
      tool(
        'Add a board',
        'Add a board: a named page in the editor’s own, much larger layout space. The positions saved in the game are not touched.',
        () => {
          const id = addBoard(data, `Board ${data.boards.length + 1}`);
          save();
          switchTo(id);
        },
        '+ Board',
      ),
    ];
    if (on()) {
      const b = data.boards.find((x) => x.id === mode)!;
      const name = h('input', { type: 'text', value: b.name, 'aria-label': 'Board name', maxLength: 40, class: 'grator-board-name' });
      name.addEventListener('change', () => {
        renameBoard(data, b.id, name.value);
        save();
        render();
        c.draw();
      });
      kids.push(name);
      const sel = c.selected();
      const here = model?.nodeOf.get(sel);
      const groups = data.groups.filter((g) => g.board === mode);
      const move = h(
        'select',
        { 'aria-label': `Move scene ${sel} to a board`, title: 'Move the selected scene to another board' },
        h('option', { value: '' }, 'Move scene to…'),
        ...data.boards.filter((x) => x.id !== here?.board).map((x) => h('option', { value: x.id }, x.name)),
      );
      move.addEventListener('change', () => {
        if (!move.value) return;
        // a free spot among the other board's own cards
        const taken = allNodes()
          .filter((n) => n.board === move.value)
          .map((n) => n.pos);
        placeScene(data, sel, move.value, freeSpotOn(taken));
        save();
        switchTo(move.value, sel);
      });
      const group = h(
        'select',
        { 'aria-label': `Group scene ${sel}`, title: 'Fold the selected scene into a stacked group card' },
        h('option', { value: '' }, 'Group scene…'),
        h('option', { value: '+' }, 'New group with this scene'),
        ...groups.filter((g) => !g.members.includes(sel)).map((g) => h('option', { value: g.id }, g.name)),
      );
      group.addEventListener('change', () => {
        if (!group.value) return;
        if (group.value === '+') addGroup(data, 'New group', mode, here?.pos ?? { x: 8, y: 8 }, [sel]);
        else addToGroup(data, group.value, sel);
        save();
        render();
        c.draw();
        const n = model?.nodeOf.get(sel);
        if (n) showGroup(n);
      });
      kids.push(
        move,
        group,
        tool(
          'Auto-arrange',
          'Lay this board’s scenes out by how they link, the start first and the end last, a group as one card (again for another layout)',
          () => arrange('auto'),
          '⇄ Auto-arrange',
        ),
        tool('Spread out', 'Move cards apart so none hides another, keeping your arrangement', () => arrange('spread'), '✥ Spread out'),
        tool('Close gaps', 'Bring cards closer together, keeping your arrangement', () => arrange('gaps'), '⇲ Close gaps'),
        tool('Undo board layout', 'Undo the last change to the boards: cards moved, boards added (Ctrl+Z on the board)', undoBoards, '↶ Layout'),
        tool('Redo board layout', 'Redo the last undone change to the boards (Ctrl+Shift+Z on the board)', redoBoards, '↷ Layout'),
        data.boards.length > 1
          ? h(
              'button',
              {
                title: `Delete this board; its scenes move to ${data.boards.find((x) => x.id !== mode)?.name ?? 'another board'}`,
                onclick: () => {
                  removeBoard(data, b.id);
                  save();
                  switchTo(data.boards[0].id);
                },
              },
              'Delete board',
            )
          : null,
      );
      const s = suggestGroups(
        c.game,
        usedScenes(c.game).filter((i) => model?.nodeOf.get(i)?.board === mode),
        new Set(data.groups.flatMap((g) => g.members)),
        data.dismissed,
      );
      if (s.length)
        kids.push(
          h(
            'details',
            { class: 'grator-suggest' },
            h('summary', null, `Suggested groups (${s.length})`),
            h(
              'ul',
              null,
              ...s.map((x) =>
                h(
                  'li',
                  null,
                  h('span', null, `${x.name} (${x.members.length}) · ${x.why} `),
                  h(
                    'button',
                    {
                      'aria-label': `Group ${x.name}`,
                      onclick: () => {
                        const at = model?.nodeOf.get(x.members[0])?.pos ?? { x: 8, y: 8 };
                        addGroup(data, x.name, mode, at, x.members);
                        save();
                        render();
                        c.draw();
                      },
                    },
                    'Group',
                  ),
                  h(
                    'button',
                    {
                      'aria-label': `Dismiss ${x.name}`,
                      onclick: () => {
                        dismiss(data, x.key);
                        save();
                        render();
                      },
                    },
                    'Dismiss',
                  ),
                ),
              ),
            ),
          ),
        );
    }
    clear(row, ...kids);
  }
  const allNodes = (): BoardNode[] => {
    const m = buildModel(c.game, data, data.boards[0].id, measure);
    return [...m.nodeOf.values()].filter((n, k, a) => a.indexOf(n) === k);
  };
  /** Moves this board's cards to `at` (a scene's new spot; a group follows its first member), sliding them unless motion is reduced. */
  function applyPositions(at: Map<number, Point>, nothing: string): void {
    const m = model;
    if (!m) return;
    const from = new Map(m.nodes.map((n) => [n.key, { ...n.pos }]));
    for (const n of m.nodes) {
      const p = at.get(n.scenes[0]);
      if (!p) continue;
      if (n.group) moveGroup(data, n.group.id, n.board, p);
      else placeScene(data, n.scenes[0], n.board, p);
    }
    const before = current;
    save();
    if (current === before) return toast(nothing);
    const moved = model!;
    const to = new Map(moved.nodes.map((n) => [n.key, { ...n.pos }]));
    c.fit();
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return c.draw();
    animating = true;
    const t0 = performance.now();
    const frame = (now: number) => {
      const k = Math.min(1, (now - t0) / 280);
      const e = k * (2 - k);
      for (const n of moved.nodes) {
        const a = from.get(n.key);
        const b = to.get(n.key);
        if (a && b) n.pos = { x: a.x + (b.x - a.x) * e, y: a.y + (b.y - a.y) * e };
      }
      if (k < 1) requestAnimationFrame(frame);
      else animating = false;
      c.draw();
    };
    requestAnimationFrame(frame);
  }
  /** The game as the arrange tools see it: this board's cards at their board spots (a group's links are all its members'), every other scene unused. */
  function boardGame(): Game {
    const nodes = model?.nodes ?? [];
    const first = new Map<number, number>();
    for (const n of nodes) for (const m of n.scenes) first.set(m, n.scenes[0]);
    const scenes = c.game.scenes.map((s, i) => {
      const n = nodes.find((x) => x.scenes[0] === i);
      if (!n) return { ...s, gametype: NOSCENE };
      const links = n.scenes
        .flatMap((m) => c.game.scenes[m].links)
        .map((l) => ({ ...l, toScene: first.get(l.toScene) ?? NOSCENE }))
        .filter((l) => l.toScene !== NOSCENE);
      return { ...s, pos: n.pos, links };
    });
    return { ...c.game, scenes };
  }
  let layouts: { list: Arrangement[]; k: number } | undefined;
  function arrange(kind: 'auto' | 'spread' | 'gaps'): void {
    if (!model) return;
    if (kind === 'spread') applyPositions(spreadOut(boardGame()), 'Nothing to spread: no card hides another.');
    else if (kind === 'gaps') applyPositions(closeGaps(boardGame()), 'Already close: no gaps to close.');
    else {
      if (layouts) layouts.k = (layouts.k + 1) % layouts.list.length;
      else layouts = { list: arrangements(boardGame()), k: 0 };
      if (layouts.list.length) applyPositions(layouts.list[layouts.k].positions, 'Already laid out that way.');
    }
  }
  /** Alt+arrow keys nudge the selected card (Shift: bigger steps). */
  function nudge(e: KeyboardEvent): boolean {
    const d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
    const n = model?.nodeOf.get(c.selected());
    if (!d || !n || !e.altKey) return false;
    const k = e.shiftKey ? 10 : 2;
    const q = clampBoardPos({ x: n.pos.x + d[0] * k, y: n.pos.y + d[1] * k });
    if (n.group) moveGroup(data, n.group.id, n.board, q);
    else placeScene(data, n.scenes[0], n.board, q);
    save();
    c.draw();
    return true;
  }

  render();
  rebuild();
  return {
    el: row,
    tabs: tabStrip,
    pop,
    on,
    /** Shows scene `i` from outside (the side list, the URL…). */
    reveal,
    settle,
    refresh: () => (rebuild(), render()),
    /** The BoardView part for painting. */
    view(): BoardView['boards'] {
      const m = animating ? model : rebuild();
      if (!m) return undefined;
      return { world: BOARD_WORLD, title: m.active.name, paint: (ctx, forExport) => paintModel(ctx, forExport, boardView!(), m) };
    },
    /** The scene a card stands for at a board point (the selected one when it is in that group), or -1. */
    sceneAt(x: number, y: number): number {
      const n = nodeAt(x, y);
      if (!n) return -1;
      return n.scenes.includes(c.selected()) ? c.selected() : n.scenes[0];
    },
    stubAt,
    openStub: (s: Stub) => switchTo(s.board, s.scene),
    /** Hands the canvas painter its BoardView. */
    setBoardView: (f: () => BoardView) => (boardView = f),
    /** The card showing scene i, as a board rect. */
    rectOf: (i: number): Rect | undefined => {
      const n = (model ?? rebuild())?.nodeOf.get(i);
      return n && n.board === mode ? nodeRect(n) : undefined;
    },
    shown: (): number[] => (model ?? rebuild())?.nodes.map((n) => (n.scenes.includes(c.selected()) ? c.selected() : n.scenes[0])) ?? [],
    posOf: (i: number): Point | undefined => (model ?? rebuild())?.nodeOf.get(i)?.pos,
    /** A card was dragged to `p` (units). */
    moveTo(i: number, p: Point): void {
      const n = model?.nodeOf.get(i);
      if (!n) return;
      const q = clampBoardPos(p);
      if (n.group) moveGroup(data, n.group.id, n.board, q);
      else placeScene(data, i, n.board, q);
      n.pos = q;
    },
    saved: save,
    /** A card was pressed. */
    pressed(i: number): void {
      const n = model?.nodeOf.get(i);
      if (n?.group) showGroup(n);
      else closePop();
      render();
    },
    closePop,
    /** The camera's board-to-screen mapping, so the popover can sit by its card. */
    setScreen: (f: (p: Point) => Point) => (toScreen = f),
  };
}
