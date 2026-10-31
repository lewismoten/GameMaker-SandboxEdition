// Splitting a line's spoken text at its stops, so each piece is voiced on its own and the pauses
// are fixed lengths (scripts/narrate.ts --split): the cloned voices rush through commas and short
// sentences (pauses.ts finds those). 'sentences' splits at . ! ? : only; 'clauses' also at commas
// and semicolons; 'none' leaves the line whole. Pure apart from the samples handed to joinPieces.

export type SplitMode = 'none' | 'sentences' | 'clauses';

/** Silence after a sentence end, seconds. */
export const SENTENCE_GAP = 0.45;
/** Silence after a comma or semicolon, seconds. */
export const COMMA_GAP = 0.25;
/** Quiet kept around each piece's words when its edges are trimmed, seconds. */
const EDGE = 0.03;
/** A frame is silence below this share of the piece's loudest frame. */
const SILENT = 0.03;

export interface Piece {
  text: string;
  /** Silence to follow it, seconds (0 for the last). */
  gap: number;
}

export function splitMode(v: string | true | undefined): SplitMode {
  if (v === undefined) return 'none';
  if (v === 'none' || v === 'sentences' || v === 'clauses') return v;
  throw new Error(`--split takes none, sentences or clauses, not ${String(v)}`);
}

/** The line's pieces, each with its closing punctuation, and the silence after it. */
export function splitStops(spoken: string, mode: SplitMode): Piece[] {
  if (mode === 'none') return [{ text: spoken, gap: 0 }];
  const stop = mode === 'clauses' ? /([,;:.!?…]+["')\]]*)\s+(?=[\p{L}\p{N}])/gu : /([:.!?…]+["')\]]*)\s+(?=[\p{L}\p{N}])/gu;
  const out: Piece[] = [];
  let from = 0;
  for (const m of spoken.matchAll(stop)) {
    const end = m.index + m[1].length;
    out.push({ text: spoken.slice(from, end), gap: /^[,;]/.test(m[1]) ? COMMA_GAP : SENTENCE_GAP });
    from = m.index + m[0].length;
  }
  out.push({ text: spoken.slice(from), gap: 0 });
  return out;
}

/** The samples without the quiet before the first and after the last loud 10 ms frame (a small margin kept). */
export function trimSilence(pcm: Float32Array, rate: number): Float32Array {
  const hop = Math.round(rate * 0.01);
  const level: number[] = [];
  for (let i = 0; i + hop <= pcm.length; i += hop) {
    let sum = 0;
    for (let j = i; j < i + hop; j++) sum += pcm[j] * pcm[j];
    level.push(Math.sqrt(sum / hop));
  }
  const floor = Math.max(0, ...level) * SILENT;
  const first = level.findIndex((v) => v > floor);
  const last = level.length - 1 - [...level].reverse().findIndex((v) => v > floor);
  if (first < 0) return pcm;
  const margin = Math.round(rate * EDGE);
  return pcm.slice(Math.max(0, first * hop - margin), Math.min(pcm.length, (last + 1) * hop + margin));
}

/** The pieces' trimmed samples with each piece's gap of silence between them. */
export function joinPieces(parts: Float32Array[], pieces: Piece[], rate: number): Float32Array {
  const trimmed = parts.map((p) => trimSilence(p, rate));
  const gaps = pieces.map((p, i) => (i < parts.length - 1 ? Math.round(p.gap * rate) : 0));
  const out = new Float32Array(trimmed.reduce((n, p, i) => n + p.length + gaps[i], 0));
  let at = 0;
  trimmed.forEach((p, i) => {
    out.set(p, at);
    at += p.length + gaps[i];
  });
  return out;
}
