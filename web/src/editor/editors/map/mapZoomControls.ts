// Map zoom presets, step buttons and wheel handling.
import { h, selectField } from '../../core/ui';
import { MAX_ZOOM, MIN_ZOOM, wheelZoom } from './mapZoom';

/** The zoom menu's round presets; the wheel and pinch zoom continuously between 1 pixel per block and 400%. */
const ZOOMS: [number, string][] = [
  [MIN_ZOOM, '5% (1 pixel per block)'],
  [0.1, '10%'],
  [0.15, '15%'],
  [0.2, '20%'],
  [0.25, '25%'],
  [1 / 3, '33%'],
  [0.5, '50%'],
  [2 / 3, '67%'],
  [0.75, '75%'],
  [1, '100%'],
  [1.25, '125%'],
  [1.5, '150%'],
  [1.75, '175%'],
  [2, '200%'],
  [3, '300%'],
  [MAX_ZOOM, '400%'],
];

interface Context {
  readonly zoom: number;
  readonly setZoom: (value: number, pointer?: { x: number; y: number }) => void;
  readonly scroller: HTMLDivElement;
}

export function createMapZoomControls(editor: Context) {
  const zoomControl = selectField(
    'Zoom',
    ZOOMS,
    () => editor.zoom,
    (value) => editor.setZoom(value),
  );
  /** The menu shows a round preset, or the exact percentage the wheel reached. */
  const zoomSelect = zoomControl.querySelector('select')!;
  zoomSelect.classList.add('mt-big');
  // visible + and − beside the menu: a finger has no wheel (44 px on touch, mapTools.css)
  const zoomStep = (label: string, name: string, factor: number) =>
    h('button', { type: 'button', class: 'mt-zoom-step', 'aria-label': name, title: name, onclick: () => editor.setZoom(editor.zoom * factor) }, label);
  // phones: the block-set, monster and palette pickers and Download picture fold behind one button, so the tools and the map
  // come first (mapTools.css); wider screens show them all and the button is hidden
  const filesToggle = h(
    'button',
    {
      type: 'button',
      class: 'mt-files-toggle',
      'aria-expanded': 'false',
      'aria-controls': 'mt-files-body',
      onclick: () => setFilesOpen(filesToggle.getAttribute('aria-expanded') !== 'true'),
    },
    'Blocks & palette ▸',
  );
  function setFilesOpen(open: boolean): void {
    filesToggle.setAttribute('aria-expanded', String(open));
    filesToggle.textContent = open ? 'Blocks & palette ▾' : 'Blocks & palette ▸';
    filesToggle.parentElement?.classList.toggle('mt-files-open', open);
    requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
  }
  const zoomRow = h('div', { class: 'mt-zoom-row' });
  zoomSelect.replaceWith(zoomRow);
  zoomRow.append(zoomSelect, zoomStep('−', 'Zoom out', 1 / 1.5), zoomStep('+', 'Zoom in', 1.5));
  const zoomCustom = h('option', { value: 'custom', hidden: true });
  zoomSelect.append(zoomCustom);
  function showZoom(): void {
    const preset = ZOOMS.find(([z]) => Math.abs(z - editor.zoom) < 0.0005);
    zoomCustom.hidden = !!preset;
    zoomCustom.textContent = `${Math.round(editor.zoom * 100)}%`;
    zoomSelect.value = preset ? String(preset[0]) : 'custom';
  }
  showZoom();
  editor.scroller.title = 'Mouse wheel or pinch zooms around the pointer; Shift+wheel scrolls.';
  // wheel and pinch turn into one zoom change per animation frame, around the last pointer position
  let wheelTarget = editor.zoom;
  let wheelPointer = { x: 0, y: 0 };
  let wheelFrame = 0;
  editor.scroller.addEventListener(
    'wheel',
    (event) => {
      if (event.shiftKey || !event.deltaY || (!event.ctrlKey && Math.abs(event.deltaX) > Math.abs(event.deltaY))) return;
      event.preventDefault();
      if (!wheelFrame) wheelTarget = editor.zoom;
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? editor.scroller.clientHeight : 1;
      wheelTarget = wheelZoom(wheelTarget, event.deltaY * unit, event.ctrlKey);
      const bounds = editor.scroller.getBoundingClientRect();
      wheelPointer = { x: event.clientX - bounds.left - editor.scroller.clientLeft, y: event.clientY - bounds.top - editor.scroller.clientTop };
      if (wheelFrame) return;
      wheelFrame = requestAnimationFrame(() => {
        wheelFrame = 0;
        editor.setZoom(wheelTarget, wheelPointer);
      });
    },
    { passive: false },
  );

  return { zoomControl, filesToggle, showZoom };
}
