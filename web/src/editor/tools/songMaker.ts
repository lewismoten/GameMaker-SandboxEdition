// Making Sound Blaster music (.CMF) without a MIDI keyboard: pick a mood, a key and a
// speed and press Compose for a new tune (melody, bass and chords on FM instruments);
// listen, compose again, or edit the notes by hand, then save.
import { h, modal, toast } from '../core/ui';
import { registerMaker } from './makers';
import { INSTRUMENTS, song, type Voice } from '../../audio/compose';
import { AudioEngine } from '../../audio/engine';
import { validDosName, type Project } from '../core/project';
import { normalize } from '../../project/files';

type Mood = 'Adventure' | 'Happy' | 'Spooky' | 'Chase' | 'Space' | 'Victory' | 'Sad' | 'March';

interface Style {
  minor: boolean;
  /** Chord roots as scale degrees (0-based), one per bar. */
  progression: number[][];
  bpm: number;
  /** Melody rhythm patterns per bar (lengths: q, e, h, s, q.). */
  rhythms: string[][];
  lead: keyof typeof INSTRUMENTS;
  chords: keyof typeof INSTRUMENTS;
  bass: keyof typeof INSTRUMENTS;
}

const STYLES: Record<Mood, Style> = {
  Adventure: { minor: false, progression: [[0, 4, 5, 3], [0, 3, 4, 4], [5, 3, 0, 4]], bpm: 120, rhythms: [['q', 'e', 'e', 'q', 'q'], ['q.', 'e', 'h'], ['e', 'e', 'e', 'e', 'h']], lead: 'brass', chords: 'strings', bass: 'bass' },
  Happy: { minor: false, progression: [[0, 4, 5, 3], [0, 5, 3, 4], [3, 4, 0, 0]], bpm: 140, rhythms: [['e', 'e', 'q', 'e', 'e', 'q'], ['q', 'q', 'h'], ['e', 'e', 'e', 'e', 'q', 'q']], lead: 'bell', chords: 'pluck', bass: 'bass' },
  Spooky: { minor: true, progression: [[0, 3, 4, 0], [0, 5, 3, 4], [0, 1, 0, 4]], bpm: 84, rhythms: [['h', 'q', 'q'], ['q.', 'e', 'h'], ['w']], lead: 'organ', chords: 'pad', bass: 'bass' },
  Chase: { minor: true, progression: [[0, 0, 5, 6], [0, 6, 5, 4], [0, 3, 0, 4]], bpm: 168, rhythms: [['e', 'e', 'e', 'e', 'e', 'e', 'e', 'e'], ['s', 's', 'e', 'e', 'e', 'q', 'q'], ['e', 'e', 'q', 'e', 'e', 'q']], lead: 'lead', chords: 'pluck', bass: 'bass' },
  Space: { minor: true, progression: [[0, 5, 2, 6], [0, 3, 5, 4], [5, 6, 0, 0]], bpm: 96, rhythms: [['h', 'h'], ['q', 'q', 'h'], ['w']], lead: 'pad', chords: 'strings', bass: 'bass' },
  Victory: { minor: false, progression: [[0, 3, 4, 0], [0, 4, 0, 0], [3, 4, 0, 0]], bpm: 132, rhythms: [['e', 'e', 'e', 'e', 'h'], ['q', 'q', 'q', 'q'], ['q.', 'e', 'h']], lead: 'brass', chords: 'strings', bass: 'bass' },
  Sad: { minor: true, progression: [[0, 5, 3, 4], [0, 3, 6, 4], [5, 3, 0, 0]], bpm: 72, rhythms: [['h', 'h'], ['q.', 'e', 'h'], ['q', 'q', 'h']], lead: 'piano', chords: 'strings', bass: 'bass' },
  March: { minor: false, progression: [[0, 4, 0, 4], [3, 0, 4, 0], [0, 3, 4, 0]], bpm: 112, rhythms: [['q', 'e', 'e', 'q', 'q'], ['q.', 'e', 'q', 'q'], ['q', 'q', 'h']], lead: 'brass', chords: 'organ', bass: 'bass' },
};

const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const MAJOR = [0, 2, 4, 5, 7, 9, 11];
const MINOR = [0, 2, 3, 5, 7, 8, 10];

const noteName = (midi: number) => `${NAMES[((midi % 12) + 12) % 12]}${Math.floor(midi / 12) - 1}`;

/** Writes new notes for each voice: melody, chords (as an arpeggio) and bass. */
export function compose(mood: Mood, key: number, bars: number, seed: number): { lead: string; chords: string; bass: string } {
  let a = seed >>> 0 || 1;
  const rnd = () => ((a = (a * 1664525 + 1013904223) >>> 0) / 4294967296);
  const pick = <T>(xs: T[]): T => xs[Math.floor(rnd() * xs.length)];
  const st = STYLES[mood];
  const scale = st.minor ? MINOR : MAJOR;
  const prog = pick(st.progression);
  const degreeToMidi = (deg: number, octave: number) => 12 * (octave + 1) + key + scale[((deg % 7) + 7) % 7] + 12 * Math.floor(deg / 7);
  const lead: string[] = [];
  const chords: string[] = [];
  const bass: string[] = [];
  let deg = 7 + pick([0, 2, 4]);
  // a motif the melody returns to, for a tune you can hum
  const motif = Array.from({ length: 4 }, () => pick([-2, -1, 1, 2, 0, 3]));
  for (let bar = 0; bar < bars; bar++) {
    const root = prog[bar % prog.length];
    const rhythm = pick(st.rhythms);
    rhythm.forEach((len, i) => {
      const onBeat = i === 0;
      if (onBeat) deg = 7 + root + pick([0, 2, 4]);
      else deg += bar % 4 === 0 && i < motif.length ? motif[i] : pick([-2, -1, -1, 1, 1, 2]);
      deg = Math.max(5, Math.min(14, deg));
      const rest = !onBeat && rnd() < 0.08;
      lead.push(`${rest ? 'r' : noteName(degreeToMidi(deg, 4))} ${len}`);
    });
    // chords as eighth-note arpeggios over the bar
    const tones = [0, 2, 4, 2].map((d) => noteName(degreeToMidi(root + d, 3)));
    for (let i = 0; i < 8; i++) chords.push(`${tones[i % 4]} e`);
    // bass: root and fifth
    const r = degreeToMidi(root, 2);
    bass.push(`${noteName(r)} q`, `${noteName(r + 7)} q`, `${noteName(r)} q`, `${noteName(r + (rnd() < 0.5 ? 12 : 7))} q`);
  }
  // end on the home note
  lead[lead.length - 1] = `${noteName(degreeToMidi(7, 4))} ${lead[lead.length - 1].split(' ')[1]}`;
  return { lead: lead.join(', '), chords: chords.join(', '), bass: bass.join(', ') };
}

async function songDialog(project: Project): Promise<string | undefined> {
  const audio = new AudioEngine();
  return modal<string>('Make music', (close) => {
    let mood: Mood = 'Adventure';
    let key = 0;
    let bars = 16;
    let bpm = STYLES[mood].bpm;
    let seed = Math.floor(Math.random() * 1e9);
    const lead = h('textarea', { rows: 3, spellcheck: false });
    const chords = h('textarea', { rows: 2, spellcheck: false });
    const bass = h('textarea', { rows: 2, spellcheck: false });
    const status = h('p', { class: 'hint' });
    const nameInput = h('input', { type: 'text', value: project.freeName('song', 'cmf'), required: true });

    const build = (): Uint8Array | undefined => {
      const st = STYLES[mood];
      const voices: Voice[] = [
        { channel: 0, instrument: INSTRUMENTS[st.lead], notes: lead.value, velocity: 110 },
        { channel: 1, instrument: INSTRUMENTS[st.chords], notes: chords.value, velocity: 70 },
        { channel: 2, instrument: INSTRUMENTS[st.bass], notes: bass.value, velocity: 100 },
      ];
      try {
        const bytes = song(bpm, voices);
        status.textContent = `${mood} in ${NAMES[key]} ${STYLES[mood].minor ? 'minor' : 'major'} · ${bars} bars at ${bpm} beats a minute · ${bytes.length.toLocaleString()} bytes`;
        return bytes;
      } catch (e) {
        status.textContent = `Check the notes: ${(e as Error).message}`;
        return undefined;
      }
    };
    const newTune = () => {
      seed = (seed * 31 + 7) >>> 0;
      const t = compose(mood, key, bars, seed);
      lead.value = t.lead;
      chords.value = t.chords;
      bass.value = t.bass;
      void listen();
    };
    const listen = async () => {
      const bytes = build();
      if (!bytes) return;
      await audio.resume();
      await audio.playSong(bytes);
    };
    const seg = <T extends string | number>(label: string, options: [T, string][], get: () => T, set: (v: T) => void) =>
      h(
        'div',
        { class: 'seg' },
        h('span', null, label),
        ...options.map(([v, text]) => {
          const b = h('button', { type: 'button', 'aria-pressed': String(get() === v) }, text);
          b.addEventListener('click', () => {
            set(v);
            [...b.parentElement!.querySelectorAll('button')].forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
            newTune();
          });
          return b;
        }),
      );
    const save = () => {
      const bytes = build();
      if (!bytes) return;
      let name = normalize(nameInput.value.trim());
      if (!name.includes('.')) name += '.cmf';
      if (!validDosName(name)) {
        toast('Use a DOS name: up to 8 letters, then .CMF.', 'error');
        return;
      }
      audio.stopSong();
      project.files.set(name, bytes);
      close(name);
    };
    queueMicrotask(() => {
      const t = compose(mood, key, bars, seed);
      lead.value = t.lead;
      chords.value = t.chords;
      bass.value = t.bass;
      build();
    });
    return h(
      'div',
      { class: 'stack song-maker' },
      seg<Mood>('Mood', (Object.keys(STYLES) as Mood[]).map((m) => [m, m]), () => mood, (v) => ((mood = v), (bpm = STYLES[v].bpm))),
      seg<number>('Key', NAMES.map((n, i) => [i, n] as [number, string]), () => key, (v) => (key = v)),
      seg<number>('Length', [[8, '8 bars'], [16, '16 bars'], [32, '32 bars']], () => bars, (v) => (bars = v)),
      h('label', { class: 'field' }, h('span', null, 'Speed (beats a minute)'), h('input', { type: 'range', min: 50, max: 200, value: bpm, onchange: (e: Event) => ((bpm = Number((e.target as HTMLInputElement).value)), void listen()) })),
      h('div', { class: 'toolbar' }, h('button', { type: 'button', class: 'primary', onclick: newTune }, '🎲 Compose a new tune'), h('button', { type: 'button', onclick: () => void listen() }, '▶ Listen'), h('button', { type: 'button', onclick: () => audio.stopSong() }, '■ Stop')),
      status,
      h(
        'details',
        null,
        h('summary', null, 'Edit the notes'),
        h('p', { class: 'hint' }, 'Notes like C4 q (quarter), e (eighth), h (half), w (whole), s (sixteenth), q. (dotted); r is a rest; [C4 E4 G4] h is a chord.'),
        h('label', { class: 'field' }, h('span', null, 'Melody'), lead),
        h('label', { class: 'field' }, h('span', null, 'Chords'), chords),
        h('label', { class: 'field' }, h('span', null, 'Bass'), bass),
      ),
      h('label', { class: 'field' }, h('span', null, 'File name'), nameInput),
      h('div', { class: 'buttons' }, h('button', { type: 'button', onclick: () => (audio.stopSong(), close(undefined)) }, 'Cancel'), h('button', { type: 'button', class: 'primary', onclick: save }, 'Save .CMF')),
    );
  });
}

registerMaker('cmf', { label: '🎼 Compose a song…', run: songDialog });
