// Settings for the whole song: the drum kit (rhythm mode), beat length and speed, where it
// repeats, Game-Maker's clock, loudness (scaling note velocities), and clearing out events
// the game ignores.
import { h, clear, toast } from '../../core/ui';
import { CMF_GAMEMAKER_CLOCK } from '../../../formats/cmf';
import {
  channelNotes,
  clampVelocity,
  ignoredCount,
  lastEventTick,
  modeChanges,
  scaleTime,
  scaleVelocities,
  setEnd,
  setStartMode,
  setVelocity,
  stripIgnored,
  writeSong,
  type Note,
} from '../../../formats/cmfEdit';
import { TICK_RATE } from '../../../audio/cmfPlayer';
import type { MusicDoc } from './doc';

export class SongPanel {
  readonly el = h('div', { class: 'mus-song' });
  /** Which notes the loudness tools change. */
  private scope: 'track' | 'all' = 'track';

  constructor(private doc: MusicDoc) {
    doc.on((c) => (c === 'song' || c === 'track') && this.render());
    this.render();
  }

  private scoped(): Note[] {
    return this.scope === 'all' ? this.doc.song.notes : channelNotes(this.doc.song, this.doc.track);
  }

  private loudness(): HTMLElement {
    const doc = this.doc;
    const notes = this.scoped();
    const vels = notes.map((n) => n.on.b);
    const range = vels.length ? `now ${Math.min(...vels)}–${Math.max(...vels)}` : 'no notes';
    const scope = h(
      'select',
      { 'aria-label': 'Which notes' },
      h('option', { value: 'track', selected: this.scope === 'track' }, `${doc.trackName(doc.track)} (this track)`),
      h('option', { value: 'all', selected: this.scope === 'all' }, 'All tracks'),
    );
    scope.addEventListener('change', () => {
      this.scope = scope.value as 'track' | 'all';
      this.render();
    });
    const scale = (factor: number, add = 0) => {
      const list = this.scoped();
      if (!list.length) return toast('No notes to change.');
      let n = 0;
      doc.edit(() => (n = scaleVelocities(list, factor, add)));
      if (!n) doc.undoDiscard();
      toast(n ? `Changed ${n} note${n === 1 ? '' : 's'}.` : 'Already as far as they go (1-127).');
    };
    const pct = h('input', { type: 'number', min: 10, max: 400, value: '100', step: 5, style: 'width:5em', 'aria-label': 'Velocity percent' });
    const set = h('input', { type: 'number', min: 1, max: 127, value: String(doc.velocity), style: 'width:4.5em', 'aria-label': 'Velocity for every note' });
    return h(
      'div',
      { class: 'field' },
      h('span', null, `Loudness (velocity, ${range})`),
      h(
        'div',
        { class: 'mus-loud' },
        scope,
        h('button', { onclick: () => scale(0.85), title: 'Every note 15% softer' }, '🔉 Softer'),
        h('button', { onclick: () => scale(1 / 0.85), title: 'Every note 15% louder' }, '🔊 Louder'),
        pct,
        h(
          'button',
          { onclick: () => scale(Math.max(10, Math.min(400, Number(pct.value) || 100)) / 100), title: 'Multiply every velocity by this percent' },
          'Scale %',
        ),
        set,
        h(
          'button',
          {
            title: 'Give every note this velocity',
            onclick: () => {
              const list = this.scoped();
              if (!list.length) return toast('No notes to change.');
              const v = clampVelocity(Number(set.value));
              doc.edit(() => setVelocity(list, v));
              toast(`Every note now plays at velocity ${v}.`);
            },
          },
          'Set all',
        ),
      ),
      h(
        'p',
        { class: 'hint' },
        'Velocity is loudness the way Sound Blaster’s driver (SBFMDRV) played it: it scales the instrument’s output level, so 127 is as loud as the instrument and the quietest note (1) is about half as loud in level steps. Velocity 0 would stop the note, so 1 is the least.',
      ),
    );
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
        this.loudness(),
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
