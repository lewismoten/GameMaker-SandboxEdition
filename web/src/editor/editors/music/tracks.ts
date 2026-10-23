// The track list: one track per MIDI channel, with its instrument, mute and solo, and
// buttons to add and remove tracks.
import { h, clear, confirmDialog } from '../../core/ui';
import { channelNotes, removeChannel, setStartProgram, startProgram } from '../../../formats/cmfEdit';
import { RHYTHM_CHANNELS, DRUM_NAMES } from '../../../formats/cmfSong';
import { TRACK_COLORS, type MusicDoc } from './doc';
import { instLabel, instShortLabel } from './instrument';
import { PRESETS } from './sbi';

export class TrackList {
  readonly el = h('div', { class: 'mus-tracks', role: 'list', 'aria-label': 'Tracks' });
  private adding = false;
  /** Opens the instrument track ch starts with in the Instruments tab. */
  onEditInstrument?: (ch: number) => void;

  constructor(
    private doc: MusicDoc,
    private onSelect: () => void,
  ) {
    doc.on((c) => {
      if (c === 'song' || c === 'track') this.render();
    });
    this.render();
  }

  private toggle(set: Set<number>, ch: number): void {
    if (set.has(ch)) set.delete(ch);
    else set.add(ch);
    this.doc.remix();
    this.render();
    this.doc.emit('view');
  }

  private addTrack(ch: number): void {
    const doc = this.doc;
    const song = doc.song;
    const drum = RHYTHM_CHANNELS.includes(ch);
    doc.edit(() => {
      doc.extra.add(ch);
      // its own instrument unless the channel's default one is free
      const p = startProgram(song, ch);
      const taken = doc.tracks().some((c) => c !== ch && startProgram(song, c) === p);
      if (!song.instruments[p] || taken) {
        if (song.instruments.length < 128) {
          song.instruments.push((drum ? PRESETS.pluck : PRESETS.piano).slice());
          setStartProgram(song, ch, song.instruments.length - 1);
        }
      }
    });
    this.adding = false;
    doc.selectTrack(ch);
    this.onSelect();
    this.render();
  }

  private async remove(ch: number): Promise<void> {
    const doc = this.doc;
    const n = channelNotes(doc.song, ch).length;
    if (n && !(await confirmDialog('Remove track', `Remove ${doc.trackName(ch)} and its ${n} notes?`, 'Remove'))) return;
    doc.edit(() => {
      removeChannel(doc.song, ch);
      doc.extra.delete(ch);
      doc.muted.delete(ch);
      doc.solo.delete(ch);
    });
    if (doc.track === ch) {
      const next = doc.tracks()[0];
      if (next !== undefined) doc.selectTrack(next);
      this.onSelect();
    }
  }

  render(): void {
    const doc = this.doc;
    const song = doc.song;
    const rows = doc.tracks().map((ch) => {
      const notes = channelNotes(song, ch).length;
      const silent = !doc.sounds(ch);
      const drum = doc.rhythm && RHYTHM_CHANNELS.includes(ch);
      const p = startProgram(song, ch);
      const bank = h(
        'select',
        { 'aria-label': `Instrument for ${doc.trackName(ch)}`, title: instLabel(doc, p) },
        // short names fit the narrow header; the full one is each option's tooltip
        ...song.instruments.map((_, i) => h('option', { value: String(i), selected: i === p, title: instLabel(doc, i) }, instShortLabel(doc, i))),
        song.instruments[p] ? null : h('option', { value: String(p), selected: true }, instLabel(doc, p)),
      );
      bank.addEventListener('change', () => {
        doc.edit(() => setStartProgram(song, ch, Number(bank.value)));
        void doc.audition(ch, 60);
      });
      return h(
        'div',
        { class: `mus-track${ch === doc.track ? ' active' : ''}${silent ? ' silent' : ''}`, role: 'listitem', style: `--track:${TRACK_COLORS[ch]}` },
        h(
          'button',
          {
            class: 'mus-track-name',
            'aria-current': ch === doc.track ? 'true' : undefined,
            title: silent ? 'Game-Maker does not play this channel now' : `Edit ${doc.trackName(ch)}`,
            onclick: () => {
              doc.selectTrack(ch);
              this.onSelect();
            },
          },
          h('span', { class: 'mus-swatch' }, drum ? '🥁' : String(ch + 1)),
          h(
            'span',
            { class: 'mus-track-text' },
            h('b', null, doc.trackName(ch)),
            h('small', null, `${silent ? 'silent · ' : ''}${notes} note${notes === 1 ? '' : 's'}`),
          ),
        ),
        h(
          'div',
          { class: 'mus-track-tools' },
          bank,
          this.onEditInstrument
            ? h(
                'button',
                {
                  class: 'mus-ms',
                  title: `Shape this instrument (Instruments tab)`,
                  'aria-label': `Edit the instrument of ${doc.trackName(ch)}`,
                  onclick: () => {
                    doc.selectTrack(ch);
                    this.onEditInstrument?.(ch);
                  },
                },
                '🎛',
              )
            : null,
          h(
            'button',
            {
              class: 'mus-ms',
              'aria-pressed': String(doc.muted.has(ch)),
              title: 'Mute (only while listening here)',
              onclick: () => this.toggle(doc.muted, ch),
            },
            'M',
          ),
          h(
            'button',
            {
              class: 'mus-ms solo',
              'aria-pressed': String(doc.solo.has(ch)),
              title: 'Solo: hear only this (and other solo) tracks',
              onclick: () => this.toggle(doc.solo, ch),
            },
            'S',
          ),
          h('button', { class: 'mus-ms', title: 'Remove this track', 'aria-label': `Remove ${doc.trackName(ch)}`, onclick: () => void this.remove(ch) }, '×'),
        ),
      );
    });
    const free = doc.freeChannels();
    const add = this.adding
      ? h(
          'div',
          { class: 'mus-add' },
          h('span', { class: 'hint' }, 'Add which track?'),
          ...free.map((ch) =>
            h('button', { onclick: () => this.addTrack(ch) }, doc.rhythm && RHYTHM_CHANNELS.includes(ch) ? `🥁 ${DRUM_NAMES[ch]}` : `♪ Melody track ${ch + 1}`),
          ),
          h('button', { onclick: () => ((this.adding = false), this.render()) }, 'Cancel'),
        )
      : h(
          'button',
          {
            class: 'mus-add-btn',
            disabled: !free.length,
            title: free.length
              ? 'Add a track'
              : doc.rhythm
                ? 'All 6 melody tracks and 5 drums are in use'
                : 'All 9 FM voices are in use (turn on the drum kit for drums)',
            onclick: () => ((this.adding = true), this.render()),
          },
          '＋ Add track',
        );
    clear(this.el, ...rows, h('div', { role: 'listitem', style: 'display:contents' }, add));
    if (this.adding) add.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
}
