// Sound Blaster music (.CMF): tracks, a piano roll per track, FM instruments, and playback
// through the same PlayIt code the games use. Only what Game-Maker plays can be edited:
// notes and their velocities (loudness), instruments (program changes and SBI settings), the
// drum kit (rhythm mode), timing.
import { registerEditor } from './index';
import { h, clear, toast } from '../ui';
import { MusicDoc, SNAPS } from '../music/doc';
import { PianoRoll } from '../music/roll';
import { Overview } from '../music/overview';
import { TrackList } from '../music/tracks';
import { InstrumentPanel } from '../music/instrument';
import { SongPanel } from '../music/songPanel';
import { VelocityField } from '../music/velocity';
import '../music/music.css';

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

  const bar = h(
    'div',
    { class: 'mus-bar' },
    h('div', { class: 'toolbar' }, playBtn, toStart, loopBtn, time),
    h(
      'div',
      { class: 'toolbar' },
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
      undoBtn,
      redoBtn,
    ),
  );
  const options = h(
    'div',
    { class: 'mus-options' },
    velocity.el,
    h('label', { class: 'check', title: 'Show the other tracks faintly behind this one' }, ghosts, h('span', null, 'Show other tracks')),
    h('label', { class: 'check', title: 'Keep the playhead in view' }, follow, h('span', null, 'Follow playback')),
    h(
      'span',
      { class: 'hint' },
      'Click the ruler to set where playing starts; drag on it to mark a loop. Drag END to change where the song repeats. Drag the bars in VEL to make notes louder or softer.',
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

  const root = h(
    'div',
    { class: 'mus', tabIndex: -1 },
    bar,
    overview.el,
    h('div', { class: 'mus-main' }, tracks.el, h('div', { class: 'mus-roll-col' }, roll.el, options)),
    h(
      'div',
      { class: 'mus-lower' },
      instrument.el,
      h('details', { class: 'mus-song-box panel', open: doc.song.clockTicks !== 146 }, h('summary', null, 'Song settings'), songPanel.el),
    ),
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
  refresh();
  if (!doc.song.notes.length && !doc.tracks().length) toast('An empty song: add a track to start.');
  return () => {
    doc.dispose();
    roll.dispose();
    overview.dispose();
  };
});
