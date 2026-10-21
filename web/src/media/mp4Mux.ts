// A minimal MP4 (ISO BMFF) writer for one H.264 video track: what WebCodecs' VideoEncoder
// produces, put in a file any player opens. The index (moov) goes first so the video
// can start playing before it has all loaded; all samples sit in one chunk.
//
// Layout (ISO/IEC 14496-12 and 14496-15):
//   ftyp
//   moov
//     mvhd                    movie timescale and duration
//     trak
//       tkhd                  track 1, size in 16.16 fixed point
//       mdia
//         mdhd, hdlr          media timescale, 'vide' handler
//         minf
//           vmhd, dinf/dref   video header, data in this same file
//           stbl              sample table:
//             stsd            avc1 sample entry holding avcC
//             stts            sample durations
//             stss            which samples are key frames
//             stsc            samples per chunk (one chunk of all samples)
//             stsz            each sample's size
//             stco            the chunk's file offset (inside mdat)
//   mdat                      the frames back to back
// Sizes and offsets are 32-bit, so the file must stay under 4 GB.

export interface Mp4Sample {
  /** One encoded frame, AVC length-prefixed NAL units. */
  data: Uint8Array;
  /** How long it is shown, in `timescale` units. */
  duration: number;
  /** A sync sample (IDR frame). */
  key: boolean;
}

export interface Mp4Track {
  width: number;
  height: number;
  /** Units a second for durations (e.g. 70 for the VGA's retraces, or 1000 for ms). */
  timescale: number;
  /** The AVCDecoderConfigurationRecord (VideoEncoder's decoderConfig.description). */
  avcC: Uint8Array;
  samples: Mp4Sample[];
}

class Writer {
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

/** A box: 32-bit size, four character type, then the content. */
function box(type: string, ...content: Uint8Array[]): Uint8Array {
  const w = new Writer();
  const len = 8 + content.reduce((n, c) => n + c.length, 0);
  w.u32(len).str(type);
  content.forEach((c) => w.bytes(c));
  return w.result();
}

/** A full box: version and flags before the content. */
function fullBox(type: string, version: number, flags: number, body: (w: Writer) => void): Uint8Array {
  const w = new Writer().u8(version, (flags >> 16) & 255, (flags >> 8) & 255, flags & 255);
  body(w);
  return box(type, w.result());
}

// Identity transformation matrix (16.16 fixed point, with 2.30 for the last column).
const MATRIX = [0x00010000, 0, 0, 0, 0x00010000, 0, 0, 0, 0x40000000];

export function muxMp4(t: Mp4Track): Uint8Array {
  const { width, height, timescale, samples } = t;
  const duration = samples.reduce((n, s) => n + s.duration, 0);
  const ftyp = box('ftyp', new Writer().str('isom').u32(0x200).str('isomiso2avc1mp41').result());

  const mvhd = fullBox('mvhd', 0, 0, (w) => {
    // Creation and modification times 0, timescale, duration, rate 1.0, volume 1.0, reserved.
    w.u32(0).u32(0).u32(timescale).u32(duration).u32(0x00010000).u16(0x0100).zeros(10);
    MATRIX.forEach((m) => w.u32(m));
    // Six pre_defined words, then next_track_ID.
    w.zeros(24).u32(2);
  });
  // Flags 3: track enabled and used in the movie. Fields: times, track_ID 1, reserved,
  // duration, reserved, layer, alternate group, volume (0 for video), reserved.
  const tkhd = fullBox('tkhd', 0, 3, (w) => {
    w.u32(0).u32(0).u32(1).u32(0).u32(duration).zeros(8).u16(0).u16(0).u16(0).u16(0);
    MATRIX.forEach((m) => w.u32(m));
    w.u32(width << 16).u32(height << 16);
  });
  const mdhd = fullBox('mdhd', 0, 0, (w) => w.u32(0).u32(0).u32(timescale).u32(duration).u16(0x55c4).u16(0)); // 'und'
  const hdlr = fullBox('hdlr', 0, 0, (w) => w.u32(0).str('vide').zeros(12).str('VideoHandler').u8(0));
  const vmhd = fullBox('vmhd', 0, 1, (w) => w.u16(0).u16(0).u16(0).u16(0));
  const dinf = box(
    'dinf',
    fullBox('dref', 0, 0, (w) => w.u32(1).bytes(fullBox('url ', 0, 1, () => undefined))),
  );
  // Visual sample entry: reserved, data reference index, pre_defined/reserved, size,
  // 72 dpi resolution, reserved, frame count, compressor name, depth 24, pre_defined -1.
  const avc1 = box(
    'avc1',
    new Writer()
      .zeros(6)
      .u16(1) // data reference index
      .zeros(16)
      .u16(width)
      .u16(height)
      .u32(0x00480000)
      .u32(0x00480000)
      .u32(0)
      .u16(1) // frames per sample
      .zeros(32) // compressor name
      .u16(0x18) // depth
      .u16(0xffff)
      .result(),
    box('avcC', t.avcC),
  );
  const stsd = fullBox('stsd', 0, 0, (w) => w.u32(1).bytes(avc1));
  // durations, run-length coded
  const runs: [number, number][] = [];
  for (const s of samples) {
    const last = runs[runs.length - 1];
    if (last && last[1] === s.duration) last[0]++;
    else runs.push([1, s.duration]);
  }
  const stts = fullBox('stts', 0, 0, (w) => {
    w.u32(runs.length);
    runs.forEach(([n, d]) => w.u32(n).u32(d));
  });
  // Sample numbers in stss are 1-based.
  const keys = samples.flatMap((s, i) => (s.key ? [i + 1] : []));
  const stss = fullBox('stss', 0, 0, (w) => {
    w.u32(keys.length);
    keys.forEach((k) => w.u32(k));
  });
  // One entry: from chunk 1, every chunk holds all the samples, sample description 1.
  const stsc = fullBox('stsc', 0, 0, (w) => w.u32(1).u32(1).u32(samples.length).u32(1));
  const stsz = fullBox('stsz', 0, 0, (w) => {
    // sample_size 0 means each sample's size follows.
    w.u32(0).u32(samples.length);
    samples.forEach((s) => w.u32(s.data.length));
  });
  const moovWith = (offset: number) =>
    box(
      'moov',
      mvhd,
      box(
        'trak',
        tkhd,
        box(
          'mdia',
          mdhd,
          hdlr,
          box(
            'minf',
            vmhd,
            dinf,
            box(
              'stbl',
              stsd,
              stts,
              stss,
              stsc,
              stsz,
              fullBox('stco', 0, 0, (w) => w.u32(1).u32(offset)),
            ),
          ),
        ),
      ),
    );
  // The moov's size doesn't depend on the offset, so measure it once.
  const moovLen = moovWith(0).length;
  // The first frame starts right after the mdat box header (size + type).
  const mdatOffset = ftyp.length + moovLen + 8;
  const moov = moovWith(mdatOffset);
  const dataLen = samples.reduce((n, s) => n + s.data.length, 0);
  const out = new Writer()
    .bytes(ftyp)
    .bytes(moov)
    .u32(8 + dataLen)
    .str('mdat');
  samples.forEach((s) => out.bytes(s.data));
  return out.result();
}

/** The boxes at the top level of an MP4 (for checks): type, offset and size. */
export function topBoxes(bytes: Uint8Array): { type: string; offset: number; size: number }[] {
  const out: { type: string; offset: number; size: number }[] = [];
  const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  for (let p = 0; p + 8 <= bytes.length;) {
    const size = v.getUint32(p);
    out.push({ type: String.fromCharCode(...bytes.subarray(p + 4, p + 8)), offset: p, size });
    if (size < 8) break;
    p += size;
  }
  return out;
}
