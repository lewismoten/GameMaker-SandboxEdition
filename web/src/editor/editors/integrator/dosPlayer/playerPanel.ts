// The integrator's "DOS player" dialog: customize XFERPLAY.EXE, the stand-alone player the DOS
// export ships, within the rules a 1990s hex editor had to keep (dosPlayer/). Words, Colors,
// Frames, Positions, Times and Keys, three presets, and a live preview of the screen being
// edited, drawn by the web engine with the patches applied. Choices go in the .gam's companion
// section, so the DOS export, Play and the web-page exports all show them.
import './playerPanel.css';
import { h, clear, modal } from '../../../core/ui';
import type { Project } from '../../../core/project';
import { Screen } from '../../../../gfx/screen';
import {
  PATCHES,
  COLOR_TARGETS,
  type ColorName,
  type FramePatch,
  type NumberPatch,
  type PatchEntry,
  type PatchGroup,
  type TextPatch,
} from '../../../../dosPlayer/patchTable';
import { formatCodes, isStock, patchEntry, patchProblem, type PatchValue, type PlayerPatches } from '../../../../dosPlayer/patchRules';
import { companionPatches, playerRecord, PLAYER_SECTION } from '../../../../dosPlayer/playerRecord';
import { PLAYER_PRESETS } from '../../../../dosPlayer/presets';
import { COLOR_LABELS, SCREEN_NAMES } from '../../../../dosPlayer/describePatches';
import { playerLook } from '../../../../engine/playerLook';
import { drawPreview, type PreviewScreen } from './playerPreview';

const GROUPS: [PatchGroup, string][] = [
  ['words', 'Words'],
  ['colors', 'Colors'],
  ['frames', 'Frames'],
  ['positions', 'Positions'],
  ['times', 'Times'],
  ['keys', 'Keys'],
];

const PREVIEWS: PreviewScreen[] = ['menu', 'hiscores', 'newHiscore', 'status', 'load', 'save', 'drop', 'help', 'text', 'missing', 'about'];

const hex6 = (v: number[]) =>
  `#${v
    .map((c) =>
      Math.round((c * 255) / 63)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;
const from6 = (hex: string) => [1, 3, 5].map((i) => Math.round((parseInt(hex.slice(i, i + 2), 16) * 63) / 255));

let uid = 0;

/** Opens the DOS player dialog for a project. */
export function openPlayerPanel(project: Project): void {
  void modal<void>('DOS player', () => playerPanel(project));
}

function playerPanel(project: Project): HTMLElement {
  const patches: PlayerPatches = { ...companionPatches(project.companion, project.gam) };
  const game = project.game();
  const gameName = project.gam.replace(/\.[^.]*$/, '').toLowerCase();
  const locked = !!project.readOnly;
  let group: PatchGroup = 'words';
  let shown: PreviewScreen = 'menu';
  /** The patch whose field has the focus: the menu preview shows a "No game-specific" line only for those. */
  let focused = '';
  const id = `dp${++uid}`;

  const canvas = h('canvas', { class: 'dp-canvas', role: 'img' });
  const screen = new Screen(canvas);
  const pick = h(
    'select',
    { id: `${id}-screen`, onchange: () => show(pick.value as PreviewScreen) },
    ...PREVIEWS.map((s) => h('option', { value: s }, SCREEN_NAMES[s])),
  );
  const count = h('p', { class: 'dp-count-all', role: 'status' });
  const redraw = () => {
    drawPreview(screen, project.files, game, gameName, playerLook(patches), shown, focused);
    canvas.setAttribute('aria-label', `Preview of the ${SCREEN_NAMES[shown]} screen as the DOS player draws it`);
    const n = Object.keys(patches).length;
    count.textContent = n ? `${n} change${n === 1 ? '' : 's'}: the DOS export, Play and the web-page export show them.` : 'The player as it came on the CD.';
  };
  const show = (s: PreviewScreen) => {
    shown = s;
    pick.value = s;
    redraw();
  };
  const save = () => {
    project.setExtras(project.gam, PLAYER_SECTION, playerRecord(patches));
    redraw();
  };
  // patches saved from outside (the desk's PLAYHACK, editor/shell/workspace.ts) replace the ones shown
  const offExtras = project.onExtrasChange((file, section) => {
    if (!body.isConnected) return offExtras();
    if (file !== project.gam || section !== PLAYER_SECTION) return;
    const now = companionPatches(project.companion, project.gam);
    if (JSON.stringify(now) === JSON.stringify(patches)) return;
    for (const k of Object.keys(patches)) delete patches[k];
    Object.assign(patches, now);
    render();
    redraw();
  });

  /** Sets one patch (or the stock value) when it keeps the rules; returns the problem otherwise. */
  const set = (pid: string, value: PatchValue): string | undefined => {
    const e = patchEntry(pid)!;
    const problem = patchProblem(e, value);
    if (problem) return problem;
    if (isStock(e, value)) delete patches[pid];
    else patches[pid] = value;
    save();
    return undefined;
  };
  const current = (e: PatchEntry): PatchValue =>
    patches[e.id] ?? (e.kind === 'fkey' ? 'on' : e.kind === 'text' || e.kind === 'format' ? e.stock.trimEnd() : e.stock);

  const tabs = h('div', { class: 'dp-tabs', role: 'tablist', 'aria-label': 'What to change' });
  // look-only, every field is disabled: the panel itself takes the keyboard so it can be scrolled
  const body = h('div', { class: 'dp-body', role: 'tabpanel', id: `${id}-body`, tabindex: locked ? '0' : '-1' });
  const renderTabs = () =>
    clear(
      tabs,
      ...GROUPS.map(([g, label]) =>
        h(
          'button',
          {
            type: 'button',
            role: 'tab',
            id: `${id}-tab-${g}`,
            class: `dp-tab${g === group ? ' on' : ''}`,
            'aria-selected': String(g === group),
            'aria-controls': `${id}-body`,
            tabindex: g === group ? '0' : '-1',
            onclick: () => {
              group = g;
              render();
            },
            onkeydown: (ev: KeyboardEvent) => {
              const k = GROUPS.findIndex(([x]) => x === group);
              const next = ev.key === 'ArrowRight' ? k + 1 : ev.key === 'ArrowLeft' ? k - 1 : -2;
              if (next === -2) return;
              group = GROUPS[(next + GROUPS.length) % GROUPS.length][0];
              render();
              tabs.querySelector<HTMLElement>('.dp-tab.on')?.focus();
            },
          },
          label,
        ),
      ),
    );

  const render = () => {
    renderTabs();
    body.setAttribute('aria-labelledby', `${id}-tab-${group}`);
    clear(body, ...groupFields(group));
    body.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLButtonElement>('input, select, button').forEach((el) => (el.disabled = locked));
  };

  // ---- fields --------------------------------------------------------------------------
  const field = (e: { id: string; screen: string; web: boolean }, ...children: (Node | string | null)[]) => {
    const div = h(
      'div',
      { class: 'dp-field', dataset: { screen: e.screen, patch: e.id } },
      ...children,
      e.web ? null : h('span', { class: 'dp-dos-only' }, 'DOS only'),
    );
    return div;
  };
  const errorOf = (fid: string) => h('p', { class: 'dp-error', id: `${fid}-err`, hidden: true });
  const report = (err: HTMLElement, problem: string | undefined, input?: HTMLElement) => {
    err.hidden = !problem;
    err.textContent = problem ? `Not saved: ${problem}.` : '';
    if (input) input.setAttribute('aria-invalid', String(!!problem));
  };

  const textField = (e: TextPatch) => {
    const fid = `${id}-${e.id}`;
    const err = errorOf(fid);
    const counter = h('span', { class: 'dp-count', 'aria-hidden': 'true' });
    if (e.kind === 'format') return formatField(e, fid, err, counter);
    const input = h('input', {
      type: 'text',
      id: fid,
      class: 'dp-text',
      value: current(e),
      maxlength: String(e.length),
      spellcheck: false,
      placeholder: '(hidden)',
      'aria-describedby': `${fid}-err ${fid}-n`,
    });
    counter.id = `${fid}-n`;
    counter.removeAttribute('aria-hidden');
    const update = () => {
      counter.textContent = `${input.value.length}/${e.length}`;
      report(err, set(e.id, input.value), input);
    };
    input.addEventListener('input', update);
    counter.textContent = `${input.value.length}/${e.length}`;
    const hide = h(
      'button',
      {
        type: 'button',
        class: 'dp-hide',
        title: 'Write spaces instead, which the player draws as nothing (as Builder did)',
        onclick: () => {
          input.value = '';
          update();
        },
      },
      'Hide',
    );
    return field(e, h('label', { for: fid }, e.label), h('div', { class: 'dp-row' }, input, counter, hide), err);
  };

  /** A printf format: its % codes are locked; only the words between them change. */
  const formatField = (e: TextPatch, fid: string, err: HTMLElement, counter: HTMLElement) => {
    const codes = formatCodes(e.stock);
    const split = (s: string) => s.split(/%[-+ #0]*\d*(?:\.\d+)?[lh]?[diouxXcs]/);
    const parts = split(current(e) as string);
    const inputs = parts.map((p, i) =>
      h('input', {
        type: 'text',
        class: 'dp-text dp-part',
        value: p,
        size: String(Math.max(2, p.length || 2)),
        spellcheck: false,
        'aria-label': `${e.label}, ${i === 0 ? 'words before' : `words after`} ${codes[Math.max(0, i - 1)] ?? ''}`.trim(),
        'aria-describedby': `${fid}-err ${fid}-n`,
      }),
    );
    counter.id = `${fid}-n`;
    counter.removeAttribute('aria-hidden');
    const value = () => inputs.map((x, i) => x.value + (codes[i] ?? '')).join('');
    const update = (from?: HTMLInputElement) => {
      // keep within the original length: what doesn't fit is cut from the field being typed in
      const over = value().length - e.length;
      if (over > 0 && from) from.value = from.value.slice(0, Math.max(0, from.value.length - over));
      const v = value();
      counter.textContent = `${v.length}/${e.length}`;
      report(err, set(e.id, v), from);
    };
    const row = h('div', { class: 'dp-row dp-format', role: 'group', 'aria-labelledby': `${fid}-l` });
    inputs.forEach((x, i) => {
      x.addEventListener('input', () => update(x));
      row.append(x);
      if (codes[i]) row.append(h('code', { class: 'dp-lock', title: 'A code the player fills in: it stays as it is' }, codes[i]));
    });
    row.append(counter);
    counter.textContent = `${value().length}/${e.length}`;
    return field(e, h('span', { class: 'dp-label', id: `${fid}-l` }, e.label, h('span', { class: 'dp-note' }, ' (the codes stay)')), row, err);
  };

  const numberField = (e: NumberPatch) => {
    const fid = `${id}-${e.id}`;
    const err = errorOf(fid);
    const input = h('input', {
      type: 'number',
      id: fid,
      class: 'dp-num',
      value: String(current(e)),
      min: String(e.min),
      max: String(e.max),
      step: '1',
      'aria-describedby': `${fid}-err`,
    });
    input.addEventListener('input', () => {
      if (input.value === '') return;
      report(err, set(e.id, Number(input.value)), input);
    });
    return field(e, h('label', { for: fid }, e.label, e.note ? h('span', { class: 'dp-note' }, ` (${e.note})`) : null), input, err);
  };

  const selectField = (e: PatchEntry & { kind: 'select' }) => {
    const fid = `${id}-${e.id}`;
    const sel = h(
      'select',
      { id: fid, onchange: () => set(e.id, sel.value) },
      ...(Object.keys(COLOR_TARGETS) as ColorName[]).map((c) =>
        h('option', { value: c, selected: c === current(e) }, COLOR_LABELS[c] + (c === e.stock ? ' (as shipped)' : '')),
      ),
    );
    return field(e, h('label', { for: fid }, e.label), sel);
  };

  const rgbField = (e: PatchEntry & { kind: 'rgb' }) => {
    const fid = `${id}-${e.id}`;
    const levels = h('span', { class: 'dp-note', id: `${fid}-v` });
    const input = h('input', { type: 'color', id: fid, class: 'dp-color', value: hex6(current(e) as number[]), 'aria-describedby': `${fid}-v` });
    const show = (v: number[]) => (levels.textContent = `${v.join(', ')} of 63`);
    show(current(e) as number[]);
    input.addEventListener('input', () => {
      const v = from6(input.value);
      show(v);
      set(e.id, v);
    });
    return field(
      e,
      h('label', { for: fid }, e.label, e.note ? h('span', { class: 'dp-note' }, ` (${e.note})`) : null),
      h('div', { class: 'dp-row' }, input, levels),
    );
  };

  const fkeyField = (e: PatchEntry & { kind: 'fkey' }) => {
    const fid = `${id}-${e.id}`;
    const box = h('input', { type: 'checkbox', id: fid, checked: current(e) === 'on', onchange: () => set(e.id, box.checked ? 'on' : 'off') });
    return field(e, h('label', { for: fid, class: 'dp-check' }, box, e.label));
  };

  /** A screen's two frames: double (as shipped), single (the inner on the outer) or custom. */
  const frameFields = (outer: FramePatch, inner: FramePatch) => {
    const fid = `${id}-${outer.id}`;
    const o = current(outer) as number[];
    const i = current(inner) as number[];
    const same = (a: number[], b: number[]) => a.join() === b.join();
    const style = same(o, outer.stock) && same(i, inner.stock) ? 'double' : same(i, o) ? 'single' : 'custom';
    const custom = h('div', { class: 'dp-frame-custom', hidden: style !== 'custom' });
    const err = errorOf(fid);
    const nums = [outer, inner].flatMap((fr) =>
      (current(fr) as number[]).map((v, k) => {
        const name = `${fr === outer ? 'Outer' : 'Inner'} ${['left', 'top', 'right', 'bottom'][k]}`;
        const input = h('input', {
          type: 'number',
          class: 'dp-num',
          value: String(v),
          min: '0',
          max: String(k % 2 ? 199 : 319),
          step: '1',
          'aria-label': `${outer.label.replace(/, .*/, '')}: ${name}`,
        });
        custom.append(h('label', { class: 'dp-mini' }, name, input));
        return input;
      }),
    );
    const read = () => nums.map((n) => Number(n.value));
    const apply = (a: number[], b: number[]) => {
      report(err, set(outer.id, a) ?? set(inner.id, b));
      read().forEach((_, k) => (nums[k].value = String((k < 4 ? a : b)[k % 4])));
    };
    nums.forEach((n) => n.addEventListener('input', () => n.value !== '' && apply(read().slice(0, 4), read().slice(4))));
    const sel = h(
      'select',
      {
        id: fid,
        onchange: () => {
          custom.hidden = sel.value !== 'custom';
          if (sel.value === 'double') apply(outer.stock, inner.stock);
          else if (sel.value === 'single') apply(read().slice(0, 4), read().slice(0, 4));
        },
      },
      h('option', { value: 'double', selected: style === 'double' }, 'Double (as shipped)'),
      h('option', { value: 'single', selected: style === 'single' }, 'Single'),
      h('option', { value: 'custom', selected: style === 'custom' }, 'Custom'),
    );
    return field(outer, h('label', { for: fid }, outer.label.replace(/, outer frame$/, ' frames')), sel, custom, err);
  };

  /** The menu's six words and marker move together: left x, top y and spacing. */
  const menuBlock = () => {
    const fid = `${id}-menublock`;
    const err = errorOf(fid);
    const words = ['play', 'instructions', 'storyline', 'credits', 'highScores', 'quit'];
    const num = (pid: string) => current(patchEntry(pid)!) as number;
    const mk = (name: string, v: number, min: number, max: number) => {
      const input = h('input', {
        type: 'number',
        class: 'dp-num',
        value: String(v),
        min: String(min),
        max: String(max),
        step: '1',
        'aria-label': `Menu words: ${name}`,
      });
      return { input, label: h('label', { class: 'dp-mini' }, name, input) };
    };
    const x = mk('Left', num('layout.menu.play.x'), 10, 127);
    const top = mk('Top', num('layout.menu.play.y'), 0, 126);
    const dy = mk('Spacing', num('layout.menu.spacing'), 1, 20);
    const apply = () => {
      const [l, t, s] = [x, top, dy].map((f) => Number(f.input.value));
      if (![l, t, s].every(Number.isInteger) || l < 10 || l > 127 || t < 0 || t > 126 || s < 1 || s > 20 || t + 5 * s > 199) {
        report(err, 'left 10-127, top 0-126, and the last word must stay on the screen');
        return;
      }
      const all: [string, number][] = [
        ...words.flatMap((w, k): [string, number][] => [
          [`layout.menu.${w}.x`, l],
          [`layout.menu.${w}.y`, t + k * s],
        ]),
        ['layout.menu.markerX', l - 10],
        ['layout.menu.firstY', t + 1],
        ['layout.menu.spacing', s],
      ];
      report(err, all.map(([pid, v]) => set(pid, v)).find(Boolean));
    };
    [x, top, dy].forEach((f) => f.input.addEventListener('input', apply));
    return field(
      { id: 'menublock', screen: 'menu', web: true },
      h('span', { class: 'dp-label' }, 'Menu words and marker, together'),
      h('div', { class: 'dp-row', role: 'group', 'aria-label': 'Menu words and marker' }, x.label, top.label, dy.label),
      err,
    );
  };

  const byScreen = (entries: PatchEntry[], make: (e: PatchEntry) => HTMLElement | null) => {
    const out: HTMLElement[] = [];
    for (const s of [...new Set(entries.map((e) => e.screen))]) {
      const fields = entries
        .filter((e) => e.screen === s)
        .map(make)
        .filter((x): x is HTMLElement => !!x);
      if (fields.length) out.push(h('section', { class: 'dp-section' }, h('h3', null, s === 'all' ? 'The player’s colors' : SCREEN_NAMES[s]), ...fields));
    }
    return out;
  };

  function groupFields(g: PatchGroup): HTMLElement[] {
    const entries = PATCHES.filter((e) => e.group === g);
    switch (g) {
      case 'words':
        return [
          h('p', { class: 'dp-note' }, 'Each line keeps to its length in the .EXE. Plain letters, digits and punctuation only.'),
          ...byScreen(entries, (e) => textField(e as TextPatch)),
        ];
      case 'colors':
        return [
          h('p', { class: 'dp-note' }, 'The player looks for the nearest of these in each screen’s palette, so they adapt to any picture.'),
          ...byScreen(entries, (e) => (e.kind === 'rgb' ? rgbField(e) : e.kind === 'select' ? selectField(e) : null)),
        ];
      case 'frames':
        return byScreen(entries, (e) =>
          e.kind === 'frame'
            ? e.id.endsWith('.outer')
              ? frameFields(e, patchEntry(e.id.replace(/outer$/, 'inner')) as FramePatch)
              : null
            : numberField(e as NumberPatch),
        );
      case 'positions': {
        const sections = byScreen(entries, (e) => numberField(e as NumberPatch));
        const each = h('details', { class: 'dp-each' }, h('summary', null, 'Every position, one by one'), ...sections);
        return [h('section', { class: 'dp-section' }, h('h3', null, 'Main menu'), menuBlock()), each];
      }
      case 'times':
        return byScreen(entries, (e) => numberField(e as NumberPatch));
      case 'keys':
        return [
          h('p', { class: 'dp-note' }, 'A key turned off just blanks the screen for a moment and play goes on.'),
          ...byScreen(entries, (e) => fkeyField(e as PatchEntry & { kind: 'fkey' })),
        ];
    }
  }

  const presets = h(
    'div',
    { class: 'dp-presets', role: 'group', 'aria-label': 'Presets' },
    ...PLAYER_PRESETS.map((p) =>
      h(
        'button',
        {
          type: 'button',
          disabled: locked,
          onclick: () => {
            if (p.patches) Object.assign(patches, p.patches);
            else for (const k of Object.keys(patches)) delete patches[k];
            save();
            render();
            show(p.id === 'rodip' ? 'status' : 'menu');
          },
        },
        p.label,
      ),
    ),
  );

  // the preview follows the field being edited
  body.addEventListener('focusin', (ev) => {
    const f = (ev.target as HTMLElement).closest<HTMLElement>('.dp-field');
    const s = f?.dataset.screen;
    focused = f?.dataset.patch ?? '';
    if (s && s !== 'all' && s !== 'play') show(s as PreviewScreen);
  });

  render();
  redraw();
  return h(
    'div',
    { class: 'dp' },
    h(
      'p',
      { class: 'dp-intro' },
      'Change the stand-alone player’s own words, colors, frames and timings, as 1990s authors did with a hex editor, but only in ways it can take. The DOS export writes them into its XFERPLAY.EXE.',
      locked ? h('strong', null, ' This game is look-only.') : null,
    ),
    presets,
    h(
      'div',
      { class: 'dp-main' },
      h('div', { class: 'dp-edit' }, tabs, body),
      h('div', { class: 'dp-preview' }, h('label', { for: `${id}-screen`, class: 'dp-mini' }, 'Preview', pick), canvas, count),
    ),
  );
}
