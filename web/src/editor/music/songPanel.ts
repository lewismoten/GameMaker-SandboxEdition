// Settings for the whole song: the drum kit (rhythm mode), beat length and speed, where it
// repeats, Game-Maker's clock, and clearing out events the game ignores.
import { h, clear, toast } from '../ui';
import { CMF_GAMEMAKER_CLOCK } from '../../formats/cmf';
import { ignoredCount, lastEventTick, modeChanges, scaleTime, setEnd, setStartMode, stripIgnored, writeSong } from '../../formats/cmfEdit';
import { TICK_RATE } from '../../audio/cmfPlayer';
import type { MusicDoc } from './doc';

export class SongPanel {
  readonly el = h('div', { class: 'mus-song' });

  constructor(private doc: MusicDoc) {
    doc.on((c) => c === 'song' && this.render());
    this.render();
  }

  render(): void {
    const doc = this.doc;
    const song = doc.song;
    const bpm = (TICK_RATE * 60) / doc.beat;
    const drums = h('input', { type: 'checkbox', checked: doc.rhythm });
    drums.addEventListener('change', () => doc.edit(() => setStartMode(song, drums.checked)));
    const midSong = modeChanges(song).length > 1;

    const beat = h('input', { type: 'number', min: 4, max: 2000, value: String(song.ticksPerBeat), style: 'width:6em' });
    beat.addEventListener('change', () => {
      const v = Math.max(4, Math.min(2000, Math.round(Number(beat.value) || 0)));
      doc.edit(() => (song.ticksPerBeat = v));
    });

    const pct = h('input', { type: 'number', min: 25, max: 400, value: '100', step: 5, style: 'width:5em', 'aria-label': 'New speed in percent' });
    const speed = (factor: number) => {
      doc.edit(() => scaleTime(song, factor));
      toast(`Now ${Math.round(((TICK_RATE * 60) / doc.beat) * 10) / 10} beats a minute.`);
    };

    const ignored = ignoredCount(song);
    const bytes = writeSong(song).length;
    const wrongClock = song.clockTicks !== CMF_GAMEMAKER_CLOCK;
    clear(
      this.el,
      wrongClock
        ? h(
            'div',
            { class: 'callout mus-warn' },
            h(
              'p',
              null,
              `This song was made for ${song.clockTicks} ticks a second. Game-Maker only plays songs converted to ${CMF_GAMEMAKER_CLOCK}, so games will stay silent.`,
            ),
            h(
              'button',
              {
                class: 'primary',
                onclick: () =>
                  doc.edit(() => {
                    scaleTime(song, CMF_GAMEMAKER_CLOCK / Math.max(1, song.clockTicks));
                    song.clockTicks = CMF_GAMEMAKER_CLOCK;
                  }),
              },
              'Convert for Game-Maker',
            ),
          )
        : null,
      h(
        'div',
        { class: 'mus-song-grid' },
        h(
          'label',
          {
            class: 'check',
            title: 'Rhythm mode: tracks 1-6 play melody, and channels 12-16 play the bass drum, snare, tom-tom, cymbal and hi-hat. Tracks 7-9 go silent.',
          },
          drums,
          h('span', null, 'Drum kit (6 melody tracks + 5 drums)'),
        ),
        midSong ? h('p', { class: 'hint' }, 'This song also switches the drum kit on or off part way through (🥁/♫ marks on the ruler).') : null,
        h(
          'label',
          { class: 'field', title: 'Only sets the grid: Game-Maker counts time in ticks of 1/146 s' },
          h('span', null, `Beat length (ticks) · ${bpm.toFixed(1)} beats a minute`),
          beat,
        ),
        h(
          'div',
          { class: 'field' },
          h('span', null, 'Speed (stretches every note)'),
          h(
            'div',
            { class: 'toolbar' },
            h('button', { onclick: () => speed(1.1), title: 'Make it 10% slower' }, '🐢 Slower'),
            h('button', { onclick: () => speed(1 / 1.1), title: 'Make it 10% faster' }, '🐇 Faster'),
            pct,
            h(
              'button',
              { onclick: () => speed(100 / Math.max(25, Math.min(400, Number(pct.value) || 100))), title: 'Set the speed in percent of now' },
              'Set %',
            ),
          ),
        ),
        h(
          'div',
          { class: 'field' },
          h('span', null, `Repeats after ${doc.seconds(song.end.tick)} (bar ${doc.barBeat(song.end.tick)})`),
          h(
            'div',
            { class: 'toolbar' },
            h('button', { onclick: () => doc.edit(() => setEnd(song, lastEventTick(song))), title: 'Repeat right after the last note' }, 'End at last note'),
            h(
              'button',
              {
                onclick: () => doc.edit(() => setEnd(song, Math.ceil(lastEventTick(song) / (doc.beat * 4)) * doc.beat * 4)),
                title: 'Repeat at the end of the last bar',
              },
              'End at bar line',
            ),
          ),
        ),
        h(
          'div',
          { class: 'field' },
          h('span', null, `${ignored} event${ignored === 1 ? '' : 's'} Game-Maker ignores (pitch bend, volume, stray note-offs…)`),
          h(
            'div',
            { class: 'toolbar' },
            h(
              'button',
              {
                disabled: !ignored,
                onclick: () => {
                  let n = 0;
                  doc.edit(() => (n = stripIgnored(song)));
                  toast(`Removed ${n} events; the song plays exactly the same.`);
                },
              },
              'Remove them',
            ),
          ),
        ),
        h(
          'p',
          { class: 'hint' },
          `${song.notes.length.toLocaleString()} notes · ${song.instruments.length} instruments · ${bytes.toLocaleString()} bytes · ${song.clockTicks} ticks a second`,
        ),
      ),
    );
  }
}
