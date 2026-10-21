// The piano roll: one track's notes (time across, pitch up) with a ruler for the play
// position, loop region and song end, a lane of instrument changes, a keyboard to try notes,
// and a velocity lane under the notes (how loud each note plays: SBFMDRV scales the
// instrument's carrier level by it).
//
// This file is the keyboard shortcuts, copy and paste, and the instrument change popup. The
// rest is in roll/, a chain of classes each extending the one before: view -> draw ->
// pointer -> PianoRoll; layout.ts has the measurements.
import { h } from '../../core/ui';
import { addNote, channelNotes, deleteNotes, noteEnd, removeEvent, setNote, setVelocity, type Ev, type Note } from '../../../formats/cmfEdit';
import { HEAD } from './roll/layout';
import { RollPointer } from './roll/pointer';

export class PianoRoll extends RollPointer {
  protected key(e: KeyboardEvent): void {
    const doc = this.doc;
    const song = doc.song;
    const mod = e.ctrlKey || e.metaKey;
    const sel = [...doc.selection];
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (!sel.length) return;
      e.preventDefault();
      doc.edit(() => deleteNotes(song, sel));
      doc.selection.clear();
      return;
    }
    if (mod && e.key.toLowerCase() === 'a') {
      e.preventDefault();
      doc.selection = new Set(channelNotes(song, doc.track));
      doc.emit('view');
      return;
    }
    if (mod && e.key.toLowerCase() === 'c') {
      this.copy();
      return;
    }
    if (mod && e.key.toLowerCase() === 'x') {
      this.copy();
      doc.edit(() => deleteNotes(song, sel));
      doc.selection.clear();
      return;
    }
    if (mod && e.key.toLowerCase() === 'v') {
      e.preventDefault();
      this.paste(doc.cursor);
      return;
    }
    if (mod && e.key.toLowerCase() === 'd') {
      e.preventDefault();
      if (!sel.length) return;
      this.copy();
      const end = Math.max(...sel.map((n) => noteEnd(song, n)));
      const start = Math.min(...sel.map((n) => n.on.tick));
      this.paste(start + Math.max(doc.snap, Math.ceil((end - start) / doc.snap) * doc.snap));
      return;
    }
    if (e.key === 'Escape') {
      doc.selection.clear();
      doc.emit('view');
      return;
    }
    if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown') && sel.length) {
      // Alt+Up/Down: louder or softer (Shift: by 10)
      e.preventDefault();
      const dv = (e.key === 'ArrowUp' ? 1 : -1) * (e.shiftKey ? 10 : 1);
      doc.edit(() => {
        for (const n of sel) setVelocity([n], n.on.b + dv);
      });
      doc.velocity = sel[0].on.b;
      doc.emit('view');
      return;
    }
    const arrows: Record<string, [number, number]> = { ArrowUp: [0, 1], ArrowDown: [0, -1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
    const a = arrows[e.key];
    if (a && sel.length) {
      e.preventDefault();
      const dt = a[0] * doc.snap;
      const dk = a[1] * (e.shiftKey ? 12 : 1);
      if (sel.some((n) => n.on.tick + dt < 0 || n.on.a + dk < 0 || n.on.a + dk > 127)) return;
      doc.edit(() => {
        for (const n of sel) setNote(song, n, n.on.tick + dt, noteEnd(song, n) - n.on.tick, n.on.a + dk);
      });
      if (dk) void doc.audition(doc.track, sel[0].on.a);
      this.reveal(sel);
    }
  }

  /** Scrolls so the notes are in view. */
  reveal(notes: Note[]): void {
    if (!notes.length) return;
    const keys = notes.map((n) => n.on.a);
    const hi = Math.max(...keys);
    const lo = Math.min(...keys);
    if (hi > this.topKey || lo < this.topKey - this.visibleRows + 1) this.setTopKey((hi + lo) / 2 + this.visibleRows / 2);
    const start = Math.min(...notes.map((n) => n.on.tick));
    if (start < this.scrollX || start > this.scrollX + this.span * 0.9) this.scrollX = Math.max(0, start - this.span * 0.1);
    this.doc.emit('view');
  }

  copy(): void {
    const sel = [...this.doc.selection];
    if (!sel.length) return;
    const start = Math.min(...sel.map((n) => n.on.tick));
    this.doc.clipboard = sel.map((n) => ({ dt: n.on.tick - start, len: noteEnd(this.doc.song, n) - n.on.tick, key: n.on.a, vel: n.on.b }));
  }

  paste(at: number): void {
    const doc = this.doc;
    if (!doc.clipboard.length) return;
    doc.edit(() => {
      doc.selection.clear();
      for (const c of doc.clipboard) doc.selection.add(addNote(doc.song, doc.track, c.key, at + c.dt, c.len, c.vel));
    });
    this.reveal([...doc.selection]);
  }

  // ---- instrument change popup ----

  protected closePopup(): void {
    this.popup?.remove();
    this.popup = undefined;
  }

  protected programPopup(ev: Ev, x: number): void {
    this.closePopup();
    const doc = this.doc;
    const insts = doc.song.instruments;
    const sel = h(
      'select',
      { 'aria-label': 'Instrument' },
      ...insts.map((_, i) => h('option', { value: String(i), selected: i === ev.a }, `Instrument ${i + 1}`)),
      ev.a >= insts.length ? h('option', { value: String(ev.a), selected: true }, `Instrument ${ev.a + 1} (missing)`) : null,
    );
    sel.addEventListener('change', () => {
      doc.edit(() => (ev.a = Number(sel.value)));
      void doc.audition(doc.track, 60, ev.a);
    });
    this.popup = h(
      'div',
      { class: 'mus-popup', style: `left:${Math.min(x, this.w - 220)}px;top:${HEAD + 2}px` },
      h('strong', null, `Change instrument at bar ${doc.barBeat(ev.tick)}`),
      sel,
      h(
        'div',
        { class: 'toolbar' },
        h(
          'button',
          {
            class: 'danger',
            onclick: () => {
              doc.edit(() => removeEvent(doc.song, ev));
              this.closePopup();
            },
          },
          'Remove',
        ),
        h('button', { onclick: () => this.closePopup() }, 'Done'),
      ),
    );
    this.el.append(this.popup);
    sel.focus();
  }
}
