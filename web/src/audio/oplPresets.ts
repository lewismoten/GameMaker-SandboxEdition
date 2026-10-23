// Instrument presets for the music editor: OPL2 two-operator patches (SBI instruments) for
// the melodic voices, grouped by family. The drum kit (rhythm mode) is in oplDrumPresets.ts.
// The words of each patch are explained in oplPatch.ts: modulator, carrier, voice.
//
// The chip has two operators a voice and four waveforms, so these are honest approximations:
// FM brightness that fades (plucks, pianos), feedback for buzz, the chip's own vibrato and
// tremolo for life, and a few tricks (a modulator at twice the pitch gives only odd
// harmonics, like a square wave or a clarinet; a carrier at half pitch with the "bumps"
// waveform plays every harmonic, like an organ). Several come from the games' own songs
// (games/kit/song.ts, games/risi/src/sound/patches.ts), so their tracks show these names too.
import { INSTRUMENTS } from './compose';
import { patch as p, preset, type OplPreset } from './oplPatch';
import { DRUM_KIT } from './oplDrumPresets';

export const PRESET_GROUPS: { id: string; name: string }[] = [
  { id: 'keys', name: 'Keys' },
  { id: 'strings', name: 'Strings' },
  { id: 'voices', name: 'Voices' },
  { id: 'bass', name: 'Bass' },
  { id: 'synth', name: 'Synth' },
  { id: 'organ', name: 'Organ' },
  { id: 'brass', name: 'Brass' },
  { id: 'winds', name: 'Woodwinds' },
  { id: 'mallets', name: 'Mallets and bells' },
  { id: 'perc', name: 'Percussion' },
  { id: 'kit', name: 'Drum kit' },
  { id: 'classic', name: 'Classic' },
];

const keys = (id: string, name: string, key: number, about: string, patch: Uint8Array) => preset('keys', id, name, key, 'tune', about, patch);

const MELODIC: OplPreset[] = [
  // ---- keys ----
  keys('piano-bright', 'Acoustic Piano (bright)', 60, 'A grand piano: a bright hammer strike that mellows as it fades', p('x1 tl22 ksl1.5 ar15 dr3 sl5 rr5', 'x1 ar15 dr2 sl6 rr5', 'fb5')),
  keys('piano-mellow', 'Acoustic Piano (mellow)', 60, 'An upright piano played softly: round, little hammer', p('x1 tl32 ksl3 ar13 dr3 sl6 rr5', 'x1 ar14 dr2 sl6 rr5', 'fb2')),
  keys('epiano', 'Electric Piano', 60, 'A tine electric piano: a high metal ping over a sine-like body', p('x15 tl38 ar15 dr7 sl15 rr7', 'x1 ar15 dr3 sl4 rr6', 'fb0')),
  keys('epiano-round', 'Electric Piano (round)', 60, 'A soft, round electric piano (from the games\' songs)', p('x1 tl21 ksl3 ar15 dr2 sl6 rr3', 'x1 tl5 ar13 dr3 sl7 rr4', 'fb4')),
  keys('harpsichord', 'Harpsichord', 60, 'Quills plucking strings: bright, buzzy, quick to die (from Veni, Vidi, Risi!)', p('x1 tl14 ar15 dr8 sl4 rr4 w2', 'x1 ar15 dr4 sl5 rr5', 'fb7')),
  keys('clavinet', 'Clavinet', 60, 'A funky clavinet: nasal, snappy and short', p('x3 tl20 ar15 dr5 sl6 rr6 w1', 'x1 ar15 dr4 sl6 rr7 w1', 'fb6')),

  // ---- strings ----
  preset('strings', 'violin', 'Solo Violin', 67, 'tune', 'One bowed violin: a quick bow, bright, with vibrato', p('x1 tl24 ar6 dr2 sl2 rr5 hold vib', 'x1 ar6 dr1 sl1 rr6 hold vib', 'fb6')),
  preset('strings', 'orchestra', 'Orchestral Strings', 60, 'chord', 'A string section: slow swell, held, a little shimmer', p('x1 tl28 ar4 dr1 sl1 rr4 hold vib', 'x1 ar4 dr1 sl0 rr4 hold vib', 'fb7')),
  preset('strings', 'pizzicato', 'Pizzicato', 60, 'tune', 'Plucked violin strings: short and round', p('x1 tl26 ar15 dr6 sl6 rr6', 'x1 ar15 dr6 sl8 rr7', 'fb4')),
  preset('strings', 'guitar-steel', 'Acoustic Guitar', 52, 'tune', 'A steel-string guitar pluck: bright attack, ringing body', p('x3 tl24 ar15 dr5 sl6 rr5', 'x1 ar15 dr3 sl5 rr6', 'fb6')),
  preset('strings', 'guitar-nylon', 'Nylon Guitar', 52, 'tune', 'A classical nylon guitar: softer, warmer pluck', p('x1 tl30 ar15 dr4 sl5 rr5 w1', 'x1 ar15 dr3 sl6 rr6', 'fb3')),
  preset('strings', 'oud', 'Oud', 52, 'tune', 'A fretless lute: woody and twangy (from the games\' songs)', p('x3 tl22 ar15 dr6 sl4 rr4 w2', 'x1 ar15 dr4 sl4 rr5', 'fb6')),
  preset('strings', 'harp', 'Harp', 60, 'tune', 'A concert harp: a soft pluck that rings (from Veni, Vidi, Risi!)', p('x2 tl29 ar15 dr4 sl3 rr2', 'x1 ar15 dr3 sl2 rr4', 'fb3')),

  // ---- voices ----
  preset('voices', 'aah', 'Vocal "Aah"', 60, 'tune', 'An open sung "aah" with vibrato (the games\' singing voice)', p('x2 tl29 ar6 dr4 sl1 rr6 hold vib', 'x1 ar7 dr5 sl1 rr7 hold vib', 'fb6')),
  preset('voices', 'ooh', 'Vocal "Ooh"', 60, 'tune', 'A round, closed "ooh": nearly pure, with vibrato', p('x1 tl40 ar5 dr2 sl1 rr5 hold vib', 'x1 ar5 dr1 sl1 rr6 hold vib', 'fb2')),
  preset('voices', 'soprano', 'Soprano', 72, 'tune', 'A high, pure operatic voice (from Veni, Vidi, Risi!)', p('x1 tl36 ar7 dr5 sl1 rr4 hold vib', 'x2 ar7 dr6 sl1 rr5 hold vib', 'fb5')),
  preset('voices', 'choir', 'Choir Pad', 60, 'chord', 'Many voices: a slow swell with a gentle wobble', p('x2 tl34 ar3 dr2 sl1 rr4 hold vib', 'x1 ar3 dr1 sl0 rr4 hold vib trem', 'fb3')),

  // ---- bass ----
  preset('bass', 'sub-bass', 'Deep Sub-Bass', 33, 'tune', 'A deep, nearly pure sine bass that holds', p('x1 tl44 ar15 dr4 sl6 rr6', 'x1 ar15 dr1 sl1 rr6 hold', 'fb0')),
  preset('bass', 'punch-bass', 'Punchy Bass', 36, 'tune', 'A picked bass: a bright thump that settles', p('x1 tl20 ar15 dr6 sl6 rr6', 'x1 ar15 dr3 sl3 rr6', 'fb5')),
  preset('bass', 'slap-bass', 'Slap Bass', 36, 'tune', 'A buzzy slapped bass: a hard, bright snap', p('x2 tl18 ar15 dr7 sl5 rr6 w1', 'x1 ar15 dr4 sl3 rr7', 'fb6')),
  preset('bass', 'upright-bass', 'Upright Bass', 36, 'tune', 'An acoustic upright bass: woody thump, quick to fade', p('x1 tl30 ar15 dr5 sl6 rr6', 'x1 ar14 dr4 sl4 rr6', 'fb3')),
  preset('bass', 'finger-bass', 'Fingered Bass', 36, 'tune', 'A round fingered electric bass (from the games\' songs)', p('x1 tl22 ar15 dr4 sl2 rr6', 'x1 ar15 dr4 sl3 rr6', 'fb5')),
  preset('bass', 'fretless', 'Fretless Bass', 36, 'tune', 'A fretless bass: smooth, singing "mwah"', p('x1 tl30 ar8 dr3 sl3 rr6 hold', 'x1 ar9 dr2 sl2 rr6 hold', 'fb3')),

  // ---- synth ----
  preset('synth', 'lead-bright', 'Bright Synth Lead', 72, 'tune', 'A cutting synth lead: buzzy and held', p('x1 tl20 ar15 dr2 sl2 rr5 hold', 'x1 ar15 dr1 sl1 rr5 hold', 'fb6')),
  preset('synth', 'lead-square', 'Square Lead', 72, 'tune', 'A square wave: hollow, odd harmonics only (the modulator at twice the pitch)', p('x2 tl24 ar15 dr0 sl0 rr5 hold', 'x1 ar15 dr0 sl0 rr5 hold', 'fb0')),
  preset('synth', 'lead-saw', 'Saw Lead', 72, 'tune', 'A sawtooth: the feedback buzz heard directly, with a sine under it', p('x1 tl14 ar15 dr0 sl0 rr5 hold', 'x1 tl8 ar15 dr0 sl0 rr5 hold', 'fb6 add')),
  preset('synth', 'pad-80s', '80s Bright Pad', 60, 'chord', 'A shiny 1980s synth pad: bright, swelling, wobbling', p('x2 tl26 ar5 dr2 sl2 rr4 w1 hold vib', 'x1 ar5 dr1 sl1 rr4 hold', 'fb6')),
  preset('synth', 'pad-warm', 'Warm Pad', 60, 'chord', 'A soft, warm pad: slow and dark', p('x1 tl38 ar3 dr2 sl1 rr4 hold', 'x1 ar3 dr1 sl0 rr4 hold trem', 'fb2')),
  preset('synth', 'pad-sweep', 'Sweep Pad', 60, 'chord', 'A filter sweep: the brightness rises slowly, then settles', p('x1 tl20 ar2 dr2 sl4 rr3 hold', 'x1 ar5 dr0 sl0 rr4 hold', 'fb5')),

  // ---- organ ----
  preset('organ', 'pipe-organ', 'Pipe Organ', 60, 'chord', 'A church organ: an 8 and 4 foot pair of flue pipes, both heard', p('x2 tl8 ar9 dr0 sl0 rr5 hold', 'x1 ar8 dr0 sl0 rr5 hold', 'fb2 add')),
  preset('organ', 'tonewheel', 'Tonewheel Organ', 60, 'chord', 'A Hammond-style organ: drawbar body (a half-pitch carrier, every harmonic) and a third-harmonic percussion click', p('x3 tl8 ar15 dr6 sl15 rr8', 'x0.5 w2 ar15 dr0 sl0 rr12 hold', 'fb2 add')),
  preset('organ', 'combo-organ', 'Combo Organ', 60, 'chord', 'A thin combo organ: two sine drawbars (from the games\' songs)', p('x2 tl10 ksl3 ar15 dr0 sl0 rr15 hold', 'x1 tl5 ar15 dr0 sl0 rr15 hold', 'fb0 add')),
  preset('organ', 'accordion', 'Accordion', 60, 'tune', 'Reeds and bellows: buzzy, with a musette wobble', p('x1 tl24 ar10 dr0 sl0 rr6 w1 hold', 'x1 ar10 dr1 sl1 rr6 hold trem', 'fb6')),
  preset('organ', 'harmonica', 'Harmonica', 67, 'tune', 'A blues harp: reedy and breathy', p('x1 tl22 ar8 dr2 sl2 rr6 w1 hold', 'x1 ar8 dr2 sl2 rr6 hold vib', 'fb4')),
  preset('organ', 'kazoo', 'Kazoo Reed', 60, 'tune', 'A kazoo-ish reed, an octave above the note (from the games\' songs)', p('x1 tl30 ar7 dr2 sl0 rr6 w1 hold ksr', 'x2 ar7 dr3 sl0 rr7 hold', 'fb5')),

  // ---- brass ----
  preset('brass', 'synth-brass', 'Synth Brass', 60, 'chord', 'A bright brass section stab, as from a synthesizer', p('x1 tl22 ar6 dr3 sl3 rr6 hold', 'x1 ar9 dr2 sl2 rr6 hold', 'fb6')),
  preset('brass', 'trumpet', 'Trumpet', 67, 'tune', 'A bright trumpet (from Veni, Vidi, Risi!)', p('x1 tl22 ar7 dr1 sl1 rr5 hold', 'x1 ar8 dr2 sl1 rr6 hold', 'fb7')),
  preset('brass', 'trombone', 'Trombone', 48, 'tune', 'A long, brassy trombone (from Veni, Vidi, Risi!)', p('x1 tl26 ar5 dr2 sl1 rr4 hold', 'x1 tl2 ar6 dr1 sl1 rr5 hold', 'fb6')),
  preset('brass', 'horn', 'French Horn', 55, 'tune', 'A French horn: mellow, a soft swell', p('x1 tl32 ar5 dr2 sl2 rr5 hold', 'x1 ar5 dr1 sl1 rr5 hold', 'fb4')),
  preset('brass', 'tuba', 'Tuba', 36, 'tune', 'A tuba: low, round and blowy', p('x1 tl28 ar7 dr2 sl2 rr6 hold', 'x1 ar7 dr2 sl1 rr6 hold', 'fb5')),

  // ---- woodwinds ----
  preset('winds', 'flute', 'Flute', 72, 'tune', 'A breathy flute with vibrato (from the games\' songs)', p('x1 tl36 ar5 dr4 sl0 rr6 hold vib', 'x1 ar7 dr5 sl0 rr6 hold vib', 'fb7')),
  preset('winds', 'clarinet', 'Clarinet', 60, 'tune', 'A clarinet: woody and hollow (odd harmonics, like a square wave)', p('x2 tl28 ar8 dr1 sl1 rr6 hold', 'x1 ar8 dr0 sl0 rr6 hold', 'fb0')),
  preset('winds', 'oboe', 'Oboe', 67, 'tune', 'An oboe: thin and nasal', p('x3 tl24 ar8 dr1 sl1 rr6 hold', 'x1 ar8 dr0 sl0 rr6 hold vib', 'fb3')),
  preset('winds', 'sax', 'Saxophone', 55, 'tune', 'A tenor sax: reedy, growly and bright', p('x1 tl22 ar8 dr3 sl3 rr6 w2 hold vib', 'x1 ar8 dr1 sl1 rr6 hold', 'fb5')),
  preset('winds', 'pan-flute', 'Pan Flute', 72, 'tune', 'Pan pipes: a puff of breath, then a pure hollow tone', p('x1 tl26 ar10 dr5 sl8 rr6 hold', 'x1 ar5 dr2 sl1 rr6 hold vib', 'fb7')),

  // ---- mallets and bells ----
  preset('mallets', 'glockenspiel', 'Glockenspiel', 84, 'tune', 'Steel bars struck hard: high, pure, ringing', p('x5 tl36 ar15 dr5 sl6 rr4', 'x1 ar15 dr3 sl3 rr4', 'fb0')),
  preset('mallets', 'tubular-bells', 'Tubular Bells', 60, 'tune', 'Orchestral chimes: a long, clanging bell (inharmonic, from a 2:7 ratio)', p('x7 tl30 ar15 dr3 sl4 rr3', 'x2 ar15 dr2 sl3 rr3', 'fb0')),
  preset('mallets', 'celesta', 'Celesta', 72, 'tune', 'A celesta: soft, sweet bell-piano (from the games\' songs)', p('x5 tl28 ar15 dr6 sl3 rr4', 'x1 ar15 dr4 sl2 rr5', 'fb3')),
  preset('mallets', 'music-box', 'Music Box', 84, 'tune', 'A wind-up music box: tiny, high, plinky', p('x4 tl36 ar15 dr6 sl6 rr5', 'x1 ar15 dr3 sl5 rr5', 'fb0')),
  preset('mallets', 'vibraphone', 'Vibraphone', 67, 'tune', 'A vibraphone: soft mallets, long ring, the motor\'s tremolo', p('x4 tl40 ar15 dr6 sl10 rr5', 'x1 ar15 dr2 sl3 rr4 trem', 'fb0')),
  preset('mallets', 'marimba', 'Marimba', 60, 'tune', 'A marimba: warm wooden bars with a quick knock (the 4th partial)', p('x4 tl34 ar15 dr8 sl15 rr8', 'x1 ar15 dr5 sl5 rr6', 'fb0')),
  preset('mallets', 'xylophone', 'Xylophone', 79, 'tune', 'A xylophone: hard, dry, bright (the 3rd partial)', p('x3 tl28 ar15 dr8 sl15 rr8', 'x1 ar15 dr5 sl6 rr6', 'fb0')),
  preset('mallets', 'chimes', 'Metallic Chimes', 72, 'tune', 'Wind chimes: bright, shimmering metal (inharmonic, a 2:15 ratio)', p('x15 tl42 ar15 dr3 sl3 rr3', 'x2 ar15 dr2 sl2 rr3', 'fb0')),
  preset('mallets', 'steel-drum', 'Steel Drum', 67, 'tune', 'A Caribbean steel pan: a bright ping with a hollow ring', p('x2 tl28 ar15 dr4 sl4 rr5', 'x1 ar15 dr4 sl4 rr5 w1', 'fb2')),

  // ---- percussion on melody tracks ----
  preset('perc', 'cowbell', 'Cowbell', 68, 'hits', 'A cowbell: a short, clanky metallic tone', p('x3 tl34 ar15 dr6 sl15 rr7', 'x2 ar15 dr5 sl6 rr7 w1', 'fb0')),
  preset('perc', 'woodblock', 'Woodblock', 84, 'hits', 'A woodblock: a dry, hollow knock', p('x5 tl30 ar15 dr10 sl15 rr10', 'x1 ar15 dr8 sl15 rr9', 'fb0')),
  preset('perc', 'timpani', 'Timpani', 41, 'hits', 'Kettle drums: a tuned boom that rings', p('x1 tl28 ar15 dr4 sl6 rr4', 'x1 ar15 dr3 sl4 rr4', 'fb4')),
  preset('perc', 'melodic-kick', 'Kick (melody track)', 36, 'hits', 'A kick drum for a melody track, when the drum kit is off', p('x1 tl14 ar15 dr9 sl15 rr9', 'x0.5 ar15 dr6 sl15 rr7', 'fb3')),
  preset('perc', 'melodic-snare', 'Snare (melody track)', 60, 'hits', 'A noisy snare for a melody track: full feedback makes the noise', p('x15 ar15 dr8 sl15 rr8', 'x1 ar15 dr7 sl15 rr8', 'fb7')),
  preset('perc', 'melodic-hat', 'Hi-hat (melody track)', 84, 'hits', 'A noisy hi-hat for a melody track: a short hiss', p('x15 ar15 dr10 sl15 rr10', 'x12 ar15 dr10 sl15 rr10', 'fb7')),
];

// The song maker's first nine patches, kept under their old names.
const CLASSIC_NAMES: Record<keyof typeof INSTRUMENTS, [string, number, string]> = {
  piano: ['Piano', 60, 'The song maker\'s piano'],
  bass: ['Bass', 36, 'The song maker\'s bass'],
  strings: ['Strings', 60, 'The song maker\'s strings'],
  brass: ['Brass', 60, 'The song maker\'s brass'],
  lead: ['Lead', 72, 'The song maker\'s lead'],
  bell: ['Bell', 72, 'The song maker\'s bell'],
  organ: ['Organ', 60, 'The song maker\'s organ'],
  pad: ['Pad', 60, 'The song maker\'s pad'],
  pluck: ['Pluck', 60, 'The song maker\'s pluck'],
};
const CLASSIC: OplPreset[] = Object.entries(CLASSIC_NAMES).map(([id, [name, key, about]]) =>
  preset('classic', id, name, key, 'tune', about, INSTRUMENTS[id as keyof typeof INSTRUMENTS]),
);

/** Every preset, in the order the picker lists them. */
export const OPL_PRESETS: OplPreset[] = [...MELODIC, ...DRUM_KIT, ...CLASSIC];

const BY_ID = new Map(OPL_PRESETS.map((x) => [x.id, x]));
export const presetById = (id: string) => BY_ID.get(id);

/** The preset an instrument is (its first 11 bytes match), if any. */
export function findPreset(inst: Uint8Array): OplPreset | undefined {
  return OPL_PRESETS.find((x) => {
    for (let i = 0; i < 11; i++) if (x.patch[i] !== inst[i]) return false;
    return true;
  });
}
