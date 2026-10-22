// "Download MP4": the walkthrough rendered frame by frame, faster than real time, at exactly
// 320×200 and 60 frames a second, with its soundtrack rendered offline (audioRender.ts):
// H.264 from WebCodecs' VideoEncoder, AAC (or Opus where the browser has no AAC encoder)
// from its AudioEncoder, put together by mp4av.ts.
import { canEncodeMp4 } from '../media/video';
import type { GameFiles } from '../project/files';
import { AudioRenderer } from './audioRender';
import { WALKTHROUGH_FPS, type Walkthrough } from './format';
import { muxAv, type AvSample } from './mp4av';
import { headlessCanvas, screenRgba, WalkRun } from './runtime';

const W = 320;
const H = 200;
const RATE = 48000;
const PER_FRAME = RATE / WALKTHROUGH_FPS;

export interface ExportOptions {
  files: GameFiles;
  gam: string;
  walk: Walkthrough;
  /** The frames to make (default: the whole walkthrough). */
  from?: number;
  to?: number;
  onProgress?: (done: number, total: number) => void;
  signal?: AbortSignal;
}

export interface ExportResult {
  blob: Blob;
  frames: number;
  /** The sound's codec, or 'none' when the browser can't encode either. */
  audio: 'aac' | 'opus' | 'none';
}

async function audioCodec(): Promise<{ codec: string; kind: 'aac' | 'opus' } | undefined> {
  if (typeof AudioEncoder === 'undefined') return undefined;
  for (const [codec, kind] of [
    ['mp4a.40.2', 'aac'],
    ['opus', 'opus'],
  ] as const) {
    try {
      const r = await AudioEncoder.isConfigSupported({ codec, sampleRate: RATE, numberOfChannels: 1, bitrate: 128000 });
      if (r.supported) return { codec, kind };
    } catch {
      /* the next */
    }
  }
  return undefined;
}

/** Whether this browser can make the video at all (an H.264 encoder). */
export async function canExport(): Promise<boolean> {
  return !!(await canEncodeMp4(W, H));
}

const aborted = () => new DOMException('The video was cancelled', 'AbortError');

export async function exportWalkthrough(o: ExportOptions): Promise<ExportResult> {
  const vcodec = await canEncodeMp4(W, H);
  if (!vcodec) throw new Error('This browser has no H.264 video encoder (WebCodecs).');
  const acodec = await audioCodec();

  let fail: Error | undefined;
  const video: AvSample[] = [];
  let avcC: Uint8Array | undefined;
  const venc = new VideoEncoder({
    output: (chunk, meta) => {
      const d = meta?.decoderConfig?.description;
      if (d && !avcC) avcC = new Uint8Array(d instanceof ArrayBuffer ? d : (d as ArrayBufferView).buffer).slice();
      const data = new Uint8Array(chunk.byteLength);
      chunk.copyTo(data);
      video.push({ data, duration: 1, key: chunk.type === 'key' });
    },
    error: (e) => (fail = e instanceof Error ? e : new Error(String(e))),
  });
  // Pixel art with hard edges: enough bits that it stays sharp, without the whole game's worth of memory.
  venc.configure({ codec: vcodec, width: W, height: H, bitrate: 700_000, bitrateMode: 'variable', framerate: WALKTHROUGH_FPS, avc: { format: 'avc' }, latencyMode: 'quality' });

  const audio: AvSample[] = [];
  let aconfig: Uint8Array | undefined;
  const aenc = acodec
    ? new AudioEncoder({
        output: (chunk, meta) => {
          const d = meta?.decoderConfig?.description;
          if (d && !aconfig) aconfig = new Uint8Array(d instanceof ArrayBuffer ? d : (d as ArrayBufferView).buffer).slice();
          const data = new Uint8Array(chunk.byteLength);
          chunk.copyTo(data);
          audio.push({ data, duration: chunk.duration ? Math.round((chunk.duration * RATE) / 1e6) : acodec.kind === 'aac' ? 1024 : 960, key: true });
        },
        error: (e) => (fail = e instanceof Error ? e : new Error(String(e))),
      })
    : undefined;
  aenc?.configure({ codec: acodec!.codec, sampleRate: RATE, numberOfChannels: 1, bitrate: 128000 });

  const run = new WalkRun(headlessCanvas(), o.files.copy(), o.gam, o.walk);
  run.audio.logging = true;
  const sound = new AudioRenderer(run.audio.events, RATE);
  const from = Math.max(0, o.from ?? 0);
  const to = Math.min(o.to ?? o.walk.timeline.frames, o.walk.timeline.frames + WALKTHROUGH_FPS);
  const total = Math.max(1, to - from);
  const rgba = new Uint8ClampedArray(W * H * 4);
  const pause = () => new Promise((r) => setTimeout(r, 0));
  try {
    await run.start();
    // up to the first frame wanted, nothing drawn or encoded (the sound still follows, so the music is where it should be)
    while (run.frame < from && (await run.step(false))) {
      sound.render(PER_FRAME);
      if (run.frame % 600 === 0) {
        if (o.signal?.aborted) throw aborted();
        o.onProgress?.(0, total);
        await pause();
      }
    }
    for (let f = from; f < to; f++) {
      if (o.signal?.aborted) throw aborted();
      if (fail) throw fail;
      if (f > from && !(await run.step(false))) break;
      const us = Math.round(((f - from) * 1e6) / WALKTHROUGH_FPS);
      const frame = new VideoFrame(screenRgba(run.m, rgba), { format: 'RGBA', codedWidth: W, codedHeight: H, timestamp: us, duration: Math.round(1e6 / WALKTHROUGH_FPS) });
      venc.encode(frame, { keyFrame: (f - from) % (WALKTHROUGH_FPS * 2) === 0 });
      frame.close();
      const pcm = sound.render(PER_FRAME);
      if (aenc) {
        const data = new AudioData({ format: 'f32', sampleRate: RATE, numberOfFrames: PER_FRAME, numberOfChannels: 1, timestamp: us, data: pcm as Float32Array<ArrayBuffer> });
        aenc.encode(data);
        data.close();
      }
      if ((f - from) % 30 === 0) {
        o.onProgress?.(f - from, total);
        // let the page breathe, and the encoders catch up
        await pause();
        while (venc.encodeQueueSize > 24 || (aenc?.encodeQueueSize ?? 0) > 48) await new Promise((r) => setTimeout(r, 2));
      }
    }
    await venc.flush();
    await aenc?.flush();
    if (fail) throw fail;
    if (!avcC) throw new Error('The encoder gave no H.264 configuration.');
    o.onProgress?.(total, total);
    const blob = muxAv(
      { width: W, height: H, timescale: WALKTHROUGH_FPS, avcC, samples: video },
      aenc && audio.length ? { codec: acodec!.kind, sampleRate: RATE, channels: 1, config: aconfig, samples: audio } : undefined,
    );
    return { blob, frames: video.length, audio: aenc && audio.length ? acodec!.kind : 'none' };
  } finally {
    run.stop();
    if (venc.state !== 'closed') venc.close();
    if (aenc && aenc.state !== 'closed') aenc.close();
  }
}
