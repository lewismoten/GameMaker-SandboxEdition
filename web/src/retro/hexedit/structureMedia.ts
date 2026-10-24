// HEXEDIT's maps of the media files Game-Maker plays (.FLI, .GIF, .VOC, .CMF) and the one
// entry point, describe(), which picks a format by the file's name and first bytes.
// The fields follow the layouts written up at the top of formats/fli.ts, gif.ts, voc.ts
// and cmf.ts.
import { Builder, GM_FORMATS, part, readVlq, text, type Describer, type Structure } from './structure';

const hex = (n: number, w = 2) => n.toString(16).toUpperCase().padStart(w, '0');

const FLI_CHUNKS: Record<number, string> = {
  4: 'COLOR_256',
  7: 'SS2 (word delta)',
  11: 'COLOR',
  12: 'LC (line delta)',
  13: 'BLACK',
  15: 'BRUN (run length)',
  16: 'COPY (raw pixels)',
  18: 'PSTAMP',
};

/** .FLI/.FLC: a 128-byte header, then frames of chunks (FLI.HPP). */
function fli(b: Builder): void {
  const bytes = b.bytes;
  const flc = b.u16(4) === 0xaf12;
  b.sect('FLI header');
  b.f('File size', 'u32', { note: (v) => (v === bytes.length ? 'matches' : `file is ${bytes.length}`) });
  b.f('Magic', 'u16', { note: (v) => (v === 0xaf11 ? 'FLI' : v === 0xaf12 ? 'FLC' : 'not an FLI!') });
  b.f('Frames', 'u16', { key: 'frameCount' });
  b.f('Width', 'u16', { key: 'width' });
  b.f('Height', 'u16', { key: 'height' });
  b.f('Depth', 'u16', { note: () => 'bits a pixel' });
  b.f('Flags', 'u16');
  if (flc) b.f('Speed', 'u32', { note: () => 'milliseconds a frame' });
  else b.f('Speed', 'u16', { key: 'speed', note: () => '1/70 s a frame' });
  if (flc) {
    b.f('Reserved', 'raw', { len: 80 - b.off });
    b.f('Offset of frame 1', 'u32');
    b.f('Offset of frame 2', 'u32');
  }
  b.f('Reserved', 'raw', { len: 128 - b.off });
  let off = flc ? b.u32(80) || 128 : 128;
  b.off = off;
  let n = 0;
  while (off + 16 <= bytes.length) {
    const size = b.u32(off);
    const type = b.u16(off + 4);
    if (size < 16) break;
    const frame = type === 0xf1fa;
    b.sect(frame ? `Frame ${n}` : `Prefix chunk ${hex(type, 4)}h`, off);
    b.off = off;
    b.f(frame ? `Frame ${n} size` : 'Chunk size', 'u32');
    b.f('Magic', 'u16', { note: (v) => (v === 0xf1fa ? 'frame' : 'not a frame: skipped') });
    if (frame) {
      const chunks = b.f('Chunks', 'u16');
      b.f('Reserved', 'raw', { len: 8 });
      const end = Math.min(bytes.length, off + size);
      for (let c = 0; c < chunks && b.off + 6 <= end; c++) {
        const at = b.off;
        const csize = b.u32(at);
        const ctype = b.u16(at + 4);
        b.f(`Chunk ${c} size`, 'u32');
        b.f(`Chunk ${c} type`, 'u16', { note: (v) => FLI_CHUNKS[Number(v)] ?? 'unknown' });
        const cend = Math.min(end, at + Math.max(6, csize));
        if (ctype === 11 || ctype === 4) colorChunk(b, cend, ctype === 4);
        if (b.off < cend) b.f(`${FLI_CHUNKS[ctype] ?? 'Chunk'} data`, 'raw', { len: cend - b.off });
        if (csize < 6) break;
        b.off = at + csize;
      }
    }
    off += size;
    if (frame) n++;
  }
  b.off = Math.max(b.off, off);
}

function colorChunk(b: Builder, end: number, eightBit: boolean): void {
  const packets = b.f('Color packets', 'u16');
  for (let p = 0; p < packets && b.off + 2 <= end; p++) {
    b.f(`Packet ${p} skip`, 'u8', { note: () => 'colors left alone' });
    const count = b.f(`Packet ${p} count`, 'u8', { note: (v) => (v === 0 ? '256 colors' : 'colors') }) || 256;
    const n = Math.min(count, Math.floor((end - b.off) / 3));
    b.arr(
      `Packet ${p} colors`,
      n,
      3,
      [part(0, 'red', 'u8'), part(1, 'green', 'u8'), part(2, 'blue', 'u8')],
      (i) => `[${i}]${eightBit ? ' (0-255)' : ' (0-63)'}`,
    );
  }
}

/** .GIF: header, color tables and blocks (GIF89a). */
function gif(b: Builder): void {
  const bytes = b.bytes;
  b.sect('GIF header');
  b.f('Signature', 'str', { len: 6 });
  b.f('Screen width', 'u16');
  b.f('Screen height', 'u16');
  const flags = b.f('Screen flags', 'u8', { note: (v) => tableNote(Number(v)) });
  b.f('Background color', 'u8');
  b.f('Aspect ratio', 'u8');
  const table = (name: string, f: number) => {
    if (!(f & 0x80)) return;
    b.sect(name);
    b.arr(name, 2 << (f & 7), 3, [part(0, 'red', 'u8'), part(1, 'green', 'u8'), part(2, 'blue', 'u8')], (i) => `Color ${i}`);
  };
  table('Global color table', flags);
  let image = 0;
  let ext = 0;
  const subBlocks = (name: string, asText = false) => {
    while (b.off < bytes.length) {
      const len = b.f(`${name} block size`, 'u8', { note: (v) => (v === 0 ? 'end of blocks' : '') });
      if (!len) break;
      b.f(name, asText ? 'text' : 'raw', { len });
    }
  };
  while (b.off < bytes.length) {
    const t = b.u8();
    if (t === 0x21) {
      const label = b.u8(b.off + 1);
      const kind =
        label === 0xf9
          ? 'Graphic control'
          : label === 0xfe
            ? 'Comment'
            : label === 0xff
              ? 'Application'
              : label === 0x01
                ? 'Plain text'
                : `Extension ${hex(label)}h`;
      b.sect(`${kind} extension ${ext++}`);
      b.f('Extension introducer', 'u8', { note: () => "'!'" });
      b.f('Label', 'u8', { note: () => kind });
      subBlocks(`${kind} data`, label === 0xfe);
    } else if (t === 0x2c) {
      b.sect(`Image ${image}`);
      b.f('Image separator', 'u8', { note: () => "','" });
      b.f('Left', 'u16', { note: () => 'Game-Maker draws at 0' });
      b.f('Top', 'u16');
      b.f('Width', 'u16', image === 0 ? { key: 'width' } : {});
      b.f('Height', 'u16', image === 0 ? { key: 'height' } : {});
      const f = b.f('Image flags', 'u8', { note: (v) => `${tableNote(Number(v))}${Number(v) & 0x40 ? ', interlaced' : ''}` });
      table(`Image ${image} local color table`, f);
      b.f('LZW minimum code size', 'u8');
      subBlocks(`Image ${image} LZW data`);
      image++;
    } else if (t === 0x3b) {
      b.sect('Trailer');
      b.f('Trailer', 'u8', { note: () => "';' end of the GIF" });
      break;
    } else break;
  }
}

const tableNote = (f: number) => (f & 0x80 ? `color table of ${2 << (f & 7)}` : 'no color table');

const VOC_BLOCKS = ['Terminator', 'Sound data', 'Sound continues', 'Silence', 'Marker', 'Text', 'Repeat start', 'Repeat end', 'Extended', 'New sound data'];

/** .VOC: a 26-byte header, then typed blocks (Creative Voice File). */
function voc(b: Builder): void {
  const bytes = b.bytes;
  b.sect('VOC header');
  b.f('Signature', 'str', { len: 20 });
  const first = b.f('First block offset', 'u16');
  b.f('Version', 'u16', { note: (v) => `${Number(v) >> 8}.${String(Number(v) & 255).padStart(2, '0')}` });
  b.f('Check', 'u16', { note: (v) => (v === ((~b.u16(22) + 0x1234) & 0xffff) ? 'valid' : 'does not match the version') });
  if (first > b.off) b.f('Header extra', 'raw', { len: first - b.off });
  b.off = Math.max(b.off, first);
  const rate = (v: number | string) => `${Math.round(1_000_000 / (256 - Number(v)))} Hz`;
  for (let n = 0; b.off < bytes.length; n++) {
    const type = b.u8();
    const at = b.off;
    b.sect(`Block ${n}: ${VOC_BLOCKS[type] ?? 'unknown'}`);
    b.f('Block type', 'u8', { note: () => VOC_BLOCKS[type] ?? 'unknown' });
    if (type === 0) break;
    const size = b.f('Block size', 'u24');
    const end = Math.min(bytes.length, at + 4 + size);
    if (type === 1) {
      b.f('Time constant', 'u8', { note: rate });
      b.f('Codec', 'u8', { note: (v) => ['8-bit PCM', '4-bit ADPCM', '2.6-bit ADPCM', '2-bit ADPCM'][Number(v)] ?? '' });
    } else if (type === 3) {
      b.f('Length - 1', 'u16', { note: () => 'samples of silence' });
      b.f('Time constant', 'u8', { note: rate });
    } else if (type === 6) b.f('Repeat count', 'u16', { note: (v) => (v === 0xffff ? 'endless' : 'more times') });
    else if (type === 8) {
      b.f('Time constant', 'u16');
      b.f('Pack', 'u8');
      b.f('Mode', 'u8', { note: (v) => (v === 1 ? 'stereo' : 'mono') });
    } else if (type === 9) {
      b.f('Sample rate', 'u32', { note: () => 'Hz' });
      b.f('Bits', 'u8');
      b.f('Channels', 'u8');
      b.f('Codec', 'u16');
      b.f('Reserved', 'raw', { len: 4 });
    }
    if (b.off < end) b.f(type === 5 ? 'Text' : 'Samples', type === 5 ? 'str' : 'raw', { len: end - b.off });
    b.off = at + 4 + size;
  }
}

const SBI = [
  'modulator characteristic',
  'carrier characteristic',
  'modulator level',
  'carrier level',
  'modulator attack/decay',
  'carrier attack/decay',
  'modulator sustain/release',
  'carrier sustain/release',
  'modulator wave',
  'carrier wave',
  'feedback/connection',
];
const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const noteName = (k: number) => `${NOTES[k % 12]}${Math.floor(k / 12) - 1}`;

/** .CMF: header, SBI instruments, then MIDI-like events (Creative Music File). */
function cmf(b: Builder): void {
  const bytes = b.bytes;
  b.sect('CMF header');
  b.f('Signature', 'str', { len: 4 });
  b.f('Version', 'u16', { key: 'version', note: (v) => `${Number(v) >> 8}.${String(Number(v) & 255).padStart(2, '0')}` });
  const instBlk = b.f('Instruments offset', 'u16');
  const musicBlk = b.f('Music offset', 'u16');
  b.f('Ticks a beat', 'u16', { key: 'ticksPerBeat' });
  b.f('Clock ticks a second', 'u16', { key: 'clockTicks', note: (v) => (v === 146 ? 'as Game-Maker needs' : 'PLAYGAME wants 146!') });
  b.f('Title offset', 'u16', { note: (v) => (v ? '' : 'none') });
  b.f('Composer offset', 'u16', { note: (v) => (v ? '' : 'none') });
  b.f('Remarks offset', 'u16', { note: (v) => (v ? '' : 'none') });
  b.arr(
    'Channels used',
    16,
    1,
    [
      part(
        0,
        '',
        'u8',
        (i) => `channelUsed.${i}`,
        (v) => (v ? 'used' : 'unused'),
      ),
    ],
    (i) => `channel ${i}`,
  );
  const instNum = b.f('Instruments', 'u16', { key: 'instruments.length' });
  b.f('Basic tempo', 'u16', { key: 'basicTempo' });
  if (instBlk > b.off) b.f('Header extra (title, composer, remarks)', 'raw', { len: instBlk - b.off });
  b.off = Math.max(b.off, instBlk);
  b.sect('Instruments (SBI)');
  b.arr(
    'Instruments',
    instNum,
    16,
    [...SBI.map((n, k) => part(k, n, 'u8', (i) => `instruments.${i}.${k}`)), part(11, 'reserved', 'raw', undefined, undefined, 5)],
    (i) => `#${i}`,
  );
  if (musicBlk > b.off) b.f('Gap before the music', 'raw', { len: musicBlk - b.off });
  b.off = Math.max(b.off, musicBlk);
  b.sect('Music events');
  let status = 0;
  for (let n = 0; b.off < bytes.length; n++) {
    if (n && n % 200 === 0) b.sect(`Music events ${n}-`);
    b.f(`Event ${n} delta`, 'vlq', { note: () => 'ticks to wait' });
    const at = b.off;
    let s = b.u8();
    let len = 0;
    if (s & 0x80) len = 1;
    else s = status; // running status: the last status byte again
    const hi = s & 0xf0;
    const ch = s & 15;
    let what = '';
    if (s === 0xff) {
      const type = b.u8(at + 1);
      const l = readVlq(bytes, at + 2);
      len = 2 + l.len + l.value;
      what = type === 0x2f ? 'end of song' : `meta ${hex(type)}h`;
    } else if (s === 0xf0 || s === 0xf7) {
      const l = readVlq(bytes, at + 1);
      len = 1 + l.len + l.value;
      what = 'system exclusive';
    } else if (hi >= 0x80) {
      status = s;
      const d1 = b.u8(at + len);
      const d2 = b.u8(at + len + 1);
      const two = hi !== 0xc0 && hi !== 0xd0;
      len += two ? 2 : 1;
      what =
        hi === 0x90 && d2
          ? `note on ch ${ch} ${noteName(d1)} vel ${d2}`
          : hi === 0x80 || hi === 0x90
            ? `note off ch ${ch} ${noteName(d1)}`
            : hi === 0xc0
              ? `instrument ${d1} on ch ${ch}`
              : hi === 0xb0
                ? `control ${hex(d1)}h = ${d2} ch ${ch}${d1 === 0x67 ? ' (rhythm mode)' : ''}`
                : hi === 0xe0
                  ? `pitch bend ch ${ch}`
                  : `${hex(s)}h ch ${ch}`;
    } else {
      b.f('Unreadable event', 'raw', { len: bytes.length - b.off });
      break;
    }
    b.f(`Event ${n}: ${what}`, 'raw', { len: Math.max(1, len) });
    if (s === 0xff && b.u8(at + 1) === 0x2f) break;
  }
}

const TEXT_EXTS = new Set(['txt', 'lst', 'bat', 'hlp', 'doc', 'diz', 'nfo', 'sys', 'sav', 'reg', 'me', '1st']);

/** The structure of a file by its name (and first bytes), or undefined for an unknown one. */
export function describe(name: string, bytes: Uint8Array): Structure | undefined {
  const lower = name.toLowerCase();
  const ext = lower.includes('.') ? lower.slice(lower.lastIndexOf('.') + 1) : '';
  const magic = (s: string) => [...s].every((c, i) => bytes[i] === c.charCodeAt(0));
  let pick: [string, Describer] | undefined = GM_FORMATS[lower] ?? GM_FORMATS[ext];
  if (magic('GIF8')) pick = ['GIF picture (.GIF)', gif];
  else if (magic('CTMF')) pick = ['Creative Music File (.CMF)', cmf];
  else if (magic('Creative Voice File')) pick = ['Creative Voice File (.VOC)', voc];
  else if (bytes.length >= 6 && (bytes[4] | (bytes[5] << 8)) >= 0xaf11 && (bytes[4] | (bytes[5] << 8)) <= 0xaf12 && (ext === 'fli' || ext === 'flc' || !pick))
    pick = ['Autodesk Animator (.FLI)', fli];
  else if (!pick && TEXT_EXTS.has(ext)) pick = [ext === 'sav' ? 'Saved game (JSON text, as this PLAYGAME writes it)' : `Text (.${ext.toUpperCase()})`, text];
  if (!pick) return undefined;
  const b = new Builder(bytes, pick[0]);
  try {
    pick[1](b);
  } catch {
    /* a broken file: what was mapped before the problem */
  }
  return b.build();
}
