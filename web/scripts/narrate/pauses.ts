// Pause check for the tour's voice clips: a line's commas, semicolons and sentence ends should
// each be a breath in the recording, and some takes run straight through them. pausesCalledFor
// counts the stops a spoken line has inside it; innerSilences finds the quiet stretches between
// the first and last sound; tooFewPauses compares them. Used by verify.ts (npm run voice:check).

/** Quiet this long (seconds) counts as a pause: good takes pause 0.36 s or more at a comma, words in a take are at most ~0.18 s apart. */
export const MIN_PAUSE = 0.2;
/** A frame is quiet under this share of the clip's loud level (its 90th-percentile frame): the 10 kbps Opus clips have no true silence. */
const QUIET_SHARE = 0.1;

/** Stops inside a spoken line: , ; : . ! ? followed by more words (the last one ends the clip). */
export function pausesCalledFor(spoken: string): number {
  return (spoken.match(/[,;:.!?…]+["')\]]*\s+(?=[\p{L}\p{N}])/gu) ?? []).length;
}

/** Lengths in seconds of the quiet stretches between the first and last sound, in 10 ms frames. */
export function innerSilences(pcm: Float32Array, rate: number): number[] {
  const hop = Math.round(rate * 0.01);
  const level: number[] = [];
  for (let i = 0; i + hop <= pcm.length; i += hop) {
    let sum = 0;
    for (let j = i; j < i + hop; j++) sum += pcm[j] * pcm[j];
    level.push(Math.sqrt(sum / hop));
  }
  const floor = [...level].sort((a, b) => a - b)[Math.floor(level.length * 0.9)] * QUIET_SHARE;
  const loud = level.map((v) => v >= floor && v > 0);
  const first = loud.indexOf(true);
  const last = loud.lastIndexOf(true);
  const out: number[] = [];
  let run = 0;
  for (let i = first; i >= 0 && i <= last; i++) {
    if (loud[i]) {
      if (run) out.push((run * hop) / rate);
      run = 0;
    } else run++;
  }
  return out;
}

/** True when the recording has clearly fewer pauses than the text calls for: one may go missing only in a line with four or more. */
export function tooFewPauses(called: number, silences: number[]): boolean {
  const heard = silences.filter((s) => s >= MIN_PAUSE).length;
  return called - heard >= (called >= 4 ? 2 : 1);
}
