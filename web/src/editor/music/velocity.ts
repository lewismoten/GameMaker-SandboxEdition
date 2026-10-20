// The velocity field next to the piano roll: how loud the selected notes play, or, with
// nothing selected, how loud new notes are drawn (and notes are tried) — the last one set.
import { h } from '../ui';
import { setVelocity, clampVelocity } from '../../formats/cmfEdit';
import type { MusicDoc } from './doc';

export class VelocityField {
  readonly el: HTMLElement;
  private label = h('span', { class: 'mus-vel-label' });
  private range = h('input', { type: 'range', min: 1, max: 127, step: 1, 'aria-label': 'Velocity' });
  private num = h('input', { type: 'number', min: 1, max: 127, step: 1, style: 'width:4.2em', 'aria-label': 'Velocity (1-127)' });
  private sliding = false;

  constructor(private doc: MusicDoc) {
    this.el = h(
      'div',
      {
        class: 'mus-vel',
        title:
          'Velocity: how loud a note plays (1-127). Sound Blaster’s driver scales the instrument’s loudness by it: 127 is as loud as the instrument, 1 about half. Drag bars in the VEL lane, or Alt+↑/↓ on selected notes.',
      },
      this.label,
      this.range,
      this.num,
    );
    this.range.addEventListener('input', () => {
      const v = clampVelocity(Number(this.range.value));
      this.num.value = String(v);
      if (doc.selection.size) {
        if (!this.sliding) doc.begin();
        this.sliding = true;
        setVelocity(doc.selection, v);
      }
      doc.velocity = v;
      doc.emit('view');
    });
    this.range.addEventListener('change', () => this.finish());
    this.num.addEventListener('change', () => {
      const v = clampVelocity(Number(this.num.value));
      if (doc.selection.size) doc.edit(() => setVelocity(doc.selection, v));
      doc.velocity = v;
      this.update();
      doc.emit('view');
      this.preview();
    });
    doc.on((c) => c !== 'play' && !this.sliding && this.update());
    this.update();
  }

  private finish(): void {
    if (this.sliding) {
      this.sliding = false;
      this.doc.commit();
    }
    this.update();
    this.preview();
  }

  /** Plays the selected (or a middle) note at the new loudness. */
  private preview(): void {
    const doc = this.doc;
    const first = [...doc.selection][0];
    void doc.audition(doc.track, first ? first.on.a : 60, undefined, 50, doc.velocity);
  }

  update(): void {
    const sel = [...this.doc.selection];
    let v = this.doc.velocity;
    let mixed = false;
    if (sel.length) {
      v = sel[0].on.b;
      mixed = sel.some((n) => n.on.b !== v);
      if (mixed) v = Math.round(sel.reduce((a, n) => a + n.on.b, 0) / sel.length);
    }
    this.label.textContent = sel.length ? `Velocity · ${sel.length} note${sel.length === 1 ? '' : 's'}${mixed ? ' (mixed)' : ''}` : 'Velocity · new notes';
    this.range.value = String(v);
    if (document.activeElement !== this.num) this.num.value = mixed ? '' : String(v);
    this.num.placeholder = mixed ? `~${v}` : '';
  }
}
