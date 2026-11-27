// Map view persistence and opening-position restoration.
import { BLEN } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import type { parseMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { LASTMON } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import type { viewState } from '../../../urlState';
import type { Project } from '../../core/project';
import type { mapViewport } from './mapViewport';
import { rememberView, type MapView } from './mapViews';
import { nativeCell } from './mapWrap';
import { zoomToUrl } from './mapZoom';
interface Context {
  readonly project: Project;
  readonly file: string;
  readonly host: HTMLElement;
  readonly scroller: HTMLDivElement;
  readonly viewport: ReturnType<typeof mapViewport>;
  readonly wrapping: boolean;
  readonly zoom: number;
  readonly view: ReturnType<typeof viewState>;
  readonly saved: MapView | undefined;
  readonly linkMarks: () => { x: number; y: number; kind: 'from' | 'to'; label: string }[];
  readonly map: ReturnType<typeof parseMap>;
}
export function mapViewMemory(editor: Context) {
  let viewReady = false;
  /** True while the opening spot may still be put back; no view is saved until the reader acts or it ends. */
  let restoring = true;
  let stopRestoring = () => {};
  const listeners = new AbortController();
  let cleanupOpening = () => {};
  let frame: number;
  let rememberTimer: ReturnType<typeof setTimeout> | undefined;
  let latest: MapView | undefined;
  /** Notes the view now (zoom and the block at the middle); it is saved once things settle. */
  function noteView(): void {
    if (!viewReady || restoring) return;
    const at = editor.viewport.at();
    const c = editor.wrapping ? nativeCell({ x: Math.round(at.x), y: Math.round(at.y) }) : at;
    latest = { z: editor.zoom, x: c.x, y: c.y };
    if (!editor.wrapping) {
      const s = BLEN * editor.zoom;
      Object.assign(latest, {
        sx: editor.scroller.scrollLeft / s,
        sy: editor.scroller.scrollTop / s,
        w: editor.scroller.clientWidth,
        h: editor.scroller.clientHeight,
      });
    }
    clearTimeout(rememberTimer);
    rememberTimer = setTimeout(flushView, 300);
  }
  function flushView(): void {
    clearTimeout(rememberTimer);
    if (latest) rememberView(editor.project.id, editor.file, latest);
    latest = undefined;
  }

  function restoreView(): void {
    // Open where the address says, else where the action is: where the character starts, else the first placed monster.
    frame = requestAnimationFrame(() => {
      if (!editor.host.isConnected) return;
      editor.viewport.setWrapped(editor.wrapping);
      const urlX = editor.view.num('x');
      const urlY = editor.view.num('y');
      const start = editor.linkMarks().find((m) => m.kind === 'to') ?? editor.map.monsters.find((m) => m.monnum < LASTMON) ?? undefined;
      const at = editor.saved
        ? { x: editor.saved.x, y: editor.saved.y }
        : urlX !== undefined && urlY !== undefined
          ? { x: urlX, y: urlY }
          : start
            ? 'curx' in start
              ? { x: start.curx, y: start.cury }
              : start
            : undefined;
      // the same window size (a scroll bar aside): the exact scroll; else the same middle
      const place = () => {
        if (
          editor.saved?.sx !== undefined &&
          editor.saved.sy !== undefined &&
          !editor.wrapping &&
          Math.abs((editor.saved.w ?? 0) - editor.scroller.clientWidth) < 40 &&
          Math.abs((editor.saved.h ?? 0) - editor.scroller.clientHeight) < 40
        )
          editor.viewport.goTo({ x: editor.saved.sx, y: editor.saved.sy }, { x: 0, y: 0 });
        else if (at) editor.viewport.goTo(at);
      };
      place();
      viewReady = true;
      if (editor.saved) editor.view.set({ zoom: zoomToUrl(editor.zoom) }); // the address says the zoom the map opened at
      // The window may still change size as the editor settles, which would shift the middle: keep
      // putting the spot back until the reader does something.
      const keepSpot = new ResizeObserver(() => {
        if (restoring) place();
      });
      keepSpot.observe(editor.scroller);
      const stopKeeping = () => {
        restoring = false;
        keepSpot.disconnect();
        noteView();
      };
      const openingTimer = setTimeout(stopKeeping, 800);
      for (const e of ['wheel', 'pointerdown', 'keydown', 'touchstart'] as const)
        editor.scroller.addEventListener(e, stopKeeping, { passive: true, once: true, signal: listeners.signal });
      stopRestoring = stopKeeping;
      // from now on, scrolling updates the address (once it settles)
      let settle: ReturnType<typeof setTimeout> | undefined;
      editor.scroller.addEventListener(
        'scroll',
        () => {
          clearTimeout(settle);
          settle = setTimeout(() => {
            const at = editor.viewport.at();
            const center = editor.wrapping ? nativeCell({ x: Math.round(at.x), y: Math.round(at.y) }) : { x: Math.round(at.x), y: Math.round(at.y) };
            editor.view.set({ x: center.x, y: center.y });
          }, 300);
          noteView();
        },
        { signal: listeners.signal },
      );
      cleanupOpening = () => {
        clearTimeout(openingTimer);
        clearTimeout(settle);
        keepSpot.disconnect();
      };
    });
  }
  function dispose(): void {
    cancelAnimationFrame(frame);
    listeners.abort();
    cleanupOpening();
    flushView();
  }
  return { noteView, dispose, restoreView, stopRestoring: () => stopRestoring() };
}
