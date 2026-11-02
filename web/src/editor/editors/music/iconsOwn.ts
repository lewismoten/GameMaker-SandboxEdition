// Every preset's own drawing, gathered from the family files (id -> rows).
import { KEYS_ICONS } from './iconsKeys';
import { PERC_ICONS } from './iconsPerc';
import { STRINGS_ICONS } from './iconsStrings';
import { SYNTH_ICONS } from './iconsSynth';
import { WINDS_ICONS } from './iconsWinds';

export const OWN: Record<string, () => string[]> = { ...KEYS_ICONS, ...STRINGS_ICONS, ...SYNTH_ICONS, ...WINDS_ICONS, ...PERC_ICONS, piano: KEYS_ICONS.grand };
