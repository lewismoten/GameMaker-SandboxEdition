// Veni, Vidi, Risi!'s chords and tunes: chord symbols, and each song's sections (song.ts).

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
export const root = (name: string, shift = 0) => fold(shape(name).pc + shift, 40);
/** A close chord from `lo` up. */
export const chord = (name: string, lo = 55, shift = 0) => {
  const { pc, iv } = shape(name);
  return iv.map((i) => fold(pc + i + shift, lo)).sort((a, b) => a - b);
};

// ---- the material -------------------------------------------------------------------------

export interface Section {
  name: string;
  /** One chord per bar, or two ("Cm G": half a bar each). */
  chords: string[];
  /** One bar of the tune per string (4 beats; kit/songFx tones()). */
  tune: string[];
}

const vamp = (name: string, chords: string[]): Section => ({ name, chords, tune: chords.map(() => 'r w') });

// Canis Meus Flatum Dedit (C minor)
/** "Sub mensa... in tenebris... sic venit pestilentia..." */
export const CANIS_ARIA: Section = {
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
export const CANIS_REFRAIN: Section = {
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
export const CANIS_FINALE: Section = {
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
export const IGNAVI_VERSE: Section = {
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
export const IGNAVI_REFRAIN: Section = {
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
export const IGNAVI_GALLOP = vamp('gallop', ['Dm', 'A', 'Dm', 'A']);

// Titus Torquet Lingua (G minor, patter)
/** "Titus tot titulos tetigit, tene, Titus, titulus ter! Tanta tecta tecti tectis, tacite tangunt tactum tactis!" */
export const TITUS_VERSE: Section = {
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
export const TITUS_REFRAIN: Section = {
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
export const TITUS_SAGAX: Section = {
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
export const FELIS_VERSE: Section = {
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
export const FELIS_REFRAIN: Section = {
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
export const FELIS_BRIDGE: Section = {
  name: 'bridge',
  chords: ['Gm', 'Dm', 'Gm', 'A'],
  tune: ['G4 q, A4 q, G4 q, A4 q', 'A4 q, E4 q, F4 h', 'Bb4 q, A4 q, G4 q, F4 q', 'E4 h, ~A4 q, r q'],
};

// Canit Piscis Aureus (G minor, then E flat major)
/** "O piscis aureus, diva balnei, undas tremulas vocem tua tollit! Sub aqua regina, clara canit, tympana tremunt, cymbala resonant!" */
export const PISCIS_ARIA: Section = {
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
export const PISCIS_REFRAIN: Section = {
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
export const PISCIS_FINALE: Section = {
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
export const SILENT_VERSE: Section = {
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
export const SILENT_REFRAIN: Section = {
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
export const SILENT_BRIDGE: Section = {
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
export const FANFARE: Section = {
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
