// The "PC" a game runs on: screen, keyboard, pointer, audio and the game directory,
// plus the blocking BIOS/DOS style helpers playgame relied on, as async functions:
// PauseTimeKey (code/GM/GENC.C) and FadeTo/FadeAllTo (code/GM/PALC.C). Where the C
// busy-waited, these await animation frames, so every wait is also a screen refresh.
import { Screen } from '../gfx/screen';
import { Keyboard, type TypedKey } from '../input/keyboard';
import { listenDeskMouse, Mickeys } from '../input/deskMouse';
import { AudioEngine } from '../audio/engine';
import { GameFiles } from '../project/files';
import { PALETTE_SIZE } from '../formats/palette';

/** GetKey polls a second on a 1994 PC waiting for a key (~6000; sets how long demo screens stay up). */
const POLLS_PER_MS = 6;

/** Thrown to unwind the game when the player is closed. */
export class GameAborted extends Error {
  constructor() {
    super('Game aborted');
  }
}

export interface PointerState {
  /** Screen coordinates (0..319, 0..199) of the last pointer position. */
  x: number;
  y: number;
  clicks: number;
}

/** How a Machine is driven (the defaults are a live player's). */
export interface MachineOptions {
  /**
   * 'manual': no animation frame loop; whoever made the Machine calls presentFrame() for
   * each frame, and now() is theirs too (a walkthrough steps the game on a clock of its own).
   */
  frames?: 'auto' | 'manual';
  /** False: the pointer, the desk mouse and the keyboard never reach the game. */
  input?: boolean;
}

export class Machine {
  readonly screen: Screen;
  readonly keyboard = new Keyboard();
  readonly audio: AudioEngine;
  files: GameFiles;
  readonly pointer: PointerState = { x: 160, y: 100, clicks: 0 };
  aborted = false;
  private frameWaiters: (() => void)[] = [];
  private raf = 0;
  /** The ball mouse on the desk moves the pointer and clicks too. */
  private offDeskMouse!: () => void;

  constructor(canvas: HTMLCanvasElement, files: GameFiles, audio = new AudioEngine(), opts: MachineOptions = {}) {
    this.screen = new Screen(canvas);
    this.files = files;
    this.audio = audio;
    if (opts.input === false) {
      this.offDeskMouse = () => undefined;
      this.keyboard.attach = () => undefined;
    } else this.listen(canvas);
    if (opts.frames === 'manual') return;
    const loop = () => {
      this.presentFrame();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  private listen(canvas: HTMLCanvasElement): void {
    canvas.addEventListener('pointerdown', this.onPointer);
    canvas.addEventListener('pointermove', this.onMove);
    const mickeys = new Mickeys();
    let held = 0;
    this.offDeskMouse = listenDeskMouse((dx, dy, buttons) => {
      const [x, y] = mickeys.take(dx, dy);
      this.pointer.x = Math.max(0, Math.min(319, this.pointer.x + x));
      this.pointer.y = Math.max(0, Math.min(199, this.pointer.y + y));
      if (buttons & ~held) {
        this.pointer.clicks++;
        void this.audio.resume();
      }
      held = buttons;
    });
  }

  /** The time in ms the game goes by (waits, fades, animations, the game clock). */
  now(): number {
    return performance.now();
  }

  /** One display frame: the screen is shown (unless `show` is false) and everything waiting for a frame goes on. */
  presentFrame(show = true): void {
    if (show) this.screen.present();
    const w = this.frameWaiters;
    this.frameWaiters = [];
    w.forEach((f) => f());
  }

  /** How many are waiting for the next frame (a stepped Machine's game is idle when one is). */
  get frameWaiting(): number {
    return this.frameWaiters.length;
  }

  private toScreen(e: PointerEvent): void {
    const r = this.screen.canvas.getBoundingClientRect();
    this.pointer.x = Math.floor(((e.clientX - r.left) / r.width) * 320);
    this.pointer.y = Math.floor(((e.clientY - r.top) / r.height) * 200);
  }

  private onPointer = (e: PointerEvent) => {
    this.toScreen(e);
    this.pointer.clicks++;
    void this.audio.resume();
  };

  private onMove = (e: PointerEvent) => this.toScreen(e);

  destroy(): void {
    this.aborted = true;
    cancelAnimationFrame(this.raf);
    this.keyboard.detach();
    this.audio.stopAll();
    this.screen.canvas.removeEventListener('pointerdown', this.onPointer);
    this.screen.canvas.removeEventListener('pointermove', this.onMove);
    this.offDeskMouse();
    const w = this.frameWaiters;
    this.frameWaiters = [];
    w.forEach((f) => f());
  }

  /** Told when the game waits for files still on their way (true) and when they are in. */
  onLoading?: (loading: boolean) => void;

  /**
   * Waits for game files still on their way from the site (a hosted game starts before
   * all its files are in, project/streamGame.ts); a short wait shows no cue. Names the
   * game doesn't have, or that are in already, return at once.
   */
  async need(...names: (string | undefined)[]): Promise<void> {
    const wait = this.files.stream?.need(names.filter((n): n is string => !!n));
    if (!wait) return;
    const cue = setTimeout(() => this.onLoading?.(true), 150);
    try {
      await wait;
    } finally {
      clearTimeout(cue);
      this.onLoading?.(false);
    }
    // the time spent loading was no GetKey polling on the DOS PC (demo playback)
    this.polledAt = this.now();
    this.checkAbort();
  }

  /** Fetches these game files next, if they are still on their way, without waiting. */
  want(...names: (string | undefined)[]): void {
    this.files.stream?.want(names.filter((n): n is string => !!n));
  }

  checkAbort(): void {
    if (this.aborted) throw new GameAborted();
  }

  /** Waits for the next animation frame (the screen is presented every frame). */
  frame(): Promise<void> {
    this.checkAbort();
    this.pollKeys();
    return new Promise<void>((resolve) => this.frameWaiters.push(resolve)).then(() => this.checkAbort());
  }

  async sleep(ms: number): Promise<void> {
    const end = this.now() + ms;
    while (this.now() < end) await this.frame();
  }

  takeClick(): boolean {
    if (!this.pointer.clicks) return false;
    this.pointer.clicks = 0;
    return true;
  }

  /**
   * PauseTimeKey: waits up to `seconds` (forever if omitted) for a key or click.
   * Returns the key, a pseudo key for a click (ascii 1, as the C returned 1 for a mouse
   * button; scan 28 is Enter's), or undefined on time out (the C returned FALSE).
   */
  async pauseTimeKey(seconds = Infinity): Promise<TypedKey | undefined> {
    const end = this.now() + seconds * 1000;
    this.takeClick();
    return this.waiting(async () => {
      for (;;) {
        const k = this.keyboard.readKey();
        if (k) return k;
        if (this.takeClick()) return { scan: 28, ascii: 1, key: '' };
        if (this.now() >= end) return undefined;
        await this.frame();
      }
    });
  }

  private waitDepth = 0;
  private polledAt = 0;

  /**
   * Runs `fn` as PLAYGAME code that read keys through GetKey (key waits, pictures,
   * animations, text pages): while it runs, each frame hands the demo recorder the polls
   * the DOS PC would have made meanwhile (keyPoll). Gameplay itself stole the keyboard
   * interrupt and never called GetKey, so it does not count.
   */
  async waiting<T>(fn: () => Promise<T>): Promise<T> {
    if (this.waitDepth++ === 0) this.polledAt = this.now();
    try {
      return await fn();
    } finally {
      if (--this.waitDepth === 0 && this.keyPollEnd) for (const key of this.keyPollEnd()) this.keyboard.feed(key);
    }
  }

  private pollKeys(): void {
    if (!this.keyPoll || this.waitDepth === 0) return;
    const now = this.now();
    const polls = Math.max(1, Math.round((now - this.polledAt) * POLLS_PER_MS));
    this.polledAt = now;
    for (const key of this.keyPoll(polls)) this.keyboard.feed(key);
  }

  /**
   * Demo playback: called while a screen waits for a key with how many GetKey polls the
   * DOS PC would have made meanwhile; returns recorded keys that become pending.
   */
  keyPoll?: (polls: number) => number[];
  /** Demo playback: a key-reading screen ended; returns recorded keys it must have taken. */
  keyPollEnd?: () => number[];

  /** Clears keyboard input (while (GetKey(1)) GetKey(0)). */
  flushKeys(): void {
    this.keyboard.clear();
    this.pointer.clicks = 0;
  }

  /**
   * FadeTo: 65 retrace-synchronized steps from the current palette to `dest`. The C
   * waited for one VGA vertical retrace (70 Hz in mode 13h) per step, hence steps/70 s;
   * it stepped each channel Bresenham-style, which the truncated d*step/steps matches
   * at every step.
   */
  async fadeTo(dest: ArrayLike<number>, steps = 65): Promise<void> {
    const from = this.screen.palette.slice();
    const start = this.now();
    const duration = (steps / 70) * 1000;
    for (;;) {
      const t = Math.min(1, (this.now() - start) / duration);
      const step = Math.floor(t * steps);
      const pal = new Uint8Array(PALETTE_SIZE);
      for (let i = 0; i < PALETTE_SIZE; i++) {
        const d = (dest[i] ?? 0) - from[i];
        pal[i] = from[i] + Math.trunc((d * step) / steps);
      }
      this.screen.setPalette(pal);
      if (t >= 1) break;
      await this.frame();
    }
    this.screen.setPalette(dest);
  }

  async fadeAllTo(r: number, g: number, b: number, steps = 65): Promise<void> {
    const dest = new Uint8Array(PALETTE_SIZE);
    for (let i = 0; i < 256; i++) dest.set([r, g, b], i * 3);
    await this.fadeTo(dest, steps);
  }
}
