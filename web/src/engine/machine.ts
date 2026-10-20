// The "PC" a game runs on: screen, keyboard, pointer, audio and the game directory,
// plus the blocking BIOS/DOS style helpers playgame relied on, as async functions.
import { Screen } from '../gfx/screen';
import { Keyboard, type TypedKey } from '../input/keyboard';
import { AudioEngine } from '../audio/engine';
import { GameFiles } from '../project/files';
import { PALETTE_SIZE } from '../formats/palette';

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

export class Machine {
  readonly screen: Screen;
  readonly keyboard = new Keyboard();
  readonly audio: AudioEngine;
  files: GameFiles;
  readonly pointer: PointerState = { x: 160, y: 100, clicks: 0 };
  aborted = false;
  private frameWaiters: (() => void)[] = [];
  private raf = 0;

  constructor(canvas: HTMLCanvasElement, files: GameFiles, audio = new AudioEngine()) {
    this.screen = new Screen(canvas);
    this.files = files;
    this.audio = audio;
    canvas.addEventListener('pointerdown', this.onPointer);
    canvas.addEventListener('pointermove', this.onMove);
    const loop = () => {
      this.screen.present();
      const w = this.frameWaiters;
      this.frameWaiters = [];
      w.forEach((f) => f());
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
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
    const w = this.frameWaiters;
    this.frameWaiters = [];
    w.forEach((f) => f());
  }

  checkAbort(): void {
    if (this.aborted) throw new GameAborted();
  }

  /** Waits for the next animation frame (the screen is presented every frame). */
  frame(): Promise<void> {
    this.checkAbort();
    return new Promise<void>((resolve) => this.frameWaiters.push(resolve)).then(() => this.checkAbort());
  }

  async sleep(ms: number): Promise<void> {
    const end = performance.now() + ms;
    while (performance.now() < end) await this.frame();
  }

  takeClick(): boolean {
    if (!this.pointer.clicks) return false;
    this.pointer.clicks = 0;
    return true;
  }

  /**
   * PauseTimeKey: waits up to `seconds` (forever if omitted) for a key or click.
   * Returns the key, a pseudo key with ascii 13 for a click, or undefined on time out.
   */
  async pauseTimeKey(seconds = Infinity): Promise<TypedKey | undefined> {
    const end = performance.now() + seconds * 1000;
    this.takeClick();
    for (;;) {
      const k = this.keyboard.readKey();
      if (k) return k;
      if (this.takeClick()) return { scan: 28, ascii: 1, key: '' };
      if (performance.now() >= end) return undefined;
      await this.frame();
    }
  }

  /** Clears keyboard input (while (GetKey(1)) GetKey(0)). */
  flushKeys(): void {
    this.keyboard.clear();
    this.pointer.clicks = 0;
  }

  /** FadeTo: 65 retrace-synchronized steps from the current palette to `dest`. */
  async fadeTo(dest: ArrayLike<number>, steps = 65): Promise<void> {
    const from = this.screen.palette.slice();
    const start = performance.now();
    const duration = (steps / 70) * 1000;
    for (;;) {
      const t = Math.min(1, (performance.now() - start) / duration);
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
