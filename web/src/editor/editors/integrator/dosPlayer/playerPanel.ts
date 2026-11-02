// Overview's "DOS player" tab (the integrator's DOS player button opens it): customize XFERPLAY.EXE, the stand-alone player the DOS
// export ships, within the rules a 1990s hex editor had to keep (dosPlayer/). A tab per screen
// (screenTabs.ts) holds all of that screen's words, positions, frames, colors and times, beside
// a live preview drawn by the web engine with the patches applied, where words and frames can be
// dragged (dragStage.ts). Choices go in the .gam's companion section, so the DOS export, Play and
// the web-page exports all show them.
import './playerPanel.css';
import { h, clear } from '../../../core/ui';
import type { Project } from '../../../core/project';
import { Screen } from '@lewismoten/gamemaker-sandbox-engine/gfx/screen';
import type { PatchEntry, PatchScreen } from '@lewismoten/gamemaker-sandbox-engine/player/patchTable';
import { isStock, patchEntry, patchProblem, type PatchValue, type PlayerPatches } from '@lewismoten/gamemaker-sandbox-engine/player/patchRules';
import { companionPatches, playerRecord, PLAYER_SECTION } from '../../../../dosPlayer/playerRecord';
import { PLAYER_PRESETS } from '../../../../dosPlayer/presets';
import { SCREEN_NAMES } from '../../../../dosPlayer/describePatches';
import { playerLook } from '@lewismoten/gamemaker-sandbox-engine/engine/playerLook';
import { History } from '../../../core/history';
import { drawPreview, type PreviewScreen } from './playerPreview';
import { fieldMaker } from './playerFields';
import { screenFields } from './screenFields';
import { PLAYER_FIELD_EVENT, takePlayerField } from './playerTarget';
import { SCREEN_TABS, type PanelTab } from './screenTabs';
import { fileFields } from './fileFields';
import { withoutExtensions } from '@lewismoten/gamemaker-sandbox-engine/player/fileExtensions';
import { itemFor, screenItems, type DragItem } from './dragItems';
import { dragStage } from './dragStage';
import { aboutFields, aboutLookOf, type AboutView } from './aboutFields';
import { creditsLink } from './creditsLink';
import { companionOrigin } from '../../../../dosPlayer/playerOrigin';

const PREVIEWS: PreviewScreen[] = ['menu', 'hiscores', 'newHiscore', 'status', 'load', 'save', 'drop', 'help', 'text', 'missing', 'about'];
const isPreview = (s: PanelTab): s is PreviewScreen => (PREVIEWS as string[]).includes(s);

let uid = 0;

/** The panel itself: Overview's DOS player tab shows it. */
export function playerPanel(project: Project): HTMLElement {
  const patches: PlayerPatches = { ...companionPatches(project.companion, project.gam) };
  const game = project.game();
  const gameName = project.gam.replace(/\.[^.]*$/, '').toLowerCase();
  const locked = !!project.readOnly;
  let tab: PanelTab = 'menu';
  // the About tab's switch: the page as the DOS player shows it or as Play on the web does
  const origin = companionOrigin(project.companion, project.gam);
  let aboutView: AboutView = 'dos';
  let aboutPage = 0;
  let shown: PreviewScreen = 'menu';
  /** The patch whose field has the focus: the menu preview shows a "No game-specific" line only for those. */
  let focused = '';
  let items: DragItem[] = [];
  let refreshers: (() => void)[] = [];
  const id = `dp${++uid}`;

  const current = (e: PatchEntry): PatchValue =>
    patches[e.id] ?? (e.kind === 'fkey' ? 'on' : e.kind === 'text' || e.kind === 'format' ? e.stock.trimEnd() : e.stock);
  const value = (pid: string) => current(patchEntry(pid)!);

  const canvas = h('canvas', { class: 'dp-canvas', 'aria-hidden': 'true' });
  const screen = new Screen(canvas);
  const stage = dragStage({
    canvas,
    items: () => items,
    value,
    apply: (updates) => {
      for (const [pid, v] of updates) {
        if (isStock(patchEntry(pid)!, v)) delete patches[pid];
        else patches[pid] = v;
      }
      redraw();
      refreshers.forEach((f) => f());
    },
    commit: () => save(),
    picked: () => redraw(),
    title: () => `Preview of the ${SCREEN_NAMES[shown]} screen as the DOS player draws it`,
    locked,
  });
  const pick = h(
    'select',
    { id: `${id}-screen`, onchange: () => show(pick.value as PreviewScreen) },
    ...PREVIEWS.map((s) => h('option', { value: s }, SCREEN_NAMES[s])),
  );
  const pickRow = h('label', { for: `${id}-screen`, class: 'dp-mini' }, 'Preview', pick);
  const heading = h('p', { class: 'dp-shown' });
  const count = h('p', { class: 'dp-count-all', role: 'status' });
  function redraw() {
    const noFile = focused || (stage.picked() === 'menu.noFile' ? 'layout.menu.noFile.x' : '');
    const look = playerLook(patches, shown === 'about' ? aboutLookOf(aboutView, origin) : undefined);
    const drawn = drawPreview(screen, project.files, game, gameName, look, shown, noFile, aboutPage);
    items = screenItems(shown, look, drawn);
    stage.refresh();
    heading.textContent = `${SCREEN_NAMES[shown]}, as ${shown === 'about' && aboutView === 'web' ? 'Play on the web' : 'the DOS player'} draws it`;
    const n = Object.keys(withoutExtensions(patches)).length;
    const files = Object.keys(patches).length - n;
    count.textContent =
      (n ? `${n} change${n === 1 ? '' : 's'}: the DOS export, Play and the web-page export show them.` : 'The player as it came on the CD.') +
      (files ? ` ${files} renamed extension${files === 1 ? '' : 's'}, for the DOS download only.` : '');
  }
  const show = (s: PreviewScreen) => {
    shown = s;
    pick.value = s;
    redraw();
  };
  // Undo and redo step through snapshots of the patches; a run of typing in one field is one step,
  // and a Reset button or any other field starts a new one.
  const history = new History<PlayerPatches>();
  let base: PlayerPatches = { ...patches };
  let lastChange = 0;
  let lastBy: Element | null = null;
  const undoBtn = h('button', { type: 'button', title: 'Undo (Ctrl+Z)', disabled: true, onclick: () => step(true) }, '↶ Undo');
  const redoBtn = h('button', { type: 'button', title: 'Redo (Ctrl+Y)', disabled: true, onclick: () => step(false) }, '↷ Redo');
  const syncHistory = () => {
    undoBtn.disabled = locked || !history.canUndo;
    redoBtn.disabled = locked || !history.canRedo;
  };
  const replacePatches = (to: PlayerPatches) => {
    for (const k of Object.keys(patches)) delete patches[k];
    Object.assign(patches, to);
  };
  function save() {
    if (JSON.stringify(patches) !== JSON.stringify(base)) {
      const now = Date.now();
      const by = document.activeElement;
      if (now - lastChange > 500 || by !== lastBy || by instanceof HTMLButtonElement) history.record(base);
      lastChange = now;
      lastBy = by;
      base = { ...patches };
      syncHistory();
    }
    project.setExtras(project.gam, PLAYER_SECTION, playerRecord(patches));
    redraw();
  }
  function step(back: boolean) {
    const to = back ? history.undo(base) : history.redo(base);
    if (!to) return;
    replacePatches(to);
    base = { ...patches };
    lastChange = 0;
    project.setExtras(project.gam, PLAYER_SECTION, playerRecord(patches));
    syncHistory();
    render();
    redraw();
  }
  const onKey = (ev: KeyboardEvent) => {
    if (!body.isConnected) return window.removeEventListener('keydown', onKey);
    if (locked || !(ev.ctrlKey || ev.metaKey) || ev.target instanceof HTMLInputElement || ev.target instanceof HTMLSelectElement) return;
    const k = ev.key.toLowerCase();
    if (k !== 'z' && k !== 'y') return;
    // only while the DOS player tab is the one showing
    if (!body.offsetParent) return;
    ev.preventDefault();
    step(k === 'z' && !ev.shiftKey);
  };
  window.addEventListener('keydown', onKey);
  // patches saved from outside (the desk's PLAYHACK, editor/shell/workspace.ts) replace the ones shown
  const offExtras = project.onExtrasChange((file, section) => {
    if (!body.isConnected) return offExtras();
    if (file !== project.gam || section !== PLAYER_SECTION) return;
    const now = companionPatches(project.companion, project.gam);
    if (JSON.stringify(now) === JSON.stringify(patches)) return;
    replacePatches(now);
    base = { ...patches };
    render();
    redraw();
  });

  const make = fieldMaker({
    id,
    current,
    set: (pid, v) => {
      const e = patchEntry(pid)!;
      const problem = patchProblem(e, v);
      if (problem) return problem;
      if (isStock(e, v)) delete patches[pid];
      else patches[pid] = v;
      save();
      return undefined;
    },
    onSync: (f) => refreshers.push(f),
    locked,
  });

  const tabs = h('div', { class: 'dp-tabs', role: 'tablist', 'aria-label': 'Screens' });
  // look-only, every field is disabled: the panel itself takes the keyboard so it can be scrolled
  const body = h('div', { class: 'dp-body', role: 'tabpanel', id: `${id}-body`, tabindex: locked ? '0' : '-1' });
  const choose = (s: PanelTab, focus = false) => {
    tab = s;
    render();
    if (isPreview(s)) show(s);
    if (focus) tabs.querySelector<HTMLElement>('.dp-tab.on')?.focus();
  };
  const renderTabs = () =>
    clear(
      tabs,
      ...SCREEN_TABS.map(({ screen: s, label }) =>
        h(
          'button',
          {
            type: 'button',
            role: 'tab',
            id: `${id}-tab-${s}`,
            class: `dp-tab${s === tab ? ' on' : ''}`,
            'aria-selected': String(s === tab),
            'aria-controls': `${id}-body`,
            tabindex: s === tab ? '0' : '-1',
            onclick: () => choose(s),
            onkeydown: (ev: KeyboardEvent) => {
              const k = SCREEN_TABS.findIndex((t) => t.screen === tab);
              const n = SCREEN_TABS.length;
              const next = { ArrowRight: k + 1, ArrowLeft: k - 1, Home: 0, End: n - 1 }[ev.key];
              if (next === undefined) return;
              ev.preventDefault();
              choose(SCREEN_TABS[(next + n) % n].screen, true);
            },
          },
          label,
        ),
      ),
    );

  function render() {
    renderTabs();
    refreshers = [];
    body.setAttribute('aria-labelledby', `${id}-tab-${tab}`);
    clear(body, ...(tab === 'files' ? fileFields({ id, patches, locked, save: (again) => (save(), again && render()) }) : screenFields(tab, make)));
    body.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLButtonElement>('input, select, button').forEach((el) => (el.disabled = locked));
    if (tab === 'about') body.prepend(aboutFields({ id, view: aboutView, page: aboutPage, origin, change: changeAbout }));
    if (tab === 'menu') body.querySelector('[data-patch="str.menu.credits"]')?.after(creditsLink(project));
    // the F-keys and the shared colors have no screen of their own: they pick one to preview
    pickRow.hidden = isPreview(tab);
  }

  /** The About switch or page changed: the preview follows, and the focus stays on the choice. */
  function changeAbout(view: AboutView, page: number) {
    const which = view !== aboutView ? 'view' : 'page';
    aboutView = view;
    aboutPage = page;
    render();
    show('about');
    body.querySelector<HTMLInputElement>(`input[name="${id}-about-${which}"]:checked`)?.focus();
  }

  /** Shows the screen a patch belongs to and focuses its field (Overview search opens fields this way). */
  const goTo = (pid: string) => {
    const entry = patchEntry(pid);
    if (!entry) return;
    pending = undefined;
    if (tab !== entry.screen) choose(entry.screen);
    const field = Array.from(body.querySelectorAll<HTMLElement>('[data-patch]')).find((f) => f.dataset.patch === pid);
    if (!field) return;
    field.scrollIntoView({ block: 'center' });
    field.classList.add('dp-found');
    setTimeout(() => field.classList.remove('dp-found'), 2500);
    const control = field.querySelector<HTMLElement>('input:not(:disabled), select:not(:disabled), textarea:not(:disabled), button:not(:disabled)');
    if (!control) field.tabIndex = -1;
    (control ?? field).focus({ preventScroll: true });
  };
  window.addEventListener(PLAYER_FIELD_EVENT, (ev) => body.isConnected && goTo((ev as CustomEvent<string>).detail));
  let pending = takePlayerField();
  if (pending) requestAnimationFrame(() => pending && goTo(pending));

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
            choose(p.id === 'rodip' ? 'status' : 'menu');
          },
        },
        p.label,
      ),
    ),
    undoBtn,
    redoBtn,
  );

  // the preview follows the field being edited, and picks what that field moves
  body.addEventListener('focusin', (ev) => {
    const f = (ev.target as HTMLElement).closest<HTMLElement>('.dp-field');
    focused = f?.dataset.patch ?? '';
    const s = f?.dataset.screen as PatchScreen | undefined;
    if (s && isPreview(s) && s !== shown) show(s);
    else redraw();
    const it = focused ? itemFor(items, focused) : undefined;
    if (it) stage.select(it.key);
  });
  body.addEventListener('focusout', () => {
    focused = '';
  });

  render();
  redraw();
  return h(
    'div',
    { class: 'dp' },
    h(
      'p',
      { class: 'dp-intro' },
      'Change the stand-alone player’s own words, colors, frames and timings, screen by screen, and the extensions of its files, as 1990s authors did with a hex editor, but only in ways it can take. The DOS export writes them into its XFERPLAY.EXE.',
      locked ? h('strong', null, ' This game is look-only.') : null,
    ),
    presets,
    h('div', { class: 'dp-tabs-wrap' }, tabs),
    h('div', { class: 'dp-main' }, body, h('div', { class: 'dp-preview' }, pickRow, heading, stage.stage, stage.controls, count)),
  );
}
