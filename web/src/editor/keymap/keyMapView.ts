// The "⌨ Keys" dialog: a keyboard with the keys a game uses lit up and labelled, a list of
// what each does (from keyMap.ts), the joystick, PLAYGAME's own keys, and the game's own
// instructions. Self-contained (no editor.css), so the player can show it too.
import './keyMapView.css';
import { gameKeyMap, type GameKeyMap, type KeyUse, type Level } from './keyMap';
import { parseBlocks, BACKBL, MONBL, type Block } from '../../formats/blocks';
import { parsePalette, defaultPalette, type Palette } from '../../formats/palette';
import { parseMonsters, type Monster } from '../../formats/monster';
import { decodeGif, isGif } from '../../formats/gif';
import { blockCanvas, paintIndexed } from '../core/draw';
import { macHint } from '../../input/macKeys';
import type { GameFiles } from '../../project/files';

type Child = Node | string | null | undefined | false;

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string | null, ...children: Child[]): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  for (const c of children) if (c !== null && c !== undefined && c !== false) e.append(c);
  return e;
}

const SVG = 'http://www.w3.org/2000/svg';
function svg<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number> = {}): SVGElementTagNameMap[K] {
  const e = document.createElementNS(SVG, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  return e;
}

// ---- keyboard layout: [label, scan, width, height] in key units -----------------------------

type Cap = [label: string, scan: number, w?: number, h?: number];
type Row = (Cap | number)[]; // a number is a gap

const MAIN: Row[] = [
  [
    ['Esc', 1],
    1,
    ['F1', 59],
    ['F2', 60],
    ['F3', 61],
    ['F4', 62],
    0.5,
    ['F5', 63],
    ['F6', 64],
    ['F7', 65],
    ['F8', 66],
    0.5,
    ['F9', 67],
    ['F10', 68],
    ['F11', 87],
    ['F12', 88],
  ],
  [
    ['`', 41],
    ['1', 2],
    ['2', 3],
    ['3', 4],
    ['4', 5],
    ['5', 6],
    ['6', 7],
    ['7', 8],
    ['8', 9],
    ['9', 10],
    ['0', 11],
    ['-', 12],
    ['=', 13],
    ['Bksp', 14, 2],
  ],
  [
    ['Tab', 15, 1.5],
    ['Q', 16],
    ['W', 17],
    ['E', 18],
    ['R', 19],
    ['T', 20],
    ['Y', 21],
    ['U', 22],
    ['I', 23],
    ['O', 24],
    ['P', 25],
    ['[', 26],
    [']', 27],
    ['\\', 43, 1.5],
  ],
  [
    ['Caps', 58, 1.75],
    ['A', 30],
    ['S', 31],
    ['D', 32],
    ['F', 33],
    ['G', 34],
    ['H', 35],
    ['J', 36],
    ['K', 37],
    ['L', 38],
    [';', 39],
    ["'", 40],
    ['Enter', 28, 2.25],
  ],
  [
    ['Shift', 42, 2.25],
    ['Z', 44],
    ['X', 45],
    ['C', 46],
    ['V', 47],
    ['B', 48],
    ['N', 49],
    ['M', 50],
    [',', 51],
    ['.', 52],
    ['/', 53],
    ['Shift', 54, 2.75],
  ],
  [['Ctrl', 29, 1.5], 1, ['Alt', 56, 1.5], ['Space', 57, 7], ['Alt', 56, 1.5], 1, ['Ctrl', 29, 1.5]],
];

const PAD: Row[] = [
  [0, 0, 0, 0.5, 0],
  [['Ins', 82], ['Home', 71], ['PgUp', 73], 0.5, ['Num', 69], ['/', 53], ['*', 55], ['-', 74]],
  [['Del', 83], ['End', 79], ['PgDn', 81], 0.5, ['7', 71], ['8', 72], ['9', 73], ['+', 78, 1, 2]],
  [3.5, ['4', 75], ['5', 76], ['6', 77]],
  [1, ['↑', 72], 1, 0.5, ['1', 79], ['2', 80], ['3', 81], ['Ent', 28, 1, 2]],
  [['←', 75], ['↓', 80], ['→', 77], 0.5, ['0', 82, 2], ['.', 83]],
];

const U = 40;
const GAP = 4;
const ROW_Y = (r: number) => (r === 0 ? 0 : r * U + 10);

interface CapInfo {
  short: string;
  title: string;
  game: boolean;
  global: boolean;
  more: boolean;
}

function withScan<T extends Element>(scan: number, e: T): T {
  e.setAttribute('data-scan', String(scan));
  return e;
}

function drawKeyboard(rows: Row[], info: (scan: number) => CapInfo | undefined, onPick: (scan: number) => void, label: string): SVGSVGElement {
  let width = 0;
  const caps: SVGGElement[] = [];
  rows.forEach((row, r) => {
    let x = 0;
    for (const item of row) {
      if (typeof item === 'number') {
        x += item * U;
        continue;
      }
      const [text, scan, w = 1, hh = 1] = item;
      const i = info(scan);
      const g = svg('g', { class: `km-cap${i?.game ? ' game' : ''}${i?.global ? ' global' : ''}`, 'data-scan': scan, tabindex: i ? 0 : -1 });
      const title = svg('title');
      title.textContent = i ? `${text}: ${i.title}` : `${text}: not used`;
      g.append(title);
      g.append(svg('rect', { x: x + GAP / 2, y: ROW_Y(r) + GAP / 2, width: w * U - GAP, height: hh * U - GAP, rx: 5 }));
      const tl = svg('text', { x: x + 7, y: ROW_Y(r) + 15, class: 'km-cap-label' });
      tl.textContent = text;
      g.append(tl);
      if (i) {
        const s = i.short.length > 6 ? `${i.short.slice(0, 5)}…` : i.short;
        const shown = i.more ? `${s}+` : s;
        const act = svg('text', {
          x: x + (w * U) / 2,
          y: ROW_Y(r) + hh * U - 9,
          class: `km-cap-act${w === 1 && shown.length > 4 ? ' tight' : ''}`,
          'text-anchor': 'middle',
        });
        act.textContent = shown;
        g.append(act);
        g.addEventListener('click', () => onPick(scan));
        g.addEventListener('keydown', (e) => {
          if ((e as KeyboardEvent).key === 'Enter' || (e as KeyboardEvent).key === ' ') {
            e.preventDefault();
            onPick(scan);
          }
        });
      }
      caps.push(g);
      x += w * U;
    }
    width = Math.max(width, x);
  });
  const height = ROW_Y(rows.length - 1) + U;
  const s = svg('svg', { viewBox: `0 0 ${width} ${height}`, class: 'km-board', role: 'img', 'aria-label': label });
  s.append(...caps);
  return s;
}

// ---- pictures of objects and monsters, in a level's colors -----------------------------------

class Pictures {
  private cache = new Map<string, unknown>();
  constructor(private files: GameFiles) {}
  private get<T>(key: string, make: () => T): T | undefined {
    if (!this.cache.has(key)) {
      try {
        this.cache.set(key, make());
      } catch {
        this.cache.set(key, undefined);
      }
    }
    return this.cache.get(key) as T | undefined;
  }
  palette(l: Level): Palette {
    return (l.pal && this.get(`pal:${l.pal}`, () => parsePalette(this.files.get(l.pal)!))) || defaultPalette();
  }
  object(l: Level, n: number): HTMLCanvasElement | undefined {
    const set = l.bbl ? this.get<Block[]>(`bbl:${l.bbl}`, () => parseBlocks(this.files.get(l.bbl)!, BACKBL)) : undefined;
    const b = set?.[n];
    return b ? blockCanvas(b.pixels, this.palette(l), { className: 'km-pic' }) : undefined;
  }
  monster(l: Level, n: number): HTMLCanvasElement | undefined {
    const mons = l.mon ? this.get<Monster[]>(`mon:${l.mon}`, () => parseMonsters(this.files.get(l.mon)!)) : undefined;
    const set = l.mbl ? this.get<Block[]>(`mbl:${l.mbl}`, () => parseBlocks(this.files.get(l.mbl)!, MONBL)) : undefined;
    const pic = mons?.[n]?.pic[0]?.[0];
    if (pic === undefined || pic < 0 || pic >= MONBL || !set?.[pic]) return undefined;
    return blockCanvas(set[pic].pixels, this.palette(l), { transparent: true, className: 'km-pic' });
  }
}

// ---- the view -------------------------------------------------------------------------------

/** The key map of a game as an element (keyboard, list, joystick, global keys, instructions). */
export function keyMapView(files: GameFiles, gamFile?: string, km: GameKeyMap = gameKeyMap(files, gamFile)): HTMLElement {
  const pics = new Pictures(files);
  const chrs = [...new Set(km.levels.map((l) => l.chr))].filter((c) => !km.missing.includes(c));
  let only = ''; // '' = every character
  const root = el('div', 'km');
  const boards = el('div', 'km-boards');
  const list = el('div', 'km-list');
  const joy = el('div', 'km-joy');

  const usesOf = (uses: KeyUse[]) => (only ? uses.filter((u) => u.chrs.includes(only)) : uses);
  const globalOf = (scan: number) => km.global.find((g) => g.scan === scan);

  const pick = (scan: number) => {
    const row = list.querySelector<HTMLElement>(`[data-scan="${scan}"]`);
    if (!row) return;
    list.querySelectorAll('.picked').forEach((r) => r.classList.remove('picked'));
    row.classList.add('picked');
    row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const capInfo = (scan: number): CapInfo | undefined => {
    const k = km.keys.find((b) => b.scan === scan);
    const uses = k ? usesOf(k.uses) : [];
    const g = globalOf(scan);
    if (!uses.length && !g) return undefined;
    const shorts = [...new Set(uses.map((u) => u.action.short))];
    return {
      short: shorts[0] ?? g!.short,
      title: [...new Set(uses.map((u) => u.action.title)), g?.title].filter(Boolean).join(' / '),
      game: !!uses.length,
      global: !!g,
      more: shorts.length > 1,
    };
  };

  const levelsText = (u: KeyUse) => {
    if (km.levels.length <= 1 || u.levels.length === km.levels.length) return '';
    const names = [...new Set(u.levels)];
    return names.length > 4 ? `In ${names.length} levels (${u.chrs.join(', ')})` : `In ${names.join(', ')}`;
  };

  const useRow = (u: KeyUse): HTMLElement => {
    const a = u.action;
    const pictures: Child[] = [];
    for (const m of a.fires.slice(0, 4)) {
      const c = pics.monster(u.level, m);
      if (c) pictures.push(el('span', 'km-thumb', c, el('small', null, `monster ${m}`)));
    }
    for (const b of (a.refills ?? []).slice(0, 3)) {
      const c = pics.object(u.level, b);
      if (c) pictures.push(el('span', 'km-thumb', c, el('small', null, `object ${b} gives uses`)));
    }
    if (a.needsBlock !== undefined) {
      const c = pics.object(u.level, a.needsBlock);
      pictures.push(el('span', 'km-thumb need', c ?? '', el('small', null, `needs object ${a.needsBlock}`)));
    }
    return el(
      'div',
      `km-use kind-${a.kind}`,
      el(
        'div',
        'km-use-head',
        el('strong', null, a.title),
        a.uses !== undefined ? el('span', 'km-badge', a.uses > 0 ? `${a.uses} uses` : 'no uses yet') : null,
        levelsText(u) ? el('span', 'km-where', levelsText(u)) : null,
      ),
      el('ul', null, ...a.details.map((d) => el('li', null, d))),
      pictures.length ? el('div', 'km-thumbs', ...pictures) : null,
    );
  };

  function render(): void {
    boards.replaceChildren(
      drawKeyboard(MAIN, capInfo, pick, 'Main keyboard with the game’s keys lit'),
      drawKeyboard(PAD, capInfo, pick, 'Arrow keys and number pad with the game’s keys lit'),
    );
    const rows = km.keys
      .map((k) => ({ k, uses: usesOf(k.uses) }))
      .filter((r) => r.uses.length)
      .map(({ k, uses }) =>
        withScan(
          k.scan,
          el(
            'div',
            'km-row',
            macHint(k.scan) ? el('div', 'km-keycol', el('kbd', 'km-key', k.name), el('small', 'km-mac', `Mac: ${macHint(k.scan)}`)) : el('kbd', 'km-key', k.name),
            el(
              'div',
              'km-uses',
              ...uses.map(useRow),
              uses.length > 1 && new Set(uses.flatMap((u) => u.chrs)).size === 1
                ? el('p', 'km-note', 'When several apply, the first one the hero can use (carrying its object, with uses left) runs.')
                : null,
            ),
          ),
        ),
      );
    list.replaceChildren(...(rows.length ? rows : [el('p', 'km-note', 'No keys are set for this character’s sequences.')]));
    const sticks = km.joystick.filter((j) => !only || j.chrs.includes(only));
    joy.replaceChildren(
      ...(sticks.length
        ? [
            el('h3', null, '🕹 Joystick / gamepad'),
            el(
              'table',
              null,
              ...sticks.map((j) =>
                el(
                  'tr',
                  null,
                  el('td', null, j.label),
                  el('td', null, j.action.title),
                  el('td', 'km-where', j.levels.length < km.levels.length && km.levels.length > 1 ? `${new Set(j.levels).size} level(s)` : ''),
                ),
              ),
            ),
          ]
        : []),
    );
  }

  const chooser =
    chrs.length > 1
      ? (() => {
          const sel = el('select', 'km-select');
          sel.append(new Option(`Every hero (${chrs.length} characters)`, ''));
          for (const c of chrs) {
            const names = [...new Set(km.levels.filter((l) => l.chr === c).map((l) => l.name))];
            sel.append(new Option(`${c} — ${names.length > 3 ? `${names.length} levels` : names.join(', ')}`, c));
          }
          sel.addEventListener('change', () => ((only = sel.value), render()));
          return el('label', 'km-filter', 'Show the keys of ', sel);
        })()
      : null;

  const legend = el(
    'div',
    'km-legend',
    el('span', null, el('i', 'sw game'), 'This game’s keys'),
    el('span', null, el('i', 'sw global'), 'Game-Maker’s own keys'),
    el('span', null, 'Click a lit key to find it in the list'),
  );

  const globals = el(
    'div',
    'km-global',
    el('h3', null, 'Keys in every Game-Maker game'),
    el('table', null, ...km.global.map((g) => el('tr', null, el('td', null, el('kbd', 'km-key small', g.name)), el('td', null, g.title)))),
  );

  const instr = km.instructions.length
    ? el(
        'details',
        'km-instr',
        el('summary', null, `📜 The game’s own instructions (F1)`),
        el('p', 'km-note', 'What the author wrote. It may leave keys out or describe them differently — the list above comes from the game’s data.'),
        ...km.instructions.map((i) => {
          if (i.kind === 'text') return el('pre', 'km-text', i.text ?? '');
          if (i.gif && isGif(i.gif)) {
            const g = decodeGif(i.gif);
            const c = el('canvas', 'km-gif');
            paintIndexed(c, g.pixels, g.width, g.height, g.palette);
            return c;
          }
          return null;
        }),
      )
    : null;

  root.append(
    chooser ?? '',
    legend,
    boards,
    km.missing.length ? el('p', 'km-note', `Missing character files: ${km.missing.join(', ')}.`) : '',
    el('h3', null, 'What each key does'),
    list,
    joy,
    globals,
    instr ?? '',
  );
  render();
  return root;
}

/** Opens the key map in a dialog. Keys typed while it is open don't reach a running game. */
export function showKeyMap(files: GameFiles | Promise<GameFiles>, gamFile: string | undefined, title: string, onClose?: () => void): HTMLDialogElement {
  const body = el('div', 'km-body', el('p', 'km-note', 'Reading the game…'));
  const close = el('button', 'km-close', '×');
  close.title = 'Close (Esc)';
  close.setAttribute('aria-label', 'Close');
  const dlg = el('dialog', 'km-dialog', el('header', 'km-head', el('h2', null, el('span', 'km-icon', '⌨'), ` Keys · ${title}`), close), body);
  const done = () => {
    dlg.close();
    dlg.remove();
    onClose?.();
  };
  close.addEventListener('click', done);
  dlg.addEventListener('cancel', (e) => {
    e.preventDefault();
    done();
  });
  dlg.addEventListener('click', (e) => e.target === dlg && done());
  for (const t of ['keydown', 'keyup']) dlg.addEventListener(t, (e) => e.stopPropagation());
  document.body.append(dlg);
  dlg.showModal();
  void Promise.resolve(files)
    .then((f) => body.replaceChildren(keyMapView(f, gamFile)))
    .catch((e) => body.replaceChildren(el('p', 'km-note', `Couldn’t read the game: ${(e as Error).message}`)));
  return dlg;
}
