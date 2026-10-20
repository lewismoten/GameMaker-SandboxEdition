// Video files from canvases.
//
//  - Frame by frame (animations, exact timing, faster than real time): WebCodecs'
//    VideoEncoder makes H.264 and mp4Mux.ts puts it in an .mp4. Chrome, Edge and Safari 16.4+
//    have it; Firefox has VideoEncoder from 130 but often no H.264 encoder.
//  - Live (the desk's screen and a game played back, with sound): MediaRecorder on the
//    canvas' stream plus an audio track. MP4 (H.264 + AAC/Opus) where the browser records it
//    (Chrome 126+, Edge, Safari); WebM (VP9/VP8 + Opus) otherwise (Firefox).
import { muxMp4, type Mp4Sample } from './mp4Mux';

/** Is frame-by-frame MP4 encoding available? */
export async function canEncodeMp4(width: number, height: number): Promise<string | undefined> {
  if (typeof VideoEncoder === 'undefined' || typeof VideoFrame === 'undefined') return undefined;
  // High, Main, then Baseline: hardware encoders differ in what they take.
  for (const codec of ['avc1.640028', 'avc1.4d0028', 'avc1.42001f', 'avc1.42e01e']) {
    try {
      const r = await VideoEncoder.isConfigSupported({ codec, width, height, bitrate: 4_000_000, avc: { format: 'avc' } });
      if (r.supported) return codec;
    } catch {
      /* try the next */
    }
  }
  return undefined;
}

/**
 * Encodes frames into an .mp4. Add each frame (a canvas of the video's size) with how long
 * it shows, in `timescale` units; finish() resolves with the file.
 */
export class Mp4Encoder {
  private samples: Mp4Sample[] = [];
  private durations: number[] = [];
  private avcC?: Uint8Array;
  private encoder: VideoEncoder;
  private error?: Error;
  private time = 0;
  private count = 0;
  private lastKey = -Infinity;

  private constructor(
    readonly width: number,
    readonly height: number,
    readonly timescale: number,
    codec: string,
  ) {
    this.encoder = new VideoEncoder({
      output: (chunk, meta) => {
        const desc = meta?.decoderConfig?.description;
        if (desc && !this.avcC) this.avcC = new Uint8Array(desc instanceof ArrayBuffer ? desc : (desc as ArrayBufferView).buffer).slice();
        const data = new Uint8Array(chunk.byteLength);
        chunk.copyTo(data);
        this.samples.push({ data, duration: 0, key: chunk.type === 'key' });
      },
      error: (e) => (this.error = e instanceof Error ? e : new Error(String(e))),
    });
    // Plenty of bits: these are small pictures with hard edges that must stay sharp.
    this.encoder.configure({ codec, width, height, bitrate: Math.max(2_000_000, width * height * 40), avc: { format: 'avc' }, latencyMode: 'quality' });
  }

  static async create(width: number, height: number, timescale: number): Promise<Mp4Encoder | undefined> {
    const codec = await canEncodeMp4(width, height);
    return codec ? new Mp4Encoder(width, height, timescale, codec) : undefined;
  }

  /** Adds a frame shown for `duration` timescale units. */
  async add(canvas: HTMLCanvasElement | OffscreenCanvas, duration: number): Promise<void> {
    if (this.error) throw this.error;
    const us = (t: number) => Math.round((t * 1e6) / this.timescale);
    const frame = new VideoFrame(canvas, { timestamp: us(this.time), duration: us(duration) });
    // a key frame every two seconds, so players can seek
    const key = this.count === 0 || this.time - this.lastKey >= 2 * this.timescale;
    if (key) this.lastKey = this.time;
    this.encoder.encode(frame, { keyFrame: key });
    frame.close();
    this.durations.push(duration);
    this.time += duration;
    this.count++;
    while (this.encoder.encodeQueueSize > 8) await new Promise((r) => setTimeout(r, 1));
  }

  async finish(): Promise<Uint8Array> {
    await this.encoder.flush();
    this.encoder.close();
    if (this.error) throw this.error;
    if (!this.avcC) throw new Error('The encoder gave no H.264 configuration');
    this.samples.forEach((s, i) => (s.duration = this.durations[i] ?? 1));
    return muxMp4({ width: this.width, height: this.height, timescale: this.timescale, avcC: this.avcC, samples: this.samples });
  }
}

/** The best format MediaRecorder can make here, MP4 first. */
export function recorderFormat(withAudio: boolean): { mime: string; ext: 'mp4' | 'webm' } | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined;
  const mp4 = withAudio
    ? [
        'video/mp4;codecs=avc1.640028,mp4a.40.2',
        'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
        'video/mp4;codecs=avc1,mp4a.40.2',
        'video/mp4;codecs=avc1,opus',
        'video/mp4',
      ]
    : ['video/mp4;codecs=avc1.640028', 'video/mp4;codecs=avc1.42E01E', 'video/mp4;codecs=avc1', 'video/mp4'];
  const webm = withAudio
    ? ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm']
    : ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
  for (const mime of mp4) if (MediaRecorder.isTypeSupported(mime)) return { mime, ext: 'mp4' };
  for (const mime of webm) if (MediaRecorder.isTypeSupported(mime)) return { mime, ext: 'webm' };
  return undefined;
}

/** Records a canvas (and optionally an audio track) live, as it is drawn. */
export class LiveRecorder {
  private recorder: MediaRecorder;
  private chunks: Blob[] = [];
  private stopped: Promise<Blob>;
  readonly ext: 'mp4' | 'webm';
  readonly mime: string;
  private track: CanvasCaptureMediaStreamTrack;
  private raf = 0;

  constructor(canvas: HTMLCanvasElement, audio?: MediaStreamTrack, fps = 70) {
    const fmt = recorderFormat(!!audio);
    if (!fmt) throw new Error('This browser cannot record video');
    this.ext = fmt.ext;
    this.mime = fmt.mime;
    // Frames on our clock, not only when the canvas changes: a screen that holds still
    // (a title, "Hit any key") must still fill its time in the video.
    const stream = canvas.captureStream(0);
    this.track = stream.getVideoTracks()[0] as CanvasCaptureMediaStreamTrack;
    const every = 1000 / fps;
    let last = 0;
    const pump = (t: number) => {
      if (this.track.readyState === 'ended') return;
      if (t - last >= every - 1 && this.recorder?.state === 'recording') {
        last = t;
        this.track.requestFrame();
      }
      this.raf = requestAnimationFrame(pump);
    };
    this.raf = requestAnimationFrame(pump);
    if (audio) stream.addTrack(audio);
    this.recorder = new MediaRecorder(stream, {
      mimeType: fmt.mime,
      videoBitsPerSecond: Math.max(2_500_000, canvas.width * canvas.height * 40),
      audioBitsPerSecond: 160_000,
    });
    this.recorder.ondataavailable = (e) => e.data.size && this.chunks.push(e.data);
    this.stopped = new Promise((resolve) => (this.recorder.onstop = () => resolve(new Blob(this.chunks, { type: fmt.mime.split(';')[0] }))));
    this.recorder.start(1000);
  }

  get state(): RecordingState {
    return this.recorder.state;
  }

  pause(): void {
    if (this.recorder.state === 'recording') this.recorder.pause();
  }

  resume(): void {
    if (this.recorder.state === 'paused') this.recorder.resume();
  }

  /** Stops and resolves with the whole video. */
  stop(): Promise<Blob> {
    cancelAnimationFrame(this.raf);
    if (this.recorder.state !== 'inactive') this.recorder.stop();
    this.track.stop();
    return this.stopped;
  }
}
