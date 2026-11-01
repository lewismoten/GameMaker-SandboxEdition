// The integrator's boards in use: the tab row (DOS layout and the editor's named boards), the
// group popover (click a stacked card to choose one of its scenes), the suggestions the author
// can accept or dismiss, and the moves between boards and groups. integrator.ts owns the game,
// the selection and the canvas; this owns which board is showing and keeps boardLayout.ts's data
// in the project's companion (editor-only: the .gam and DOS export are never touched).
import type { Game } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import type { Point } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { h, clear } from '../../core/ui';
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
  /** 'dos' for the DOS layout, else a board id. */
  let mode = data.boards[0]?.id ?? 'dos';
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
  const pop = h('div', { class: 'grator-pop', role: 'dialog', 'aria-label': 'Scenes in this group', hidden: true });

  const on = () => mode !== 'dos' && data.boards.some((b) => b.id === mode);
  const rebuild = () => {
    model = on() ? buildModel(c.game, data, mode, measure) : undefined;
    return model;
  };
  const save = () => {
    c.project.setExtras(file, BOARDS_SECTION, JSON.parse(JSON.stringify(data)));
    rebuild();
  };
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
              `${i}  ${c.game.scenes[i].desc || '(untitled)'}`,
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
    if (e.key === 'Escape' && openGroup) closePop();
    else if (e.key === 'Enter') {
      const n = model?.nodeOf.get(c.selected());
      if (n?.group) showGroup(n);
    } else return;
    e.preventDefault();
  });

  function render(): void {
    const tab = (id: string, name: string) =>
      h('button', { role: 'tab', 'aria-selected': String(mode === id), class: mode === id ? 'primary' : undefined, onclick: () => switchTo(id) }, name);
    const kids: (HTMLElement | null)[] = [
      h('div', { role: 'tablist', 'aria-label': 'Layouts', class: 'grator-tabs' }, tab('dos', 'DOS layout'), ...data.boards.map((b) => tab(b.id, b.name))),
      h(
        'button',
        {
          title: 'Add a board: a named page of the editor’s own, much larger layout space. Your DOS layout stays as it is.',
          onclick: () => {
            const id = addBoard(data, `Board ${data.boards.length + 1}`);
            save();
            switchTo(id);
          },
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
        h(
          'button',
          {
            title: 'Put this board’s cards in neat rows',
            onclick: () => {
              tidy();
            },
          },
          'Tidy',
        ),
        data.boards.length > 0
          ? h(
              'button',
              {
                title: `Delete this board; its scenes move to ${data.boards.find((x) => x.id !== mode)?.name ?? 'the DOS layout'}`,
                onclick: () => {
                  removeBoard(data, b.id);
                  save();
                  switchTo(data.boards[0]?.id ?? 'dos');
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
  function tidy(): void {
    if (!model) return;
    const nodes = [...model.nodes].sort((a, b) => a.pos.y - b.pos.y || a.pos.x - b.pos.x);
    const perRow = Math.max(1, Math.floor((BOARD_WORLD.w - 16) / 26));
    nodes.forEach((n, k) => {
      const p = clampBoardPos({ x: 8 + (k % perRow) * 26, y: 8 + Math.floor(k / perRow) * 24 });
      if (n.group) moveGroup(data, n.group.id, n.board, p);
      else placeScene(data, n.scenes[0], n.board, p);
    });
    save();
    c.fit();
    c.draw();
  }

  render();
  rebuild();
  return {
    el: row,
    pop,
    on,
    /** Shows scene `i` from outside (the side list, the URL…). */
    reveal,
    refresh: () => (rebuild(), render()),
    /** The BoardView part for painting. */
    view(): BoardView['boards'] {
      const m = rebuild();
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
