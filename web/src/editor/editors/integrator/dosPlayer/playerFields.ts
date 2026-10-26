// The DOS player dialog's fields, one maker per kind of patch: words (length counter, Hide, a
// format's locked % codes), numbers, an x and y pair, color picks and levels, F-keys, a screen's
// two frames, and the menu's words and marker moved together. Each saves through the dialog's
// `set` (which keeps patchRules.ts) and can be brought back in step after a drag on the preview.
import { h } from '../../../core/ui';
import { COLOR_TARGETS, type ColorName, type FramePatch, type NumberPatch, type PatchEntry, type TextPatch } from '../../../../dosPlayer/patchTable';
import { formatCodes, frameLimit, patchEntry, type PatchValue } from '../../../../dosPlayer/patchRules';
import { COLOR_LABELS } from '../../../../dosPlayer/describePatches';

export interface FieldContext {
  /** Prefix for element ids, unique to the dialog. */
  id: string;
  current: (e: PatchEntry) => PatchValue;
  /** Sets one patch when it keeps the rules; returns the problem otherwise. */
  set: (pid: string, value: PatchValue) => string | undefined;
  /** Each field gives a way to show its patches' values again (after a drag moves them). */
  onSync: (refresh: () => void) => void;
}

const hex6 = (v: number[]) =>
  `#${v
    .map((c) =>
      Math.round((c * 255) / 63)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;
const from6 = (hex: string) => [1, 3, 5].map((i) => Math.round((parseInt(hex.slice(i, i + 2), 16) * 63) / 255));

const MENU_WORDS = ['play', 'instructions', 'storyline', 'credits', 'highScores', 'quit'];

/** The field makers for one dialog. */
export function fieldMaker(ctx: FieldContext) {
  const { id, current, set, onSync } = ctx;
  const num = (pid: string) => current(patchEntry(pid)!) as number;
  /** Shows a value unless its input is being typed in. */
  const show = (input: HTMLInputElement, v: number) => {
    if (document.activeElement !== input) input.value = String(v);
  };

  const field = (e: { id: string; screen: string; web: boolean }, ...children: (Node | string | null)[]) =>
    h('div', { class: 'dp-field', dataset: { screen: e.screen, patch: e.id } }, ...children, e.web ? null : h('span', { class: 'dp-dos-only' }, 'DOS only'));
  const errorOf = (fid: string) => h('p', { class: 'dp-error', id: `${fid}-err`, hidden: true });
  const report = (err: HTMLElement, problem: string | undefined, input?: HTMLElement) => {
    err.hidden = !problem;
    err.textContent = problem ? `Not saved: ${problem}.` : '';
    if (input) input.setAttribute('aria-invalid', String(!!problem));
  };
  const numInput = (v: number, min: number, max: number, attrs: Record<string, string>) =>
    h('input', { type: 'number', class: 'dp-num', value: String(v), min: String(min), max: String(max), step: '1', ...attrs });

  const text = (e: TextPatch) => {
    const fid = `${id}-${e.id}`;
    const err = errorOf(fid);
    const counter = h('span', { class: 'dp-count', id: `${fid}-n` });
    if (e.kind === 'format') return format(e, fid, err, counter);
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
  const format = (e: TextPatch, fid: string, err: HTMLElement, counter: HTMLElement) => {
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

  const number = (e: NumberPatch) => {
    const fid = `${id}-${e.id}`;
    const err = errorOf(fid);
    const input = numInput(current(e) as number, e.min, e.max, { id: fid, 'aria-describedby': `${fid}-err` });
    input.addEventListener('input', () => {
      if (input.value === '') return;
      report(err, set(e.id, Number(input.value)), input);
    });
    onSync(() => show(input, current(e) as number));
    return field(e, h('label', { for: fid }, e.label, e.note ? h('span', { class: 'dp-note' }, ` (${e.note})`) : null), input, err);
  };

  /** A position's x and y on one row. */
  const point = (name: string, ex: NumberPatch, ey: NumberPatch) => {
    const fid = `${id}-${ex.id}`;
    const err = errorOf(fid);
    const pair = [ex, ey].map((e, k) => {
      const input = numInput(current(e) as number, e.min, e.max, { 'aria-label': `${name} ${k ? 'y' : 'x'}`, 'aria-describedby': `${fid}-err` });
      input.addEventListener('input', () => input.value !== '' && report(err, set(e.id, Number(input.value)), input));
      onSync(() => show(input, current(e) as number));
      return h('label', { class: 'dp-mini' }, k ? 'y' : 'x', input);
    });
    return field(
      ex,
      h('span', { class: 'dp-label', id: `${fid}-l` }, name),
      h('div', { class: 'dp-row', role: 'group', 'aria-labelledby': `${fid}-l` }, ...pair),
      err,
    );
  };

  const select = (e: PatchEntry & { kind: 'select' }) => {
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

  const rgb = (e: PatchEntry & { kind: 'rgb' }) => {
    const fid = `${id}-${e.id}`;
    const levels = h('span', { class: 'dp-note', id: `${fid}-v` });
    const input = h('input', { type: 'color', id: fid, class: 'dp-color', value: hex6(current(e) as number[]), 'aria-describedby': `${fid}-v` });
    const showLevels = (v: number[]) => (levels.textContent = `${v.join(', ')} of 63`);
    showLevels(current(e) as number[]);
    input.addEventListener('input', () => {
      const v = from6(input.value);
      showLevels(v);
      set(e.id, v);
    });
    return field(
      e,
      h('label', { for: fid }, e.label, e.note ? h('span', { class: 'dp-note' }, ` (${e.note})`) : null),
      h('div', { class: 'dp-row' }, input, levels),
    );
  };

  const fkey = (e: PatchEntry & { kind: 'fkey' }) => {
    const fid = `${id}-${e.id}`;
    const box = h('input', { type: 'checkbox', id: fid, checked: current(e) === 'on', onchange: () => set(e.id, box.checked ? 'on' : 'off') });
    return field(e, h('label', { for: fid, class: 'dp-check' }, box, e.label));
  };

  /** A screen's two frames: double (as shipped), single (the inner on the outer) or custom. */
  const frames = (outer: FramePatch, inner: FramePatch) => {
    const fid = `${id}-${outer.id}`;
    const same = (a: number[], b: number[]) => a.join() === b.join();
    const styleOf = () => {
      const o = current(outer) as number[];
      const i = current(inner) as number[];
      return same(o, outer.stock) && same(i, inner.stock) ? 'double' : same(i, o) ? 'single' : 'custom';
    };
    const custom = h('div', { class: 'dp-frame-custom', hidden: styleOf() !== 'custom' });
    const err = errorOf(fid);
    const nums = [outer, inner].flatMap((fr) =>
      (current(fr) as number[]).map((v, k) => {
        const name = `${fr === outer ? 'Outer' : 'Inner'} ${['left', 'top', 'right', 'bottom'][k]}`;
        const input = numInput(v, 0, frameLimit(fr, k), { 'aria-label': `${outer.label.replace(/, .*/, '')}: ${name}` });
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
      h('option', { value: 'double' }, 'Double (as shipped)'),
      h('option', { value: 'single' }, 'Single'),
      h('option', { value: 'custom' }, 'Custom'),
    );
    sel.value = styleOf();
    onSync(() => {
      const v = [...(current(outer) as number[]), ...(current(inner) as number[])];
      nums.forEach((n, k) => show(n, v[k]));
      // a dragged frame that is no longer double or single shows its numbers
      if (styleOf() === 'custom') sel.value = 'custom';
      custom.hidden = sel.value !== 'custom';
    });
    return field(outer, h('label', { for: fid }, outer.label.replace(/, outer frame$/, ' frames')), sel, custom, err);
  };

  /** The menu's six words and marker move together: left x, top y and spacing. */
  const menuBlock = () => {
    const fid = `${id}-menublock`;
    const err = errorOf(fid);
    const mk = (name: string, v: number, min: number, max: number) => {
      const input = numInput(v, min, max, { 'aria-label': `Menu words: ${name}` });
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
        ...MENU_WORDS.flatMap((w, k): [string, number][] => [
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
    onSync(() => {
      show(x.input, num('layout.menu.play.x'));
      show(top.input, num('layout.menu.play.y'));
      show(dy.input, num('layout.menu.spacing'));
    });
    return field(
      { id: 'layout.menu.play.x', screen: 'menu', web: true },
      h('span', { class: 'dp-label' }, 'Menu words and marker, together'),
      h('div', { class: 'dp-row', role: 'group', 'aria-label': 'Menu words and marker' }, x.label, top.label, dy.label),
      err,
    );
  };

  return { text, number, point, select, rgb, fkey, frames, menuBlock };
}

export type FieldMaker = ReturnType<typeof fieldMaker>;
