// Palette editor (PALCHOS.EXE): 256 VGA colors with 0..63 red/green/blue.
import { rovingGrid } from '../../widgets/rovingGrid';
import { colorChoice } from '../../widgets/colorChoice';
import { History } from '../../core/history';
import { registerEditor } from '../registry';
import { viewState } from '../../../urlState';
import { fileField } from '../../widgets/filePicker';
import { h, clear } from '../../core/ui';
import { parsePalette, paletteCss, serializePalette, defaultPalette } from '../../../formats/palette';
import { decodeGif, isGif } from '../../../formats/gif';
import { spread as spreadRange } from './ramps';
import { paletteTools } from './paletteTools';
import { fitToPane } from '../../core/fitPane';
import './palette.css';

registerEditor(['pal'], (host, project, file) => {
  const pal = parsePalette(project.files.get(file)!);
  // the address keeps the color selected (…/SHADES.PAL?color=200)
  const view = viewState(['p', project.id, file]);
  const urlColor = view.num('color');
  let selected = urlColor !== undefined && urlColor >= 0 && urlColor <= 255 ? urlColor : 1;
  let rangeEnd: number | undefined;
  const save = () => project.files.set(file, serializePalette(pal));
  const history = new History<Uint8Array>();
  // icons, so the tools stay one row in a short window
  const undoBtn = h(
    'button',
    { class: 'pal-icon', title: 'Undo (Ctrl+Z)', 'aria-label': 'Undo', 'aria-keyshortcuts': 'Control+Z', disabled: true, onclick: () => step(true) },
    '↶',
  );
  const redoBtn = h(
    'button',
    { class: 'pal-icon', title: 'Redo (Ctrl+Y)', 'aria-label': 'Redo', 'aria-keyshortcuts': 'Control+Y', disabled: true, onclick: () => step(false) },
    '↷',
  );
  let lastRecord = 0;
  /** Call before a change; a slider drag (changes less than a second apart) is one step. */
  const remember = (coalesce = false) => {
    const now = Date.now();
    if (!coalesce || now - lastRecord > 1000) history.record(pal.slice());
    lastRecord = now;
    undoBtn.disabled = !history.canUndo;
    redoBtn.disabled = !history.canRedo;
  };
  function step(back: boolean): void {
    const to = back ? history.undo(pal.slice()) : history.redo(pal.slice());
    if (!to) return;
    pal.set(to);
    lastRecord = 0;
    undoBtn.disabled = !history.canUndo;
    redoBtn.disabled = !history.canRedo;
    save();
    refresh();
  }

  /** The note by color 0: “backgrounds” opens a preview of the player's screens drawn on it. */
  const zeroLink = () =>
    h(
      'button',
      {
        type: 'button',
        class: 'pal-zero-link',
        title: 'Preview the screens the player draws on color 0',
        onclick: () => void import('./colorZeroDialog').then(({ colorZeroDialog }) => colorZeroDialog(project, file, pal)),
      },
      'backgrounds',
    );
  const swatches = rovingGrid(h('div', { class: 'swatches pal-swatches' }), 'Palette colors (Shift+arrow keys select a range)', { multiselect: true });
  const preview = h('div', { style: 'width:64px;height:64px;border:1px solid var(--border);border-radius:6px' });
  const label = h('div', { class: 'meta' });
  const sliders = ['Red', 'Green', 'Blue'].map((name, c) => {
    const range = h('input', { type: 'range', min: 0, max: 63, step: 1, 'aria-label': name, style: 'flex:1;min-width:0' });
    const num = h('input', { type: 'number', min: 0, max: 63, 'aria-label': `${name} (0 to 63)`, style: 'width:64px' });
    const set = (v: number) => {
      remember(true);
      pal[selected * 3 + c] = Math.max(0, Math.min(63, v | 0));
      save();
      refresh();
    };
    range.addEventListener('input', () => set(Number(range.value)));
    num.addEventListener('change', () => set(Number(num.value)));
    return {
      range,
      num,
      row: h(
        'label',
        { class: 'field pal-slider' },
        h('span', null, name),
        h('div', { class: 'row', style: 'align-items:center;gap:6px;flex-wrap:nowrap' }, range, num),
      ),
    };
  });

  const colorBox = colorChoice({
    get: () => selected,
    set: (i) => {
      selected = i;
      rangeEnd = undefined;
      refresh();
    },
    css: (i) => paletteCss(pal, i),
  });

  const buttons: HTMLButtonElement[] = [];
  for (let i = 0; i < 256; i++) {
    const b = h('button', {
      title: `Color ${i}`,
      'aria-label': `Color ${i}`,
      onclick: (e: MouseEvent) => {
        if (e.shiftKey) rangeEnd = i;
        else {
          selected = i;
          rangeEnd = undefined;
        }
        refresh();
      },
    });
    buttons.push(b);
    swatches.append(b);
  }

  function refresh(): void {
    buttons.forEach((b, i) => {
      b.style.background = paletteCss(pal, i);
      const inRange = rangeEnd !== undefined && i >= Math.min(selected, rangeEnd) && i <= Math.max(selected, rangeEnd);
      b.classList.toggle('selected', i === selected || inRange);
    });
    preview.style.background = paletteCss(pal, selected);
    colorBox.refresh();
    view.set({ color: selected });
    const hex =
      '#' +
      [0, 1, 2]
        .map((c) =>
          Math.round((pal[selected * 3 + c] * 255) / 63)
            .toString(16)
            .padStart(2, '0'),
        )
        .join('');
    clear(
      label,
      h('strong', null, `Color ${selected}${rangeEnd !== undefined ? ` to ${rangeEnd}` : ''}`),
      h('br'),
      h('span', { style: 'font-family:ui-monospace,monospace' }, hex),
      selected === 255 ? h('span', null, ' · see-through in monster and character blocks') : null,
      selected === 0 ? h('span', null, ' · drawn as menu ', zeroLink()) : null,
    );
    sliders.forEach((s, c) => {
      s.range.value = String(pal[selected * 3 + c]);
      s.num.value = String(pal[selected * 3 + c]);
    });
    tools.refresh();
    // the check only while it is shown (opening its tab catches up)
    if (!visionPane.hidden) vision?.refresh();
  }

  const spread = () => {
    if (rangeEnd === undefined) return;
    remember();
    const [a, b] = [Math.min(selected, rangeEnd), Math.max(selected, rangeEnd)];
    spreadRange(pal, a, b);
    save();
    refresh();
  };

  const tools = paletteTools({
    project,
    file,
    pal,
    selected: () => selected,
    rangeEnd: () => rangeEnd,
    remember: () => remember(),
    changed: () => {
      save();
      refresh();
    },
  });

  const gifs = project.files.byExtension('gif').filter((g) => isGif(project.files.get(g)!));
  let gifChoice = gifs[0] ?? '';
  const editPane = h(
    'div',
    { class: 'stack', id: 'pal-pane-edit', role: 'tabpanel', 'aria-labelledby': 'pal-tab-edit' },
    h('div', { class: 'row', style: 'align-items:center' }, preview, label),
    colorBox.el,
    ...sliders.map((s) => s.row),
    h(
      'div',
      { class: 'toolbar' },
      h('button', { onclick: spread, title: 'Blend the colors between the two ends of the range' }, 'Spread range'),
      tools.rampBtn,
      // together, so they wrap as a pair
      h('span', { class: 'pal-undo' }, undoBtn, redoBtn),
    ),
    gifs.length
      ? h(
          'div',
          { class: 'toolbar' },
          fileField(
            project,
            'Copy colors from picture',
            ['gif'],
            () => gifChoice,
            (v) => v && (gifChoice = v),
            { allowNone: false },
          ),
          h(
            'button',
            {
              onclick: () => {
                remember();
                pal.set(decodeGif(project.files.get(gifChoice)!).palette);
                save();
                refresh();
              },
            },
            'Copy',
          ),
        )
      : null,
    h(
      'button',
      {
        onclick: () => {
          remember();
          pal.set(defaultPalette());
          save();
          refresh();
        },
      },
      'Reset to default colors',
    ),
    tools.uses,
  );
  // the column's second tab, the color vision check, loads the first time it is opened
  let vision: { el: HTMLElement; refresh: () => void; dispose: () => void } | undefined;
  const visionPane = h(
    'div',
    { class: 'stack', id: 'pal-pane-vision', role: 'tabpanel', 'aria-labelledby': 'pal-tab-vision', hidden: true },
    h('p', { class: 'meta' }, 'Loading…'),
  );
  const tabs = [
    { id: 'edit', label: 'Color', pane: editPane },
    { id: 'vision', label: 'Color vision', pane: visionPane },
  ].map((t) => ({
    ...t,
    btn: h(
      'button',
      { type: 'button', role: 'tab', id: `pal-tab-${t.id}`, class: 'pal-tab', 'aria-controls': t.pane.id, onclick: () => pick(t.id, true) },
      t.label,
    ),
  }));
  function pick(id: string, focus = false): void {
    for (const t of tabs) {
      const on = t.id === id;
      t.btn.setAttribute('aria-selected', String(on));
      t.btn.tabIndex = on ? 0 : -1;
      t.pane.hidden = !on;
      if (on && focus) t.btn.focus();
    }
    view.set({ tab: id === 'edit' ? undefined : id });
    if (id === 'vision') vision?.refresh();
    if (id === 'vision' && !vision)
      void import('./visionPanel').then(({ visionPanel }) => {
        if (vision || !host.isConnected) return;
        vision = visionPanel({
          project,
          file,
          pal,
          select: (i) => {
            selected = i;
            rangeEnd = undefined;
            refresh();
          },
          remember: () => remember(),
          changed: () => {
            save();
            refresh();
          },
          undo: () => step(true),
        });
        clear(visionPane, vision.el);
      });
  }
  const tabList = h('div', { class: 'pal-tabs', role: 'tablist', 'aria-label': 'Palette tools' }, ...tabs.map((t) => t.btn));
  tabList.addEventListener('keydown', (e) => {
    const k = tabs.findIndex((t) => t.btn === document.activeElement);
    const to = e.key === 'ArrowRight' ? k + 1 : e.key === 'ArrowLeft' ? k - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : -2;
    if (k < 0 || to === -2) return;
    e.preventDefault();
    pick(tabs[(to + tabs.length) % tabs.length].id, true);
  });
  const side = h('div', { class: 'panel stack pal-side', style: 'flex:1 1 260px;max-width:420px' }, tabList, editPane, visionPane);
  pick(view.get('tab') === 'vision' ? 'vision' : 'edit');
  const row = h('div', { class: 'row pal-row' }, h('div', { class: 'panel', style: 'flex:0 1 auto' }, swatches), side);
  clear(
    host,
    h(
      'p',
      { class: 'hint' },
      'Click a color to edit it. Shift-click a second color to select a range, then “Spread” to blend between them. Color 255 is drawn as transparent in monster and character blocks. Color 0 is drawn as menu ',
      zeroLink(),
      '.',
    ),
    row,
    tools.el,
  );
  // the colors and the column beside them leave room for the folded re-light panel below
  requestAnimationFrame(() => row.style.setProperty('--below', `${Math.ceil(tools.el.getBoundingClientRect().bottom - row.getBoundingClientRect().bottom)}px`));
  fitToPane(swatches, side);
  refresh();
  const onKey = (e: KeyboardEvent) => {
    if (!(e.ctrlKey || e.metaKey) || e.target instanceof HTMLInputElement) return;
    const k = e.key.toLowerCase();
    if (k === 'z' || k === 'y') {
      e.preventDefault();
      step(k === 'z' && !e.shiftKey);
    }
  };
  window.addEventListener('keydown', onKey);
  return () => {
    window.removeEventListener('keydown', onKey);
    tools.dispose();
    vision?.dispose();
  };
});
