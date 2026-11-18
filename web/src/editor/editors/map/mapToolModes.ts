// Map tool modes, buttons and descriptions.
import { h } from '../../core/ui';
import type { ToolMode } from './tools/toolController';
export type Mode = 'paint' | 'fill' | 'pick' | 'monster' | 'pan' | 'zoom' | ToolMode;
const TOOL_MODES = new Set<string>(['line', 'rect', 'select', 'terrain', 'stamp', 'building', 'paste']);
export const isTool = (m: Mode): m is ToolMode => TOOL_MODES.has(m);

/** The tool buttons: mode, icon, name, key, what it does. */
export const nowTool = (m: Mode): Node[] => {
  const t = TOOLS.find((x) => x[0] === m);
  return t ? [h('strong', null, t[2]), document.createTextNode(` ${t[4]}`)] : [];
};
export const TOOLS: [Mode, string, string, string, string][] = [
  ['paint', '✎', 'Paint', 'B', 'Drag to paint the chosen block'],
  ['line', '╱', 'Line', 'L', 'Drag a straight line of the chosen block'],
  ['rect', '▭', 'Rectangle', 'R', 'Drag out a rectangle of the chosen block'],
  ['fill', '▣', 'Fill', 'F', 'Fill the area of one block with the chosen block'],
  ['pick', '⌖', 'Pick', 'I', 'Click a block on the map to paint with it (eyedropper)'],
  ['select', '⬚', 'Select', 'S', 'Select a rectangle or polygon to fill, copy, cut, paste or save'],
  ['terrain', '⛰', 'Terrain', 'T', 'Paint grass, water or paths: edges and corners are chosen for you'],
  ['stamp', '★', 'Stamp', 'P', 'Place a saved stamp (a house, a tree…)'],
  ['building', '⌂', 'Building', 'H', 'Drag out a rectangle to build a house of that size from its parts'],
  ['monster', '👾', 'Monsters', 'M', 'Click to place the chosen monster; right-click to remove one'],
  ['pan', '✋', 'Scroll', '', 'Touch screens: drag to scroll the map instead of drawing; pinch to zoom'],
  ['zoom', '🔍', 'Zoom', '', 'Tap the map to zoom in there (Shift-click or the − button zooms out)'],
];
