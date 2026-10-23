// The soundtrack: the six songs of Veni, Vidi, Risi! (Lewis Moten's group: Latin lyrics shaped
// with ChatGPT from his prompts, music and vocals made with Riffusion, now Google Flow Music),
// arranged for the Sound Blaster's OPL2 FM chip as Creative Music Files in rhythm mode, with
// the tricks in games/kit/songFx.ts. Each song keeps its recording's tempo, key and harmony
// (games/risi/tools/analyze.py measured them; the recordings are not in the repo) and its sung
// tune, tidied from the analysis's pitches word by word, on an instrument for its genre:
//   canis      "Canis Meus Flatum Dedit": a tragic opera. 76 BPM (the analysis counts 151.7,
//              the eighths), C minor with the Neapolitan D flat; a tenor and his vibrato twin
//              (the chorus of senators), strings, brass stabs, a harpsichord for the bridge,
//              timpani on tuned toms, and the event itself: a trombone sliding down an octave.
//   ignavi     "Laudes Ignavi": a quick military march, 172 BPM, D minor: trumpets, a snare's
//              rolls, a lyre's arpeggios, and the hook "Cucurri-curri-currimus" in eighths.
//   titus      "Titus Torquet Lingua": a patter song, 97 BPM, G minor: a lute, a flute and a
//              triangle, the tongue twister in sixteenths, faster and faster at the end.
//   felis      "Felis Fortissimus": a heroic march, 123 BPM, D minor: brass, a piccolo, snare
//              and bass drum, and a mysterious bridge for the hunt in the dark.
//   piscis     "Canit Piscis Aureus": a diva's aria, 91 BPM, G minor turning to E flat major for
//              the finale: a soprano, harp, celesta sparkle and tambourine.
//   silentium  "Silentium Ridentium": an ironic bounce, 144 BPM, G minor: a reedy kazoo of a
//              lead, oom-pah, a rimshot, and bars of silence where the laugh should be.
// The title and the win play the group's own fanfare ("Veni, vidi, risi!" in C major, with a
// laughing trill); the menu is a medley of all six refrains. A marker at every section
// (PLAYGAME skips them; tools/songPreview.ts reads them).
import { INSTRUMENTS, sbi } from '../../../kit/music';
import { CELESTA, FLUTE, OUD, REED, VOICE, Writer, type Groove } from '../../../kit/song';
import { DRUM, Fx, detuned } from '../../../kit/songFx';

export type SongName = 'canis' | 'ignavi' | 'titus' | 'felis' | 'piscis' | 'silentium';

// ---- the patches --------------------------------------------------------------------------

/** The tenor: a vibrato voice; his twin without it sings along in the choruses. */
const TENOR = VOICE;
const TWIN = detuned(VOICE);
/** Bowed strings, sustaining. */
const STRINGS = INSTRUMENTS.strings;
/** Brass: stabs and fanfares. */
const BRASS = INSTRUMENTS.brass;
/** A bright trumpet for the marches. */
const TRUMPET = sbi({ modChar: 0x21, carChar: 0x21, modLevel: 0x16, carLevel: 0x00, modAD: 0x71, carAD: 0x82, modSR: 0x15, carSR: 0x16, feedback: 0x0e });
/** The trombone for the event: a long brassy note. */
const TROMBONE = sbi({ modChar: 0x21, carChar: 0x21, modLevel: 0x1a, carLevel: 0x02, modAD: 0x52, carAD: 0x61, modSR: 0x14, carSR: 0x15, feedback: 0x0c });
/** A harpsichord (plucked, bright, quick to die). */
const HARPSICHORD = sbi({ modChar: 0x01, carChar: 0x01, modLevel: 0x0e, carLevel: 0x00, modAD: 0xf8, carAD: 0xf4, modSR: 0x44, carSR: 0x55, modWave: 2, feedback: 0x0e });
/** The harp (and the lyre): a soft pluck that rings. */
const HARP = sbi({ modChar: 0x02, carChar: 0x01, modLevel: 0x1d, carLevel: 0x00, modAD: 0xf4, carAD: 0xf3, modSR: 0x32, carSR: 0x24, feedback: 0x06 });
/** Pizzicato strings. */
const PIZZ = INSTRUMENTS.pluck;
/** The soprano (the diva): a pure, high, sustained voice with vibrato. */
const SOPRANO = sbi({ modChar: 0x61, carChar: 0x62, modLevel: 0x24, carLevel: 0x00, modAD: 0x75, carAD: 0x76, modSR: 0x14, carSR: 0x15, feedback: 0x0a });
/** A kazoo-ish reed for the ironic one. */
const KAZOO = REED;
/** The bass: plucked. */
const BASSP = sbi({ modChar: 0x01, carChar: 0x01, modLevel: 0x14, carLevel: 0x00, modAD: 0xf5, carAD: 0xf4, modSR: 0x36, carSR: 0x36, feedback: 0x0c });
/** Timpani on the tom channel (long decay, its pitch follows its note). */
const TIMPANI = sbi({ modChar: 0x01, carChar: 0x00, modLevel: 0x00, carLevel: 0x00, modAD: 0xf4, carAD: 0x00, modSR: 0x26, carSR: 0x00, feedback: 0x00 });

// ---- chords -------------------------------------------------------------------------------

const PC: Record<string, number> = { C: 0, Db: 1, D: 2, Eb: 3, E: 4, F: 5, Gb: 6, G: 7, Ab: 8, A: 9, Bb: 10, B: 11 };

function shape(name: string): { pc: number; iv: number[] } {
  const m = /^([A-G]b?)(m?)(7?)$/.exec(name);
  if (!m) throw new Error(`Unknown chord ${name}`);
  const iv = [0, m[2] ? 3 : 4, 7];
  if (m[3]) iv.push(m[2] ? 10 : 10);
  return { pc: PC[m[1]], iv };
}

const fold = (pc: number, lo: number) => lo + ((pc - lo + 120) % 12);
/** The bass root (E1..D#2), shifted. */
const root = (name: string, shift = 0) => fold(shape(name).pc + shift, 40);
/** A close chord from `lo` up. */
const chord = (name: string, lo = 55, shift = 0) => {
  const { pc, iv } = shape(name);
  return iv.map((i) => fold(pc + i + shift, lo)).sort((a, b) => a - b);
};

// ---- the material -------------------------------------------------------------------------

interface Section {
  name: string;
  /** One chord per bar, or two ("Cm G": half a bar each). */
  chords: string[];
  /** One bar of the tune per string (4 beats; kit/songFx tones()). */
  tune: string[];
}

const vamp = (name: string, chords: string[]): Section => ({ name, chords, tune: chords.map(() => 'r w') });

// Canis Meus Flatum Dedit (C minor)
/** "Sub mensa... in tenebris... sic venit pestilentia..." */
const CANIS_ARIA: Section = {
  name: 'aria',
  chords: ['Cm', 'Cm', 'Ab', 'Ab', 'Db', 'G', 'Cm', 'G'],
  tune: [
    'G4 h, C5 q., Bb4 e', // Sub men-
    'Ab4 q, G4 q, r h', // -sa...
    'Eb5 q., D5 e, C5 q, Bb4 q', // in te-ne-bris...
    'Ab4 h, r h',
    'Db5 q, C5 q, Bb4 q, Ab4 q', // sic ve-nit pes-
    'B4 q, G4 q, D5 h', // -ti-len-ti-
    'C5 h., r q', // -a...
    'B4 q, D5 q, ~G5 h!', // O dii!
  ],
};
/** "O flatus, perfidus ventus! Tanquam Brutus, subdolus es! Non per gladium, sed per natum, me prodidisti, Rufus meus..." */
const CANIS_REFRAIN: Section = {
  name: 'refrain',
  chords: ['Cm', 'Fm', 'G', 'Cm', 'Ab', 'Fm', 'G', 'Cm'],
  tune: [
    'G4 q, ~Eb5 h, G5 q', // O fla-tus,
    'F5 q., Eb5 e, D5 q, C5 q', // per-fi-dus ven-tus!
    'G4 e, C5 e, G4 e, Ab4 e, Ab4 q, G4 q', // Tan-quam Bru-tus, sub-
    'B4 q, C5 q, D5 h', // -do-lus es!
    'Ab4 q, G4 q, Eb5 q, C5 q', // Non per gla-di-um,
    'Ab4 q, F4 q, Eb4 h', // sed per na-tum
    'D4 q, Eb4 q, Ab4 q, D5 q', // me pro-di-dis-ti,
    'C5 h., r q', // Ru-fus me-us...
  ],
};
/** "Canis meus, flatus dedit! Et cum eo spes mea fugit." */
const CANIS_FINALE: Section = {
  name: 'finale',
  chords: ['Ab', 'Ab', 'Fm', 'G', 'Cm', 'Cm'],
  tune: [
    'Eb5 q!, Eb5 q, Db5 q, C5 q', // Ca-nis me-us,
    'Bb4 q, Ab4 q, G4 h', // fla-tus de-dit!
    'r e, F4 e, F4 e, Ab4 e, C5 q, F5 q', // Et cum e-o spes
    'Eb5 q, D5 q, B4 h', // me-a fu-
    'C5 w', // -git.
    'r w',
  ],
};

// Laudes Ignavi (D minor, quick)
/** "Summa laus et gloria, ignavo spectato! Cuius cor est tremens, sed pes semper parato!" */
const IGNAVI_VERSE: Section = {
  name: 'verse',
  chords: ['Dm', 'Dm', 'A', 'Dm', 'Gm', 'Dm', 'A', 'Dm'],
  tune: [
    'F4 q, D4 q, F4 q, A4 q', // Sum-ma laus et
    'D5 h, A4 h', // glo-ri-a,
    'C#5 q, E5 q, A4 q, C#5 q', // i-gna-vo spec-
    'D5 h, r h', // -ta-to!
    'Bb4 q, Bb4 q, G4 q, Bb4 q', // Cu-ius cor est
    'A4 q, F4 q, D4 h', // tre-mens,
    'E4 q, A4 q, C#5 q, E5 q', // sed pes sem-per
    'D5 h, r h', // pa-ra-to!
  ],
};
/** "O Ignave Fortis, te laudamus! ... Cucurri-curri-currimus, ad victoriam pervenimus!" */
const IGNAVI_REFRAIN: Section = {
  name: 'refrain',
  chords: ['Bb', 'Gm', 'A', 'Dm', 'Dm', 'Bb', 'A', 'Dm'],
  tune: [
    'D5 q!, A4 q, Bb4 q, D5 q', // O I-gna-ve
    'Bb4 q, G4 q, G4 h', // For-tis,
    'E4 q, C#5 q, E5 q, A4 q', // te lau-da-mus!
    'D5 h, r h',
    'D5 e, D5 e, C#5 e, A4 e, D5 e, D5 e, C#5 e, A4 e', // Cu-cur-ri-cur-ri-cur-ri-mus,
    'F5 q, F5 e, E5 e, D5 q, Bb4 q', // ad vic-to-ri-am
    'A4 e, A4 e, C#5 e, E5 e, ~A5 h', // per-ve-ni-mus!
    'D5 h., r q',
  ],
};
/** The cowards' gallop between verses: the band alone. */
const IGNAVI_GALLOP = vamp('gallop', ['Dm', 'A', 'Dm', 'A']);

// Titus Torquet Lingua (G minor, patter)
/** "Titus tot titulos tetigit, tene, Titus, titulus ter! Tanta tecta tecti tectis, tacite tangunt tactum tactis!" */
const TITUS_VERSE: Section = {
  name: 'verse',
  chords: ['Gm', 'Gm', 'Eb Cm', 'D', 'Eb Cm', 'D', 'Gm', 'D'],
  tune: [
    'Bb4 e, Bb4 e, A4 e, G4 e, G4 e, G4 e, Bb4 e, A4 e', // Ti-tus tot ti-tu-los te-ti-
    'G4 q, r e, G4 e, G4 e, G4 e, Bb4 e, A4 e', // -git, te-ne Ti-tus ti-
    'D5 e, G5 e, G5 e, G5 e, G5 q, r q', // -tu-lus ter!
    'r w',
    'D5 s, D5 s, C5 s, Bb4 s, A4 s, Bb4 s, A4 s, G4 s, D5 s, D5 s, C5 s, Bb4 s, A4 q', // Tan-ta tec-ta tec-ti tec-tis,
    'A4 s, Bb4 s, A4 s, G4 s, F#4 s, G4 s, A4 s, Bb4 s, A4 h', // ta-ci-te tan-gunt tac-tum tac-tis!
    'r w',
    'r w',
  ],
};
/** "Titus tot titulos tetigit" (three times), "Tite titulos ter!" */
const TITUS_REFRAIN: Section = {
  name: 'refrain',
  chords: ['Eb Cm', 'D', 'Eb Cm', 'D', 'Eb Cm', 'D', 'Gm', 'Gm'],
  tune: [
    'G4 e, G4 e, G4 e, Bb4 e, A4 q, r q', // Ti-tus tot ti-tu-los te-ti-git,
    'D5 e, G5 e, G5 e, Eb5 e, D5 q, r q', // Ti-tus ti-tu-los tot te-ti-git,
    'D5 e, G5 e, G5 e, G5 e, Bb4 q, r q', // Ti-tus tot ti-tu-los te-ti-git,
    'Bb4 e, A4 e, A4 e, G4 e, ~D5 h', // Ti-te ti-tu-los ter!
    'G4 e, G4 e, G4 e, Bb4 e, A4 q, r q',
    'D5 e, G5 e, G5 e, Eb5 e, D5 q, r q',
    'Bb4 e, A4 e, A4 e, G4 e, G4 h',
    'r w',
  ],
};
/** "Sagax sapiens sagitat sagas, saxa sagas sapit sagax..." (faster, the tongue tied) */
const TITUS_SAGAX: Section = {
  name: 'sagax',
  chords: ['Gm', 'Dm', 'Gm', 'D'],
  tune: [
    'G4 s, G4 s, D4 s, D4 s, D4 s, D4 s, C4 s, C4 s, D4 s, D4 s, F#4 s, F#4 s, A4 q', // Sa-gax sa-pi-ens sa-gi-tat sa-gas,
    'D5 s, D5 s, Bb4 s, Bb4 s, G4 s, G4 s, Eb4 s, Eb4 s, D4 h', // sa-xa sa-gas sa-pit sa-gax,
    'G4 s, G4 s, D4 s, D4 s, G4 s, G4 s, D4 s, D4 s, D4 s, D4 s, F#4 s, F#4 s, E4 q', // si sa-gas sa-pis...
    'D4 s, D4 s, F#4 s, F#4 s, A4 s, A4 s, D5 s, D5 s, ~G5 h!', // ...sa-gax sa-pi-ens sa-ga sa-pit!
  ],
};

// Felis Fortissimus (D minor, march)
/** "Felis ambulat super mensam, oculis fulget sicut flamma. Mures tremunt sub pavimento, clamant: Ecce! Malum momentum!" */
const FELIS_VERSE: Section = {
  name: 'verse',
  chords: ['Dm', 'Dm', 'Am', 'Dm', 'Dm', 'Gm', 'A', 'Dm'],
  tune: [
    'D5 e, E5 e, F5 q, D5 q, A4 q', // Fe-lis am-bu-lat
    'Bb4 e, Bb4 e, A4 q, G4 q, r q', // su-per men-sam,
    'C5 e, C5 e, A4 q, E5 q, C5 q', // o-cu-lis ful-get
    'A4 e, A4 e, D5 q, D5 h', // si-cut flam-ma.
    'F5 e, F5 e, D5 q, A4 q, D5 q', // Mu-res tre-munt
    'Bb4 q, A4 e, G4 e, A4 h', // sub pa-vi-men-to,
    'E5 e, E5 e, C#5 q, A4 q, E5 q', // cla-mant: Ec-ce!
    'D5 q, A4 q, D5 h', // Ma-lum mo-men-tum!
  ],
};
/** "Felis fortissimus, terror nocturnus! Saltat, miavit, et nullus superstes! Non propter gloriam, nec propter famem, sed propter caseum, regem saporum!" */
const FELIS_REFRAIN: Section = {
  name: 'refrain',
  chords: ['Dm', 'Bb', 'Gm', 'A', 'Dm', 'Bb', 'A', 'Dm'],
  tune: [
    'D5 q!, A4 e, Bb4 e, D5 q, F5 q', // Fe-lis for-tis-si-mus,
    'F5 q, E5 e, D5 e, E5 h', // ter-ror noc-tur-nus!
    'D5 e, D5 e, E5 e, F5 e, E5 q, C#5 q', // Sal-tat, mi-a-vit,
    'E5 e, F5 e, E5 e, D5 e, C#5 h', // et nul-lus su-per-stes!
    'A4 q, D5 q, A4 q, A4 q', // Non prop-ter glo-ri-am,
    'G4 q, A4 q, Bb4 h', // nec prop-ter fa-mem,
    'D5 q, D5 q, F5 q, F5 q', // sed prop-ter ca-se-um,
    'E5 q, C#5 q, D5 h', // re-gem sa-po-rum!
  ],
};
/** "Mus sibilat, ridet, fugit... in tenebris, lux oculorum, in odore casei: victoria!" */
const FELIS_BRIDGE: Section = {
  name: 'bridge',
  chords: ['Gm', 'Dm', 'Gm', 'A'],
  tune: ['G4 q, A4 q, G4 q, A4 q', 'A4 q, E4 q, F4 h', 'Bb4 q, A4 q, G4 q, F4 q', 'E4 h, ~A4 q, r q'],
};

// Canit Piscis Aureus (G minor, then E flat major)
/** "O piscis aureus, diva balnei, undas tremulas vocem tua tollit! Sub aqua regina, clara canit, tympana tremunt, cymbala resonant!" */
const PISCIS_ARIA: Section = {
  name: 'aria',
  chords: ['Gm', 'Gm', 'F7', 'Bb', 'Eb', 'Dm', 'Cm', 'D'],
  tune: [
    'D5 h, Bb4 q, G4 q', // O pis-cis
    'A4 q, Bb4 q, C5 h', // au-re-us,
    'C5 q, D5 q, Eb5 q, C5 q', // di-va bal-ne-
    'D5 w', // -i!
    'Eb5 q, D5 e, C5 e, Bb4 q, G4 q', // un-das tre-mu-las
    'A4 q, F4 q, D5 h', // vo-cem tol-lit!
    'C5 e, C5 e, Bb4 q, A4 q, G4 q', // tym-pa-na tre-munt,
    'F#4 q, A4 q, D5 h', // cym-ba-la!
  ],
};
/** "Gloria piscibus, vox fulgida! ... Fluit unda, clamant mures, piscis canit, balneum plaudit!" */
const PISCIS_REFRAIN: Section = {
  name: 'refrain',
  chords: ['Gm', 'Gm', 'Eb', 'Bb', 'Cm', 'Gm', 'D', 'Gm'],
  tune: [
    'G5 q., F5 e, Eb5 q, D5 q', // Glo-ri-a pis-
    'C5 q, Bb4 q, A4 h', // -ci-bus,
    'G4 q, Bb4 q, Eb5 q, G5 q', // vox ful-gi-da!
    'F5 h., r q',
    'Eb5 e, Eb5 e, C5 q, G4 q, C5 q', // flu-it un-da,
    'D5 e, D5 e, Bb4 q, G4 h', // cla-mant mu-res,
    'A4 q, D5 q, F#5 q, A5 q', // pis-cis ca-nit,
    'G5 h., r q', // bal-ne-um plau-dit!
  ],
};
/** "Cantemus omnes, piscem laudamus! In balneo regnat, rex et magus! Diva aurea, vocis imperatrix, piscis cantat... in aeternum!" */
const PISCIS_FINALE: Section = {
  name: 'finale',
  chords: ['Eb', 'Ab', 'Eb', 'Bb', 'Ab', 'Eb', 'Bb7', 'Eb'],
  tune: [
    'Eb5 q, Eb5 q, Ab5 q, Bb5 q', // Can-te-mus om-nes,
    'C6 h, Ab5 h', // pis-cem lau-da-mus!
    'G5 q, G5 q, Bb5 q, Eb5 q', // in bal-ne-o reg-nat,
    'F5 h, D5 h', // rex et ma-gus!
    'C5 q, Eb5 q, Ab5 q, C6 q', // Di-va au-re-a,
    'Bb5 q, G5 q, Eb5 h', // vo-cis im-pe-ra-trix,
    'D5 q, F5 q, Ab5 q, ~Bb5 q', // pis-cis can-tat... in
    'Eb6 w', // ae-ter-num!
  ],
};

// Silentium Ridentium (G minor, a bounce)
/** "Cogito, scribo, quaero iocum ... sed ludus meus fit stultissimus! Omnes spectant, nemo ridet. Cur latine? Nemo intellegit!" */
const SILENT_VERSE: Section = {
  name: 'verse',
  chords: ['Gm', 'Gm', 'Cm', 'D', 'Gm', 'Eb', 'D', 'Gm'],
  tune: [
    'G4 q, Bb4 q, A4 q, F#4 q', // Co-gi-to, scri-
    'A4 q, D5 q, r h', // -bo,
    'G5 q, Bb4 q, A4 q, G4 q', // quae-ro io-cum...
    'Bb4 q, A4 q, A4 h', // stul-tis-si-mus!
    'D5 q, G5 q, G5 q, D5 q', // Om-nes spec-tant,
    'C5 q, Eb5 q, D5 h', // ne-mo ri-det.
    'D5 q, D5 q, D5 q, F#5 q', // Cur la-ti-ne?
    'G5 h, r h', // (no one understands)
  ],
};
/** "Cantemus, rideamus, sed quis ridet? In lingua vetere, nulla felicitas est ... Humor fugit, et nos manemus confusi!" */
const SILENT_REFRAIN: Section = {
  name: 'refrain',
  chords: ['Gm', 'Gm', 'Dm', 'Eb', 'Dm', 'Gm', 'D', 'Gm'],
  tune: [
    'A4 e, D5 e, Bb4 e, F#4 e, A4 q, G4 q', // Can-te-mus, ri-de-a-mus,
    'Bb4 q, A4 q, G4 h', // sed quis ri-det?
    'D4 q, C4 q, C4 q, A3 q', // In lin-gua ve-te-re,
    'F#4 q, D4 q, r h', // nul-la fe-li-ci-tas.
    'G4 q, Eb4 q, G4 q, D4 q', // Scrip-ta sunt ver-ba,
    'Bb3 q, D4 q, r h', // sed si-len-ti-um est.
    'C4 q, Eb4 q, D4 q, D4 q', // Hu-mor fu-git, et nos
    'D4 q, G4 q, r h', // ma-ne-mus con-fu-si!
  ],
};
/** "Ridetisne? Nonne ridetis? ... Risus erit... forsitan... cras?" (with the silence where the laugh should be) */
const SILENT_BRIDGE: Section = {
  name: 'bridge',
  chords: ['Gm', 'Gm', 'Cm', 'D', 'Gm', 'Gm'],
  tune: [
    'G4 q, A4 q, F#4 q, G4 q', // Ri-de-tis-ne?
    'C5 q, G4 q, r h', // Non-ne ri-de-tis?
    'r w', // (silence)
    'D5 h, r h', // Ri-sus e-rit...
    'G5 h, D5 h', // for-si-tan...
    '~G5 q!, r h.', // cras?
  ],
};

// The group's fanfare (C major): "Veni, vidi, risi!" and a laughing trill
const FANFARE: Section = {
  name: 'fanfare',
  chords: ['C', 'C', 'F', 'G', 'C', 'Am', 'F G', 'C'],
  tune: [
    'G4 q, C5 q, E5 h', // Ve-ni,
    'G4 q, C5 q, E5 h', // vi-di,
    'A4 q, C5 q, F5 h', //
    'G5 q, F5 q, D5 h', //
    'G5 q!, E5 q, C5 h', // ri-si!
    'E5 s, C5 s, E5 s, C5 s, E5 s, C5 s, E5 s, C5 s, A4 h', // ha-ha-ha-ha
    'F5 q, A5 q, G5 q, B4 q',
    'C5 w',
  ],
};

// ---- the band -----------------------------------------------------------------------------

const LEAD = 0;
const TWIN_CH = 1;
const BASS = 2;
const COMP = [3, 4];
const COLOR = 5;

const GROOVE: Record<string, Groove> = {
  // opera: the timpani alone, a roll into the refrain
  opera: { t: 'x.......x.......' },
  operaStab: { k: 'x...............', t: 'x.......x.......', c: 'x...............' },
  // a military march: snare rolls and the bass drum on the beat
  march: { k: 'x...x...x...x...', s: '..x...x.xx.x..x.', h: 'x.x.x.x.x.x.x.x.' },
  marchRoll: { k: 'x.......x.......', s: 'xxxxxxxxxxxxXxXX' },
  // the patter: a triangle (the hi-hat) and a light kick
  patter: { k: 'x.......x.......', h: 'x.xxx.xxx.xxx.xx' },
  // the cat's march: heavier
  felis: { k: 'x...x...x...x...', s: '....X.......X...', h: 'x.x.x.x.x.x.x.x.' },
  felisCrash: { k: 'x...x...x...x...', s: '....X.......X...', c: 'X...............', h: '..x.x.x.x.x.x.x.' },
  sneak: { k: 'x.........x.....', h: '....x.......x...' },
  // the aria: a tambourine (hats)
  aria: { k: 'x.......x.......', h: '..x...x...x...x.' },
  ariaBright: { k: 'x.......x.......', s: '....x.......x...', h: 'xxx.xxx.xxx.xxx.' },
  // the bounce: oom-pah and a rimshot
  bounce: { k: 'x.......x.......', s: '....x.......x...' },
  rimshot: { s: 'x.x.........X...', c: '............x...' },
  fanfare: { k: 'x...x...x...x...', s: '....X.......X...', c: 'X...............', h: 'x.x.x.x.x.x.x.x.' },
  none: {},
};

interface Band {
  lead: Uint8Array;
  comp: Uint8Array;
  color: Uint8Array;
  bass?: Uint8Array;
}

interface Play {
  sing: 'solo' | 'choir' | 'none';
  /** The comping voices: held chords, off-beat stabs (oom-PAH), eighth pumps, or out. */
  comp: 'hold' | 'pah' | 'pump' | 'none';
  /** The color channel: a fast arpeggio, a harp (with the comp channels), stabs on the beat, the tune an octave up, or out. */
  color: 'arp' | 'harp' | 'stab' | 'double' | 'none';
  bass: 'long' | 'march' | 'oompah' | 'eighths' | 'none';
  /** A groove name per bar (the last one repeats). */
  drums: string[];
  vel?: number;
  shift?: number;
}

class Arranger {
  readonly fx: Fx;
  bar = 0;
  constructor(
    readonly bpm: number,
    readonly band: Band,
  ) {
    const w = new Writer(bpm);
    this.fx = new Fx(w);
    this.fx.open(LEAD, band.lead).open(TWIN_CH, band.lead === TENOR ? TWIN : detuned(band.lead)).open(BASS, band.bass ?? BASSP);
    COMP.forEach((ch) => this.fx.open(ch, band.comp));
    this.fx.open(COLOR, band.color);
    this.fx.open(DRUM.tom, TIMPANI);
  }

  get w(): Writer {
    return this.fx.w;
  }

  section(s: Section, p: Play): this {
    const fx = this.fx;
    const at0 = this.bar * 4;
    const vel = p.vel ?? 100;
    const shift = p.shift ?? 0;
    fx.marker(at0, s.name);
    s.tune.forEach((bar, i) => {
      const at = at0 + i * 4;
      if (p.sing !== 'none') {
        const len = fx.phrase(LEAD, at, bar, vel + 6, shift);
        if (Math.abs(len - 4) > 1e-6) throw new Error(`${s.name} bar ${i + 1} is ${len} beats: ${bar}`);
        if (p.sing === 'choir') fx.phrase(TWIN_CH, at, bar, vel - 16, shift);
        if (p.color === 'double') fx.phrase(COLOR, at, bar, vel - 30, shift + 12);
      }
      const names = s.chords[i].split(' ');
      names.forEach((name, k) => {
        const span = 4 / names.length;
        const t = at + k * span;
        const notes = chord(name, 55, shift);
        if (p.comp === 'hold') notes.slice(0, 2).forEach((n, j) => fx.note(COMP[j], t, span, j ? notes[2] : n, vel - 30, 0.97));
        if (p.comp === 'pah') for (let b = 1; b < span; b += 2) notes.slice(1).forEach((n, j) => fx.note(COMP[j], t + b, 0.5, n, vel - 26, 0.7));
        if (p.comp === 'pump') for (let e = 0; e < span; e += 0.5) notes.slice(1).forEach((n, j) => fx.note(COMP[j], t + e, 0.5, n, vel - 34 + (e % 1 ? 0 : 6), 0.6));
        const r = root(name, shift);
        if (p.bass === 'long') fx.note(BASS, t, span, r, vel, 0.95);
        if (p.bass === 'march' || p.bass === 'oompah') for (let b = 0; b < span; b += p.bass === 'march' ? 1 : 2) fx.note(BASS, t + b, 1, b % 2 === 0 ? r : r + 7, vel - 2, 0.7);
        if (p.bass === 'eighths') for (let e = 0; e < span; e += 0.5) fx.note(BASS, t + e, 0.5, e % 2 === 1.5 ? r + 12 : r, vel - 6, 0.75);
        if (p.color === 'arp') fx.arp(COLOR, t, span, chord(name, 67, shift), 1 / 4, vel - 40, 'updown');
        if (p.color === 'harp') fx.harp([COLOR], t, span, [...chord(name, 55, shift), ...chord(name, 67, shift)], 1 / 2, vel - 34);
        if (p.color === 'stab') fx.note(COLOR, t, 0.5, chord(name, 60, shift)[2], vel - 20, 0.6);
      });
      const name = p.drums[Math.min(i, p.drums.length - 1)];
      const groove = GROOVE[name];
      if (!groove) throw new Error(`No groove ${name}`);
      this.w.drums(at, groove, vel - 14);
    });
    this.bar += s.tune.length;
    return this;
  }

  /** The timpani rolls down into the next bar (`beats` long, ending on it). */
  roll(beats = 2, toms = [43, 43, 38, 38, 43, 43, 38, 38]): this {
    const at = this.bar * 4 - beats;
    this.fx.drumRoll(DRUM.tom, at, beats, 1 / 4, 60, 124, toms);
    return this;
  }

  /** The event (a trombone sliding down an octave), the timpani, and a bar to take it in. */
  event(n = 55): this {
    const at = this.bar * 4;
    this.fx.marker(at, 'the event');
    this.fx.program(COLOR, at, TROMBONE);
    this.fx.note(COLOR, at, 1, n, 110, 0.95);
    this.fx.slide(COLOR, at + 1, n, n - 12, 5, 104);
    this.fx.drumRoll(DRUM.tom, at + 3, 1, 1, 127, 127, [36]);
    this.fx.program(COLOR, at + 4, this.band.color);
    this.bar += 1;
    return this;
  }

  /** A rimshot (ba-dum-tss) on the last beat of a bar of its own. */
  rimshot(): this {
    const at = this.bar * 4;
    this.fx.marker(at, 'rimshot');
    this.w.drums(at, GROOVE.rimshot, 110);
    this.bar += 1;
    return this;
  }

  /** Bars of nothing at all (the silence where the laugh should be). */
  silence(bars: number): this {
    this.fx.marker(this.bar * 4, 'silentium');
    this.bar += bars;
    return this;
  }

  cmf(): Uint8Array {
    if (!Number.isInteger(this.bar)) throw new Error(`The song ends mid-bar (${this.bar})`);
    return this.fx.cmf(this.bar);
  }
}

const BANDS: Record<SongName | 'fanfare', [number, Band]> = {
  canis: [76, { lead: TENOR, comp: STRINGS, color: BRASS }],
  ignavi: [172, { lead: TRUMPET, comp: BRASS, color: HARP }],
  titus: [97, { lead: FLUTE, comp: PIZZ, color: OUD }],
  felis: [123, { lead: TRUMPET, comp: STRINGS, color: FLUTE }],
  piscis: [91, { lead: SOPRANO, comp: STRINGS, color: HARP }],
  silentium: [144, { lead: KAZOO, comp: PIZZ, color: CELESTA }],
  fanfare: [120, { lead: TRUMPET, comp: BRASS, color: CELESTA }],
};
const arranger = (name: keyof typeof BANDS, bpm = BANDS[name][0]) => new Arranger(bpm, BANDS[name][1]);

const rep = (name: string, n: number, last?: string) => [...new Array(last ? n - 1 : n).fill(name), ...(last ? [last] : [])];

// ---- the songs ----------------------------------------------------------------------------

/** I. The banquet: the aria, the event, the refrain with the senators' chorus, the finale. */
function canis(lite = false): Arranger {
  const a = arranger('canis');
  a.section(CANIS_ARIA, { sing: 'solo', comp: 'hold', color: 'none', bass: 'long', drums: ['opera'], vel: 92 });
  a.event();
  a.roll(2);
  a.section(CANIS_REFRAIN, { sing: 'choir', comp: 'hold', color: lite ? 'none' : 'stab', bass: 'long', drums: ['operaStab', 'opera'], vel: 104 });
  if (!lite) {
    a.fx.program(COMP[0], a.bar * 4, HARPSICHORD).program(COMP[1], a.bar * 4, HARPSICHORD);
    a.section({ ...CANIS_ARIA, name: 'bridge' }, { sing: 'solo', comp: 'pump', color: 'none', bass: 'long', drums: ['none'], vel: 88 });
    a.fx.program(COMP[0], a.bar * 4, STRINGS).program(COMP[1], a.bar * 4, STRINGS);
    a.roll(2);
  }
  a.section(CANIS_FINALE, { sing: 'choir', comp: 'hold', color: 'stab', bass: 'long', drums: ['operaStab', 'opera'], vel: 110 });
  return a;
}

/** II. The battle: the gallop, the verse, the refrain ("Cucurri-curri-currimus!"), again faster. */
function ignavi(lite = false): Arranger {
  const a = arranger('ignavi');
  a.section(IGNAVI_GALLOP, { sing: 'none', comp: 'pump', color: 'arp', bass: 'march', drums: ['march', 'march', 'march', 'marchRoll'], vel: 98 });
  a.section(IGNAVI_VERSE, { sing: 'solo', comp: 'pah', color: 'arp', bass: 'march', drums: rep('march', 8, 'marchRoll'), vel: 100 });
  a.section(IGNAVI_REFRAIN, { sing: 'choir', comp: 'pump', color: 'stab', bass: 'march', drums: rep('march', 8, 'marchRoll'), vel: 108 });
  if (!lite) {
    a.section(IGNAVI_GALLOP, { sing: 'none', comp: 'pump', color: 'arp', bass: 'eighths', drums: ['march', 'march', 'march', 'marchRoll'], vel: 100 });
    a.section(IGNAVI_REFRAIN, { sing: 'choir', comp: 'pump', color: 'double', bass: 'eighths', drums: rep('march', 8, 'marchRoll'), vel: 112, shift: 2 });
  }
  return a;
}

/** III. The rooftops: the verse, the refrain, the wise man's tongue-twister, the refrain again. */
function titus(lite = false): Arranger {
  const a = arranger('titus');
  a.section(TITUS_VERSE, { sing: 'solo', comp: 'pah', color: 'arp', bass: 'oompah', drums: ['patter'], vel: 96 });
  a.section(TITUS_REFRAIN, { sing: 'choir', comp: 'pah', color: 'stab', bass: 'march', drums: ['patter'], vel: 102 });
  if (!lite) {
    a.section(TITUS_SAGAX, { sing: 'solo', comp: 'pump', color: 'arp', bass: 'march', drums: ['patter'], vel: 100 });
    a.section(TITUS_REFRAIN, { sing: 'choir', comp: 'pump', color: 'double', bass: 'march', drums: ['patter'], vel: 106, shift: 2 });
  }
  return a;
}

/** IV. The kitchen: the verse, the refrain, the hunt in the dark, the refrain again. */
function felis(lite = false): Arranger {
  const a = arranger('felis');
  a.section(FELIS_VERSE, { sing: 'solo', comp: 'pah', color: 'none', bass: 'march', drums: ['felis'], vel: 98 });
  a.section(FELIS_REFRAIN, { sing: 'choir', comp: 'hold', color: 'double', bass: 'march', drums: ['felisCrash', 'felis'], vel: 106 });
  if (!lite) {
    a.section(FELIS_BRIDGE, { sing: 'solo', comp: 'hold', color: 'arp', bass: 'long', drums: ['sneak'], vel: 88 });
    a.section(FELIS_REFRAIN, { sing: 'choir', comp: 'hold', color: 'double', bass: 'march', drums: ['felisCrash', 'felis'], vel: 110 });
  }
  return a;
}

/** V. The baths: the aria with the harp, the refrain, the finale in E flat. */
function piscis(lite = false): Arranger {
  const a = arranger('piscis');
  a.section(PISCIS_ARIA, { sing: 'solo', comp: 'hold', color: 'harp', bass: 'long', drums: ['aria'], vel: 94 });
  a.section(PISCIS_REFRAIN, { sing: 'solo', comp: 'pah', color: 'harp', bass: 'oompah', drums: ['ariaBright'], vel: 102 });
  if (!lite) a.section(PISCIS_FINALE, { sing: 'choir', comp: 'hold', color: 'arp', bass: 'march', drums: ['ariaBright'], vel: 108 });
  return a;
}

/** VI. The theater: the verse, the refrain, the bridge with its silence, a rimshot. */
function silentium(lite = false): Arranger {
  const a = arranger('silentium');
  a.section(SILENT_VERSE, { sing: 'solo', comp: 'pah', color: 'none', bass: 'oompah', drums: ['bounce'], vel: 96 });
  a.section(SILENT_REFRAIN, { sing: 'choir', comp: 'pah', color: 'arp', bass: 'oompah', drums: ['bounce'], vel: 102 });
  if (!lite) {
    a.section(SILENT_BRIDGE, { sing: 'solo', comp: 'none', color: 'none', bass: 'long', drums: ['none'], vel: 84 });
    a.silence(1);
    a.rimshot();
  }
  return a;
}

const LEVEL_SONGS: Record<SongName, (lite?: boolean) => Arranger> = { canis, ignavi, titus, felis, piscis, silentium };

/** Title: the group's fanfare, then "O flatus, perfidus ventus" for a taste of the opera. */
export function titleSong(): Uint8Array {
  const a = arranger('fanfare');
  a.section(FANFARE, { sing: 'choir', comp: 'hold', color: 'arp', bass: 'march', drums: ['fanfare'], vel: 106 });
  a.rimshot();
  return a.cmf();
}

/** The story: "Cogito, scribo, quaero iocum", hushed. */
export function storySong(): Uint8Array {
  const a = arranger('silentium', 120);
  a.section(SILENT_VERSE, { sing: 'solo', comp: 'pah', color: 'none', bass: 'oompah', drums: ['bounce'], vel: 88 });
  a.section(SILENT_BRIDGE, { sing: 'solo', comp: 'none', color: 'none', bass: 'long', drums: ['none'], vel: 80 });
  return a.cmf();
}

/** Won: the fanfare, louder, a key up, and the laugh at last. */
export function wonSong(): Uint8Array {
  const a = arranger('fanfare');
  a.section(FANFARE, { sing: 'choir', comp: 'hold', color: 'arp', bass: 'march', drums: ['fanfare'], vel: 110 });
  a.section({ ...FANFARE, name: 'again' }, { sing: 'choir', comp: 'pump', color: 'double', bass: 'eighths', drums: ['fanfare'], vel: 114, shift: 2 });
  a.rimshot();
  return a.cmf();
}

/** Lost: "Risus erit... forsitan... cras?" slow, alone. */
export function lostSong(): Uint8Array {
  const a = arranger('canis', 66);
  a.section({ ...SILENT_BRIDGE, name: 'cras' }, { sing: 'solo', comp: 'hold', color: 'none', bass: 'long', drums: ['opera'], vel: 86 });
  a.event(50);
  return a.cmf();
}

/** The menu: a medley, every song's refrain in the game's order. */
export function medley(): Uint8Array {
  const parts: [SongName, Section][] = [
    ['canis', CANIS_REFRAIN],
    ['ignavi', IGNAVI_REFRAIN],
    ['titus', TITUS_REFRAIN],
    ['felis', FELIS_REFRAIN],
    ['piscis', PISCIS_REFRAIN],
    ['silentium', SILENT_REFRAIN],
  ];
  // one tempo (each refrain keeps its own feel by the band's patches, set by program change)
  const a = arranger('fanfare', 112);
  for (const [name, s] of parts) {
    const band = BANDS[name][1];
    const at = a.bar * 4;
    a.fx.program(LEAD, at, band.lead).program(TWIN_CH, at, band.lead === TENOR ? TWIN : detuned(band.lead));
    COMP.forEach((ch) => a.fx.program(ch, at, band.comp));
    a.fx.program(COLOR, at, band.color);
    a.section({ ...s, name }, { sing: 'choir', comp: name === 'canis' || name === 'felis' ? 'hold' : 'pah', color: 'none', bass: name === 'canis' ? 'long' : 'march', drums: [name === 'canis' ? 'opera' : name === 'ignavi' ? 'march' : name === 'titus' ? 'patter' : name === 'felis' ? 'felis' : name === 'piscis' ? 'aria' : 'bounce'], vel: 100 });
    if (name === 'canis') a.event();
  }
  a.rimshot();
  return a.cmf();
}

/** A level song's file name (DOS 8.3). */
export const songFile = (name: SongName): string => (name === 'silentium' ? 'silens' : name);

/** Every song, by file name, for the build and the preview. */
export function allSongs(): Record<string, Uint8Array> {
  const out: Record<string, Uint8Array> = { title: titleSong(), story: storySong() };
  for (const [name, f] of Object.entries(LEVEL_SONGS)) out[songFile(name as SongName)] = f().cmf();
  out.won = wonSong();
  out.lost = lostSong();
  out.menu = medley();
  return out;
}
