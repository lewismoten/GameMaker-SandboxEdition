// Splitting a line's spoken text at its stops, so each piece is voiced on its own and the pauses
// are fixed lengths (scripts/narrate.ts --split): the cloned voices rush through commas and short
// sentences (pauses.ts finds those). 'sentences' splits at . ! ? : only; 'clauses' also at commas
// and semicolons; 'none' leaves the line whole. Pure apart from the samples handed to joinPieces.

export type SplitMode = 'none' | 'sentences' | 'clauses' | 'stretch';

/** Silence after a sentence end, seconds. */
export const SENTENCE_GAP = 0.45;
/** Silence after a comma or semicolon, seconds. */
export const COMMA_GAP = 0.25;
/** Pieces with fewer words than this are merged into a neighbor. */
const MIN_WORDS = 3;
/** The same for clauses: "Play a game," alone was voiced as "games". */
const CLAUSE_MIN_WORDS = 4;
/** Quiet kept around each piece's words when its edges are trimmed, seconds. */
const EDGE = 0.005;
/** Speech ends where a frame stays below this share (-30 dB) of the piece's 90th-percentile level: breath and hiss either side are cut. */
const SILENT = 0.03;
/** Fade at each piece's edges, seconds. */
const FADE = 0.025;

export interface Piece {
  text: string;
  /** Silence to follow it, seconds (0 for the last). */
  gap: number;
}

export function splitMode(v: string | true | undefined): SplitMode {
  if (v === undefined) return 'none';
  if (v === 'none' || v === 'sentences' || v === 'clauses' || v === 'stretch') return v;
  throw new Error(`--split takes none, sentences, clauses or stretch, not ${String(v)}`);
}

/** The line's pieces, each with its closing punctuation, and the silence after it. */
export function splitStops(spoken: string, mode: SplitMode): Piece[] {
  if (mode === 'none' || mode === 'stretch') return [{ text: spoken, gap: 0 }];
  const stop = mode === 'clauses' ? /([,;:.!?…]+["')\]]*)\s+(?=[\p{L}\p{N}])/gu : /([:.!?…]+["')\]]*)\s+(?=[\p{L}\p{N}])/gu;
  const out: Piece[] = [];
  let from = 0;
  for (const m of spoken.matchAll(stop)) {
    const end = m.index + m[1].length;
    out.push({ text: spoken.slice(from, end), gap: /^[,;]/.test(m[1]) ? COMMA_GAP : SENTENCE_GAP });
    from = m.index + m[0].length;
  }
  out.push({ text: spoken.slice(from), gap: 0 });
  return mergeShort(out, mode === 'clauses' ? CLAUSE_MIN_WORDS : MIN_WORDS);
}

/** A piece alone under MIN_WORDS words is voiced with its neighbor (alone, "Case closed." gets an over-pronounced final d), keeping the neighbor's gap. */
function mergeShort(pieces: Piece[], min: number): Piece[] {
  const short = (p: Piece) => p.text.split(/\s+/).length < min;
  const out: Piece[] = [];
  for (let i = 0; i < pieces.length; i++) {
    let p = pieces[i];
    while (short(p) && i + 1 < pieces.length) p = { text: `${p.text} ${pieces[++i].text}`, gap: pieces[i].gap };
    if (short(p) && out.length) {
      const prev = out.pop()!;
      p = { text: `${prev.text} ${p.text}`, gap: 0 };
    }
    out.push(p);
  }
  return out;
}

/** The samples from the first to the last frame of real speech (10 ms frames, level relative to the piece's own), faded in and out. */
export function trimSilence(pcm: Float32Array, rate: number): Float32Array {
  const hop = Math.round(rate * 0.01);
  const level: number[] = [];
  for (let i = 0; i + hop <= pcm.length; i += hop) {
    let sum = 0;
    for (let j = i; j < i + hop; j++) sum += pcm[j] * pcm[j];
    level.push(Math.sqrt(sum / hop));
  }
  const floor = [...level].sort((a, b) => a - b)[Math.floor(level.length * 0.9)] * SILENT;
  const first = level.findIndex((v) => v > floor);
  if (first < 0) return pcm;
  const last = level.length - 1 - [...level].reverse().findIndex((v) => v > floor);
  const margin = Math.round(rate * EDGE);
  const out = pcm.slice(Math.max(0, first * hop - margin), Math.min(pcm.length, (last + 1) * hop + margin));
  const fade = Math.min(Math.round(rate * FADE), out.length >> 1);
  for (let i = 0; i < fade; i++) {
    const g = i / fade;
    out[i] *= g;
    out[out.length - 1 - i] *= g;
  }
  return out;
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

/** The target pause after each stop in the line, in order: SENTENCE_GAP or COMMA_GAP. */
export function stopGaps(spoken: string): number[] {
  return [...spoken.matchAll(/([,;:.!?…]+)["')\]]*\s+(?=[\p{L}\p{N}])/gu)].map((m) => (/^[,;]/.test(m[1]) ? COMMA_GAP : SENTENCE_GAP));
}

/**
 * A whole take with its pauses lengthened and its words untouched: the `targets.length` longest
 * quiet stretches (under -20 dB of the take's 90th-percentile level, 80 ms or more, in time order)
 * are taken to be the stops, and each shorter than its target gets room tone (its own quiet
 * middle, tiled with 10 ms crossfades) inserted at its quietest point.
 */
export function stretchPauses(pcm: Float32Array, rate: number, targets: number[]): Float32Array {
  const hop = Math.round(rate * 0.01);
  const level: number[] = [];
  for (let i = 0; i + hop <= pcm.length; i += hop) {
    let sum = 0;
    for (let j = i; j < i + hop; j++) sum += pcm[j] * pcm[j];
    level.push(Math.sqrt(sum / hop));
  }
  const floor = [...level].sort((a, b) => a - b)[Math.floor(level.length * 0.9)] * 0.1;
  const loud = level.map((v) => v > floor);
  const first = loud.indexOf(true);
  const last = loud.lastIndexOf(true);
  const gaps: { from: number; to: number }[] = [];
  for (let i = first; i >= 0 && i <= last;) {
    if (loud[i]) {
      i++;
      continue;
    }
    let j = i;
    while (!loud[j]) j++;
    if (j - i >= 8) gaps.push({ from: i, to: j });
    i = j;
  }
  const chosen = [...gaps]
    .sort((a, b) => b.to - b.from - (a.to - a.from))
    .slice(0, targets.length)
    .sort((a, b) => a.from - b.from);
  if (chosen.length < targets.length) return pcm;
  const parts: Float32Array[] = [];
  let at = 0;
  chosen.forEach((g, k) => {
    const need = Math.round(targets[k] * rate) - (g.to - g.from) * hop;
    let low = g.from;
    for (let f = g.from; f < g.to; f++) if (level[f] < level[low]) low = f;
    const cut = low * hop;
    parts.push(pcm.slice(at, cut));
    at = cut;
    if (need <= 0) return;
    const w = Math.max(hop * 2, Math.round((g.to - g.from) * hop * 0.5));
    const src = pcm.slice(Math.max(0, cut - Math.round(w / 2)), Math.max(0, cut - Math.round(w / 2)) + w);
    const tone = new Float32Array(need);
    const x = hop;
    for (let p = 0, n = 0; p < need; n++) {
      for (let i = 0; i < src.length && p + i < need; i++) {
        const fadeIn = n && i < x ? i / x : 1;
        tone[p + i] += src[i] * fadeIn * (i >= src.length - x && p + src.length < need ? (src.length - i) / x : 1);
      }
      p += src.length - x;
    }
    parts.push(tone);
  });
  parts.push(pcm.slice(at));
  const out = new Float32Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) (out.set(p, o), (o += p.length));
  return out;
}
