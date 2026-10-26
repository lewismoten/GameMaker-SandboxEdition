// "Copy melody to a new song…": one track's tune as a new .CMF, faster or slower and
// optionally transposed (arrange/copyTune.ts), with a band generated around it if wanted,
// then opened in its own editor. The song being edited is not changed.
import { h, clear, modal, toast } from '../../core/ui';
import { audio } from '../../widgets/mediaShared';
import { openInEditor } from '../../core/uses';
import { channelNotes } from '../../../formats/cmfEdit';
import { writeSong, type CmfSong } from '../../../formats/cmfSong';
import { TICK_RATE } from '../../../audio/cmfPlayer';
import { copyTune } from './arrange/copyTune';
import { accompany, type Accompaniment } from './arrange/accompany';
import type { StyleId } from './arrange/styles';
import { describeTake, hearSong, styleSelect, tuneTrackSelect } from './accompanyDialog';
import type { MusicDoc } from './doc';

const SPEEDS: [number, string][] = [
  [0.5, 'Half as fast (50%)'],
  [0.67, 'Two thirds (67%)'],
  [0.75, 'Slower (75%)'],
  [0.9, 'A little slower (90%)'],
  [1, 'Same speed'],
  [1.1, 'A little faster (110%)'],
  [1.25, 'Faster (125%)'],
  [1.5, 'One and a half (150%)'],
  [2, 'Twice as fast (200%)'],
];

export async function copyTuneDialog(doc: MusicDoc): Promise<void> {
  const withNotes = doc.tracks().filter((c) => channelNotes(doc.song, c).length);
  if (!withNotes.length) {
    await modal<void>('Copy melody to a new song', (close) => [
      h('p', null, 'This song has no notes to copy yet.'),
      h('div', { class: 'buttons' }, h('button', { class: 'primary', onclick: () => close(undefined) }, 'OK')),
    ]);
    return;
  }
  const project = doc.project;
  const stem = doc.file.replace(/\.[^.]*$/, '');
  const track = tuneTrackSelect(doc, doc.track);
  const speed = h('select', null, ...SPEEDS.map(([v, t]) => h('option', { value: String(v), selected: v === 0.75 }, t)));
  const percent = h('input', { type: 'number', min: 10, max: 1000, step: 1, value: '75', style: 'width:5.5em' });
  const transpose = h('input', { type: 'number', min: -24, max: 24, step: 1, value: '0', style: 'width:5em' });
  const band = h('input', { type: 'checkbox', checked: true });
  const style = styleSelect('ballad');
  const name = h('input', {
    type: 'text',
    required: true,
    maxLength: 12,
    pattern: '[A-Za-z0-9_]{1,8}(\\.[Cc][Mm][Ff])?',
    value: project.freeName(`${stem.slice(0, 6)}2`, 'cmf'),
  });
  const summary = h('div', { class: 'mus-acc-result', 'aria-live': 'polite' });
  const hear = h('button', { type: 'button' }, '▶ Hear it');
  const again = h('button', { type: 'button', title: 'Another take of the band' }, '🎲 Another take');
  let seed = 0;
  let made: { song: CmfSong; take?: Accompaniment } | undefined;
  let playing = false;
  const stop = () => {
    if (playing) audio.stopSong();
    playing = false;
    hear.textContent = '▶ Hear it';
  };
  const factor = () => Math.max(0.1, Math.min(10, (Number(percent.value) || 100) / 100));
  const make = () => {
    stop();
    try {
      const tune = copyTune(doc.song, { melody: Number(track.value), speed: factor(), transpose: Number(transpose.value) || 0 });
      const take = band.checked ? accompany(tune, { melody: 0, style: style.value as StyleId, seed }) : undefined;
      made = { song: take?.song ?? tune, take };
      const bpm = (TICK_RATE * 60) / Math.max(1, made.song.ticksPerBeat);
      clear(
        summary,
        h('p', null, `${bpm.toFixed(0)} beats a minute · ${doc.seconds(made.song.end.tick)} long (was ${doc.seconds(doc.song.end.tick)})`),
        take ? describeTake(doc, take) : h('p', { class: 'hint' }, 'Just the tune, on track 1.'),
      );
    } catch (e) {
      made = undefined;
      clear(summary, h('p', { class: 'error' }, (e as Error).message));
    }
    style.disabled = again.disabled = !band.checked;
  };
  speed.addEventListener('change', () => {
    percent.value = String(Math.round(Number(speed.value) * 100));
    make();
  });
  percent.addEventListener('change', () => {
    const v = factor();
    const near = SPEEDS.find(([s]) => Math.abs(s - v) < 0.005);
    speed.value = near ? String(near[0]) : '';
    make();
  });
  for (const el of [track, transpose, band, style]) el.addEventListener('change', make);
  again.addEventListener('click', () => {
    seed++;
    make();
  });
  hear.addEventListener('click', async () => {
    if (playing) return stop();
    if (!made) return;
    playing = await hearSong(doc, made.song);
    if (playing) hear.textContent = '■ Stop';
  });
  make();
  const file = await modal<string>('Copy melody to a new song', (close) =>
    h(
      'form',
      {
        class: 'stack mus-acc',
        method: 'dialog',
        onsubmit: (e: Event) => {
          e.preventDefault();
          if (!name.reportValidity() || !made) return;
          close(
            name.value
              .trim()
              .toLowerCase()
              .replace(/\.cmf$/, '') + '.cmf',
          );
        },
      },
      h('p', { class: 'hint' }, 'Makes a new song from one track’s tune: slow it down for a sad scene, speed it up for a chase. This song stays as it is.'),
      h(
        'div',
        { class: 'mus-acc-pick' },
        h('label', { class: 'field' }, h('span', null, 'The tune'), track),
        h('label', { class: 'field' }, h('span', null, 'Speed'), speed),
        h('label', { class: 'field' }, h('span', null, 'Speed in %'), percent),
        h('label', { class: 'field', title: 'Semitones: 12 is an octave up, -12 an octave down' }, h('span', null, 'Transpose (semitones)'), transpose),
      ),
      h(
        'div',
        { class: 'mus-acc-pick' },
        h('label', { class: 'check' }, band, h('span', null, 'Generate accompaniment')),
        h('label', { class: 'field' }, h('span', null, 'Style'), style),
      ),
      summary,
      h('label', { class: 'field' }, h('span', null, 'New file name (8 letters or digits)'), name),
      h(
        'div',
        { class: 'buttons' },
        hear,
        again,
        h('button', { type: 'button', onclick: () => close(undefined) }, 'Cancel'),
        h('button', { type: 'submit', class: 'primary' }, 'Make the song'),
      ),
    ),
  );
  stop();
  if (!file || !made) return;
  const target = project.files.has(file) ? project.freeName(file.replace(/\.cmf$/, ''), 'cmf') : file;
  doc.save();
  project.files.set(target, writeSong(made.song));
  toast(`Made ${target.toUpperCase()}.`);
  openInEditor(project, target);
}
