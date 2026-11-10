// Where each certificate sits on the Honors tab. Before the Sandbox Diploma is earned they run in order in a
// plain grid. Once it is earned, the diploma comes first (so Tab reaches it first) and sits large in the middle,
// with the six stage honors beside it: the first three on the left, the next three on the right, in stage order.
// Pure rules, no DOM.

interface HonorSlot {
  /** Index into the ceremonies in the order given (stages first, the diploma last). */
  index: number;
  place: 'plain' | 'diploma' | 'left' | 'right';
  /** 1-based row beside the diploma (left and right only). */
  row?: number;
}

/** `count` is the number of ceremonies (7: six stages and the diploma last); `diplomaEarned` picks the layout. */
export function honorsLayout(count: number, diplomaEarned: boolean): HonorSlot[] {
  const all = Array.from({ length: count }, (_, index): HonorSlot => ({ index, place: 'plain' }));
  if (!diplomaEarned || count < 2) return all;
  const stages = count - 1;
  const half = Math.ceil(stages / 2);
  const side = all.slice(0, stages).map((s) => ({ ...s, place: s.index < half ? ('left' as const) : ('right' as const), row: (s.index % half) + 1 }));
  return [{ index: stages, place: 'diploma' }, ...side];
}
