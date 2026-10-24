// The drum kit: patches for the OPL2 chip's rhythm mode (CMF controller 0x67 turns it on).
// In rhythm mode FM channels 6-8 stop being melody voices and become five drums, played on
// MIDI channels 11-15 (SBFMDRV, ported in audio/cmfPlayer.ts):
//   bass drum  MIDI 11: FM channel 6, both operators and the feedback (a whole FM voice)
//   snare      MIDI 12: FM channel 7, its carrier            } one channel: the pitch of the
//   hi-hat     MIDI 15: FM channel 7, its modulator          } last one played sets both
//   tom-tom    MIDI 13: FM channel 8, its modulator          } one channel: the tom's pitch
//   cymbal     MIDI 14: FM channel 8, its carrier            } also colors the cymbal
// The four one-operator drums take only the first (modulator) half of the instrument, so
// these patches leave the second half empty. The note played sets each drum's pitch: that is
// how one tom-tom patch plays low, mid or high.
import { patch, preset, type DrumSlot, type OplPreset } from './oplPatch';

/** What each drum is, for the picker: its MIDI channel, name and what it shares. */
export const DRUM_SLOTS: Record<DrumSlot, { ch: number; name: string; shares: string }> = {
  bd: { ch: 11, name: 'Bass drum', shares: 'The bass drum has FM channel 6 to itself and uses both operators.' },
  sd: {
    ch: 12,
    name: 'Snare drum',
    shares: 'The snare and the hi-hat share FM channel 7: the last one played sets the pitch of both. Only the first operator of the patch is used.',
  },
  tom: {
    ch: 13,
    name: 'Tom-tom',
    shares:
      "The tom-tom and the cymbal share FM channel 8: the tom's note also colors the cymbal. Only the first operator is used; the note sets the tom's pitch.",
  },
  cy: {
    ch: 14,
    name: 'Cymbal',
    shares: 'The cymbal and the tom-tom share FM channel 8: the last one played sets the pitch of both. Only the first operator is used.',
  },
  hh: {
    ch: 15,
    name: 'Hi-hat',
    shares: 'The hi-hat and the snare share FM channel 7: the last one played sets the pitch of both. Only the first operator is used.',
  },
};

/** The drum a rhythm-mode MIDI channel plays. */
export const slotOfChannel = (ch: number): DrumSlot | undefined => (Object.keys(DRUM_SLOTS) as DrumSlot[]).find((s) => DRUM_SLOTS[s].ch === ch);

/** One operator drum: the second half is unused. */
const one = (words: string) => patch(words, 'x0.5 ar0');
const kit = (drum: DrumSlot, id: string, name: string, key: number, about: string, p: Uint8Array) => preset('kit', id, name, key, 'hits', about, p, drum);

export const DRUM_KIT: OplPreset[] = [
  kit(
    'bd',
    'kick-punchy',
    'Kick (punchy)',
    36,
    "A tight rock kick: a short, hard thump (the games' kick)",
    patch('x1 tl14 ar15 dr8 sl7 rr7', 'x1 ar15 dr7 sl5 rr7', 'fb4'),
  ),
  kit('bd', 'kick-boomy', 'Kick (boomy)', 31, 'A big, low kick that booms and rings', patch('x1 tl24 ar15 dr6 sl15 rr6', 'x1 ar15 dr5 sl3 rr5', 'fb2')),
  kit('sd', 'snare-tight', 'Snare (tight)', 55, "A crisp, short snare (the games' snare)", one('x2 tl2 ar15 dr7 sl0 rr7')),
  kit('sd', 'snare-fat', 'Snare (fat)', 50, 'A deep, fat snare with a longer rattle', one('x1 ar15 dr6 sl1 rr6')),
  kit('sd', 'clap', 'Clap', 60, 'A hand clap: a bright, dry slap of noise', one('x4 tl2 ar15 dr8 sl0 rr7 w3')),
  kit('sd', 'rimshot', 'Rimshot', 67, 'A rimshot: a hard, very short crack', one('x6 tl4 ar15 dr9 sl15 rr9')),
  kit('tom', 'tom-low', 'Low Tom', 41, 'A floor tom (play low notes, around F2)', one('x2 tl2 ar15 dr6 sl3 rr6')),
  kit('tom', 'tom-mid', 'Mid Tom', 48, "A rack tom (play around C3; the games' tom)", one('x2 tl4 ar15 dr7 sl3 rr7')),
  kit('tom', 'tom-high', 'High Tom', 53, 'A small high tom (play around F3)', one('x2 tl5 ar15 dr8 sl3 rr8')),
  kit('tom', 'timpani-tom', 'Timpani (tom-tom)', 43, 'A kettle drum on the tom channel: a long ring (from Veni, Vidi, Risi!)', one('x1 ar15 dr4 sl2 rr6')),
  kit('cy', 'crash', 'Crash Cymbal', 72, 'A crash: a loud splash that rings out', one('x1 tl4 ar15 dr3 sl2 rr3')),
  kit('cy', 'ride', 'Ride Cymbal', 72, 'A ride: a shorter, steady "ting" (the games\' cymbal)', one('x1 tl8 ar15 dr4 sl0 rr4')),
  kit('hh', 'hat-closed', 'Closed Hi-hat', 55, 'A closed hi-hat: a short "tsk" (the games\' hi-hat)', one('x1 tl6 ar15 dr9 sl0 rr9')),
  kit('hh', 'hat-open', 'Open Hi-hat', 55, 'An open hi-hat: a longer "tssh"', one('x1 tl6 ar15 dr5 sl1 rr5')),
  kit('hh', 'hat-pedal', 'Pedal Hi-hat', 55, 'A hi-hat closed with the foot: a soft "chick"', one('x1 tl8 ar13 dr9 sl15 rr10')),
];
