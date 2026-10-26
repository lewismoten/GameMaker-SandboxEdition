// The preset picker: a searchable list of instrument presets in families, as radio buttons
// (arrow keys move through them, and each one chosen plays a short phrase), for one track.
// On a drum track in rhythm mode it lists that drum's presets and says what the drum shares.
import { h, modal } from '../../core/ui';
import { OPL_PRESETS, PRESET_GROUPS, findPreset } from '../../../audio/oplPresets';
import { DRUM_SLOTS, slotOfChannel } from '../../../audio/oplDrumPresets';
import type { OplPreset } from '../../../audio/oplPatch';
import { programChanges, setStartProgram, startProgram } from '../../../formats/cmfEdit';
import type { MusicDoc } from './doc';

interface PickFor {
  /** The MIDI channel (track) the sound is for. */
  ch: number;
  /** Whose sound it is, for the title ("Track 2", "Instrument 5"). */
  label: string;
  /** The instrument now, to start on its preset. */
  current?: Uint8Array;
}

/** The presets a channel can use: its drum's in rhythm mode, else every melodic one. */
function presetsFor(ch: number, rhythm: boolean): OplPreset[] {
  const slot = rhythm ? slotOfChannel(ch) : undefined;
  return slot ? OPL_PRESETS.filter((p) => p.drum === slot) : OPL_PRESETS.filter((p) => !p.drum);
}

const words = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/** Opens the picker; resolves with the preset to use, or nothing when cancelled. */
export function pickPreset(doc: MusicDoc, at: PickFor): Promise<OplPreset | undefined> {
  const slot = doc.rhythm ? slotOfChannel(at.ch) : undefined;
  const list = presetsFor(at.ch, doc.rhythm);
  const current = at.current ? findPreset(at.current) : undefined;
  const title = slot ? `${DRUM_SLOTS[slot].name} sounds` : `Instrument presets`;
  const done = modal<OplPreset>(`${title} · ${at.label}`, (close) => {
    let chosen: OplPreset | undefined = current && list.includes(current) ? current : undefined;
    const search = h('input', {
      type: 'search',
      class: 'mus-preset-search',
      placeholder: slot ? 'Search' : 'Search: piano, bass, bells…',
      'aria-label': 'Search the presets',
      autocomplete: 'off',
    });
    const count = h('p', { class: 'hint mus-preset-count', 'aria-live': 'polite' });
    const use = h('button', { type: 'submit', class: 'primary', disabled: !chosen });
    const again = h('button', { type: 'button', disabled: !chosen, title: 'Play the phrase again' }, '▶ Hear it');
    const label = () => {
      use.textContent = chosen ? `Use ${chosen.name}` : 'Use';
      use.disabled = again.disabled = !chosen;
    };
    const rows = new Map<OplPreset, HTMLElement>();
    const groups = PRESET_GROUPS.map((g) => {
      const items = list.filter((p) => p.group === g.id);
      if (!items.length) return null;
      const set = h(
        'fieldset',
        { class: 'mus-preset-group' },
        h('legend', null, slot ? `${g.name}: ${DRUM_SLOTS[slot].name.toLowerCase()}` : g.name),
        ...items.map((p) => {
          const radio = h('input', { type: 'radio', name: 'preset', value: p.id, checked: p === chosen });
          // a click, Space or an arrow key choosing it: hear it
          radio.addEventListener('click', () => {
            chosen = p;
            label();
            void doc.previewPreset(p);
          });
          const row = h(
            'label',
            { class: 'mus-preset', title: p.about },
            radio,
            h('span', { class: 'mus-preset-text' }, h('b', null, p.name), h('small', null, p.about)),
          );
          // double-click: use it at once
          row.addEventListener('dblclick', () => close(p));
          rows.set(p, row);
          return row;
        }),
      );
      return { set, items };
    });
    const filter = () => {
      const q = words(search.value).split(/\s+/).filter(Boolean);
      let shown = 0;
      for (const g of groups) {
        if (!g) continue;
        const groupName = words(g.set.querySelector('legend')!.textContent ?? '');
        let any = false;
        for (const p of g.items) {
          const text = `${words(p.name)} ${words(p.about)} ${groupName}`;
          const ok = q.every((w) => text.includes(w));
          rows.get(p)!.hidden = !ok;
          if (ok) shown++;
          any ||= ok;
        }
        g.set.hidden = !any;
      }
      count.textContent = shown ? `${shown} preset${shown === 1 ? '' : 's'}` : `No preset matches “${search.value.trim()}”.`;
    };
    search.addEventListener('input', filter);
    // Down from the search box goes to the list (the chosen one, else the first shown)
    search.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowDown') return;
      const radios = [...form.querySelectorAll<HTMLInputElement>('input[type=radio]')].filter((r) => !r.closest('[hidden]'));
      const r = radios.find((x) => x.checked) ?? radios[0];
      if (!r) return;
      e.preventDefault();
      r.focus();
      if (!r.checked) r.click();
    });
    again.addEventListener('click', () => chosen && void doc.previewPreset(chosen));
    const form = h(
      'form',
      {
        class: 'mus-presets',
        method: 'dialog',
        onsubmit: (e: Event) => {
          e.preventDefault();
          if (chosen) close(chosen);
        },
      },
      search,
      h(
        'p',
        { class: 'hint' },
        slot
          ? DRUM_SLOTS[slot].shares
          : `Choose one to hear it; the arrow keys step through them. ${doc.rhythm ? 'The drums have their own sounds: open a drum track.' : 'Drum-kit sounds are on the drum tracks (turn on the drum kit in Settings).'}`,
      ),
      count,
      h('div', { class: 'mus-preset-list' }, ...groups.map((g) => g?.set ?? null)),
      h(
        'div',
        { class: 'buttons' },
        h('small', { class: 'hint mus-preset-undo' }, 'Ctrl+Z undoes it.'),
        again,
        h('button', { type: 'button', onclick: () => close(undefined) }, 'Cancel'),
        use,
      ),
    );
    label();
    filter();
    requestAnimationFrame(() => {
      search.focus();
      if (chosen) rows.get(chosen)?.scrollIntoView({ block: 'center' });
    });
    return form;
  });
  return done.finally(() => doc.stopPreview());
}

/**
 * Gives track ch a preset's sound, as one undo step: in the instrument it starts with, or in
 * a new copy when other tracks use that instrument too (so they keep their sound).
 */
export function applyToTrack(doc: MusicDoc, ch: number, p: OplPreset): void {
  const song = doc.song;
  const prog = startProgram(song, ch);
  const inst = song.instruments[prog];
  const shared = doc.tracks().some((c) => c !== ch && (startProgram(song, c) === prog || programChanges(song, c).some((e) => e.a === prog)));
  doc.edit(() => {
    if (inst && (!shared || song.instruments.length >= 128)) inst.set(p.patch.subarray(0, 11));
    else if (song.instruments.length < 128) {
      song.instruments.push(p.patch.slice());
      setStartProgram(song, ch, song.instruments.length - 1);
    }
  });
}
