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
import { detuned } from '../../../kit/songFx';
import { arranger, Arranger, BANDS, COLOR, COMP, LEAD, rep, TWIN_CH } from './band';
import { CANIS_ARIA, CANIS_FINALE, CANIS_REFRAIN, FANFARE, FELIS_BRIDGE, FELIS_REFRAIN, FELIS_VERSE, IGNAVI_GALLOP, IGNAVI_REFRAIN, IGNAVI_VERSE, PISCIS_ARIA, PISCIS_FINALE, PISCIS_REFRAIN, type Section, SILENT_BRIDGE, SILENT_REFRAIN, SILENT_VERSE, TITUS_REFRAIN, TITUS_SAGAX, TITUS_VERSE } from './material';
import { HARPSICHORD, STRINGS, TENOR, TWIN } from './patches';

export type SongName = 'canis' | 'ignavi' | 'titus' | 'felis' | 'piscis' | 'silentium';

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
