// Map zoom math keeps the same map point under the pointer (or the viewport center).
export function nextZoom(choices: readonly number[], current: number, wheelDelta: number): number {
  if (!choices.length || !wheelDelta) return current;
  const at = Math.max(0, choices.indexOf(current));
  return choices[Math.max(0, Math.min(choices.length - 1, at + (wheelDelta < 0 ? 1 : -1)))];
}

/** Scroll coordinates before browser edge clamping, in output pixels. */
export function zoomScroll(scroll: number, pointer: number, before: number, after: number): number {
  return ((scroll + pointer) * after) / before - pointer;
}
