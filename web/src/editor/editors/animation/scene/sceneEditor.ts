// The animation maker: build a scene (backgrounds, moving text, walking characters and
// monsters, blocks) on a timeline, watch it on the picture, and every change is written to
// the .FLI as PLAYGAME will play it. The scene itself is kept in the companion file under
// the .fli's name, so it opens again just as it was. Drag what is on the picture to move it
// (the arrow keys nudge it); Generate… makes an intro, a cast or a story from the game.
import './scene.css';
import { h, clear, modal, toast, debounce } from '../../../core/ui';
import { paintIndexed } from '../../../core/draw';
import { fitToPane } from '../../../core/fitPane';
import type { Project } from '../../../core/project';
import { BLEN } from '../../../../formats/blocks';
import {
  SCENE_H,
  SCENE_W,
  SCENE_SECTION,
  actorAt,
  allItems,
  backgroundAt,
  emptyScene,
  normalizeScene,
  sortBackgrounds,
  type Item,
  type Scene,
} from './sceneModel';
import { restBox, textAt, textWarnings } from './sceneText';
import { sceneAssets, type SceneAssets } from './sceneAssets';
import { actorFrame, framePalette, renderFrame, renderScene, sceneFli } from './sceneRender';
import { generateScene, type Generator } from './sceneGenerate';
import { findItem, newBlock, newCharacter, newMonster, newText, type SceneCtx, type Selection } from './sceneCtx';
import { inspector } from './sceneInspector';
import { moveHead, timeline } from './sceneTimeline';

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** The scene kept for this .fli, if it has one. */
export function storedScene(project: Project, file: string): Scene | undefined {
  return normalizeScene(project.extras(file, SCENE_SECTION, undefined));
}

/** Where an item is on the picture at frame `f`, for choosing and dragging it. */
function itemBox(scene: Scene, assets: SceneAssets, it: Item, f: number): { x: number; y: number; w: number; h: number } | undefined {
  const local = f - it.start;
  if (it.kind === 'text') {
    const at = textAt(it, local);
    const b = restBox(it);
    return { x: at.x, y: at.y, w: b.w, h: b.h };
  }
  if (it.kind === 'block') return { x: it.x, y: it.y, w: BLEN * it.scale, h: BLEN * it.scale };
  const seg = assets.segments.find((s) => f >= s.start && f < s.end);
  const art = seg?.actors.get(it.id);
  const at = actorAt(it.path, local);
  const pic = art ? actorFrame(art, local, scene.speed) : undefined;
  return { x: at.x, y: at.y, w: (pic?.w ?? BLEN) * it.scale, h: (pic?.h ?? BLEN) * it.scale };
}

/** Moves an item by (dx, dy) at frame `f`: a text or block where it rests; an actor's key at that frame (made if need be). */
function moveBy(s: Scene, id: string, dx: number, dy: number, f: number): void {
  const found = findItem(s, id);
  if (!found) return;
  const it = found.item;
  if (it.kind !== 'actor') {
    it.x += dx;
    it.y += dy;
    return;
  }
  const local = Math.max(0, Math.min(it.end - it.start - 1, f - it.start));
  let key = it.path.find((k) => k.f === local) ?? (it.path.length === 1 ? it.path[0] : undefined);
  if (!key) {
    const at = actorAt(it.path, local);
    key = { f: local, x: at.x, y: at.y };
    it.path.push(key);
    it.path.sort((a, b) => a.f - b.f);
  }
  key.x += dx;
  key.y += dy;
}

export function sceneEditor(host: HTMLElement, project: Project, file: string): () => void {
  const stored = storedScene(project, file);
  let scene: Scene = stored ?? emptyScene();
  let assets = sceneAssets(scene, project);
  let selection: Selection = { kind: 'scene' };
  let cur = 0;
  let playing = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  /** False until the first change: opening the maker on an animation drawn some other way leaves it alone. */
  let dirty = false;
  const undo: string[] = [];
  const redo: string[] = [];
  /** While dragging on the picture: the scene as it would be. */
  let preview: Scene | undefined;
  /** A change not yet written to the .FLI. */
  let pending = false;

  const stage = h('canvas', { class: 'pixel scn-stage', width: SCENE_W, height: SCENE_H, tabIndex: 0, role: 'img', 'aria-label': 'The animation' });
  const counter = h('span', { class: 'fli-counter' });
  const scrub = h('input', { type: 'range', class: 'fli-scrub', min: 0, value: 0, 'aria-label': 'Frame' });
  const playBtn = h('button', { type: 'button', class: 'primary fli-play', title: 'Play / pause (Space)' }, '▶ Play');
  const info = h('p', { class: 'scn-info' });
  const warnings = h('div', { class: 'scn-warnings', role: 'status', 'aria-live': 'polite' });
  const timelineBox = h('div', { class: 'scn-timeline-box' });
  const side = h('div', { class: 'scn-side' });
  const undoBtn = h('button', { type: 'button', title: 'Undo (Ctrl+Z)', onclick: () => history(undo, redo) }, '↶ Undo');
  const redoBtn = h('button', { type: 'button', title: 'Redo (Ctrl+Y)', onclick: () => history(redo, undo) }, '↷ Redo');

  const shown = () => preview ?? scene;

  const paint = () => {
    const s = shown();
    const px = renderFrame(s, assets, cur);
    paintIndexed(stage, px, SCENE_W, SCENE_H, framePalette(s, assets, cur));
    if (selection.kind === 'item') {
      const found = findItem(s, selection.id);
      if (found && cur >= found.item.start && cur < found.item.end) {
        const b = itemBox(s, assets, found.item, cur);
        const g = stage.getContext('2d')!;
        if (b) {
          g.setLineDash([3, 2]);
          g.lineWidth = 1;
          g.strokeStyle = found.item.kind === 'text' && textWarnings(found.item).length ? '#ff4040' : '#ffd400';
          g.strokeRect(b.x - 0.5, b.y - 0.5, b.w + 1, b.h + 1);
        }
      }
    }
    counter.textContent = `Frame ${cur + 1} / ${s.frames}`;
    scrub.max = String(s.frames - 1);
    scrub.value = String(cur);
    stage.setAttribute(
      'aria-label',
      `The animation at frame ${cur + 1} of ${s.frames}. Drag what is on it to move it; with the picture focused, the arrow keys move the chosen item (Shift: 10 pixels).`,
    );
    moveHead(timelineBox, cur, s.frames);
  };

  const showWarnings = () => {
    const list: HTMLElement[] = [];
    for (const { item } of allItems(scene)) {
      if (item.kind !== 'text') continue;
      const w = textWarnings(item);
      if (w.length)
        list.push(
          h(
            'li',
            null,
            `Text “${item.text.split('\n')[0].slice(0, 20)}” ${w.join(', ')}. `,
            h(
              'button',
              { type: 'button', onclick: () => (seek(item.start + Math.min(item.end - item.start - 1, item.rate)), select({ kind: 'item', id: item.id })) },
              'Show it',
            ),
          ),
        );
    }
    for (const p of assets.problems) list.push(h('li', null, `${p}.`));
    clear(warnings, list.length ? h('ul', null, list) : null);
    warnings.hidden = !list.length;
  };

  const showInfo = () => {
    const bytes = project.files.get(file)?.length ?? 0;
    const secs = (scene.frames * scene.speed) / 70;
    info.textContent = `${scene.frames} frames · ${secs.toFixed(1)} s · ${dirty ? 'written to' : 'not yet written to'} ${file.toUpperCase()}${dirty ? ` (${bytes.toLocaleString()} bytes)` : ''}`;
    undoBtn.disabled = !undo.length;
    redoBtn.disabled = !redo.length;
  };

  const rebuildTimeline = () => {
    const had = (document.activeElement as HTMLElement | null)?.closest?.('.scn-timeline') ? document.activeElement?.getAttribute('title') : undefined;
    clear(timelineBox, timeline(ctx));
    if (had) [...timelineBox.querySelectorAll<HTMLElement>('button')].find((b) => b.getAttribute('title')?.split(':')[0] === had.split(':')[0])?.focus();
  };
  const rebuildSide = () => clear(side, inspector(ctx));

  /** Writes the .FLI (a moment after the last change). */
  const write = () => {
    pending = false;
    if (!dirty) return;
    try {
      project.files.set(file, sceneFli(scene, renderScene(scene, assets)));
    } catch (e) {
      toast(`The animation could not be written: ${(e as Error).message}`, 'error');
    }
    showInfo();
  };
  const writeSoon = debounce(write, 600);

  const save = () => {
    project.setExtras(file, SCENE_SECTION, scene);
    dirty = true;
    pending = true;
    writeSoon();
  };

  const refresh = (rebuild: boolean) => {
    assets = sceneAssets(scene, project);
    cur = Math.min(cur, scene.frames - 1);
    rebuildTimeline();
    if (rebuild) rebuildSide();
    showWarnings();
    showInfo();
    paint();
  };

  const change = (fn: (s: Scene) => void, rebuild = false) => {
    undo.push(JSON.stringify(scene));
    if (undo.length > 100) undo.shift();
    redo.length = 0;
    const next = structuredClone(scene);
    fn(next);
    next.backgrounds = sortBackgrounds(next.backgrounds);
    scene = normalizeScene(next) ?? scene;
    save();
    refresh(rebuild);
  };

  const history = (from: string[], to: string[]) => {
    const prev = from.pop();
    if (!prev) return;
    to.push(JSON.stringify(scene));
    scene = normalizeScene(JSON.parse(prev)) ?? scene;
    save();
    refresh(true);
  };

  const select = (s: Selection) => {
    selection = s;
    rebuildTimeline();
    rebuildSide();
    paint();
  };

  const pause = () => {
    playing = false;
    clearTimeout(timer);
    playBtn.textContent = '▶ Play';
  };
  const play = () => {
    pause();
    playing = true;
    playBtn.textContent = '⏸ Pause';
    if (cur >= scene.frames - 1) cur = 0;
    paint();
    const tick = () => {
      timer = setTimeout(
        () => {
          if (cur + 1 >= scene.frames) return pause();
          cur++;
          paint();
          tick();
        },
        (Math.max(1, scene.speed) / 70) * 1000,
      );
    };
    tick();
  };
  const seek = (f: number) => {
    pause();
    cur = Math.max(0, Math.min(scene.frames - 1, f));
    paint();
  };
  playBtn.addEventListener('click', () => (playing ? pause() : play()));
  scrub.addEventListener('input', () => seek(Number(scrub.value)));

  const ctx: SceneCtx = {
    project,
    scene: () => scene,
    change,
    selection: () => selection,
    select,
    frame: () => cur,
    seek,
    paletteAt: (f) => assets.segments[backgroundAt(scene, f)]?.palette ?? assets.segments[0].palette,
  };

  // the picture: click to choose what is there, drag to move it
  const pointAt = (e: PointerEvent) => {
    const r = stage.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * SCENE_W, y: ((e.clientY - r.top) / r.height) * SCENE_H };
  };
  stage.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    pause();
    const p = pointAt(e);
    const hit = allItems(scene)
      .reverse()
      .find(({ item }) => {
        if (cur < item.start || cur >= item.end) return false;
        const b = itemBox(scene, assets, item, cur);
        return b && p.x >= b.x && p.x < b.x + b.w && p.y >= b.y && p.y < b.y + b.h;
      });
    if (!hit) return select({ kind: 'scene' });
    const id = hit.item.id;
    if (selection.kind !== 'item' || selection.id !== id) select({ kind: 'item', id });
    stage.setPointerCapture(e.pointerId);
    let dx = 0;
    let dy = 0;
    const move = (ev: PointerEvent) => {
      const q = pointAt(ev);
      dx = Math.round(q.x - p.x);
      dy = Math.round(q.y - p.y);
      preview = structuredClone(scene);
      moveBy(preview, id, dx, dy, cur);
      paint();
    };
    const up = () => {
      stage.removeEventListener('pointermove', move);
      stage.removeEventListener('pointerup', up);
      stage.removeEventListener('pointercancel', up);
      preview = undefined;
      if (dx || dy) change((s) => moveBy(s, id, dx, dy, cur), true);
      else paint();
    };
    stage.addEventListener('pointermove', move);
    stage.addEventListener('pointerup', up);
    stage.addEventListener('pointercancel', up);
  });
  stage.addEventListener('keydown', (e) => {
    if (selection.kind !== 'item') return;
    const step = e.shiftKey ? 10 : 1;
    const d = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
    if (!d) return;
    e.preventDefault();
    e.stopPropagation();
    const id = selection.id;
    change((s) => moveBy(s, id, d[0], d[1], cur), true);
  });

  const add = (make: () => Item | undefined, name: string, missing: string) => {
    const it = make();
    if (!it) return toast(missing, 'error');
    change((s) => s.tracks.push({ name, items: [it] }));
    select({ kind: 'item', id: it.id });
  };
  const addBackground = () => {
    const at = Math.max(1, cur);
    if (scene.backgrounds.some((b) => b.start === at)) return toast('A background already starts at this frame.', 'error');
    const copy = { ...scene.backgrounds[backgroundAt(scene, at)], start: at };
    change((s) => s.backgrounds.push(copy));
    select({ kind: 'bg', index: sortBackgrounds(scene.backgrounds).findIndex((b) => b.start === at) });
  };

  const generate = async () => {
    const kinds: [Generator, string, string][] = [
      ['intro', '🎬 Intro', 'The title over the first level, as the player arrives, with the hero walking across.'],
      ['cast', '🎭 Cast', 'Each hero and the monsters the levels place, in turn, close up, with a name card.'],
      ['story', '📜 Story', 'The game’s story text, a page at a time, typed over its levels.'],
    ];
    const kind = await modal<Generator>('Generate a scene', (close) =>
      h(
        'div',
        { class: 'stack scn-generate' },
        h(
          'p',
          { class: 'hint' },
          'Made from this game’s own pictures, maps, characters and monsters. It takes the place of this scene (Undo brings it back), and everything in it can be changed afterwards.',
        ),
        ...kinds.map(([k, label, about]) =>
          h('button', { type: 'button', class: 'scn-gen-choice', onclick: () => close(k) }, h('strong', null, label), h('span', null, about)),
        ),
      ),
    );
    if (!kind) return;
    const next = generateScene(kind, {
      files: project.files,
      game: () => project.game(),
      paletteFor: (f) => project.paletteFor(f),
      name: project.name,
      extras: (f, s, fb) => project.extras(f, s, fb),
    });
    change((s) => Object.assign(s, next));
    cur = 0;
    select({ kind: 'scene' });
    if (!reducedMotion()) play();
  };

  const keys = (e: KeyboardEvent) => {
    const t = e.target as HTMLElement;
    if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT') return;
    if (e.key === ' ' && t.tagName !== 'BUTTON') playing ? pause() : play();
    else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') history(...(e.shiftKey ? ([redo, undo] as const) : ([undo, redo] as const)));
    else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') history(redo, undo);
    else if ((e.key === '.' || (e.key === 'ArrowRight' && t === stage && selection.kind !== 'item')) && !e.ctrlKey) seek(cur + 1);
    else if ((e.key === ',' || (e.key === 'ArrowLeft' && t === stage && selection.kind !== 'item')) && !e.ctrlKey) seek(cur - 1);
    else if (e.key === 'Delete' && selection.kind === 'item' && (t === stage || t.closest('.scn-bar'))) removeSelected();
    else return;
    e.preventDefault();
  };

  const removeSelected = () => {
    if (selection.kind !== 'item') return;
    const id = selection.id;
    change((s) => s.tracks.forEach((tr) => (tr.items = tr.items.filter((x) => x.id !== id))));
    select({ kind: 'scene' });
  };
  const duplicateSelected = () => {
    if (selection.kind !== 'item') return;
    const found = findItem(scene, selection.id);
    if (!found) return;
    const copy = { ...structuredClone(found.item), id: `${found.item.id}c${Date.now().toString(36)}` };
    change((s) => s.tracks[found.track].items.push(copy));
    select({ kind: 'item', id: copy.id });
  };

  const main = h(
    'div',
    { class: 'scn-main' },
    h('div', { class: 'fli-monitor scn-monitor' }, stage),
    h(
      'div',
      { class: 'toolbar fli-transport' },
      h('button', { type: 'button', 'aria-label': 'First frame', title: 'First frame', onclick: () => seek(0) }, '⏮'),
      h('button', { type: 'button', 'aria-label': 'Previous frame', title: 'Previous frame (,)', onclick: () => seek(cur - 1) }, '◀'),
      playBtn,
      h('button', { type: 'button', 'aria-label': 'Next frame', title: 'Next frame (.)', onclick: () => seek(cur + 1) }, '▶'),
      h('button', { type: 'button', 'aria-label': 'Last frame', title: 'Last frame', onclick: () => seek(scene.frames - 1) }, '⏭'),
      counter,
      scrub,
    ),
    warnings,
  );
  clear(
    host,
    h(
      'div',
      { class: 'scn', onkeydown: keys },
      main,
      side,
      h(
        'div',
        { class: 'scn-bottom' },
        h(
          'div',
          { class: 'toolbar scn-add' },
          h(
            'button',
            {
              type: 'button',
              title: 'Words that move, in the PC’s 8x8 letters',
              onclick: () => add(() => newText(scene, cur, ctx.paletteAt(cur)), 'Text', ''),
            },
            '+ Text',
          ),
          h(
            'button',
            {
              type: 'button',
              title: 'A character from this game, walking',
              onclick: () => add(() => newCharacter(project, scene, cur), 'Character', 'This game has no character (.CHR) yet.'),
            },
            '+ Character',
          ),
          h(
            'button',
            {
              type: 'button',
              title: 'A monster from this game',
              onclick: () => add(() => newMonster(project, scene, cur), 'Monster', 'This game has no monsters (.MON) yet.'),
            },
            '+ Monster',
          ),
          h(
            'button',
            {
              type: 'button',
              title: 'A background block, placed on the picture',
              onclick: () => add(() => newBlock(project, scene, cur), 'Block', 'This game has no background blocks (.BBL) yet.'),
            },
            '+ Block',
          ),
          h('button', { type: 'button', title: 'Change to another background from the frame shown', onclick: addBackground }, '+ Background'),
          h('button', { type: 'button', title: 'Copy the chosen item', onclick: duplicateSelected }, '⧉ Duplicate'),
          h('button', { type: 'button', class: 'danger', title: 'Remove the chosen item (Delete)', onclick: removeSelected }, '🗑 Remove'),
          h('span', { class: 'spacer' }),
          h(
            'button',
            { type: 'button', class: 'primary', title: 'Make an intro, a cast or a story from this game', onclick: () => void generate() },
            '✨ Generate…',
          ),
          undoBtn,
          redoBtn,
        ),
        timelineBox,
        info,
      ),
    ),
  );
  // the picture leaves room below it for the transport, the add buttons and some of the timeline
  fitToPane(main, timelineBox);
  refresh(true);
  if (!stored)
    toast(
      project.files.get(file)?.length
        ? 'Making a scene here replaces this animation’s frames once you change something.'
        : 'Add text, characters and blocks, or Generate… a scene.',
    );
  if (stored && !reducedMotion()) play();
  return () => {
    pause();
    if (pending) write();
  };
}
