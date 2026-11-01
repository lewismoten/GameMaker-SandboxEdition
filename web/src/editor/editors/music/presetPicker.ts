// The preset picker: instrument presets, one picture and name each. It opens on a Classic tab
// (the song maker's nine sounds, a favorites view tinted like the families they sound like);
// the More tab has the search bar and every family, Classic's sounds included, in families that
// flow like words (a turned family name, then its buttons on a tinted ground). They are radio
// buttons (arrow keys move through each tab's; each one chosen plays a short phrase). On a drum
// track in rhythm mode it lists that drum's presets and says what the drum shares. A drum preset
// picked while the drum kit is off asks first (drumMode.ts says what the kit costs).
import { confirmDialog, h, modal } from '../../core/ui';
import { OPL_PRESETS, PRESET_GROUPS, findPreset, soundGroup } from '../../../audio/oplPresets';
import { DRUM_SLOTS, slotOfChannel } from '../../../audio/oplDrumPresets';
import type { OplPreset } from '../../../audio/oplPatch';
import type { MusicDoc } from './doc';
import { presetIcon } from './presetIcons';
import { drumConfirmText } from './drumMode';

interface PickFor {
  /** The MIDI channel (track) the sound is for. */
  ch: number;
  /** Whose sound it is, for the title ("Track 2", "Instrument 5"). */
  label: string;
  /** The instrument now, to start on its preset. */
  current?: Uint8Array;
}

/** The presets a channel can use: its drum's in rhythm mode, else all (the drums switch the kit on). */
function presetsFor(ch: number, rhythm: boolean): OplPreset[] {
  const slot = rhythm ? slotOfChannel(ch) : undefined;
  return slot ? OPL_PRESETS.filter((p) => p.drum === slot) : OPL_PRESETS;
}

const TAB_KEY = 'gm-mus-preset-tab';
const loadTab = (): 'classic' | 'more' => {
  try {
    return sessionStorage.getItem(TAB_KEY) === 'more' ? 'more' : 'classic';
  } catch {
    return 'classic';
  }
};
const saveTab = (t: string) => {
  try {
    sessionStorage.setItem(TAB_KEY, t);
  } catch {
    /* private mode */
  }
};
/** A family's tint, the same wherever its sounds are listed. */
const hueOf = (groupId: string) => (PRESET_GROUPS.findIndex((g) => g.id === groupId) * 47 + 20) % 360;

const words = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/** Opens the picker; resolves with the preset to use, or nothing when canceled. */
export function pickPreset(doc: MusicDoc, at: PickFor): Promise<OplPreset | undefined> {
  const slot = doc.rhythm ? slotOfChannel(at.ch) : undefined;
  const list = presetsFor(at.ch, doc.rhythm);
  const current = at.current ? findPreset(at.current) : undefined;
  const title = slot ? `${DRUM_SLOTS[slot].name} sounds` : `Instrument presets`;
  const tabbed = !slot;
  const classic = list.filter((p) => p.group === 'classic');
  const done = modal<OplPreset>(`${title} · ${at.label}`, (close) => {
    let chosen: OplPreset | undefined = current && list.includes(current) ? current : undefined;
    let tab: 'classic' | 'more' = !tabbed ? 'more' : chosen && chosen.group !== 'classic' ? 'more' : loadTab();
    const search = h('input', {
      type: 'search',
      class: 'mus-preset-search',
      placeholder: slot ? 'Search' : 'Search: piano, bass, bells…',
      'aria-label': 'Search the presets',
      autocomplete: 'off',
    });
    const none = h('p', { class: 'hint mus-preset-count', 'aria-live': 'polite' });
    const use = h('button', { type: 'submit', class: 'primary', disabled: !chosen });
    const again = h('button', { type: 'button', disabled: !chosen, title: 'Play the phrase again' }, '▶ Hear it');
    const label = () => {
      use.textContent = chosen ? `Use ${chosen.name}` : 'Use';
      use.disabled = again.disabled = !chosen;
    };
    // a preset can sit in two tabs (Classic and its family): every button for it, and its tile
    const radios = new Map<OplPreset, HTMLInputElement[]>();
    const rows = new Map<OplPreset, HTMLElement[]>();
    const about = h('p', { class: 'hint mus-preset-about', 'aria-live': 'polite' });
    const tell = (p?: OplPreset) => {
      about.textContent = p ? `${p.name}: ${p.about}` : '';
    };
    const tile = (p: OplPreset, radioName: string, tinted: boolean) => {
      const radio = h('input', { type: 'radio', name: radioName, value: p.id, checked: p === chosen, 'aria-label': `${p.name}: ${p.about}` });
      // a click, Space or an arrow key choosing it: hear it
      radio.addEventListener('click', () => {
        chosen = p;
        for (const r of radios.get(p) ?? []) r.checked = true;
        label();
        tell(p);
        void doc.previewPreset(p);
      });
      radio.addEventListener('focus', () => tell(p));
      const icon = h('span', { class: 'mus-preset-icon' });
      icon.innerHTML = presetIcon(p.id, p.group);
      const row = h(
        'label',
        {
          class: tinted ? 'mus-preset mus-preset-tinted' : 'mus-preset',
          title: `${p.name}: ${p.about}`,
          style: tinted ? `--h:${hueOf(soundGroup(p))}` : undefined,
        },
        radio,
        icon,
        h('span', { class: 'mus-preset-name' }, p.name),
      );
      // double-click: use it at once
      row.addEventListener('dblclick', () => void choose(p));
      radios.set(p, [...(radios.get(p) ?? []), radio]);
      rows.set(p, [...(rows.get(p) ?? []), row]);
      return row;
    };
    /** Closes with p, after a drum preset has the player agree to the drum kit being switched on. */
    const choose = async (p: OplPreset) => {
      if (p.drum && !doc.rhythm && !(await confirmDialog('Turn on the drum kit?', drumConfirmText(doc, p), 'Turn on the drum kit and use it'))) return;
      close(p);
    };

    // Classic: one box of the song maker's sounds, each tinted like the family it sounds like
    const favorites = classic.length
      ? h(
          'div',
          { class: 'mus-preset-list mus-preset-favs' },
          h(
            'div',
            { class: 'mus-preset-group', role: 'group', 'aria-label': 'Classic', style: '--tint: color-mix(in srgb, var(--text) 45%, transparent)' },
            h('span', { class: 'mus-preset-gname', 'aria-hidden': 'true' }, 'Classic'),
            h('div', { class: 'mus-preset-tiles' }, ...classic.map((p) => tile(p, 'preset-classic', true))),
          ),
        )
      : null;

    // More: every family (a Classic sound is listed in the family it sounds like)
    const groups = PRESET_GROUPS.map((g) => {
      if (g.id === 'classic') return null;
      const items = list.filter((p) => soundGroup(p) === g.id);
      if (!items.length) return null;
      const full = slot ? `${g.name}: ${DRUM_SLOTS[slot].name.toLowerCase()}` : g.name;
      const set = h(
        'div',
        { class: 'mus-preset-group', role: 'group', 'aria-label': full, style: `--h:${hueOf(g.id)}`, dataset: { name: full } },
        h('span', { class: 'mus-preset-gname', 'aria-hidden': 'true' }, slot ? DRUM_SLOTS[slot].name : g.name),
        h('div', { class: 'mus-preset-tiles' }, ...items.map((p) => tile(p, 'preset-more', false))),
      );
      return { set, items };
    });
    const moreList = h('div', { class: 'mus-preset-list' }, ...groups.map((g) => g?.set ?? null));
    const filter = () => {
      const q = words(search.value).split(/\s+/).filter(Boolean);
      let shown = 0;
      for (const g of groups) {
        if (!g) continue;
        const groupName = words(g.set.dataset.name ?? '');
        let any = false;
        for (const p of g.items) {
          const text = `${words(p.name)} ${words(p.about)} ${groupName}`;
          const ok = q.every((w) => text.includes(w));
          rows.get(p)?.forEach((r) => r.parentElement?.closest('.mus-preset-group') === g.set && (r.hidden = !ok));
          if (ok) shown++;
          any ||= ok;
        }
        g.set.hidden = !any;
      }
      none.textContent = shown ? '' : `No preset matches “${search.value.trim()}”.`;
    };
    search.addEventListener('input', filter);

    // the tabs (Classic first); a drum track has no tabs
    const panels = { classic: favorites, more: h('div', { class: 'mus-preset-more' }, search, none, moreList) };
    const tabs = (['classic', 'more'] as const).map((k) =>
      h(
        'button',
        { type: 'button', role: 'tab', id: `mus-preset-tab-${k}`, 'aria-controls': `mus-preset-panel-${k}`, class: 'mus-tab' },
        k === 'classic' ? 'Classic' : 'More',
      ),
    );
    const show = (k: 'classic' | 'more', focus = false) => {
      tab = k;
      saveTab(k);
      tabs.forEach((b, i) => {
        const on = i === (k === 'classic' ? 0 : 1);
        b.setAttribute('aria-selected', String(on));
        b.tabIndex = on ? 0 : -1;
      });
      if (favorites) favorites.hidden = k !== 'classic';
      panels.more.hidden = k !== 'more';
      if (focus) tabs[k === 'classic' ? 0 : 1].focus();
    };
    tabs.forEach((b, i) => {
      b.addEventListener('click', () => show(i ? 'more' : 'classic'));
      b.addEventListener('keydown', (e) => {
        const key = e.key;
        const j = key === 'ArrowRight' ? (i + 1) % 2 : key === 'ArrowLeft' ? (i + 1) % 2 : key === 'Home' ? 0 : key === 'End' ? 1 : -1;
        if (j < 0) return;
        e.preventDefault();
        show(j ? 'more' : 'classic', true);
      });
    });
    if (favorites) {
      favorites.id = 'mus-preset-panel-classic';
      favorites.setAttribute('role', 'tabpanel');
      favorites.setAttribute('aria-labelledby', 'mus-preset-tab-classic');
    }
    panels.more.id = 'mus-preset-panel-more';
    if (tabbed) {
      panels.more.setAttribute('role', 'tabpanel');
      panels.more.setAttribute('aria-labelledby', 'mus-preset-tab-more');
    }

    // Down from the search box goes to the list (the chosen one, else the first shown)
    search.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowDown') return;
      const all = [...panels.more.querySelectorAll<HTMLInputElement>('input[type=radio]')].filter((r) => !r.closest('[hidden]'));
      const r = all.find((x) => x.checked) ?? all[0];
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
          if (chosen) void choose(chosen);
        },
      },
      tabbed && favorites ? h('div', { class: 'mus-preset-tabs', role: 'tablist', 'aria-label': 'Preset lists' }, ...tabs) : null,
      slot ? h('p', { class: 'hint' }, DRUM_SLOTS[slot].shares) : null,
      tabbed && favorites ? favorites : null,
      panels.more,
      about,
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
    tell(chosen);
    filter();
    if (tabbed && favorites) show(tab);
    else panels.more.hidden = false;
    requestAnimationFrame(() => {
      const visible = (chosen && rows.get(chosen)?.find((r) => !r.closest('[hidden]'))) || undefined;
      if (tab === 'more' || !tabbed) search.focus();
      else (visible?.querySelector('input') ?? tabs[0]).focus();
      visible?.scrollIntoView({ block: 'center' });
    });
    return form;
  });
  return done.finally(() => doc.stopPreview());
}
