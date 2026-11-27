// Map pointer strokes and tool event dispatch.
import { type parseBlocks } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { MLEN, type parseMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { LASTMON } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { type linkMarkers } from './links/linkMarkers';
import { isTool, type Mode } from './mapToolModes';
import { type mapViewport } from './mapViewport';
import { describeBehavior } from './tools/blockMarks';
import { type blockMarksLayer } from './tools/blockMarksDraw';
import { type OverlayState } from './tools/overlay';
import { type MapTools } from './tools/toolController';

interface Context {
  readonly map: ReturnType<typeof parseMap>;
  readonly mode: Mode;
  brush: number;
  painting: boolean;
  placingExit: boolean;
  lastPaint: { x: number; y: number } | undefined;
  readonly canvas: HTMLCanvasElement;
  readonly scroller: HTMLDivElement;
  readonly cell: (e: PointerEvent) => { x: number; y: number };
  readonly viewport: ReturnType<typeof mapViewport>;
  readonly tools: MapTools;
  readonly remember: () => void;
  readonly placeMonster: (x: number, y: number, remove: boolean) => void;
  readonly rebuildPickers: () => void;
  readonly setMode: (mode: Mode) => void;
  readonly redrawOverlay: () => void;
  readonly floodFill: (x: number, y: number) => void;
  readonly paintCell: (x: number, y: number, v?: number) => void;
  readonly zoom: number;
  readonly setZoom: (value: number, pointer?: { x: number; y: number }) => void;
  readonly linkMarks: () => { x: number; y: number; kind: 'from' | 'to'; label: string }[];
  readonly marks: ReturnType<typeof blockMarksLayer>;
  readonly bg: ReturnType<typeof parseBlocks>;
  readonly status: HTMLDivElement;
  readonly finding: boolean;
  readonly overlay: OverlayState;
  readonly revealTool: (mode: Mode) => void;
  readonly save: () => void;
  readonly markers: ReturnType<typeof linkMarkers>;
}

export function bindMapPointer(editor: Context) {
  // Tap to place: after "Add an exit" the next tap on the map puts the exit there (a drag works as before)

  editor.canvas.addEventListener(
    'pointerdown',
    (e) => {
      if (!editor.placingExit) return;
      editor.placingExit = false;
      e.stopImmediatePropagation();
      e.preventDefault();
      const p = editor.cell(e);
      editor.markers.moveExit({ x: p.x, y: p.y });
    },
    true,
  );

  let zoomPointer: number | undefined;
  editor.canvas.addEventListener('pointerdown', (e) => {
    if (editor.mode === 'pan') return;
    if (editor.mode === 'zoom') {
      if (e.isPrimary && e.button === 0) zoomPointer = e.pointerId;
      return;
    }
    const p = editor.cell(e);
    if (isTool(editor.mode)) {
      editor.canvas.setPointerCapture(e.pointerId);
      editor.tools.pointerDown(editor.viewport.gestureCell(e), e.button);
      return;
    }
    if (editor.mode !== 'pick') editor.remember();
    if (editor.mode === 'monster') {
      editor.placeMonster(p.x, p.y, e.button === 2);
      return;
    }
    if (editor.mode === 'pick') {
      editor.brush = editor.map.blocks[p.y * MLEN + p.x];
      editor.rebuildPickers();
      editor.setMode('paint');
      editor.redrawOverlay();
      return;
    }
    if (editor.mode === 'fill') {
      editor.floodFill(p.x, p.y);
      return;
    }
    editor.canvas.setPointerCapture(e.pointerId);
    editor.painting = true;
    const at = editor.viewport.gestureCell(e);
    editor.paintCell(at.x, at.y);
    editor.viewport.render();
  });
  // the Zoom tool zooms when a finger lifts, so a pinch (whose fingers the gesture code swallows) never also taps
  editor.canvas.addEventListener('pointerup', (e) => {
    if (zoomPointer !== e.pointerId) return;
    zoomPointer = undefined;
    if (editor.mode !== 'zoom' || e.button !== 0) return;
    const r = editor.scroller.getBoundingClientRect();
    editor.setZoom(editor.zoom * (e.shiftKey ? 1 / 1.5 : 1.5), {
      x: e.clientX - r.left - editor.scroller.clientLeft,
      y: e.clientY - r.top - editor.scroller.clientTop,
    });
  });

  editor.canvas.addEventListener('pointermove', (e) => {
    let p = editor.cell(e);
    const b = editor.map.blocks[p.y * MLEN + p.x];
    const mon = editor.map.monsters.find((m) => m.monnum < LASTMON && m.curx === p.x && m.cury === p.y);
    const links = editor.linkMarks().filter((m) => m.x === p.x && m.y === p.y);
    const does = editor.marks.any() && editor.bg[b] ? describeBehavior(editor.bg[b], b) : '';
    editor.status.textContent = `(${p.x}, ${p.y}) block ${b}${does ? ` · ${does}` : ''}${mon ? ` · monster ${mon.monnum}` : ''}${links.map((m) => ` · link ${m.label}`).join('')}${editor.finding ? ` · block ${editor.brush} is used ${editor.overlay.found.length} times` : ''}`;
    if (isTool(editor.mode)) return editor.tools.pointerMove(editor.viewport.gestureCell(e), e.buttons);
    if (!editor.painting || !editor.canvas.hasPointerCapture(e.pointerId)) return;
    // a fast stroke skips cells: fill them in along a line
    p = editor.viewport.gestureCell(e);
    const from = editor.lastPaint ?? p;
    const n = Math.max(Math.abs(p.x - from.x), Math.abs(p.y - from.y));
    for (let k = 1; k <= n; k++) editor.paintCell(Math.round(from.x + ((p.x - from.x) * k) / n), Math.round(from.y + ((p.y - from.y) * k) / n));
    editor.paintCell(p.x, p.y);
    editor.lastPaint = p;
    editor.viewport.render();
  });
  editor.canvas.addEventListener('pointerdown', (e) => (editor.lastPaint = editor.viewport.gestureCell(e)));
  const endStroke = (e: PointerEvent) => {
    if (isTool(editor.mode)) {
      editor.tools.pointerUp(editor.viewport.gestureCell(e));
      if (editor.mode === 'select') editor.revealTool(editor.mode);
      return;
    }
    if (editor.painting) {
      editor.painting = false;
      editor.lastPaint = undefined;
      editor.redrawOverlay();
      editor.save();
    }
  };
  editor.canvas.addEventListener('pointerup', endStroke);
  editor.canvas.addEventListener('pointercancel', endStroke);
  editor.canvas.addEventListener('dblclick', (event) => {
    if (editor.tools.finishPolygon()) {
      event.preventDefault();
      editor.revealTool('select');
    }
  });
  const cancelZoom = (e: PointerEvent) => {
    if (zoomPointer === e.pointerId) zoomPointer = undefined;
  };
  editor.canvas.addEventListener('pointercancel', cancelZoom);
  editor.canvas.addEventListener('pointerleave', (e) => {
    cancelZoom(e);
    editor.tools.leave();
  });
}
