// The music editor's document: the song being edited, what is selected, undo, and
// playback through the app's own OPL2 emulation (the same PlayIt code the games use).
import type { Project } from '../../core/project';
import { audio } from '../../widgets/mediaShared';
import { TICK_RATE } from '../../../audio/cmfPlayer';
import { auditionSong, buildPreview, type Preview } from '../../../formats/cmfPreview';
import { channelSounds, DEFAULT_VELOCITY, extendEnd, startMode, startProgram, usedChannels } from '../../../formats/cmfEdit';
import { readSong, RHYTHM_CHANNELS, writeSong, type CmfSong, type Note, DRUM_NAMES } from '../../../formats/cmfSong';
import { presetName } from './sbi';
import { presetPreview } from '../../../audio/oplPresetPreview';
import type { OplPreset } from '../../../audio/oplPatch';

/** What changed: the song itself, the view (scroll, zoom, selection), the selected track, or playback. */
type Change = 'song' | 'view' | 'track' | 'play';

/** One color per MIDI channel, from the EGA palette. */
export const TRACK_COLORS = [
  '#55ffff',
  '#ff55ff',
  '#ffff55',
  '#55ff55',
  '#ff5555',
  '#7f7fff',
  '#ffaa00',
  '#ff88cc',
  '#00cccc',
  '#cc66ff',
  '#aaaaaa',
  '#ff9955',
  '#ffdd88',
  '#88ff88',
  '#88ccff',
  '#ffffff',
];

export const SNAPS: [number, string][] = [
  [4, 'Bar'],
  [1, 'Beat'],
  [0.5, '1/2 beat'],
  [1 / 3, '1/3 beat'],
  [0.25, '1/4 beat'],
  [0.125, '1/8 beat'],
  [0, 'Off'],
];

export class MusicDoc {
  song: CmfSong;
  track = 0;
  selection = new Set<Note>();
  muted = new Set<number>();
  solo = new Set<number>();
  /** Tracks added but still empty. */
  extra = new Set<number>();
  cursor = 0;
  loop: [number, number] | null = null;
  loopOn = false;
  playhead: number | null = null;
  snapBeats = 0.25;
  noteLen: number;
  /** Velocity for new notes and for trying notes (the last one set). */
  velocity = DEFAULT_VELOCITY;
  tool: 'draw' | 'select' | 'erase' | 'pan' = 'draw';
  follow = true;
  ghosts = true;
  clipboard: { dt: number; len: number; key: number; vel: number }[] = [];

  private undoStack: Uint8Array[] = [];
  private redoStack: Uint8Array[] = [];
  private listeners = new Set<(c: Change) => void>();
  private saveTimer?: ReturnType<typeof setTimeout>;
  private preview?: { p: Preview; t0: number };
  private frame = 0;
  private restartTimer?: ReturnType<typeof setTimeout>;
  private auditionTimer?: ReturnType<typeof setTimeout>;

  constructor(
    readonly project: Project,
    readonly file: string,
  ) {
    this.song = readSong(project.files.get(file)!);
    this.noteLen = this.beat;
    this.track = this.tracks()[0] ?? 0;
  }

  // ---- notifications ----

  on(fn: (c: Change) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  emit(c: Change): void {
    for (const fn of this.listeners) fn(c);
  }

  // ---- facts ----

  get beat(): number {
    return Math.max(1, this.song.ticksPerBeat || 48);
  }

  get snap(): number {
    return this.snapBeats ? Math.max(1, Math.round(this.beat * this.snapBeats)) : 1;
  }

  quantize(t: number): number {
    const s = this.snap;
    return Math.max(0, Math.round(t / s) * s);
  }

  get rhythm(): boolean {
    return startMode(this.song);
  }

  tracks(): number[] {
    const set = new Set([...usedChannels(this.song), ...this.extra]);
    return [...set].sort((a, b) => a - b);
  }

  trackName(ch: number): string {
    if (this.rhythm && RHYTHM_CHANNELS.includes(ch)) return DRUM_NAMES[ch];
    const p = startProgram(this.song, ch);
    const preset = this.song.instruments[p] ? presetName(this.song.instruments[p]) : undefined;
    return preset ? preset[0].toUpperCase() + preset.slice(1) : `Track ${ch + 1}`;
  }

  sounds(ch: number): boolean {
    return channelSounds(ch, this.rhythm);
  }

  heard(ch: number): boolean {
    return this.solo.size ? this.solo.has(ch) : !this.muted.has(ch);
  }

  /** Channels that can take a new track. */
  freeChannels(): number[] {
    const used = new Set(this.tracks());
    const out: number[] = [];
    for (let c = 0; c < 16; c++) if (!used.has(c) && this.sounds(c)) out.push(c);
    return out;
  }

  seconds(ticks: number): string {
    const s = Math.max(0, ticks) / TICK_RATE;
    return `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, '0')}`;
  }

  barBeat(ticks: number): string {
    const beat = Math.floor(Math.max(0, ticks) / this.beat);
    return `${Math.floor(beat / 4) + 1}.${(beat % 4) + 1}`;
  }

  // ---- editing ----

  /** Call before changing the song (once per gesture). */
  begin(): void {
    this.undoStack.push(writeSong(this.song));
    if (this.undoStack.length > 200) this.undoStack.shift();
    this.redoStack = [];
  }

  /** Call after changing the song. */
  commit(): void {
    extendEnd(this.song);
    this.scheduleSave();
    this.emit('song');
    if (this.preview) {
      clearTimeout(this.restartTimer);
      this.restartTimer = setTimeout(() => void this.play(this.playhead ?? this.cursor), 250);
    }
  }

  /** A gesture that changed nothing: forget its undo step. */
  undoDiscard(): void {
    this.undoStack.pop();
  }

  edit(fn: () => void): void {
    this.begin();
    fn();
    this.commit();
  }

  get canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  get canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  undo(): void {
    const prev = this.undoStack.pop();
    if (!prev) return;
    this.redoStack.push(writeSong(this.song));
    this.restore(prev);
  }

  redo(): void {
    const next = this.redoStack.pop();
    if (!next) return;
    this.undoStack.push(writeSong(this.song));
    this.restore(next);
  }

  private restore(bytes: Uint8Array): void {
    this.song = readSong(bytes);
    this.selection.clear();
    this.commit();
    this.emit('track');
  }

  private scheduleSave(): void {
    clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this.save(), 300);
  }

  save(): void {
    clearTimeout(this.saveTimer);
    this.saveTimer = undefined;
    this.project.files.set(this.file, writeSong(this.song));
  }

  selectTrack(ch: number): void {
    if (ch === this.track) return;
    this.track = ch;
    this.selection.clear();
    this.emit('track');
    this.emit('view');
  }

  // ---- playback ----

  get playing(): boolean {
    return !!this.preview;
  }

  mutedSet(): Set<number> {
    const m = new Set<number>();
    for (let c = 0; c < 16; c++) if (!this.heard(c)) m.add(c);
    return m;
  }

  async play(from = this.cursor): Promise<void> {
    clearTimeout(this.restartTimer);
    const loop = this.loopOn && this.loop ? this.loop : undefined;
    const p = buildPreview(this.song, { muted: this.mutedSet(), from: Math.max(0, from), loop });
    await audio.resume();
    if (!(await audio.playSong(p.bytes))) return;
    const ctx = audio.context!;
    this.preview = { p, t0: ctx.currentTime };
    cancelAnimationFrame(this.frame);
    const step = () => {
      if (!this.preview) return;
      const lag = ctx.outputLatency || ctx.baseLatency || 0;
      const t = Math.max(0, (ctx.currentTime - this.preview.t0 - lag) * TICK_RATE);
      const s = this.preview.p.songTick(Math.floor(t));
      this.playhead = s < 0 ? 0 : s;
      this.emit('play');
      this.frame = requestAnimationFrame(step);
    };
    this.frame = requestAnimationFrame(step);
    this.emit('play');
  }

  stop(): void {
    clearTimeout(this.restartTimer);
    cancelAnimationFrame(this.frame);
    if (this.preview) audio.stopSong();
    this.preview = undefined;
    this.playhead = null;
    this.emit('play');
  }

  /** Mute or solo changed: hear it at once. */
  remix(): void {
    if (this.preview) void this.play(this.playhead ?? this.cursor);
  }

  /** Plays one note (only while the song is not playing). */
  async audition(ch: number, key: number, program = startProgram(this.song, ch), ticks = 60, vel = this.velocity): Promise<void> {
    if (this.preview) return;
    await audio.resume();
    await audio.playSong(auditionSong(this.song, ch, program, key, ticks, vel));
    clearTimeout(this.auditionTimer);
    this.auditionTimer = setTimeout(() => !this.preview && audio.stopSong(), (ticks / TICK_RATE) * 1000 + 1500);
  }

  /** Plays a preset's short phrase (stopping the song if it is playing). */
  async previewPreset(p: OplPreset): Promise<void> {
    if (this.preview) this.stop();
    const { bytes, seconds } = presetPreview(p);
    await audio.resume();
    await audio.playSong(bytes);
    clearTimeout(this.auditionTimer);
    this.auditionTimer = setTimeout(() => !this.preview && audio.stopSong(), seconds * 1000);
  }

  /** Stops a preset's phrase or a tried note. */
  stopPreview(): void {
    clearTimeout(this.auditionTimer);
    if (!this.preview) audio.stopSong();
  }

  dispose(): void {
    this.stop();
    clearTimeout(this.auditionTimer);
    audio.stopSong();
    if (this.saveTimer) this.save();
    this.listeners.clear();
  }
}
