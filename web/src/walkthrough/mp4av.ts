// An MP4 (ISO BMFF) with an H.264 video track and an AAC or Opus audio track, as WebCodecs'
// encoders make them, for the walkthrough videos. (media/mp4Mux.ts writes video-only files
// for the desk; this one keeps to itself.) The index (moov) goes first so a player can start
// at once; the video's frames, then the sound's, follow in mdat, one chunk a track.
//
//   ftyp, moov (mvhd, trak video, trak audio), mdat
// Sizes and offsets are 32-bit: a file must stay under 4 GB.

export interface AvSample {
  data: Uint8Array;
  /** In the track's timescale. */
  duration: number;
  key: boolean;
}

export interface AvVideo {
  width: number;
  height: number;
  timescale: number;
  /** AVCDecoderConfigurationRecord (VideoEncoder's decoderConfig.description). */
  avcC: Uint8Array;
  samples: AvSample[];
}

export interface AvAudio {
  codec: 'aac' | 'opus';
  sampleRate: number;
  channels: number;
  /** AAC: the AudioSpecificConfig (AudioEncoder's decoderConfig.description). */
  config?: Uint8Array;
  /** Opus: samples the decoder drops at the start. */
  preSkip?: number;
  samples: AvSample[];
}

class W {
  private parts: Uint8Array[] = [];
  length = 0;
  bytes(b: Uint8Array): this {
    this.parts.push(b);
    this.length += b.length;
    return this;
  }
  u8(...v: number[]): this {
    return this.bytes(Uint8Array.from(v));
  }
  u16(v: number): this {
    return this.u8((v >> 8) & 255, v & 255);
  }
  u32(v: number): this {
    return this.u8((v >>> 24) & 255, (v >>> 16) & 255, (v >>> 8) & 255, v & 255);
  }
  str(s: string): this {
    return this.u8(...[...s].map((c) => c.charCodeAt(0)));
  }
  zeros(n: number): this {
    return this.bytes(new Uint8Array(n));
  }
  result(): Uint8Array {
    const out = new Uint8Array(this.length);
    let p = 0;
    for (const b of this.parts) {
      out.set(b, p);
      p += b.length;
    }
    return out;
  }
}

function box(type: string, ...content: Uint8Array[]): Uint8Array {
  const w = new W().u32(8 + content.reduce((n, c) => n + c.length, 0)).str(type);
  content.forEach((c) => w.bytes(c));
  return w.result();
}

function fullBox(type: string, version: number, flags: number, body: (w: W) => void): Uint8Array {
  const w = new W().u8(version, (flags >> 16) & 255, (flags >> 8) & 255, flags & 255);
  body(w);
  return box(type, w.result());
}

const MATRIX = [0x00010000, 0, 0, 0, 0x00010000, 0, 0, 0, 0x40000000];
const MOVIE_TIMESCALE = 1000;

/** An MPEG-4 descriptor: tag, length in the four byte form, body. */
function descriptor(tag: number, body: Uint8Array): Uint8Array {
  const n = body.length;
  return new W()
    .u8(tag, 0x80 | ((n >> 21) & 127), 0x80 | ((n >> 14) & 127), 0x80 | ((n >> 7) & 127), n & 127)
    .bytes(body)
    .result();
}

function esds(a: AvAudio): Uint8Array {
  const bitrate = Math.round(
    (a.samples.reduce((n, s) => n + s.data.length, 0) * 8 * a.sampleRate) /
      Math.max(
        1,
        a.samples.reduce((n, s) => n + s.duration, 0),
      ),
  );
  const dsi = descriptor(5, a.config ?? new Uint8Array(0));
  // objectTypeIndication 0x40 (MPEG-4 audio), streamType 5 (audio) << 2 | 1, buffer size, max and average bitrate
  const dcd = descriptor(4, new W().u8(0x40, 0x15, 0, 0, 0).u32(bitrate).u32(bitrate).bytes(dsi).result());
  const es = descriptor(
    3,
    new W()
      .u16(1)
      .u8(0)
      .bytes(dcd)
      .bytes(descriptor(6, Uint8Array.of(2)))
      .result(),
  );
  return fullBox('esds', 0, 0, (w) => w.bytes(es));
}

function audioEntry(a: AvAudio): Uint8Array {
  const head = new W()
    .zeros(6)
    .u16(1) // data reference index
    .zeros(8)
    .u16(a.channels)
    .u16(16) // sample size
    .u16(0)
    .u16(0)
    .u32(a.sampleRate << 16)
    .result();
  if (a.codec === 'aac') return box('mp4a', head, esds(a));
  // dOps (Opus in ISO BMFF): version, channels, pre-skip, input rate, gain, mapping family 0
  const dOps = box(
    'dOps',
    new W()
      .u8(0, a.channels)
      .u16(a.preSkip ?? 312)
      .u32(a.sampleRate)
      .u16(0)
      .u8(0)
      .result(),
  );
  return box('Opus', head, dOps);
}

function videoEntry(v: AvVideo): Uint8Array {
  return box(
    'avc1',
    new W().zeros(6).u16(1).zeros(16).u16(v.width).u16(v.height).u32(0x00480000).u32(0x00480000).u32(0).u16(1).zeros(32).u16(0x18).u16(0xffff).result(),
    box('avcC', v.avcC),
  );
}

function sampleTable(entry: Uint8Array, samples: AvSample[], offset: number, sync: boolean): Uint8Array {
  const runs: [number, number][] = [];
  for (const s of samples) {
    const last = runs[runs.length - 1];
    if (last && last[1] === s.duration) last[0]++;
    else runs.push([1, s.duration]);
  }
  const boxes = [
    fullBox('stsd', 0, 0, (w) => w.u32(1).bytes(entry)),
    fullBox('stts', 0, 0, (w) => {
      w.u32(runs.length);
      runs.forEach(([n, d]) => w.u32(n).u32(d));
    }),
  ];
  if (sync) {
    const keys = samples.flatMap((s, i) => (s.key ? [i + 1] : []));
    boxes.push(
      fullBox('stss', 0, 0, (w) => {
        w.u32(keys.length);
        keys.forEach((k) => w.u32(k));
      }),
    );
  }
  boxes.push(
    fullBox('stsc', 0, 0, (w) => w.u32(1).u32(1).u32(samples.length).u32(1)),
    fullBox('stsz', 0, 0, (w) => {
      w.u32(0).u32(samples.length);
      samples.forEach((s) => w.u32(s.data.length));
    }),
    fullBox('stco', 0, 0, (w) => w.u32(1).u32(offset)),
  );
  return box('stbl', ...boxes);
}

function trak(
  id: number,
  kind: 'video' | 'audio',
  timescale: number,
  samples: AvSample[],
  entry: Uint8Array,
  offset: number,
  size?: { width: number; height: number },
): Uint8Array {
  const duration = samples.reduce((n, s) => n + s.duration, 0);
  const movieDuration = Math.round((duration * MOVIE_TIMESCALE) / timescale);
  const tkhd = fullBox('tkhd', 0, 3, (w) => {
    w.u32(0)
      .u32(0)
      .u32(id)
      .u32(0)
      .u32(movieDuration)
      .zeros(8)
      .u16(0)
      .u16(0)
      .u16(kind === 'audio' ? 0x0100 : 0)
      .u16(0);
    MATRIX.forEach((m) => w.u32(m));
    w.u32((size?.width ?? 0) << 16).u32((size?.height ?? 0) << 16);
  });
  const mdhd = fullBox('mdhd', 0, 0, (w) => w.u32(0).u32(0).u32(timescale).u32(duration).u16(0x55c4).u16(0));
  const hdlr = fullBox('hdlr', 0, 0, (w) =>
    w
      .u32(0)
      .str(kind === 'video' ? 'vide' : 'soun')
      .zeros(12)
      .str(kind === 'video' ? 'VideoHandler' : 'SoundHandler')
      .u8(0),
  );
  const header = kind === 'video' ? fullBox('vmhd', 0, 1, (w) => w.u16(0).u16(0).u16(0).u16(0)) : fullBox('smhd', 0, 0, (w) => w.u16(0).u16(0));
  const dinf = box(
    'dinf',
    fullBox('dref', 0, 0, (w) => w.u32(1).bytes(fullBox('url ', 0, 1, () => undefined))),
  );
  return box('trak', tkhd, box('mdia', mdhd, hdlr, box('minf', header, dinf, sampleTable(entry, samples, offset, kind === 'video'))));
}

/** The whole file. */
export function muxAv(video: AvVideo, audio?: AvAudio): Blob {
  const ftyp = box('ftyp', new W().str('isom').u32(0x200).str('isomiso2avc1mp41').result());
  const seconds = Math.max(
    video.samples.reduce((n, s) => n + s.duration, 0) / video.timescale,
    audio ? audio.samples.reduce((n, s) => n + s.duration, 0) / audio.sampleRate : 0,
  );
  const videoBytes = video.samples.reduce((n, s) => n + s.data.length, 0);
  const moovWith = (vOff: number, aOff: number) => {
    const mvhd = fullBox('mvhd', 0, 0, (w) => {
      w.u32(0)
        .u32(0)
        .u32(MOVIE_TIMESCALE)
        .u32(Math.round(seconds * MOVIE_TIMESCALE))
        .u32(0x00010000)
        .u16(0x0100)
        .zeros(10);
      MATRIX.forEach((m) => w.u32(m));
      w.zeros(24).u32(audio ? 3 : 2);
    });
    const tracks = [trak(1, 'video', video.timescale, video.samples, videoEntry(video), vOff, video)];
    if (audio) tracks.push(trak(2, 'audio', audio.sampleRate, audio.samples, audioEntry(audio), aOff));
    return box('moov', mvhd, ...tracks);
  };
  const moovLen = moovWith(0, 0).length;
  const vOff = ftyp.length + moovLen + 8;
  const moov = moovWith(vOff, vOff + videoBytes);
  const dataLen = videoBytes + (audio ? audio.samples.reduce((n, s) => n + s.data.length, 0) : 0);
  const mdatHead = new W()
    .u32(8 + dataLen)
    .str('mdat')
    .result();
  const parts: BlobPart[] = [ftyp as BlobPart, moov as BlobPart, mdatHead as BlobPart];
  for (const s of video.samples) parts.push(s.data as BlobPart);
  if (audio) for (const s of audio.samples) parts.push(s.data as BlobPart);
  return new Blob(parts, { type: 'video/mp4' });
}
