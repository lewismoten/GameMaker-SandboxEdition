// The score of "Shakespeare in Sweatpants" (The Bard of Bizarre, 1995): coffee-house jazz for
// open-mic night at The Hive, written for the Sound Blaster's OPL2 FM chip as Creative Music Files
// in rhythm mode (six melodic voices: the lead, its twin, an upright bass and three comping
// voices; the chip's five drums: kick, snare or brushes, tom, ride and hi-hat). Plain CMF events
// only (note on/off, program change, the rhythm switch and the markers PLAYGAME skips), with
// the tricks of games/kit/songFx.ts: swung eighths (every note, chord and cymbal is placed on a
// swing grid), walking bass lines that lead chromatically into the next chord, comping that
// voice-leads its chords, block-voiced shout choruses (the section plays chord tones under
// every note of the lead), rolled Rhodes chords, the pipe organ swelling (program changes
// through copies of one patch), stepped scoops and falls (CMF has no pitch bend), timpani
// rolls on the tuned tom, and the occasional sound gag (the office chair's squeak, the
// self-checkout's beeps, the bee buzzing round The Hive).
//
// Four of the songs come from the monologues' Riffusion music beds, measured by
// tools/analyze.py (games/kit/song/analyze.py: tempo by spectral-flux autocorrelation, key by
// Krumhansl-Schmuckler, chords per bar against templates):
//   office  <- "The Office Chair That Tried to Kill Me": 139.6 BPM, A minor, the bed sitting on
//              G7 with Am, F, Bb and C round it (cool jazz in A minor at 140, Bb7 the twist);
//   home    <- "Shelter Me Gently, You Wounded Beast": 122.6 BPM, G major, Am - D7 - G with C,
//              Bm and Em (a ii-V-I lounge ballad in G, the bed's tempo felt in half time);
//   epic    <- "How the Cat Won the Pizza War": 178.2 BPM, D minor, vamping Bb - C7 with Am, Gm
//              and Dm (mock-heroic noir in D minor at half the bed's tempo, 89);
//   triumph <- "Wore All the Weird Socks": 179.4 BPM, D major, A7 and Bm the most, G, F#m, Em
//              and a borrowed C (the big band shout chorus in D at the bed's tempo).
// The rest is composed: the Sweatpants Stroll (the main theme: title, menu, story, The Hive,
// the curtain call), the self-checkout bossa nova, the swing for going outside, the bebop
// chase, the torch blues, the bee's buzz, the beatnik snap and the last-call waltz.
import { CELESTA, FLUTE } from '../../../kit/song';
import { DRUM } from '../../../kit/songFx';
import { Arranger, BASSCH, type Style, TWIN } from './band';
import { BLUES, BRIDGE, BUZZ, CHASE, EPIC, fold, HOME, OFFICE, OUTSIDE, PC, type Sec, SHOP, slice, SNAP, STROLL, TRIUMPH, WALTZ } from './material';
import { BRASS, CLARINET, GUITAR, MUTE, PIANO, PIPE, RHODES, STRINGS, TENOR, VIBES } from './patches';

/** The level songs a monologue may name, and the songs of the title, menu, story, endings and intermissions. */
const LEVEL_SONGS = ['office', 'shop', 'home', 'outside', 'epic', 'chase', 'blues', 'triumph'] as const;
const SCREEN_SONGS = ['title', 'menu', 'story', 'won', 'lost', 'hive', 'inter1', 'inter2', 'inter3', 'finale'] as const;
type SongName = (typeof LEVEL_SONGS)[number] | (typeof SCREEN_SONGS)[number];

// ---- the gags -----------------------------------------------------------------------------

/** The office chair squeaks: a high slide up and a stutter, on the twin's channel (a vibes patch for once). */
const squeak = (bars: number[]) => (a: Arranger, at: number) => {
  for (const b of bars) {
    const t = at + b * 4 + 2;
    a.fx.program(TWIN, t, CELESTA);
    const end = a.fx.slide(TWIN, t, 86, 90, 2, 70);
    a.fx.stutter(TWIN, end, 89, 3, 1 / 6, 64);
  }
};

/** The self-checkout: beep, beep, and the low bonk of the unexpected item in the bagging area. */
const beeps = (bar: number) => (a: Arranger, at: number) => {
  const t = at + bar * 4;
  a.fx.program(TWIN, t, CELESTA);
  a.fx
    .note(TWIN, t, 0.4, 88, 96)
    .note(TWIN, t + 0.5, 0.4, 88, 96)
    .note(TWIN, t + 1.5, 1.2, 64, 104);
  a.fx.note(TWIN, t + 3, 0.4, 88, 80);
};

/** The bee: a fast buzzing trill flying off over the band. */
const bee = (bar: number) => (a: Arranger, at: number) => {
  const t = at + bar * 4;
  for (let k = 0; k < 16; k++) a.fx.note(TWIN, t + k / 8, 1 / 8, k % 2 ? 78 : 79 + Math.floor(k / 4), 60 - k * 2, 0.9);
};

/** The fanfare: the timpani rolling up out of nothing, then the brass's "ta-ta-ta TAAA" with a crash. */
function fanfare(a: Arranger, key: string, pick: string, land: string): void {
  const r = PC[key];
  a.section(
    { name: 'fanfare', chords: [key, key], tune: ['r w', `${pick} t!, ${pick} t!, ${pick} t!, ${land} h.!`] },
    { lead: BRASS, twin: 'below', twinPatch: BRASS, comp: 'shout', compPatch: BRASS, bass: 'pedal', drums: 'none', fill: false },
  );
  a.fx.drumRoll(DRUM.tom, a.beat - 8, 4, 1 / 6, 24, 112, [fold(r, 38)]);
  a.fx.drumRoll(DRUM.cymbal, a.beat - 8, 4, 1 / 4, 12, 90);
  a.crash(a.beat - 3, 124);
  a.fx.note(DRUM.kick, a.beat - 3, 0.5, 36, 110);
  a.fx.note(DRUM.tom, a.beat - 3, 0.5, fold(r, 38), 110);
}

/** The sad trombone: wah, wah, wah, wahhh (the last one wobbling). */
function trombone(a: Arranger): void {
  a.section(
    { name: 'wah wah', chords: ['Cm', 'Cm'], tune: ['G4 q, F#4 q, F4 q, ~E4 q', 'E4 h., _ q\\\\\\'] },
    { lead: BRASS, twin: 'below', twinPatch: BRASS, comp: 'none', compPatch: RHODES, bass: 'none', drums: 'none', fill: false, vel: 104 },
  );
  a.fx.note(BASSCH, a.beat - 8, 3, 43, 90).note(BASSCH, a.beat - 5, 4.5, 40, 96);
}

/** The bows: three big chords, the cymbal and the timpani on each. */
function bows(a: Arranger, sec: Sec): void {
  a.section(sec, { lead: BRASS, twin: 'below', twinPatch: BRASS, comp: 'shout', compPatch: BRASS, bass: 'stop', drums: 'none', fill: false, vel: 112 });
  const at = a.beat - 8;
  for (const t of [0, 2, 4]) {
    a.crash(at + t, 122);
    a.fx.note(DRUM.kick, at + t, 0.5, 36, 110);
  }
  a.roll(41, 2, 110);
}

// ---- the songs ----------------------------------------------------------------------------

const swing = 0.64;

/** Office (A Totally Normal Meeting and the rest of the workday): the head on muted trumpet with brushes, the chair squeaking in its rests; then the vibes with the trumpet a chord tone under them. */
function office(): Uint8Array {
  const a = new Arranger(140);
  a.section(OFFICE, { lead: MUTE, comp: 'charleston', compPatch: PIANO, bass: 'walk', drums: 'brush', swing, extra: squeak([3, 11]) });
  a.section(OFFICE, { lead: VIBES, twin: 'harm', twinPatch: MUTE, comp: 'red', compPatch: PIANO, bass: 'walk', drums: 'ride', swing });
  return a.cmf();
}

/** Shop (the self-checkout): bossa nova, flute and nylon guitar, the beeps in the last bar; then vibes with the flute over them. */
function shop(): Uint8Array {
  const a = new Arranger(136);
  a.section(SHOP, { lead: FLUTE, up: 0, comp: 'bossa', compPatch: GUITAR, bass: 'bossa', drums: 'bossa', extra: beeps(15) });
  a.section(SHOP, { lead: VIBES, twin: 'harm', twinPatch: FLUTE, comp: 'bossa', compPatch: GUITAR, bass: 'bossa', drums: 'bossa', extra: beeps(15) });
  return a.cmf();
}

/** Home (the stolen blanket): the ballad in half time on tenor sax, brushes, rolled Rhodes chords; the vibes join a chord tone under it. */
function home(): Uint8Array {
  const a = new Arranger(122.64);
  a.section(slice(HOME, 0, 8), { lead: TENOR, comp: 'roll', compPatch: RHODES, bass: 'two', drums: 'brush', stretch: 2, swing: 0.6, vel: 96 });
  a.section(slice(HOME, 8), {
    lead: TENOR,
    twin: 'harm',
    twinPatch: VIBES,
    comp: 'roll',
    compPatch: RHODES,
    bass: 'two',
    drums: 'brush',
    stretch: 2,
    swing: 0.6,
    vel: 98,
  });
  return a.cmf();
}

/** Outside: swing, AABA (clarinet; clarinet and tenor; the bridge on muted trumpet; clarinet with the brass under it). */
function outside(): Uint8Array {
  const a = new Arranger(168);
  const s = 0.62;
  a.section(OUTSIDE, { lead: CLARINET, comp: 'charleston', compPatch: PIANO, bass: 'walk', drums: 'ride', swing: s });
  a.section(OUTSIDE, { lead: CLARINET, twin: 'below', twinPatch: TENOR, comp: 'charleston', compPatch: PIANO, bass: 'walk', drums: 'ride', swing: s });
  a.section(BRIDGE, { lead: MUTE, comp: 'red', compPatch: PIANO, bass: 'walk', drums: 'ride', swing: s });
  a.section(OUTSIDE, {
    lead: CLARINET,
    twin: 'harm',
    twinPatch: BRASS,
    comp: 'charleston',
    compPatch: PIANO,
    bass: 'walk',
    drums: 'ride',
    swing: s,
    crash: true,
  });
  return a.cmf();
}

/** Epic: noir first (muted trumpet, strings, a soft ride and the low tom), then pompous (brass and trombones, the pipe organ swelling, a march, the timpani). */
function epic(): Uint8Array {
  const a = new Arranger(89.09);
  a.section(
    { name: 'storm', chords: ['Dm'], tune: ['r w'] },
    { lead: MUTE, comp: 'swell', compPatch: PIPE, bass: 'pedal', drums: 'none', fill: false, vel: 90 },
  );
  a.roll(38, 4, 100);
  a.section(EPIC, { lead: MUTE, comp: 'pad', compPatch: STRINGS, bass: 'two', drums: 'noir', swing: 0.6, vel: 94 });
  a.section(EPIC, { lead: BRASS, twin: 'below', twinPatch: BRASS, comp: 'swell', compPatch: PIPE, bass: 'pedal', drums: 'march', crash: true, vel: 108 });
  return a.cmf();
}

/** Chase: bebop at 216, trumpet and tenor in octaves; the vibes; then stop-time and the head again. */
function chase(): Uint8Array {
  const a = new Arranger(216);
  const s = 0.58;
  a.section(CHASE, { lead: BRASS, twin: 'below', twinPatch: TENOR, comp: 'red', compPatch: PIANO, bass: 'walk', drums: 'bebop', swing: s });
  a.section(CHASE, { lead: VIBES, comp: 'charleston', compPatch: PIANO, bass: 'walk', drums: 'bebop', swing: s });
  a.section(slice(CHASE, 0, 4), {
    lead: BRASS,
    twin: 'below',
    twinPatch: TENOR,
    comp: 'stop',
    compPatch: BRASS,
    bass: 'stop',
    drums: 'stop',
    swing: s,
    crash: true,
  });
  a.section(slice(CHASE, 4), { lead: BRASS, twin: 'below', twinPatch: TENOR, comp: 'red', compPatch: PIANO, bass: 'walk', drums: 'bebop', swing: s });
  return a.cmf();
}

/** Blues (the coffee goat): the slow torch blues, tenor sax first, then the muted trumpet with the tenor under it. */
function blues(): Uint8Array {
  const a = new Arranger(66);
  a.section(BLUES, { lead: TENOR, comp: 'blues', compPatch: RHODES, bass: 'walk', drums: 'shuffle', swing: 0.667, vel: 96 });
  a.section(BLUES, { lead: MUTE, twin: 'harm', twinPatch: TENOR, comp: 'blues', compPatch: RHODES, bass: 'walk', drums: 'shuffle', swing: 0.667, vel: 98 });
  return a.cmf();
}

/** Triumph: the shout chorus, trumpets over the saxes' block chords with the drums kicking every accent; then the clarinet on top. */
function triumph(): Uint8Array {
  const a = new Arranger(179.44);
  a.section(TRIUMPH, { lead: BRASS, comp: 'shout', compPatch: TENOR, bass: 'walk', drums: 'shout', swing: 0.6, crash: true, vel: 104 });
  a.section(TRIUMPH, {
    lead: CLARINET,
    up: 12,
    twin: 'below',
    twinPatch: BRASS,
    comp: 'shout',
    compPatch: BRASS,
    bass: 'walk',
    drums: 'shout',
    swing: 0.6,
    crash: true,
    vel: 104,
  });
  return a.cmf();
}

const strollMute: Style = { lead: MUTE, comp: 'red', compPatch: PIANO, bass: 'walk', drums: 'snap', swing };
const strollVibes: Style = { lead: VIBES, twin: 'harm', twinPatch: MUTE, comp: 'charleston', compPatch: PIANO, bass: 'walk', drums: 'ride', swing };

/** Title: the fanfare, then the Sweatpants Stroll (muted trumpet and the finger snaps; the vibes). */
function title(): Uint8Array {
  const a = new Arranger(120);
  fanfare(a, 'F', 'C5', 'F5');
  a.section(STROLL, strollMute);
  a.section(STROLL, strollVibes);
  return a.cmf();
}

/** Story: the Stroll as a ballad on the vibes, then the home ballad's first half on tenor. */
function story(): Uint8Array {
  const a = new Arranger(96);
  a.section(STROLL, { lead: VIBES, comp: 'roll', compPatch: RHODES, bass: 'two', drums: 'brush', swing: 0.6, vel: 92 });
  a.section(slice(HOME, 0, 8), { lead: TENOR, comp: 'roll', compPatch: RHODES, bass: 'two', drums: 'brush', swing: 0.6, vel: 92 });
  return a.cmf();
}

/** Won: the fanfare and the shout chorus, the clarinet over the brass for the last eight. */
function won(): Uint8Array {
  const a = new Arranger(179.44);
  fanfare(a, 'D', 'A4', 'D5');
  a.section(TRIUMPH, { lead: BRASS, comp: 'shout', compPatch: TENOR, bass: 'walk', drums: 'shout', swing: 0.6, crash: true, vel: 106 });
  a.section(slice(TRIUMPH, 8), {
    lead: CLARINET,
    up: 12,
    twin: 'below',
    twinPatch: BRASS,
    comp: 'shout',
    compPatch: BRASS,
    bass: 'walk',
    drums: 'shout',
    swing: 0.6,
    vel: 106,
  });
  return a.cmf();
}

/** Lost: the sad trombone, then the torch blues on muted trumpet. */
function lost(): Uint8Array {
  const a = new Arranger(66);
  trombone(a);
  a.section(BLUES, { lead: MUTE, comp: 'blues', compPatch: RHODES, bass: 'walk', drums: 'shuffle', swing: 0.667, vel: 92 });
  return a.cmf();
}

/** The Hive: the bee's bossa (flute, then vibes and flute), the bee buzzing off, then the Stroll as a bossa in C. */
function hive(): Uint8Array {
  const a = new Arranger(120);
  a.section(BUZZ, { lead: FLUTE, comp: 'bossa', compPatch: GUITAR, bass: 'bossa', drums: 'bossa', extra: bee(7) });
  a.section(BUZZ, { lead: VIBES, twin: 'harm', twinPatch: FLUTE, comp: 'bossa', compPatch: GUITAR, bass: 'bossa', drums: 'bossa' });
  a.section(STROLL, { lead: FLUTE, comp: 'bossa', compPatch: GUITAR, bass: 'bossa', drums: 'bossa', shift: -5, up: 12, extra: bee(7) });
  return a.cmf();
}

/** Intermission 1, cool: the beatnik snap, AABA (flute; vibes; up a half step with both; flute). */
function inter1(): Uint8Array {
  const a = new Arranger(132);
  const st: Style = { lead: FLUTE, comp: 'sowhat', compPatch: PIANO, bass: 'riff', drums: 'snap', swing };
  a.section(SNAP, st);
  a.section(SNAP, { ...st, lead: VIBES });
  a.section(SNAP, { ...st, shift: 1, twin: 'harm', twinPatch: VIBES });
  a.section(SNAP, st);
  return a.cmf();
}

/** Intermission 2, mellow: the home ballad on muted trumpet, piano rolls and brushes. */
function inter2(): Uint8Array {
  const a = new Arranger(72);
  a.section(HOME, { lead: MUTE, comp: 'roll', compPatch: PIANO, bass: 'two', drums: 'brush', swing: 0.6, vel: 94 });
  return a.cmf();
}

/** Intermission 3, wistful: the last-call waltz (vibes, then the flute with the vibes under it). */
function inter3(): Uint8Array {
  const a = new Arranger(132);
  a.section(WALTZ, { lead: VIBES, comp: 'waltz', compPatch: PIANO, bass: 'walk', drums: 'waltz', swing: 0.6 });
  a.section(WALTZ, { lead: FLUTE, twin: 'harm', twinPatch: VIBES, comp: 'waltz', compPatch: PIANO, bass: 'walk', drums: 'waltz', swing: 0.6 });
  return a.cmf();
}

/** The curtain call: the fanfare, the Stroll for big band (twice), the shout chorus, the bows. */
function finale(): Uint8Array {
  const a = new Arranger(160);
  fanfare(a, 'F', 'C5', 'F5');
  a.section(STROLL, { lead: BRASS, comp: 'shout', compPatch: TENOR, bass: 'walk', drums: 'shout', swing: 0.62, crash: true, vel: 104 });
  a.section(STROLL, {
    lead: CLARINET,
    up: 12,
    twin: 'below',
    twinPatch: BRASS,
    comp: 'shout',
    compPatch: BRASS,
    bass: 'walk',
    drums: 'shout',
    swing: 0.62,
    vel: 104,
  });
  a.section(TRIUMPH, { lead: BRASS, comp: 'shout', compPatch: TENOR, bass: 'walk', drums: 'shout', swing: 0.62, crash: true, vel: 106 });
  bows(a, { name: 'bows', chords: ['D', 'A7 D'], tune: ['D6 q!, r q, D6 q!, r q', 'C#6 q!, r q, D6 h!'] });
  return a.cmf();
}

/** The menu: the whole score at one tempo (132), each song's head in turn. */
function menu(): Uint8Array {
  const a = new Arranger(132);
  a.section(STROLL, strollMute);
  a.section(slice(OFFICE, 0, 8), { lead: MUTE, comp: 'charleston', compPatch: PIANO, bass: 'walk', drums: 'brush', swing, extra: squeak([3]) });
  a.section(slice(SHOP, 0, 8), { lead: FLUTE, comp: 'bossa', compPatch: GUITAR, bass: 'bossa', drums: 'bossa' });
  a.section(slice(HOME, 0, 4), { lead: TENOR, comp: 'roll', compPatch: RHODES, bass: 'two', drums: 'brush', stretch: 2, swing: 0.6, vel: 96 });
  a.section(OUTSIDE, { lead: CLARINET, comp: 'charleston', compPatch: PIANO, bass: 'walk', drums: 'ride', swing: 0.62 });
  a.section(EPIC, { lead: BRASS, twin: 'below', twinPatch: BRASS, comp: 'swell', compPatch: PIPE, bass: 'pedal', drums: 'march', crash: true, vel: 106 });
  a.section(CHASE, { lead: BRASS, comp: 'red', compPatch: PIANO, bass: 'walk', drums: 'ride', swing: 0.6 });
  a.section(BLUES, { lead: TENOR, comp: 'blues', compPatch: RHODES, bass: 'walk', drums: 'shuffle', swing: 0.667, vel: 96 });
  a.section(slice(TRIUMPH, 8), { lead: BRASS, comp: 'shout', compPatch: TENOR, bass: 'walk', drums: 'shout', swing: 0.6, crash: true, vel: 104 });
  return a.cmf();
}

const SONGS: Record<SongName, () => Uint8Array> = {
  office,
  shop,
  home,
  outside,
  epic,
  chase,
  blues,
  triumph,
  title,
  menu,
  story,
  won,
  lost,
  hive,
  inter1,
  inter2,
  inter3,
  finale,
};

export function buildSongs(): Record<string, Uint8Array> {
  const out: Record<string, Uint8Array> = {};
  for (const n of [...LEVEL_SONGS, ...SCREEN_SONGS]) out[n] = SONGS[n]();
  return out;
}
