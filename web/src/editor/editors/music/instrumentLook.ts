// What an instrument looks like in the music editor: its preset's picture on its group's
// color. Where it matches a preset: the preset whose 11 patch bytes are the same, else the
// nearest preset that differs in at most CLOSE_BYTES of them (a patch the author only nudged
// a little still reads as that sound). No match: a plain music note on a neutral tile, and
// the track keeps its channel color. The group colors are the preset picker's (one hue per
// group, in PRESET_GROUPS order), so the picker, the Instruments tab, the track list and the
// piano roll all agree. Nothing here is saved in the song.
import { OPL_PRESETS, PRESET_GROUPS } from '../../../audio/oplPresets';
import type { OplPreset } from '../../../audio/oplPatch';
import { genericIcon, presetIcon } from './presetIcons';

/** A patch differing from a preset in this many of its 11 bytes or fewer still counts as it. */
const CLOSE_BYTES = 2;

interface InstrumentLook {
  preset?: OplPreset;
  /** The patch is exactly the preset (else only close to it). */
  exact: boolean;
  /** The group's name, or undefined with no match. */
  groupName?: string;
  /** The color for the track: the group's. */
  color?: string;
  /** Inline SVG of the picture on the group's tile. */
  icon: string;
}

/** The group's hue in degrees (the preset picker's). */
const hueOf = (group: string): number => {
  const gi = PRESET_GROUPS.findIndex((g) => g.id === group);
  return ((gi < 0 ? 0 : gi) * 47 + 20) % 360;
};

/** The group's strong color (track names, notes on the roll). */
export const groupColor = (group: string): string => `hsl(${hueOf(group)} 65% 50%)`;
/** The group's pale tile color (behind a picture). */
const groupTile = (group: string): string => `hsl(${hueOf(group)} 70% 84%)`;
const NEUTRAL_TILE = '#e4e4ea';

function closest(inst: Uint8Array): { preset: OplPreset; diff: number } | undefined {
  let best: { preset: OplPreset; diff: number } | undefined;
  for (const p of OPL_PRESETS) {
    let diff = 0;
    for (let i = 0; i < 11 && diff <= CLOSE_BYTES; i++) if (p.patch[i] !== inst[i]) diff++;
    if (diff <= CLOSE_BYTES && (!best || diff < best.diff)) best = { preset: p, diff };
    if (diff === 0) break;
  }
  return best;
}

/** How an instrument (an SBI patch) is shown. */
export function instrumentLook(inst: Uint8Array | undefined): InstrumentLook {
  const hit = inst ? closest(inst) : undefined;
  if (!hit) return { exact: false, icon: genericIcon(NEUTRAL_TILE) };
  const g = hit.preset.group;
  return {
    preset: hit.preset,
    exact: hit.diff === 0,
    groupName: PRESET_GROUPS.find((x) => x.id === g)?.name,
    color: groupColor(g),
    icon: presetIcon(hit.preset.id, g, groupTile(g)),
  };
}
