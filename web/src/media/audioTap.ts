// The sound for a screen recording: every AudioContext's line out (audio/output.ts), mixed
// into one track. The mix is made on the page's own context (audio/context.ts), which is
// where everything plays: its sound goes straight in, with no second context that could
// start suspended (an armed recording starts without a click), run at another sample rate
// or add a hop of latency between the picture and the sound. Any other context feeds a
// MediaStream destination of its own, which the mix listens to.
import { audioContext } from '../audio/context';
import { tapOutputs } from '../audio/output';

export class AudioMix {
  private page = audioContext();
  private mix = this.page ?? new AudioContext();
  private dest = this.mix.createMediaStreamDestination();
  private untap: () => void;
  private links: (() => void)[] = [];

  /**
   * Only the contexts `want` accepts (default: all, including ones made while recording),
   * or just one node's sound (a game's, audio/engine.ts `node`).
   */
  constructor(want?: ((ctx: BaseAudioContext) => boolean) | AudioNode) {
    // (the page's context is resumed by the page's own gesture listeners)
    if (!this.page) void this.mix.resume().catch(() => undefined);
    const add = (ctx: BaseAudioContext, node: AudioNode) => {
      if (typeof want === 'function' && !want(ctx)) return;
      if (ctx === this.mix) {
        node.connect(this.dest);
        this.links.push(() => {
          try {
            node.disconnect(this.dest);
          } catch {
            /* already gone */
          }
        });
        return;
      }
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
    if (!this.page) void this.mix.close().catch(() => undefined);
  }
}
