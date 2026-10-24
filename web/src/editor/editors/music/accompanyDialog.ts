// "Generate accompaniment…": pick the track whose tune stays and a style, and the generator
// (arrange/accompany.ts) writes bass, chords and drums on the other tracks. Hear it, ask for
// another take (a new seed), and use it: the song changes in one step that Ctrl+Z undoes.
import { h, clear, modal } from '../../core/ui';
import { audio } from '../../widgets/mediaShared';
import { buildPreview } from '../../../formats/cmfPreview';
import { channelNotes } from '../../../formats/cmfEdit';
import type { CmfSong } from '../../../formats/cmfSong';
import { accompany, type Accompaniment } from './arrange/accompany';
import { STYLES, type StyleId } from './arrange/styles';
import { pitchName } from './arrange/harmony';
import type { MusicDoc } from './doc';

/** The last style used, for the next time. */
let lastStyle: StyleId = 'march';

const NOTE_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
const noteName = (n: number) => `${NOTE_NAMES[n % 12]}${Math.floor(n / 12) - 1}`;

/**
 * A select of the tracks that have notes (the tune's track), starting on the track that sounds
 * highest (most often the tune: the track being edited is often the bass), or on `ch` when no
 * melodic track has notes. Each says its range.
 */
export function tuneTrackSelect(doc: MusicDoc, ch: number): HTMLSelectElement {
  const song = doc.song;
  const tracks = doc.tracks().filter((c) => channelNotes(song, c).length);
  const keys = (c: number) => channelNotes(song, c).map((n) => n.on.a);
  const median = (c: number) => keys(c).sort((a, b) => a - b)[Math.floor(keys(c).length / 2)];
  const drum = (c: number) => doc.rhythm && c >= 11;
  const melodic = tracks.filter((c) => !drum(c));
  const start = melodic.sort((a, b) => median(b) - median(a))[0] ?? (tracks.includes(ch) ? ch : tracks[0]);
  return h(
    'select',
    null,
    ...doc
      .tracks()
      .filter((c) => tracks.includes(c))
      .map((c) => {
        const k = keys(c);
        const range = `${noteName(Math.min(...k))}–${noteName(Math.max(...k))}`;
        return h('option', { value: String(c), selected: c === start }, `${c + 1}: ${doc.trackName(c)} (${k.length} notes, ${range})`);
      }),
  );
}

/** A select of the styles. */
export function styleSelect(value: StyleId): HTMLSelectElement {
  return h('select', null, ...STYLES.map((s) => h('option', { value: s.id, selected: s.id === value, title: s.about }, s.name)));
}

/** Plays a song from the start in the editor's OPL2 (the doc's own playback stopped). */
export async function hearSong(doc: MusicDoc, song: CmfSong): Promise<boolean> {
  doc.stop();
  await audio.resume();
  return audio.playSong(buildPreview(song, { from: 0 }).bytes);
}

/** What the take is: the key, the chords bar by bar, and who plays what. */
export function describeTake(doc: MusicDoc, r: Accompaniment): HTMLElement {
  const beat = Math.max(1, r.song.ticksPerBeat);
  const bar = r.style.beatsPerBar;
  const chords = r.chords.map((s) => {
    const at = s.start / bar;
    const pos = Number.isInteger(at) ? `${at + 1}` : `${Math.floor(at) + 1}½`;
    return `${pos}: ${s.chord.name}`;
  });
  return h(
    'div',
    { class: 'mus-acc-take' },
    h(
      'p',
      null,
      h('b', null, `Key: ${r.key.name}`),
      ` · ${r.style.name}, ${bar} beats a bar · ${doc.seconds(r.song.end.tick)} (${Math.round(r.song.end.tick / beat / bar)} bars)`,
    ),
    h('p', { class: 'mus-acc-chords', 'aria-label': 'Chords by bar' }, chords.join('  ')),
    h('ul', { class: 'mus-acc-parts' }, ...r.parts.map((p) => h('li', null, `${p.ch >= 11 ? 'Tracks 12–16' : `Track ${p.ch + 1}`}: ${p.what}`))),
    h('p', { class: 'hint' }, `Home note ${pitchName(r.key.tonic)}. Chords are the key's own, heard from the tune's longest and strongest notes.`),
  );
}

export async function accompanyDialog(doc: MusicDoc): Promise<void> {
  if (!doc.tracks().some((c) => channelNotes(doc.song, c).length)) {
    await modal<void>('Generate accompaniment', (close) => [
      h('p', null, 'Draw a tune on a track first (the ✏️ tool in the piano roll), then the generator writes a band around it.'),
      h('div', { class: 'buttons' }, h('button', { class: 'primary', onclick: () => close(undefined) }, 'OK')),
    ]);
    return;
  }
  let seed = 0;
  let take: Accompaniment | undefined;
  let playing = false;
  const track = tuneTrackSelect(doc, doc.track);
  const style = styleSelect(lastStyle);
  const about = h('p', { class: 'hint' });
  const result = h('div', { class: 'mus-acc-result', 'aria-live': 'polite' });
  const hear = h('button', { type: 'button' }, '▶ Hear it');
  const again = h('button', { type: 'button', title: 'Another take: different bass, chords, rhythm and sounds' }, '🎲 Another take');
  const use = h('button', { type: 'submit', class: 'primary' }, 'Use it');
  const stop = () => {
    if (playing) audio.stopSong();
    playing = false;
    hear.textContent = '▶ Hear it';
  };
  const make = () => {
    stop();
    const s = STYLES.find((x) => x.id === style.value)!;
    about.textContent = s.about;
    try {
      take = accompany(doc.song, { melody: Number(track.value), style: s.id, seed });
      clear(result, describeTake(doc, take));
      use.disabled = false;
    } catch (e) {
      take = undefined;
      clear(result, h('p', { class: 'error' }, (e as Error).message));
      use.disabled = true;
    }
  };
  track.addEventListener('change', make);
  style.addEventListener('change', () => {
    lastStyle = style.value as StyleId;
    make();
  });
  again.addEventListener('click', () => {
    seed++;
    make();
  });
  hear.addEventListener('click', async () => {
    if (playing) return stop();
    if (!take) return;
    playing = await hearSong(doc, take.song);
    if (playing) hear.textContent = '■ Stop';
  });
  make();
  const chosen = await modal<Accompaniment>('Generate accompaniment', (close) =>
    h(
      'form',
      {
        class: 'stack mus-acc',
        method: 'dialog',
        onsubmit: (e: Event) => {
          e.preventDefault();
          if (take) close(take);
        },
      },
      h(
        'p',
        { class: 'hint' },
        'Keeps one track’s tune and writes bass, chords and drums on the others, in the drum kit’s 6 melody tracks and 5 drums. The other tracks are replaced; Ctrl+Z brings them back.',
      ),
      h(
        'div',
        { class: 'mus-acc-pick' },
        h('label', { class: 'field' }, h('span', null, 'The tune'), track),
        h('label', { class: 'field' }, h('span', null, 'Style'), style),
      ),
      about,
      result,
      h('div', { class: 'buttons' }, hear, again, h('button', { type: 'button', onclick: () => close(undefined) }, 'Cancel'), use),
    ),
  );
  stop();
  if (!chosen) return;
  doc.begin();
  doc.song = chosen.song;
  doc.extra.clear();
  doc.muted.clear();
  doc.solo.clear();
  doc.selection.clear();
  doc.commit();
  doc.selectTrack(chosen.melody);
  doc.emit('track');
}
