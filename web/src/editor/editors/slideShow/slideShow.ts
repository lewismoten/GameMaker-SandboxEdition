// Slide shows (.LST): pictures, animations and text screens in order, edited on a video-style
// timeline. A clip that waits a number of seconds is as long as it lasts (drag either edge);
// one that waits for a key, or goes straight on, is a whole thumbnail with that "transition"
// after it. Media from the game is dragged (or tapped) onto the timeline; the small screen
// above plays the show as the game would, lighting up the clip it is on.
//
// One closure per editor. Its sections, in order: facts and thumbnails (cached by file
// contents), the screen, layout, the timeline, changing clips (with undo), the inspector,
// the media bin, and the page. Dragging and the timeline's keys are in timelineInput.ts;
// timing as PLAYGAME plays it is in slideTimeline.ts.
import { History } from '../../core/history';
import './slideShow.css';
import { registerEditor } from '../registry';
import { viewState } from '../../../urlState';
import { h, clear, toast } from '../../core/ui';
import { pickFile } from '../../widgets/filePicker';
import { templateFor } from '../../shell/templates';
import type { FileKind } from '../../core/project';
import { parseSlideList, serializeSlideList, textLines, type SlideEntry } from '../../../formats/graphicScripts';
import { isFli, parseFli } from '../../../formats/fli';
import { PALETTE_SIZE } from '../../../formats/palette';
import { showGraphic } from '../../../engine/showGraphic';
import { normalize } from '../../../project/files';
import { gamePreview } from '../../widgets/mediaShared';
import { blankScreen, mediaThumb, pictureScreen, screenCanvas, textPages, TEXT_PAGE_LINES, type ScreenPicture } from '../../widgets/mediaPictures';
import { clipKind, clipTiming, clipWidth, MAX_SLIDES, moveEntry, showLength, type ClipFacts, type ClipTiming, type Then } from './slideTimeline';
import { timelineInput } from './timelineInput';
import { fitToPane } from '../../core/fitPane';

const MEDIA_KINDS: FileKind[] = ['gif', 'fli', 'bkd', 'txt', 'lst'];
const THUMB_W = 112;
const KIND_NAME: Record<string, string> = { gif: 'Picture', bkd: 'Backdrop', fli: 'Animation', txt: 'Text screen', lst: 'Slide show', other: 'File' };
const THEN_ICON: Record<Then, string> = { key: '⌨\uFE0F', none: '⏭', seconds: '⏱' };
const ZOOM_KEY = 'gm-slides-zoom';

function loadZoom(): number {
  try {
    return Number(localStorage.getItem(ZOOM_KEY)) || 10;
  } catch {
    return 10;
  }
}

registerEditor(['lst'], (host, project, file) => {
  let entries: SlideEntry[] = parseSlideList(project.files.get(file)!);
  // the address keeps the selected slide, counted from 1 (…/SHOW.LST?slide=4)
  const view = viewState(['p', project.id, file]);
  const urlSlide = view.num('slide');
  let selected = urlSlide !== undefined && urlSlide >= 1 && urlSlide <= entries.length ? urlSlide - 1 : entries.length ? 0 : -1;
  let playing = -1;
  let playStart = 0;
  let pps = loadZoom();

  // Undo: every save records the list as it was (saves less than half a second apart are one step).
  const history = new History<Uint8Array>();
  let base = serializeSlideList(entries);
  let lastChange = 0;
  const undoBtn = h('button', { title: 'Undo (Ctrl+Z)', disabled: true, onclick: () => step(true) }, '↶ Undo');
  const redoBtn = h('button', { title: 'Redo (Ctrl+Y)', disabled: true, onclick: () => step(false) }, '↷ Redo');
  const syncHistory = () => {
    undoBtn.disabled = !history.canUndo;
    redoBtn.disabled = !history.canRedo;
  };
  const save = () => {
    const bytes = serializeSlideList(entries);
    const now = Date.now();
    if (bytes.length !== base.length || bytes.some((b, i) => b !== base[i])) {
      if (now - lastChange > 500) history.record(base);
      lastChange = now;
      base = bytes;
      syncHistory();
    }
    project.files.set(file, bytes);
  };
  function step(back: boolean): void {
    const to = back ? history.undo(base) : history.redo(base);
    if (!to) return;
    entries = parseSlideList(to);
    base = to;
    lastChange = 0;
    selected = Math.min(selected, entries.length - 1);
    syncHistory();
    project.files.set(file, to);
    render();
  }

  // ---- facts and thumbnails, cached by file contents --------------------------------
  const factCache = new Map<string, { bytes?: Uint8Array; facts: ClipFacts }>();
  const facts = (name: string): ClipFacts => {
    const bytes = project.files.get(name);
    const hit = factCache.get(name);
    if (hit && hit.bytes === bytes) return hit.facts;
    const kind = clipKind(name);
    const f: ClipFacts = { kind, exists: !!bytes };
    try {
      if (bytes && kind === 'fli' && isFli(bytes)) {
        const a = parseFli(bytes);
        f.playSeconds = (a.frameCount * a.speed) / 70; // speed 0 plays with no wait between frames (FLI::View)
      }
      if (bytes && kind === 'txt') f.pages = Math.max(1, Math.ceil(textLines(bytes).length / TEXT_PAGE_LINES));
    } catch {
      /* shown as is */
    }
    factCache.set(name, { bytes, facts: f });
    return f;
  };
  const thumbCache = new Map<string, { bytes?: Uint8Array; el: HTMLElement; url?: string }>();
  const thumbOf = (name: string): { el: HTMLElement; url?: string } => {
    const bytes = project.files.get(name);
    const hit = thumbCache.get(name);
    if (hit && hit.bytes === bytes) return hit;
    const el = mediaThumb(project.files, name, project.paletteFor(file).palette);
    const url = el instanceof HTMLCanvasElement ? el.toDataURL() : undefined;
    const t = { bytes, el, url };
    thumbCache.set(name, t);
    return t;
  };
  const timing = (e: SlideEntry): ClipTiming => clipTiming(e, facts(e.name));

  // ---- the screen: plays the show, or shows the selected clip ------------------------
  /** What the screen looks like while clip i is shown (text goes over the picture before it). */
  const stillOf = (i: number): ScreenPicture => {
    const e = entries[i];
    const pal = project.paletteFor(file).palette;
    if (!e) return blankScreen(pal);
    const kind = clipKind(e.name);
    if (kind === 'txt') {
      let over: ScreenPicture | undefined;
      for (let j = i - 1; j >= 0 && !over; j--) if (clipKind(entries[j].name) !== 'txt') over = pictureScreen(project.files, entries[j].name);
      const bytes = project.files.get(e.name);
      return textPages(
        bytes ? textLines(bytes) : ['Missing File:', '', `The file ${e.name} is`, 'missing or cannot be opened.'],
        over ?? blankScreen(pal),
        pal,
      )[0];
    }
    if (kind === 'lst') {
      const inner = parseSlideList(project.files.get(e.name) ?? new Uint8Array()).find((x) => clipKind(x.name) !== 'txt');
      return (inner && pictureScreen(project.files, inner.name)) || blankScreen(pal);
    }
    return pictureScreen(project.files, e.name) ?? blankScreen(pal);
  };

  let playFrom = 0;
  const preview = gamePreview(project, file, {
    className: 'sl-preview',
    // the transport's Play button starts and stops the show
    button: false,
    onRunning: (on) => {
      playBtn.textContent = on ? '■ Stop' : '▶ Play the show';
      playBtn.title = on ? 'Stop the show' : 'Play the show from the first slide';
      playBtn.classList.toggle('playing', on);
      playHint.hidden = !on;
      length.hidden = on;
    },
    run: async (m, pal) => {
      const cols = new Uint8Array(PALETTE_SIZE);
      for (let i = playFrom; i < entries.length; i++) {
        setPlaying(i);
        const e = entries[i];
        // An entry without a number keeps 0xFFFF seconds: wait for a key.
        if (!(await showGraphic(m, e.name, { cols, pause: e.pause ?? 0xffff, gamePalette: pal }))) break;
      }
    },
    onEnd: () => {
      setPlaying(-1);
      drawStill();
    },
  });
  const drawStill = () => {
    if (preview.running()) return;
    screenCanvas(stillOf(selected), 'pixel', preview.canvas);
  };
  const playBtn = h('button', { class: 'primary', onclick: () => (preview.running() ? preview.stop() : play(0)) }, '▶ Play the show');
  const playHint = h('span', { class: 'sl-length', hidden: true }, 'A key or a click moves on; Esc ends the show.');
  const play = (from: number) => {
    playFrom = Math.max(0, Math.min(from, entries.length - 1));
    preview.play();
  };

  // ---- layout -----------------------------------------------------------------------
  const inspector = h('div', { class: 'sl-inspector panel' });
  const lane = h('div', { class: 'sl-lane' });
  const marker = h('div', { class: 'sl-drop', hidden: true });
  const track = h(
    'div',
    { class: 'sl-track', tabIndex: 0, 'aria-label': 'Timeline: arrow keys pick a clip, Delete removes it, Alt+arrows move it' },
    lane,
    marker,
  );
  const length = h('span', { class: 'sl-length' });
  const bin = h('div', { class: 'sl-bin-grid' });
  const zoom = h('input', { type: 'range', min: 3, max: 40, value: String(pps), 'aria-label': 'Zoom' });
  zoom.addEventListener('input', () => {
    pps = Number(zoom.value);
    try {
      localStorage.setItem(ZOOM_KEY, String(pps));
    } catch {
      /* not kept */
    }
    renderLane();
  });

  // ---- the timeline -------------------------------------------------------------------
  const clipEls: HTMLElement[] = [];

  const badgeText = (e: SlideEntry, t: ClipTiming): string => {
    const f = facts(e.name);
    if (!f.exists) return 'missing';
    if (t.ignored) return 'own timing';
    if (t.then !== 'seconds') return f.kind === 'txt' && t.waits > 1 ? `${t.waits} pages` : '';
    return t.waits > 1 ? `${e.pause}s × ${t.waits}` : `${e.pause}s`;
  };

  const thenLabel = (e: SlideEntry, t: ClipTiming): string => {
    if (t.ignored) return 'A slide show inside a slide show keeps its own timing.';
    if (t.then === 'key') return 'Then waits for a key';
    if (t.then === 'none') return 'Then goes straight on';
    return `Then waits up to ${e.pause} second${e.pause === 1 ? '' : 's'}${t.waits > 1 ? ' a page' : ''} (a key moves on sooner)`;
  };

  const clipEl = (e: SlideEntry, i: number): HTMLElement => {
    const t = timing(e);
    const f = facts(e.name);
    const thumb = thumbOf(e.name);
    const width = clipWidth(t, pps, THUMB_W);
    const el = h(
      'div',
      {
        class: [
          'sl-clip',
          `k-${f.kind}`,
          `then-${t.then}`,
          i === selected ? 'selected' : '',
          i === playing ? 'playing' : '',
          f.exists ? '' : 'missing',
          t.then === 'seconds' && !t.ignored ? 'timed' : '',
        ].join(' '),
        style: `width:${width}px;${thumb.url ? `background-image:url(${thumb.url})` : ''}`,
        title: `${e.name.toUpperCase()} — ${KIND_NAME[f.kind]}. ${thenLabel(e, t)}`,
        dataset: { index: String(i) },
      },
      thumb.url ? null : h('span', { class: 'sl-icon' }, thumb.el.textContent ?? ''),
      t.lead > 0.2 && t.then === 'seconds'
        ? h('span', {
            class: 'sl-lead',
            style: `width:${Math.min(width, t.lead * pps)}px`,
            title: f.kind === 'fli' ? 'The animation plays' : 'Fades in from black',
          })
        : null,
      h('span', { class: 'sl-name' }, e.name.toUpperCase()),
      badgeText(e, t) ? h('span', { class: 'sl-badge' }, badgeText(e, t)) : null,
      h('span', { class: 'sl-playhead' }),
      h('span', { class: 'sl-handle left', title: 'Drag to make it longer or shorter', dataset: { side: 'left' } }),
      h('span', { class: 'sl-handle right', title: 'Drag to make it longer or shorter', dataset: { side: 'right' } }),
    );
    clipEls[i] = el;
    return el;
  };

  const chipEl = (e: SlideEntry, i: number): HTMLElement => {
    const t = timing(e);
    return h(
      'button',
      {
        class: `sl-then then-${t.then} ${t.ignored ? 'ignored' : ''}`,
        title: `${thenLabel(e, t)}. Click to change.`,
        'aria-label': `After ${e.name}: ${thenLabel(e, t)}`,
        onclick: (ev: Event) => thenMenu(i, ev.currentTarget as HTMLElement),
      },
      t.ignored ? '·' : THEN_ICON[t.then],
      t.then === 'seconds' && !t.ignored ? h('small', null, `${e.pause}s`) : null,
    );
  };

  const renderLane = () => {
    clipEls.length = 0;
    clear(
      lane,
      ...entries.flatMap((e, i) => [clipEl(e, i), chipEl(e, i)]),
      entries.length
        ? h('div', { class: 'sl-end' }, '■')
        : h('div', { class: 'sl-empty' }, 'Drag pictures, animations and text screens here from the media below.'),
    );
    length.textContent = entries.length ? `${entries.length} slide${entries.length === 1 ? '' : 's'} · ${showLength(entries.map(timing))}` : '';
    // nothing to play until a slide is added
    if (!preview.running()) playBtn.disabled = !entries.length;
  };

  const render = () => {
    if (selected >= entries.length) selected = entries.length - 1;
    renderLane();
    renderInspector();
    renderBin();
    drawStill();
  };

  const select = (i: number, scroll = true) => {
    selected = Math.max(-1, Math.min(i, entries.length - 1));
    clipEls.forEach((el, j) => el.classList.toggle('selected', j === selected));
    renderInspector();
    drawStill();
    if (scroll) clipEls[selected]?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  };

  const setPlaying = (i: number) => {
    playing = i;
    playStart = performance.now();
    clipEls.forEach((el, j) => el.classList.toggle('playing', j === i));
    if (i >= 0) clipEls[i]?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
    if (i >= 0) requestAnimationFrame(tick);
  };
  /** Moves the playhead through the clip being played. */
  const tick = () => {
    if (playing < 0 || !clipEls[playing]) return;
    const e = entries[playing];
    const t = timing(e);
    const el = clipEls[playing];
    const head = el.querySelector<HTMLElement>('.sl-playhead');
    const secs = (performance.now() - playStart) / 1000;
    const span = t.then === 'seconds' ? t.total : Math.max(t.lead, 0.5);
    const frac = Math.min(1, secs / Math.max(0.1, span));
    if (head) head.style.left = `${frac * (el.clientWidth - 3)}px`;
    el.classList.toggle('waiting', t.then === 'key' && secs >= t.lead);
    requestAnimationFrame(tick);
  };

  // ---- changing clips -----------------------------------------------------------------
  const commit = (next: SlideEntry[], sel = selected) => {
    entries = next;
    selected = sel;
    save();
    render();
  };

  const insert = (name: string, at: number) => {
    if (entries.length >= MAX_SLIDES) {
      toast(`A slide show holds at most ${MAX_SLIDES} slides.`, 'error');
      return;
    }
    const n = normalize(name);
    const next = entries.slice();
    // New pictures wait for a key like most of the game's screens; animations go straight on.
    next.splice(at, 0, { name: n, pause: clipKind(n) === 'fli' ? 0 : undefined });
    commit(next, at);
  };

  const remove = (i: number) => {
    if (i < 0 || i >= entries.length) return;
    const next = entries.slice();
    next.splice(i, 1);
    commit(next, Math.min(i, next.length - 1));
  };

  const setThen = (i: number, then: Then, seconds?: number) => {
    const e = entries[i];
    if (!e) return;
    const current = e.pause && e.pause > 0 ? e.pause : 5;
    e.pause = then === 'key' ? undefined : then === 'none' ? 0 : Math.max(1, Math.min(32767, Math.round(seconds ?? current)));
    save();
    renderLane();
    renderInspector();
  };

  const thenControls = (i: number, onDone?: () => void): HTMLElement => {
    const e = entries[i];
    const t = timing(e);
    const secs = h('input', {
      type: 'number',
      min: 1,
      max: 32767,
      value: String(e.pause && e.pause > 0 ? e.pause : 5),
      'aria-label': 'Seconds',
      disabled: t.ignored,
    });
    secs.addEventListener('change', () => (setThen(i, 'seconds', Number(secs.value) || 1), onDone?.()));
    const opt = (then: Then, label: string) =>
      h(
        'button',
        {
          class: t.then === then ? 'on' : '',
          'aria-pressed': String(t.then === then),
          disabled: t.ignored,
          onclick: () => (setThen(i, then, Number(secs.value) || 5), onDone?.()),
        },
        `${THEN_ICON[then]} ${label}`,
      );
    return h(
      'div',
      { class: 'sl-then-controls' },
      h('div', { class: 'seg' }, opt('key', 'Wait for a key'), opt('none', 'Go straight on'), opt('seconds', 'Wait')),
      h('label', { class: 'sl-secs' }, secs, ' seconds'),
    );
  };

  let menu: HTMLElement | undefined;
  const closeMenu = () => {
    menu?.remove();
    menu = undefined;
    document.removeEventListener('pointerdown', outside, true);
  };
  const outside = (e: Event) => {
    if (menu && !menu.contains(e.target as Node)) closeMenu();
  };
  const thenMenu = (i: number, anchor: HTMLElement) => {
    closeMenu();
    select(i, false);
    const t = timing(entries[i]);
    menu = h(
      'div',
      { class: 'sl-menu', role: 'dialog', 'aria-label': 'After this slide' },
      h('strong', null, `After ${entries[i].name.toUpperCase()}`),
      t.ignored
        ? h('p', { class: 'meta' }, 'A slide show inside a slide show keeps its own timing: the game does not use a number after it.')
        : thenControls(i, closeMenu),
    );
    document.body.append(menu);
    const r = anchor.getBoundingClientRect();
    const w = menu.offsetWidth;
    menu.style.left = `${Math.max(8, Math.min(window.innerWidth - w - 8, r.left + r.width / 2 - w / 2))}px`;
    menu.style.top = `${r.bottom + window.scrollY + 6}px`;
    setTimeout(() => document.addEventListener('pointerdown', outside, true));
  };

  // ---- inspector ----------------------------------------------------------------------
  const renderInspector = () => {
    view.set({ slide: selected >= 0 ? selected + 1 : undefined });
    const e = entries[selected];
    if (!e) {
      clear(
        inspector,
        h('h2', null, 'An empty slide show'),
        h(
          'p',
          { class: 'meta' },
          'Drag pictures (.GIF), backdrops (.BKD), animations (.FLI) and text screens (.TXT) from the media below onto the timeline, or tap one to add it. Nothing there yet? Start with one of these:',
        ),
        h(
          'div',
          { class: 'toolbar' },
          h('button', { onclick: () => void addFromPicker('gif', true) }, '📀 A picture from the library…'),
          h('button', { onclick: () => newText() }, '+ New text screen'),
        ),
      );
      return;
    }
    const f = facts(e.name);
    const t = timing(e);
    const what =
      !f.exists && f.kind !== 'txt'
        ? 'This file is not in the game: the game clears the screen and goes straight on.'
        : f.kind === 'gif' || f.kind === 'bkd'
          ? 'Fades in from black.'
          : f.kind === 'fli'
            ? `Plays once (${(f.playSeconds ?? 0).toFixed(1)} s), and its last frame stays.`
            : f.kind === 'txt'
              ? f.exists
                ? `Written over the picture before it, ${f.pages} page${f.pages === 1 ? '' : 's'} of 16 lines.`
                : 'This file is not in the game: the game shows “Missing File” instead.'
              : f.kind === 'lst'
                ? 'Plays that slide show, with its own timing.'
                : 'The game does not know how to show this kind of file.';
    clear(
      inspector,
      h(
        'div',
        { class: 'sl-insp-head' },
        h('span', { class: 'sl-insp-num' }, `${selected + 1}`),
        h('div', null, h('h2', null, e.name.toUpperCase()), h('div', { class: 'meta' }, KIND_NAME[f.kind])),
        f.exists
          ? h(
              'a',
              { class: 'sl-edit', href: `#/p/${project.id}/${encodeURIComponent(project.files.resolve(e.name) ?? e.name)}`, title: `Edit ${e.name}` },
              '✎ Edit',
            )
          : null,
      ),
      h('p', { class: `sl-what ${f.exists ? '' : 'warn'}` }, what),
      h('div', { class: 'sl-then-title' }, 'Then'),
      t.ignored ? h('p', { class: 'meta' }, 'The game does not use a number after a slide show inside a slide show.') : thenControls(selected),
      h(
        'div',
        { class: 'sl-insp-actions' },
        h('button', { title: 'Play from this slide', onclick: () => play(selected) }, '▶ From here'),
        h(
          'button',
          {
            title: 'Move earlier',
            'aria-label': 'Move earlier',
            disabled: selected === 0,
            onclick: () => commit(moveEntry(entries, selected, selected - 1), selected - 1),
          },
          '◀',
        ),
        h(
          'button',
          {
            title: 'Move later',
            'aria-label': 'Move later',
            disabled: selected >= entries.length - 1,
            onclick: () => commit(moveEntry(entries, selected, selected + 2), selected + 1),
          },
          '▶',
        ),
        h(
          'button',
          {
            title: 'Show another file here',
            onclick: async () => {
              const picked = await pickFile(project, 'gif', { kinds: MEDIA_KINDS, current: e.name, title: 'Show instead' });
              if (!picked) return;
              e.name = normalize(picked);
              save();
              render();
            },
          },
          '⇄ Replace',
        ),
        h('button', { class: 'danger', onclick: () => remove(selected) }, '✕ Remove'),
      ),
    );
  };

  // ---- media bin ----------------------------------------------------------------------
  const renderBin = () => {
    const names = project.files.names().filter((n) => MEDIA_KINDS.includes(clipKind(n) as FileKind) && n !== file);
    const used = new Map<string, number>();
    for (const e of entries) used.set(normalize(e.name), (used.get(normalize(e.name)) ?? 0) + 1);
    clear(
      bin,
      ...names.map((n) => {
        const t = thumbOf(n);
        const thumb = t.url ? h('img', { src: t.url, alt: '', draggable: false }) : h('span', { class: 'sl-icon' }, t.el.textContent ?? '');
        return h(
          'div',
          {
            class: `sl-media k-${clipKind(n)}`,
            tabIndex: 0,
            role: 'button',
            title: `${n.toUpperCase()}: drag onto the timeline, or tap to add it after the selected slide`,
            dataset: { name: n },
          },
          thumb,
          h('span', { class: 'sl-media-name' }, n.toUpperCase()),
          used.get(n) ? h('span', { class: 'sl-media-used' }, `×${used.get(n)}`) : null,
        );
      }),
      names.length
        ? null
        : h(
            'p',
            { class: 'meta sl-bin-empty' },
            'This game has no pictures, animations or text screens yet. Add one with the buttons above: from the CD’s library, from your computer, or a new text screen.',
          ),
    );
  };

  const addFromPicker = async (kind: FileKind, adding: boolean) => {
    const picked = await pickFile(project, kind, { kinds: kind === 'txt' ? ['txt'] : MEDIA_KINDS, adding, title: 'Add to the slide show' });
    if (picked) insert(picked, selected + 1);
  };
  const newText = () => {
    const t = templateFor('txt');
    if (!t) return;
    const name = project.freeName(file.replace(/\.lst$/, ''), 'txt');
    project.files.set(name, t.make(project));
    insert(name, selected + 1);
  };

  // ---- dragging and keys on the timeline and the media bin (timelineInput.ts) ----------
  const input = timelineInput({
    host,
    track,
    lane,
    marker,
    bin,
    binBox: () => binBox,
    clipEls,
    entries: () => entries,
    selected: () => selected,
    pps: () => pps,
    thumbWidth: THUMB_W,
    timing,
    facts,
    badgeText,
    select,
    insert,
    remove,
    commit,
    play,
    save,
    renderLane,
    renderInspector,
  });

  // ---- page ---------------------------------------------------------------------------
  const binBox = h(
    'div',
    { class: 'sl-bin' },
    h(
      'div',
      { class: 'sl-bin-head' },
      h('h2', null, 'Media'),
      h('span', { class: 'meta' }, 'Drag onto the timeline, or tap to add after the selected slide. Drag a slide here to take it out.'),
      h('span', { class: 'spacer' }),
      h('button', { onclick: () => void addFromPicker('gif', true) }, '📀 From the library…'),
      h('button', { onclick: () => void addFromPicker('gif', false) }, '⬆ Other…'),
      h('button', { onclick: newText }, '+ New text screen'),
    ),
    bin,
  );

  clear(
    host,
    h('div', { class: 'sl-top' }, preview.el, inspector),
    h(
      'div',
      { class: 'sl-transport' },
      playBtn,
      length,
      playHint,
      h('span', { class: 'spacer' }),
      undoBtn,
      redoBtn,
      h('label', { class: 'sl-zoom' }, '🔍', zoom),
    ),
    track,
    h(
      'div',
      { class: 'sl-legend meta' },
      `Slides play in order; after each: ${THEN_ICON.key} waits for a key · ${THEN_ICON.none} goes straight on · ${THEN_ICON.seconds} waits seconds or a key (drag its edges for longer or shorter). Esc skips the rest.`,
    ),
    binBox,
  );
  fitToPane(bin);
  render();

  // Other editors may add or change the files shown here.
  const off = project.onChange((n) => {
    if (n === file || input.dragging()) return;
    if (MEDIA_KINDS.includes(clipKind(n))) refreshSoon();
  });
  let soon: ReturnType<typeof setTimeout> | undefined;
  const refreshSoon = () => {
    clearTimeout(soon);
    soon = setTimeout(render, 250);
  };
  const onKey = (e: KeyboardEvent) => {
    if (!(e.ctrlKey || e.metaKey) || e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
    const k = e.key.toLowerCase();
    if (k === 'z' || k === 'y') {
      e.preventDefault();
      step(k === 'z' && !e.shiftKey);
    }
  };
  window.addEventListener('keydown', onKey);
  return () => {
    window.removeEventListener('keydown', onKey);
    off();
    clearTimeout(soon);
    closeMenu();
    preview.stop();
  };
});
