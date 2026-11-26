// Browser-side playback evidence for the offline check's detached tour audio and Web Audio phone line.
import type { BrowserContext } from 'playwright-core';

export async function observePlayback(ctx: BrowserContext): Promise<string[]> {
  const clips: string[] = [];
  await ctx.exposeFunction('__offlinePlayed', (url: string) => clips.push(url));
  await ctx.addInitScript(() => {
    const played = (window as unknown as { __offlinePlayed: (url: string) => Promise<void> }).__offlinePlayed;
    /* eslint-disable @typescript-eslint/unbound-method -- Each wrapper calls the original with its receiver. */
    const play = HTMLMediaElement.prototype.play;
    const arrayBuffer = Response.prototype.arrayBuffer;
    const decode = BaseAudioContext.prototype.decodeAudioData;
    const start = AudioBufferSourceNode.prototype.start;
    /* eslint-enable @typescript-eslint/unbound-method */
    HTMLMediaElement.prototype.play = async function () {
      await play.call(this);
      if (this.currentSrc.includes('/tour/voice/')) await played(this.currentSrc);
    };

    // Follow the phone recording from its response to the source node that plays that same buffer.
    const urls = new WeakMap<ArrayBuffer | AudioBuffer, string>();
    Response.prototype.arrayBuffer = async function () {
      const bytes = await arrayBuffer.call(this);
      if (this.url.includes('/phone/voice/')) urls.set(bytes, this.url);
      return bytes;
    };
    BaseAudioContext.prototype.decodeAudioData = async function (...args) {
      const buffer = await decode.apply(this, args);
      const url = urls.get(args[0]);
      if (url) urls.set(buffer, url);
      return buffer;
    };
    AudioBufferSourceNode.prototype.start = function (when = 0, offset = 0, duration) {
      start.call(this, when, offset, duration);
      const url = this.buffer && urls.get(this.buffer);
      if (!url || !this.buffer) return;
      const end = Math.max(this.context.currentTime, when) + (duration ?? this.buffer.duration - offset);
      this.addEventListener(
        'ended',
        () => {
          if (this.context.currentTime >= end) void played(url);
        },
        { once: true },
      );
    };
  });
  return clips;
}
