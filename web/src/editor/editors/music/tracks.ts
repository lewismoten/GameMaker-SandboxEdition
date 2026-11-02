// The track list: one track per MIDI channel, with its instrument, mute and solo, and
// buttons to add, copy, paste and remove tracks (copy and paste in trackPaste.ts).
import { h, clear } from '../../core/ui';
import { channelNotes, removeChannel, setStartProgram, startProgram } from '@lewismoten/gamemaker-sandbox-engine/formats/cmfEdit';
import { RHYTHM_CHANNELS, DRUM_NAMES } from '@lewismoten/gamemaker-sandbox-engine/formats/cmfSong';
import type { MusicDoc } from './doc';
import { instLabel, instShortLabel, lookIcon } from './instrument';
import { instrumentLook } from './instrumentLook';
import { presetName } from './sbi';
import { presetById } from '../../../audio/oplPresets';
import { DRUM_KIT, slotOfChannel } from '../../../audio/oplDrumPresets';
import { pickPreset } from './presetPicker';
import { applyToTrack } from './drumMode';
import { clipLabel, copyToClipboard, pasteIntoDoc } from './trackPaste';
import { currentTrackClip } from './trackClipboard';
import { moveTrackTo, sortByGroup } from './trackOrder';

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
      if (c === 'song' || c === 'track') this.songChanged();
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
    doc.edit(() => {
      doc.extra.add(ch);
      // its own instrument unless the channel's default one is free
      const p = startProgram(song, ch);
      const taken = doc.tracks().some((c) => c !== ch && startProgram(song, c) === p);
      if (!song.instruments[p] || taken) {
        if (song.instruments.length < 128) {
          // a drum starts with its kit sound, a melody track with the piano
          const slot = doc.rhythm ? slotOfChannel(ch) : undefined;
          const start = (slot && DRUM_KIT.find((d) => d.drum === slot)) || presetById('piano')!;
          song.instruments.push(start.patch.slice());
          setStartProgram(song, ch, song.instruments.length - 1);
        }
      }
    });
    this.adding = false;
    doc.selectTrack(ch);
    this.onSelect();
    this.render();
  }

  private remove(ch: number): void {
    const doc = this.doc;
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

  /** Lists track ch at index `to` (one undo step; the song's channels do not change). */
  private moveTo(ch: number, to: number): void {
    this.doc.setOrder(moveTrackTo(this.doc.tracks(), ch, to));
  }

  private moveButton(ch: number, dir: -1 | 1, i: number, count: number): HTMLElement {
    const name = this.doc.trackName(ch);
    const word = dir < 0 ? 'up' : 'down';
    return h(
      'button',
      {
        class: 'mus-ms',
        title: `Move this track ${word} the list (only how it is listed here; the song file is not changed)`,
        'aria-label': `Move ${name} ${word}`,
        'data-move': `${ch}:${word}`,
        disabled: dir < 0 ? i === 0 : i === count - 1,
        onclick: () => this.moveTo(ch, i + dir),
      },
      dir < 0 ? '▲' : '▼',
    );
  }

  /** Drag a track onto another to put it in that place. */
  private dragging: number | null = null;
  private wireDrag(row: HTMLElement, ch: number, i: number): void {
    row.draggable = true;
    row.addEventListener('dragstart', (e) => {
      this.dragging = ch;
      e.dataTransfer?.setData('text/plain', this.doc.trackName(ch));
      if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
    });
    row.addEventListener('dragover', (e) => {
      if (this.dragging === null) return;
      e.preventDefault();
      row.classList.add('drop');
    });
    row.addEventListener('dragleave', () => row.classList.remove('drop'));
    row.addEventListener('dragend', () => (this.dragging = null));
    row.addEventListener('drop', (e) => {
      e.preventDefault();
      row.classList.remove('drop');
      const from = this.dragging;
      this.dragging = null;
      if (from !== null && from !== ch) this.moveTo(from, i);
    });
  }

  /** What the list shows apart from the note counts; when an edit leaves it alone, only the counts are redrawn. */
  private shapeKey(): string {
    const doc = this.doc;
    const song = doc.song;
    const order = doc.tracks();
    const clip = currentTrackClip();
    return JSON.stringify([
      order,
      doc.track,
      doc.rhythm,
      [...doc.muted],
      [...doc.solo],
      this.adding,
      clip ? clipLabel(clip) : null,
      order.map((ch) => [startProgram(song, ch), doc.sounds(ch)]),
      song.instruments.map((inst) => (inst ? Array.from(inst) : null)),
    ]);
  }

  private shape = '';
  /** Each track's text under its name, without the note count, and the element that shows it. */
  private counts = new Map<number, { el: HTMLElement; head: string }>();

  private songChanged(): void {
    // names, colors, pictures and labels all come from the start programs and instrument bytes in the key
    if (this.shapeKey() !== this.shape) {
      this.render();
      return;
    }
    const tally = new Map<number, number>();
    for (const n of this.doc.song.notes) tally.set(n.on.ch, (tally.get(n.on.ch) ?? 0) + 1);
    for (const [ch, { el, head }] of this.counts) {
      const notes = tally.get(ch) ?? 0;
      const text = `${head}${notes} note${notes === 1 ? '' : 's'}`;
      if (el.textContent !== text) el.textContent = text;
    }
  }

  render(): void {
    const doc = this.doc;
    const song = doc.song;
    const order = doc.tracks();
    this.shape = this.shapeKey();
    this.counts.clear();
    const rows = order.map((ch, i) => {
      const notes = channelNotes(song, ch).length;
      const silent = !doc.sounds(ch);
      const drum = doc.rhythm && RHYTHM_CHANNELS.includes(ch);
      const p = startProgram(song, ch);
      // a drum's name is the drum: its sound (the preset it matches) goes under it
      const sound = drum && song.instruments[p] ? presetName(song.instruments[p]) : undefined;
      const group = instrumentLook(song.instruments[p]).groupName;
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
      const row = h(
        'div',
        { class: `mus-track${ch === doc.track ? ' active' : ''}${silent ? ' silent' : ''}`, role: 'listitem', style: `--track:${doc.trackColor(ch)}` },
        h(
          'div',
          { class: 'mus-track-head' },
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
            lookIcon(song.instruments[p], 'mus-swatch'),
            h(
              'span',
              { class: 'mus-track-text' },
              h('b', null, doc.trackName(ch)),
              (() => {
                const head = `${silent ? 'silent · ' : ''}${sound ? `${sound} · ` : ''}${group ? `${group} · ` : ''}`;
                const el = h('small', null, `${head}${notes} note${notes === 1 ? '' : 's'}`);
                this.counts.set(ch, { el, head });
                return el;
              })(),
            ),
          ),
          h(
            'button',
            {
              class: 'mus-ms',
              title: 'Copy this track, to paste into any song',
              'aria-label': `Copy the ${doc.trackName(ch)} track`,
              onclick: () => {
                copyToClipboard(doc, ch);
                this.render();
              },
            },
            '⧉',
          ),
          this.moveButton(ch, -1, i, order.length),
          this.moveButton(ch, 1, i, order.length),
        ),
        h(
          'div',
          { class: 'mus-track-tools' },
          bank,
          h(
            'button',
            {
              class: 'mus-ms',
              title: 'Choose a preset sound',
              'aria-label': `Choose a preset sound for ${doc.trackName(ch)}`,
              'data-presets': String(ch),
              onclick: async () => {
                const preset = await pickPreset(doc, { ch, label: doc.trackName(ch), current: song.instruments[p] });
                if (preset) applyToTrack(doc, ch, preset);
                // back to this track's button (the list was drawn again), where Ctrl+Z undoes it
                this.el.querySelector<HTMLElement>(`[data-presets="${ch}"]`)?.focus();
              },
            },
            '🎹',
          ),
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
      this.wireDrag(row, ch, i);
      return row;
    });
    const free = doc.freeChannels();
    const clip = currentTrackClip();
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
          'div',
          { class: 'mus-add' },
          h(
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
          ),
          h(
            'button',
            {
              class: 'mus-add-btn',
              disabled: order.length < 2,
              title: 'List the tracks by instrument group (strings, keys, drums…); only the list changes, not the song file',
              onclick: () => doc.setOrder(sortByGroup(doc.tracks(), (ch) => instrumentLook(song.instruments[startProgram(song, ch)]).preset?.group)),
            },
            '⇅ Sort by group',
          ),
          clip
            ? h(
                'button',
                {
                  class: 'mus-add-btn',
                  title: `Add the copied track to this song as a new track`,
                  onclick: () => {
                    const ch = pasteIntoDoc(doc, clip);
                    if (ch !== undefined) this.onSelect();
                  },
                },
                `📋 Paste track: ${clipLabel(clip)}`,
              )
            : null,
          h(
            'button',
            {
              class: 'mus-add-btn',
              title: 'Pick a track from another of this game’s songs and add it here',
              onclick: () => void import('./trackPickDialog').then((m) => m.trackPickDialog(doc)).then((ch) => ch !== undefined && this.onSelect()),
            },
            '＋ Add a track from another song…',
          ),
        );
    // keep the keyboard on a track's preset button when the list is drawn again (after undo)
    const active = this.el.contains(document.activeElement) ? document.activeElement : null;
    const had = active?.getAttribute('data-presets');
    const moved = active?.getAttribute('data-move');
    const why = h(
      'p',
      { class: 'hint mus-track-why', role: 'listitem' },
      'A track’s color and picture come from its instrument: the picture is the preset it matches, on its group’s color (strings, keys, drums…). Change the instrument and they follow. A sound that matches no preset keeps a plain note and its channel’s own color.',
    );
    clear(this.el, ...rows, h('div', { role: 'listitem', style: 'display:contents' }, add), why);
    if (had) this.el.querySelector<HTMLElement>(`[data-presets="${had}"]`)?.focus();
    if (moved) {
      // the same button on the moved track; at an end it is disabled, so the other arrow gets the focus
      const [ch, way] = moved.split(':');
      const other = way === 'up' ? 'down' : 'up';
      const pick = (w: string) => this.el.querySelector<HTMLButtonElement>(`[data-move="${ch}:${w}"]:not(:disabled)`);
      (pick(way) ?? pick(other))?.focus();
    }
    if (this.adding) add.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
}
