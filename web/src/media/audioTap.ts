// The sound for a screen recording: every AudioContext's output (audio/output.ts), mixed
// into one track. Each context feeds a MediaStream destination of its own; one mixing
// context listens to all of them.
import { tapOutputs } from '../audio/output';

export class AudioMix {
  private mix = new AudioContext();
  private dest = this.mix.createMediaStreamDestination();
  private untap: () => void;
  private links: (() => void)[] = [];

  /**
   * Only the contexts `want` accepts (default: all, including ones made while recording),
   * or just one node's sound (a game's, audio/engine.ts `node`).
   */
  constructor(want?: ((ctx: BaseAudioContext) => boolean) | AudioNode) {
    void this.mix.resume().catch(() => undefined);
    const add = (ctx: BaseAudioContext, node: AudioNode) => {
      if (typeof want === 'function' && !want(ctx)) return;
      if (!('createMediaStreamDestination' in ctx)) return; // offline rendering
      const out = (ctx as AudioContext).createMediaStreamDestination();
      node.connect(out);
      const src = this.mix.createMediaStreamSource(out.stream);
      src.connect(this.dest);
      this.links.push(() => {
        try {
          node.disconnect(out);
        } catch {
          /* already gone */
        }
        src.disconnect();
      });
    };
    if (want instanceof AudioNode) {
      add(want.context, want);
      this.untap = () => undefined;
      return;
    }
    this.untap = tapOutputs(add);
  }

  get track(): MediaStreamTrack {
    return this.dest.stream.getAudioTracks()[0];
  }

  dispose(): void {
    this.untap();
    this.links.forEach((f) => f());
    this.track.stop();
    void this.mix.close().catch(() => undefined);
  }
}
