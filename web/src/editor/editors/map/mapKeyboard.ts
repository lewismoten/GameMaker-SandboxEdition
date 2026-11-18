// Map keyboard shortcuts and selection commands.
import { toast } from '../../core/ui';
import type { Mode } from './mapToolModes';
import { TOOLS } from './mapToolModes';
import { type MapTools } from './tools/toolController';

interface Context {
  readonly step: (back: boolean) => void;
  readonly tools: MapTools;
  placingExit: boolean;
  readonly revealTool: (mode: Mode) => void;
  readonly mode: Mode;
  readonly toggleGrid: () => void;
  readonly setMode: (mode: Mode) => void;
  readonly rebuildMonsters: () => void;
}

export function mapKeyboard(editor: Context) {
  const onKey = (e: KeyboardEvent) => {
    const t = e.target as HTMLElement | null;
    if (t instanceof HTMLInputElement || t instanceof HTMLSelectElement || t instanceof HTMLTextAreaElement || t?.closest('dialog')) return;
    const k = e.key.toLowerCase();
    if (e.ctrlKey || e.metaKey) {
      if (k === 'z' || k === 'y') {
        e.preventDefault();
        editor.step(k === 'z' && !e.shiftKey);
      } else if ((k === 'c' || k === 'x') && editor.tools.selection && !window.getSelection()?.toString()) {
        e.preventDefault();
        editor.tools.copy(k === 'x');
      } else if (k === 'v') {
        e.preventDefault();
        editor.tools.paste();
      }
      return;
    }
    if (e.altKey) return;
    if (e.key === 'Escape' && editor.placingExit) return ((editor.placingExit = false), toast('Exit placing cancelled.'), e.preventDefault());
    if (e.key === 'Escape' && editor.tools.cancel()) return e.preventDefault();
    if (e.key === 'Enter' && editor.tools.finishPolygon()) {
      e.preventDefault();
      editor.revealTool('select');
      return;
    }
    if (e.key === 'Backspace' && editor.tools.removePolygonCorner()) return e.preventDefault();
    if ((e.key === 'Delete' || e.key === 'Backspace') && editor.tools.selection && editor.mode === 'select') {
      e.preventDefault();
      return editor.tools.fillSelection();
    }
    if (k === 'g' && !e.shiftKey) return editor.toggleGrid();
    const tool = TOOLS.find(([, , , key]) => key && key.toLowerCase() === k);
    if (tool && !e.shiftKey) {
      editor.setMode(tool[0]);
      editor.revealTool(tool[0]);
      editor.rebuildMonsters();
    }
  };

  return { onKey };
}
