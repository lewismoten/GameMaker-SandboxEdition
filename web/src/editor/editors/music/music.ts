// Sound Blaster music (.CMF): tracks, a piano roll per track, FM instruments, and playback
// through the same PlayIt code the games use. Only what Game-Maker plays can be edited:
// notes and their velocities (loudness), instruments (program changes and SBI settings), the
// drum kit (rhythm mode), timing.
import { registerEditor } from '../registry';
import { h, clear, toast } from '../../core/ui';
import { MusicDoc, SNAPS } from './doc';
import { PianoRoll } from './roll';
import { Overview } from './overview';
import { TrackList } from './tracks';
import { InstrumentPanel } from './instrument';
import { SongPanel } from './songPanel';
import { VelocityField } from './velocity';
import { startProgram } from '../../../formats/cmfEdit';
import { MUS_TABS, loadTab, saveTab, stepTab, type MusTab } from './tabs';
import './music.css';
import { viewState } from '../../../urlState';

registerEditor(['cmf'], (host, project, file) => {
  let doc: MusicDoc;
  try {
    doc = new MusicDoc(project, file);
  } catch (e) {
    clear(host, h('p', { class: 'hint' }, `This song could not be read: ${(e as Error).message}`));
    return;
  }
  const roll = new PianoRoll(doc);
  const overview = new Overview(doc, roll);
  const tracks = new TrackList(doc, () => {
    roll.centerOnTrack();
    roll.focus();
  });
  const instrument = new InstrumentPanel(doc);
  // the address keeps the tab, the track and the instrument shown, counted from 1 as they are
  // labeled (…/SONG.CMF?tab=instruments&track=2&instrument=5)
  const view = viewState(['p', project.id, file]);
  const TAB_NAMES: Record<MusTab, string> = { song: 'song', inst: 'instruments', set: 'settings' };
  const urlTrack = view.num('track');
  if (urlTrack !== undefined && doc.tracks().includes(urlTrack - 1)) doc.selectTrack(urlTrack - 1);
  const urlInstrument = view.num('instrument');
  if (urlInstrument !== undefined && urlInstrument >= 1 && urlInstrument <= doc.song.instruments.length) instrument.show(urlInstrument - 1);
  doc.on((c) => c === 'track' && view.set({ track: doc.track + 1 }));
  instrument.onShow = (i) => view.set({ instrument: i + 1 });
  const songPanel = new SongPanel(doc);
  const velocity = new VelocityField(doc);

  // ---- transport and tools ----
  const playBtn = h('button', { class: 'primary mus-play', title: 'Play from the cursor (Space)' }, '▶ Play');
  playBtn.addEventListener('click', () => toggle());
  const toggle = () => (doc.playing ? doc.stop() : void doc.play());
  const toStart = h(
    'button',
    {
      title: 'Back to the start',
      'aria-label': 'Back to the start',
      onclick: () => {
        doc.cursor = 0;
        roll.scrollTo(0);
        if (doc.playing) void doc.play(0);
      },
    },
    '⏮',
  );
  const loopBtn = h('button', { title: 'Loop the region marked on the ruler (drag along the bar numbers to mark one)' }, '🔁 Loop');
  loopBtn.addEventListener('click', () => {
    if (!doc.loop) {
      // no region yet: loop the bars on screen
      const bar = doc.beat * 4;
      const a = Math.floor(roll.scrollX / bar) * bar;
      doc.loop = [a, a + Math.max(bar, Math.floor(roll.span / bar) * bar)];
      doc.loopOn = true;
    } else doc.loopOn = !doc.loopOn;
    doc.remix();
    doc.emit('view');
  });
  const time = h('span', { class: 'mus-time', 'aria-live': 'off' });

  const tools = h(
    'div',
    { class: 'seg mus-tools', role: 'group', 'aria-label': 'Tool' },
    ...(
      [
        ['draw', '✏️', 'Draw: click to add a note, drag to set its length; drag notes to move, their right end to resize'],
        ['select', '⬚', 'Select: drag a box around notes'],
        ['erase', '⌫', 'Erase: click or drag over notes'],
        ['pan', '✋', 'Move around (also: scroll, shift+scroll, ctrl+scroll to zoom)'],
      ] as const
    ).map(([t, icon, title]) => {
      const b = h('button', { type: 'button', title, 'aria-label': title.split(':')[0], 'aria-pressed': String(doc.tool === t) }, icon);
      b.addEventListener('click', () => {
        doc.tool = t;
        for (const x of tools.querySelectorAll('button')) x.setAttribute('aria-pressed', String(x === b));
        roll.focus();
      });
      return b;
    }),
  );
  const snap = h('select', { 'aria-label': 'Snap notes to' }, ...SNAPS.map(([v, t]) => h('option', { value: String(v), selected: v === doc.snapBeats }, t)));
  snap.addEventListener('change', () => {
    doc.snapBeats = Number(snap.value);
    doc.emit('view');
  });
  const undoBtn = h('button', { title: 'Undo (Ctrl+Z)', 'aria-label': 'Undo', onclick: () => doc.undo() }, '↶');
  const redoBtn = h('button', { title: 'Redo (Ctrl+Shift+Z)', 'aria-label': 'Redo', onclick: () => doc.redo() }, '↷');
  const zoom = (f: number) => roll.setZoom(roll.zoom * f);
  const ghosts = h('input', { type: 'checkbox', checked: doc.ghosts });
  ghosts.addEventListener('change', () => {
    doc.ghosts = ghosts.checked;
    doc.emit('view');
  });
  const follow = h('input', { type: 'checkbox', checked: doc.follow });
  follow.addEventListener('change', () => (doc.follow = follow.checked));

  // the roll's tools show only on the Song tab; play, undo and redo work on every tab
  const rollTools = h(
    'div',
    { class: 'toolbar mus-roll-tools' },
    tools,
      h('label', { class: 'mus-inline', title: 'Snap notes to the grid' }, h('span', null, 'Snap'), snap),
      h('button', { title: 'Zoom out', 'aria-label': 'Zoom out', onclick: () => zoom(1 / 1.5) }, '−'),
      h('button', { title: 'Zoom in', 'aria-label': 'Zoom in', onclick: () => zoom(1.5) }, '+'),
      h(
        'button',
        {
          title: 'Fit the whole song',
          onclick: () => {
            roll.setZoom(roll.zoom * (roll.span / Math.max(1, doc.song.end.tick * 1.02)));
            roll.scrollTo(0);
          },
        },
        'Fit',
      ),
  );
  const bar = h('div', { class: 'mus-bar' }, h('div', { class: 'toolbar' }, playBtn, toStart, loopBtn, time), rollTools);
  const options = h(
    'div',
    { class: 'mus-options' },
    velocity.el,
    h('label', { class: 'check', title: 'Show the other tracks faintly behind this one' }, ghosts, h('span', null, 'Show other tracks')),
    h('label', { class: 'check', title: 'Keep the playhead in view' }, follow, h('span', null, 'Follow playback')),
    // the how-to folds into a small ? so the roll keeps its height
    h(
      'details',
      { class: 'mus-tips' },
      h('summary', { title: 'How the ruler, END and VEL work', 'aria-label': 'Tips: the ruler, END and VEL' }, '?'),
      h(
        'p',
        { class: 'hint' },
        'Click the ruler to set where playing starts; drag on it to mark a loop. Drag END to change where the song repeats. Drag the bars in VEL to make notes louder or softer.',
      ),
    ),
  );

  const refresh = () => {
    playBtn.textContent = doc.playing ? '■ Stop' : '▶ Play';
    playBtn.title = doc.playing ? 'Stop (Space)' : 'Play from the cursor (Space)';
    loopBtn.setAttribute('aria-pressed', String(!!doc.loop && doc.loopOn));
    undoBtn.disabled = !doc.canUndo;
    redoBtn.disabled = !doc.canRedo;
    const at = doc.playhead ?? doc.cursor;
    time.textContent = `${doc.barBeat(at)}  ${doc.seconds(at)} / ${doc.seconds(doc.song.end.tick)}`;
  };

  let wasPlaying = false;
  doc.on((c) => {
    if (c === 'play') {
      if (doc.playing && doc.follow && doc.playhead !== null) {
        if (doc.playhead < roll.scrollX || doc.playhead > roll.scrollX + roll.span * 0.92) roll.scrollX = Math.max(0, doc.playhead - roll.span * 0.05);
      }
      if (wasPlaying !== doc.playing) refresh();
      wasPlaying = doc.playing;
      time.textContent = `${doc.barBeat(doc.playhead ?? doc.cursor)}  ${doc.seconds(doc.playhead ?? doc.cursor)} / ${doc.seconds(doc.song.end.tick)}`;
    } else refresh();
    roll.draw();
    overview.draw();
  });

  // ---- tabs: the notes get the whole editor; instruments and song settings have their own ----
  const songPanel_ = h(
    'section',
    { class: 'mus-panel mus-panel-song', id: 'mus-song', role: 'tabpanel', 'aria-labelledby': 'mus-tab-song' },
    overview.el,
    h('div', { class: 'mus-main' }, tracks.el, h('div', { class: 'mus-roll-col' }, roll.el, options)),
  );
  const instPanel = h('section', { class: 'mus-panel', id: 'mus-inst', role: 'tabpanel', 'aria-labelledby': 'mus-tab-inst' }, instrument.el);
  const setPanel = h(
    'section',
    { class: 'mus-panel mus-panel-set', id: 'mus-set', role: 'tabpanel', 'aria-labelledby': 'mus-tab-set' },
    h('div', { class: 'panel mus-song-box' }, h('h3', null, 'Song settings'), songPanel.el),
  );
  const panels: Record<MusTab, HTMLElement> = { song: songPanel_, inst: instPanel, set: setPanel };
  const tabBar = h(
    'div',
    { class: 'mus-tabs', role: 'tablist', 'aria-label': 'Music' },
    ...MUS_TABS.map(([key, label, title]) =>
      h(
        'button',
        {
          type: 'button',
          class: 'mus-tab',
          id: `mus-tab-${key}`,
          role: 'tab',
          title,
          'aria-controls': panels[key].id,
          onclick: () => showTab(key, true),
          onkeydown: (e: KeyboardEvent) => {
            const next = stepTab(key, e.key);
            if (!next) return;
            e.preventDefault();
            showTab(next, true);
            tabBar.querySelector<HTMLElement>('[aria-selected="true"]')?.focus();
          },
        },
        label,
      ),
    ),
  );
  const urlTab = (Object.keys(TAB_NAMES) as MusTab[]).find((k) => TAB_NAMES[k] === view.get('tab'));
  let tab = urlTab ?? loadTab();
  function showTab(key: MusTab, remember = false): void {
    tab = key;
    for (const [k, el] of Object.entries(panels)) el.hidden = k !== key;
    rollTools.hidden = key !== 'song';
    for (const b of tabBar.querySelectorAll<HTMLElement>('.mus-tab')) {
      const on = b.id === `mus-tab-${key}`;
      b.setAttribute('aria-selected', String(on));
      b.tabIndex = on ? 0 : -1;
    }
    if (remember) saveTab(key);
    view.set({ tab: TAB_NAMES[key] });
    if (key === 'song') roll.draw();
  }
  /** Opens the Instruments tab on instrument i (the selected track's when not given). */
  const editInstrument = (i?: number) => {
    instrument.show(i);
    showTab('inst', true);
    instPanel.querySelector<HTMLElement>('.mus-inst-list [aria-current="true"]')?.focus();
  };
  roll.onEditInstrument = editInstrument;
  tracks.onEditInstrument = (ch) => editInstrument(startProgram(doc.song, ch));
  tracks.render();

  const root = h(
    'div',
    { class: 'mus', tabIndex: -1 },
    h('div', { class: 'mus-tabrow' }, tabBar, h('div', { class: 'toolbar mus-undo' }, undoBtn, redoBtn)),
    bar,
    songPanel_,
    instPanel,
    setPanel,
  );

  // Space plays, Ctrl+Z undoes — anywhere in the editor except in text fields.
  root.addEventListener('keydown', (e) => {
    const t = e.target as HTMLElement;
    if (t.closest('input, select, textarea')) return;
    const mod = e.ctrlKey || e.metaKey;
    if (e.key === ' ' && !t.closest('button')) {
      e.preventDefault();
      toggle();
    } else if (mod && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      if (e.shiftKey) doc.redo();
      else doc.undo();
    } else if (mod && e.key.toLowerCase() === 'y') {
      e.preventDefault();
      doc.redo();
    }
  });

  clear(host, root);
  showTab(tab);
  refresh();
  if (!doc.song.notes.length && !doc.tracks().length) toast('An empty song: add a track to start.');
  return () => {
    doc.dispose();
    roll.dispose();
    overview.dispose();
  };
});
