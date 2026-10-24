// Turning a sequence of pictures (animation frames, backdrops) into a video file: frame by
// frame through WebCodecs where the browser has an H.264 encoder (exact timing, faster than
// real time), otherwise by playing them in real time into MediaRecorder (MP4 or WebM).
import { LiveRecorder, Mp4Encoder } from './video';

interface FrameSource {
  width: number;
  height: number;
  count: number;
  /** Draws frame i into the canvas (already width x height). */
  paint(i: number, canvas: HTMLCanvasElement): void;
  /** How long frame i shows, in `timescale` units a second. */
  duration(i: number): number;
  timescale: number;
}

interface VideoFile {
  blob: Blob;
  ext: 'mp4' | 'webm';
}

export async function framesToVideo(src: FrameSource, onProgress?: (done: number) => void): Promise<VideoFile> {
  // H.264 wants even sizes
  const w = src.width + (src.width & 1);
  const h = src.height + (src.height & 1);
  const canvas = document.createElement('canvas');
  [canvas.width, canvas.height] = [w, h];
  const frame = document.createElement('canvas');
  [frame.width, frame.height] = [src.width, src.height];
  const draw = (i: number) => {
    src.paint(i, frame);
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(frame, 0, 0);
  };
  const enc = await Mp4Encoder.create(w, h, src.timescale);
  if (enc) {
    for (let i = 0; i < src.count; i++) {
      draw(i);
      await enc.add(canvas, Math.max(1, src.duration(i)));
      onProgress?.((i + 1) / src.count);
    }
    const bytes = await enc.finish();
    return { blob: new Blob([bytes as BlobPart], { type: 'video/mp4' }), ext: 'mp4' };
  }
  // Real time: show each frame for its time while MediaRecorder watches.
  draw(0);
  const rec = new LiveRecorder(canvas, undefined, 70);
  const t0 = performance.now();
  let at = 0;
  for (let i = 0; i < src.count; i++) {
    draw(i);
    at += (Math.max(1, src.duration(i)) / src.timescale) * 1000;
    const wait = t0 + at - performance.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    onProgress?.((i + 1) / src.count);
  }
  return { blob: await rec.stop(), ext: rec.ext };
}
