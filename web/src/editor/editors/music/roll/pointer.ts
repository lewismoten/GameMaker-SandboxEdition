// Editing the piano roll with the mouse or a finger: draw, move, resize and erase notes,
// marquee selection, panning, setting the play position and song end on the ruler, and
// dragging velocities; plus double-click, the context menu and the wheel.
import { toast } from '../../../core/ui';
import { addNote, channelNotes, deleteNotes, noteEnd, setEnd, setNote, setProgramAt, setVelocity, type Ev, type Note } from '../../../../formats/cmfEdit';
import { KEYW, RULER, HEAD, VEL, programAtTick, type Drag } from './layout';
import { RollDraw } from './draw';

export abstract class RollPointer extends RollDraw {
  // Defined by a later layer (see the chain in the header comment).
  protected abstract closePopup(): void;
  protected abstract programPopup(ev: Ev, x: number): void;

  protected down(e: PointerEvent): void {
    this.closePopup();
    this.focus();
    const { x, y } = this.pos(e);
    const doc = this.doc;
    const song = doc.song;
    if (e.button === 2) return;
    const panning = doc.tool === 'pan' || e.button === 1;
    if (panning) {
      this.drag = { kind: 'pan', x0: x, y0: y, sx: this.scrollX, top: this.topKey };
      this.canvas.setPointerCapture(e.pointerId);
      return;
    }
    if (y < RULER) {
      if (x < KEYW) return;
      const endX = this.xOf(song.end.tick);
      this.canvas.setPointerCapture(e.pointerId);
      if (Math.abs(x - endX) <= 6 || (x >= endX && x <= endX + 30)) {
        doc.begin();
        this.drag = { kind: 'end', changed: false };
        return;
      }
      this.drag = { kind: 'ruler', t0: doc.quantize(this.tOf(x)), moved: false };
      return;
    }
    if (y < HEAD) {
      if (x < KEYW) return;
      const ev = this.programAt(x);
      if (ev) this.programPopup(ev, x);
      else {
        const t = doc.quantize(this.tOf(x));
        doc.begin();
        const added = setProgramAt(song, doc.track, t, programAtTick(doc, t));
        doc.commit();
        this.programPopup(added, x);
      }
      return;
    }
    if (y >= this.velTop) {
      if (x < KEYW || !doc.tracks().includes(doc.track)) return;
      this.canvas.setPointerCapture(e.pointerId);
      this.velDown(x, y, e.shiftKey || e.metaKey || e.ctrlKey);
      return;
    }
    if (x < KEYW) {
      const k = this.keyOf(y);
      void doc.audition(doc.track, k);
      return;
    }
    if (!doc.tracks().includes(doc.track)) {
      toast('Add a track first (＋ Add track).');
      return;
    }
    this.canvas.setPointerCapture(e.pointerId);
    const hit = this.noteAt(x, y);
    if (doc.tool === 'erase') {
      doc.begin();
      this.drag = { kind: 'erase', changed: false };
      this.eraseAt(x, y);
      return;
    }
    if (hit) {
      if (e.shiftKey || e.metaKey || e.ctrlKey) {
        if (doc.selection.has(hit.note)) doc.selection.delete(hit.note);
        else doc.selection.add(hit.note);
        doc.emit('view');
        return;
      }
      if (!doc.selection.has(hit.note)) {
        doc.selection.clear();
        doc.selection.add(hit.note);
      }
      const notes = [...doc.selection];
      const orig = new Map(notes.map((n) => [n, { start: n.on.tick, len: noteEnd(song, n) - n.on.tick, key: n.on.a }]));
      doc.begin();
      const t = this.tOf(x);
      if (hit.edge) this.drag = { kind: 'resize', notes, orig, t0: t, grab: hit.note, changed: false };
      else this.drag = { kind: 'move', notes, orig, t0: t, k0: this.keyOf(y), grab: hit.note, changed: false };
      doc.emit('view');
      return;
    }
    if (doc.tool === 'select' || e.shiftKey) {
      this.drag = { kind: 'marquee', x0: x, y0: y, x1: x, y1: y, base: e.shiftKey ? new Set(doc.selection) : new Set() };
      if (!e.shiftKey) doc.selection.clear();
      doc.emit('view');
      return;
    }
    // draw a new note; dragging sets its length
    const start = doc.snapBeats ? Math.floor(this.tOf(x) / doc.snap) * doc.snap : Math.round(this.tOf(x));
    const key = this.keyOf(y);
    doc.begin();
    const n = addNote(song, doc.track, key, Math.max(0, start), doc.noteLen, doc.velocity);
    doc.selection.clear();
    doc.selection.add(n);
    this.drag = { kind: 'resize', notes: [n], orig: new Map([[n, { start: n.on.tick, len: doc.noteLen, key }]]), t0: this.tOf(x), grab: n, changed: true };
    void doc.audition(doc.track, key);
    doc.emit('view');
  }

  protected move(e: PointerEvent): void {
    const { x, y } = this.pos(e);
    const doc = this.doc;
    const d = this.drag;
    if (!d) {
      const inVel = y >= this.velTop;
      const velNote = inVel && x >= KEYW ? this.velAt(x) : undefined;
      const hit: { note: Note; edge: boolean; vel?: boolean } | undefined = inVel
        ? velNote
          ? { note: velNote, edge: false, vel: true }
          : undefined
        : this.noteAt(x, y);
      const k = x < KEYW && y >= HEAD && !inVel ? this.keyOf(y) : -1;
      if (hit?.note !== this.hover?.note || hit?.edge !== this.hover?.edge || !!hit?.vel !== !!this.hover?.vel || k !== this.hoverKey) {
        this.hover = hit;
        this.hoverKey = k;
        this.draw();
      }
      this.canvas.style.cursor = inVel
        ? x < KEYW
          ? 'default'
          : velNote
            ? 'ns-resize'
            : 'crosshair'
        : y < RULER
          ? 'col-resize'
          : y < HEAD
            ? 'pointer'
            : x < KEYW
              ? 'pointer'
              : doc.tool === 'pan'
                ? 'grab'
                : hit
                  ? hit.edge
                    ? 'ew-resize'
                    : 'move'
                  : doc.tool === 'erase'
                    ? 'not-allowed'
                    : 'crosshair';
      return;
    }
    const song = doc.song;
    switch (d.kind) {
      case 'pan':
        this.scrollX = Math.max(0, d.sx - (x - d.x0) / this.zoom);
        this.setTopKey(d.top + Math.round((y - d.y0) / this.rowH));
        doc.emit('view');
        return;
      case 'ruler': {
        const t = doc.quantize(this.tOf(x));
        if (t !== d.t0) {
          d.moved = true;
          doc.loop = [Math.min(t, d.t0), Math.max(t, d.t0)];
          doc.loopOn = true;
          doc.emit('view');
        }
        return;
      }
      case 'end':
        setEnd(song, doc.quantize(this.tOf(x)));
        d.changed = true;
        doc.emit('view');
        return;
      case 'vel':
        this.velMove(d, x, y);
        return;
      case 'erase':
        this.eraseAt(x, y);
        return;
      case 'marquee': {
        d.x1 = x;
        d.y1 = y;
        const ta = this.tOf(Math.min(d.x0, x));
        const tb = this.tOf(Math.max(d.x0, x));
        const ka = this.keyOf(Math.max(d.y0, y));
        const kb = this.keyOf(Math.min(d.y0, y));
        doc.selection = new Set(d.base);
        for (const n of channelNotes(song, doc.track)) if (n.on.a >= ka && n.on.a <= kb && n.on.tick <= tb && noteEnd(song, n) >= ta) doc.selection.add(n);
        doc.emit('view');
        return;
      }
      case 'move': {
        const g = d.orig.get(d.grab)!;
        const raw = g.start + (this.tOf(x) - d.t0);
        let dt = (doc.snapBeats ? doc.quantize(raw) : Math.round(raw)) - g.start;
        let dk = this.keyOf(y) - d.k0;
        for (const o of d.orig.values()) {
          dt = Math.max(dt, -o.start);
          dk = Math.max(-o.key, Math.min(127 - o.key, dk));
        }
        const last = [...d.orig.values()].map((o) => `${o.start + dt}:${o.key + dk}`).join();
        if (this.lastMove === last) return;
        this.lastMove = last;
        const pitchChanged = d.notes.some((n) => n.on.a !== d.orig.get(n)!.key + dk);
        for (const n of d.notes) {
          const o = d.orig.get(n)!;
          setNote(song, n, o.start + dt, o.len, o.key + dk);
        }
        d.changed = true;
        if (pitchChanged) void doc.audition(doc.track, d.grab.on.a);
        doc.emit('view');
        return;
      }
      case 'resize': {
        const g = d.orig.get(d.grab)!;
        const rawEnd = g.start + g.len + (this.tOf(x) - d.t0);
        const end = doc.snapBeats ? doc.quantize(rawEnd) : Math.round(rawEnd);
        const dl = end - (g.start + g.len);
        for (const n of d.notes) {
          const o = d.orig.get(n)!;
          setNote(song, n, o.start, Math.max(doc.snapBeats ? doc.snap : 1, o.len + dl), o.key);
        }
        d.changed = true;
        doc.emit('view');
        return;
      }
    }
  }

  protected up(e: PointerEvent): void {
    const d = this.drag;
    this.drag = undefined;
    this.lastMove = undefined;
    if (this.canvas.hasPointerCapture(e.pointerId)) this.canvas.releasePointerCapture(e.pointerId);
    if (!d) return;
    const doc = this.doc;
    switch (d.kind) {
      case 'ruler':
        if (!d.moved) {
          doc.cursor = d.t0;
          if (doc.playing) void doc.play(d.t0);
        } else if (doc.playing) doc.remix();
        doc.emit('view');
        return;
      case 'vel':
        if (d.changed) {
          const n = d.grab ?? d.notes[d.notes.length - 1];
          if (n) {
            doc.velocity = n.on.b;
            if (d.grab) void doc.audition(doc.track, n.on.a, programAtTick(doc, n.on.tick), 50, n.on.b);
          }
          doc.commit();
        } else doc.undoDiscard();
        return;
      case 'move':
      case 'resize':
      case 'erase':
      case 'end':
        if (d.changed) {
          if (d.kind === 'resize' && d.notes.length === 1) doc.noteLen = noteEnd(doc.song, d.notes[0]) - d.notes[0].on.tick;
          doc.commit();
        } else doc.undoDiscard();
        return;
      case 'marquee':
        doc.emit('view');
        return;
    }
  }

  // ---- velocity lane ----

  protected velDown(x: number, y: number, add: boolean): void {
    const doc = this.doc;
    const hit = this.velAt(x);
    doc.begin();
    if (hit) {
      if (add) {
        if (!doc.selection.has(hit)) doc.selection.add(hit);
      } else if (!doc.selection.has(hit)) {
        doc.selection.clear();
        doc.selection.add(hit);
      }
      // several selected: drag them all up or down together; one: set it where the pointer is
      const notes = doc.selection.size > 1 ? [...doc.selection] : [hit];
      const relative = notes.length > 1;
      this.drag = { kind: 'vel', notes, orig: new Map(notes.map((n) => [n, n.on.b])), y0: y, grab: hit, relative, lastX: x, changed: false };
      if (!relative) this.velMove(this.drag, x, y);
      doc.emit('view');
      return;
    }
    // empty space: paint the bars the pointer passes over (only selected ones, if any)
    this.drag = { kind: 'vel', notes: [], orig: new Map(), y0: y, relative: false, lastX: x, changed: false };
    this.velMove(this.drag, x, y);
  }

  protected velMove(d: Extract<Drag, { kind: 'vel' }>, x: number, y: number): void {
    const doc = this.doc;
    if (d.grab) {
      if (d.relative) {
        const dv = Math.round(((d.y0 - y) / (VEL - 12)) * 127);
        for (const n of d.notes) setVelocity([n], d.orig.get(n)! + dv);
      } else setVelocity(d.notes, this.velOf(y));
      d.changed = true;
      doc.emit('view');
      return;
    }
    const ta = this.tOf(Math.min(d.lastX, x) - 3);
    const tb = this.tOf(Math.max(d.lastX, x) + 3);
    d.lastX = x;
    const v = this.velOf(y);
    const only = doc.selection.size ? doc.selection : undefined;
    for (const n of channelNotes(doc.song, doc.track)) {
      if (n.on.tick < ta || n.on.tick > tb || (only && !only.has(n))) continue;
      setVelocity([n], v);
      if (!d.notes.includes(n)) d.notes.push(n);
      d.changed = true;
    }
    doc.emit('view');
  }

  protected eraseAt(x: number, y: number): void {
    const hit = this.noteAt(x, y);
    const d = this.drag;
    if (!hit || d?.kind !== 'erase') return;
    deleteNotes(this.doc.song, [hit.note]);
    this.doc.selection.delete(hit.note);
    d.changed = true;
    this.doc.emit('view');
  }

  protected dbl(e: MouseEvent): void {
    const { x, y } = this.pos(e);
    const hit = this.noteAt(x, y);
    if (!hit) return;
    this.doc.edit(() => deleteNotes(this.doc.song, [hit.note]));
    this.doc.selection.delete(hit.note);
  }

  protected context(e: MouseEvent): void {
    const { x, y } = this.pos(e);
    const hit = this.noteAt(x, y);
    if (!hit) return;
    e.preventDefault();
    this.doc.edit(() => deleteNotes(this.doc.song, [hit.note]));
    this.doc.selection.delete(hit.note);
  }

  protected wheel(e: WheelEvent): void {
    e.preventDefault();
    const { x } = this.pos(e);
    if (e.ctrlKey || e.metaKey) {
      this.setZoom(this.zoom * Math.pow(1.0015, -e.deltaY), Math.max(KEYW, x));
      return;
    }
    const dx = e.shiftKey ? e.deltaY : e.deltaX;
    const dy = e.shiftKey ? 0 : e.deltaY;
    if (dx) this.scrollX = Math.max(0, this.scrollX + dx / this.zoom);
    if (dy) this.setTopKey(this.topKey - dy / this.rowH / 1.5);
    this.doc.emit('view');
  }
}
