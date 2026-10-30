// AudioWorklet that runs the OPL2 emulation and CMF sequencer on the audio thread,
// so music timing stays steady even while the game loop is busy.
import { Opl2 } from './opl';
import { CmfPlayer, TICK_RATE } from './cmfPlayer';

// Minimal typings for the AudioWorkletGlobalScope (not part of lib.dom).
declare const sampleRate: number;
declare function registerProcessor(name: string, ctor: unknown): void;
declare class AudioWorkletProcessor {
  readonly port: MessagePort;
}

export type MusicMessage =
  | { type: 'load'; music: Uint8Array; instruments: Uint8Array[] }
  | { type: 'stop' }
  | { type: 'pause'; paused: boolean }
  /** The engine is done with this node (the page's context lives on): stop processing. */
  | { type: 'end' };

class MusicProcessor extends AudioWorkletProcessor {
  private opl = new Opl2(sampleRate);
  private player = new CmfPlayer(this.opl);
  private untilTick = 0;
  private paused = false;
  private ended = false;
  private readonly samplesPerTick = sampleRate / TICK_RATE;

  constructor() {
    super();
    this.port.onmessage = (e: MessageEvent<MusicMessage>) => {
      const m = e.data;
      if (m.type === 'load') {
        this.player.load(m.music, m.instruments);
        this.untilTick = 0;
      } else if (m.type === 'stop') this.player.stop();
      else if (m.type === 'pause') this.paused = m.paused;
      else if (m.type === 'end') this.ended = true;
    };
  }

  process(_inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
    if (this.ended) return false;
    const out = outputs[0][0];
    if (!out) return true;
    if (this.paused) return true;
    let i = 0;
    while (i < out.length) {
      if (this.untilTick <= 0) {
        this.player.tick();
        this.untilTick += this.samplesPerTick;
      }
      const n = Math.min(out.length - i, Math.ceil(this.untilTick));
      this.opl.render(out.subarray(i, i + n));
      this.untilTick -= n;
      i += n;
    }
    for (let c = 1; c < outputs[0].length; c++) outputs[0][c].set(out);
    return true;
  }
}

registerProcessor('gm-music', MusicProcessor);
