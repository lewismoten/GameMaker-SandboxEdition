// The order the Song tab lists a song's tracks in. A track is a MIDI channel and the channel
// number is part of the .CMF file (the chip's voice, and channels 12-16 are the drum kit), so
// the order is only how the editor lists them: it is saved in the project's companion file
// (never in the song, DOS or any export). These helpers are pure; doc.ts holds the state.
import { PRESET_GROUPS } from '../../../audio/oplPresets';

/** The channels in the saved order, then any the order does not know yet by channel number. */
export function orderTracks(used: number[], order: number[]): number[] {
  const have = new Set(used);
  const seen = new Set<number>();
  const out: number[] = [];
  for (const c of order) {
    if (have.has(c) && !seen.has(c)) {
      out.push(c);
      seen.add(c);
    }
  }
  for (const c of [...used].sort((a, b) => a - b)) if (!seen.has(c)) out.push(c);
  return out;
}

/** The list with `ch` moved to index `to` (clamped), or the same list if it is not there. */
export function moveTrackTo(list: number[], ch: number, to: number): number[] {
  const from = list.indexOf(ch);
  if (from < 0) return list;
  const out = list.filter((c) => c !== ch);
  out.splice(Math.max(0, Math.min(out.length, to)), 0, ch);
  return out;
}

/** Sorted by the instrument group (the picker's order); ties and unmatched sounds keep their order. */
export function sortByGroup(list: number[], groupOf: (ch: number) => string | undefined): number[] {
  const rank = (ch: number) => {
    const g = groupOf(ch);
    const i = PRESET_GROUPS.findIndex((x) => x.id === g);
    return i < 0 ? PRESET_GROUPS.length : i;
  };
  return list
    .map((c, i) => ({ c, i, r: rank(c) }))
    .sort((a, b) => a.r - b.r || a.i - b.i)
    .map((x) => x.c);
}
