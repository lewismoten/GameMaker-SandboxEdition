// JPEG (JFIF) decoder for baseline and progressive Huffman files, that also decodes a file
// cut short: what has arrived so far of a download. A baseline file fills in top to bottom
// (block row by block row); a progressive one is all there from its first scan, blurry,
// and sharpens with each scan that arrives.
//
// File layout (ITU T.81): markers 0xFF xx. SOI (D8); APPn (E0-EF) and COM (FE) skipped;
// DQT (DB) quantization tables in zigzag order; SOF0/1 (baseline/extended) or SOF2
// (progressive): precision, height, width, components (id, h/v sampling, table); DHT (C4)
// Huffman tables (16 code length counts, then symbols); DRI (DD) restart interval; SOS (DA):
// the scan's components and tables, spectral start/end and successive approximation bits,
// then entropy-coded data with 0xFF stuffed as FF 00 and RSTn (D0-D7) markers; EOI (D9).
// One component is grayscale; three are YCbCr (JFIF).

const ZIGZAG = Int32Array.from([
  0, 1, 8, 16, 9, 2, 3, 10, 17, 24, 32, 25, 18, 11, 4, 5, 12, 19, 26, 33, 40, 48, 41, 34, 27, 20, 13, 6, 7, 14, 21, 28, 35, 42, 49, 56, 57, 50, 43, 36, 29, 22,
  15, 23, 30, 37, 44, 51, 58, 59, 52, 45, 38, 31, 39, 46, 53, 60, 61, 54, 47, 55, 62, 63,
]);

/** A JPEG decoded from as much of it as there is. */
export interface PartialJpeg {
  width: number;
  height: number;
  /** 1 (grayscale) or 3 (RGB). */
  channels: number;
  /** width * height * channels bytes. */
  pixels: Uint8Array;
  /** Per pixel: 1 once that part of the picture has arrived (a progressive file: all of it after its first scan). */
  shown: Uint8Array;
  progressive: boolean;
  /** Scans that have fully arrived. */
  scans: number;
  complete: boolean;
  /** Pixel width / height from the JFIF header (1 when not given). */
  aspect: number;
}

interface Huffman {
  maxcode: Int32Array;
  valptr: Int32Array;
  mincode: Int32Array;
  vals: Uint8Array;
}

interface Component {
  id: number;
  h: number;
  v: number;
  tq: number;
  blocksPerLine: number;
  blocksPerColumn: number;
  /** Blocks per line including the MCU padding. */
  stride: number;
  coeffs: Int16Array;
  pred: number;
  dc?: Huffman;
  ac?: Huffman;
}

/** The data ran out (or a marker came) in the middle of a scan. */
class EndOfData extends Error {}

function buildHuffman(counts: Uint8Array, vals: Uint8Array): Huffman {
  const maxcode = new Int32Array(18).fill(-1);
  const valptr = new Int32Array(17);
  const mincode = new Int32Array(17);
  let code = 0;
  let k = 0;
  for (let l = 1; l <= 16; l++) {
    valptr[l] = k;
    mincode[l] = code;
    code += counts[l - 1];
    k += counts[l - 1];
    maxcode[l] = counts[l - 1] ? code - 1 : -1;
    code <<= 1;
  }
  maxcode[17] = 0x7fffffff;
  return { maxcode, valptr, mincode, vals };
}

export function isJpeg(bytes: Uint8Array): boolean {
  return bytes[0] === 0xff && bytes[1] === 0xd8;
}

/** Decodes as much of a JPEG as there is; undefined until the frame header has arrived. */
export function decodePartialJpeg(data: Uint8Array): PartialJpeg | undefined {
  if (!isJpeg(data)) return undefined;
  const qt: Int32Array[] = [];
  const dcTables: Huffman[] = [];
  const acTables: Huffman[] = [];
  let comps: Component[] = [];
  let width = 0;
  let height = 0;
  let progressive = false;
  let restart = 0;
  let maxH = 1;
  let maxV = 1;
  let mcusPerLine = 0;
  let mcusPerColumn = 0;
  let aspect = 1;
  let scans = 0;
  let complete = false;
  /** Baseline: MCUs decoded in the (first) scan, for showing only what has arrived. */
  let mcusDone = 0;
  let firstScanSingle = false;
  let p = 2;
  const u16 = (at: number) => (data[at] << 8) | data[at + 1];

  outer: while (p + 1 < data.length) {
    if (data[p] !== 0xff) {
      p++;
      continue;
    }
    const marker = data[p + 1];
    if (marker === 0xff) {
      p++;
      continue;
    }
    if (marker === 0xd9) {
      complete = true;
      break;
    }
    if (marker >= 0xd0 && marker <= 0xd7) {
      p += 2;
      continue;
    }
    if (p + 4 > data.length) break;
    const len = u16(p + 2);
    const seg = p + 4;
    const end = p + 2 + len;
    if (marker !== 0xda && end > data.length) break; // a header segment still arriving
    switch (marker) {
      case 0xe0:
        // JFIF: units 0 means the densities are just a pixel aspect ratio
        if (data[seg] === 0x4a && data[seg + 1] === 0x46 && data[seg + 7] === 0) {
          const xd = u16(seg + 8);
          const yd = u16(seg + 10);
          if (xd && yd) aspect = xd / yd;
        }
        break;
      case 0xdb:
        for (let q = seg; q < end;) {
          const pq = data[q] >> 4;
          const tq = data[q] & 15;
          q++;
          const t = new Int32Array(64);
          for (let i = 0; i < 64; i++) {
            t[ZIGZAG[i]] = pq ? u16(q) : data[q];
            q += pq ? 2 : 1;
          }
          qt[tq] = t;
        }
        break;
      case 0xc0:
      case 0xc1:
      case 0xc2: {
        progressive = marker === 0xc2;
        height = u16(seg + 1);
        width = u16(seg + 3);
        const n = data[seg + 5];
        comps = [];
        for (let i = 0; i < n; i++) {
          const o = seg + 6 + i * 3;
          comps.push({
            id: data[o],
            h: data[o + 1] >> 4,
            v: data[o + 1] & 15,
            tq: data[o + 2],
            blocksPerLine: 0,
            blocksPerColumn: 0,
            stride: 0,
            coeffs: new Int16Array(0),
            pred: 0,
          });
        }
        maxH = Math.max(...comps.map((c) => c.h));
        maxV = Math.max(...comps.map((c) => c.v));
        mcusPerLine = Math.ceil(width / (8 * maxH));
        mcusPerColumn = Math.ceil(height / (8 * maxV));
        for (const c of comps) {
          c.blocksPerLine = Math.ceil(Math.ceil((width * c.h) / maxH) / 8);
          c.blocksPerColumn = Math.ceil(Math.ceil((height * c.v) / maxV) / 8);
          c.stride = mcusPerLine * c.h;
          c.coeffs = new Int16Array(mcusPerColumn * c.v * c.stride * 64);
        }
        break;
      }
      case 0xc4:
        for (let q = seg; q < end;) {
          const tc = data[q] >> 4;
          const th = data[q] & 15;
          const counts = data.subarray(q + 1, q + 17);
          const total = counts.reduce((a, b) => a + b, 0);
          const t = buildHuffman(counts, data.slice(q + 17, q + 17 + total));
          (tc ? acTables : dcTables)[th] = t;
          q += 17 + total;
        }
        break;
      case 0xdd:
        restart = u16(seg);
        break;
      case 0xda: {
        if (end > data.length || !comps.length) break outer;
        const n = data[seg];
        const scanComps: Component[] = [];
        for (let i = 0; i < n; i++) {
          const c = comps.find((c) => c.id === data[seg + 1 + i * 2])!;
          c.dc = dcTables[data[seg + 2 + i * 2] >> 4];
          c.ac = acTables[data[seg + 2 + i * 2] & 15];
          scanComps.push(c);
        }
        const o = seg + 1 + n * 2;
        const ss = data[o];
        const se = data[o + 1];
        const ah = data[o + 2] >> 4;
        const al = data[o + 2] & 15;
        if (scans === 0) firstScanSingle = n === 1 && comps.length > 1;
        const r = decodeScan(data, end, scanComps, { progressive, ss, se, ah, al, restart, mcusPerLine, mcusPerColumn });
        if (scans === 0) mcusDone = r.mcus;
        if (!r.done) break outer;
        scans++;
        p = r.pos;
        continue;
      }
    }
    p = end;
  }
  if (!comps.length || !width || !height) return undefined;

  // what has arrived: a progressive file (or one whose first scan is done) is shown whole
  const shown = new Uint8Array(width * height);
  if (progressive ? scans > 0 || mcusDone > 0 : scans > 0 && !firstScanSingle) shown.fill(1);
  else if (progressive || mcusDone > 0) {
    // baseline, first scan still arriving: the MCUs (or single-component blocks) decoded
    const single = comps.length === 1 || firstScanSingle;
    const mw = single ? 8 * (maxH / comps[0].h) : 8 * maxH;
    const mh = single ? 8 * (maxV / comps[0].v) : 8 * maxV;
    const perLine = single ? comps[0].blocksPerLine : mcusPerLine;
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) if (Math.floor(y / mh) * perLine + Math.floor(x / mw) < mcusDone) shown[y * width + x] = 1;
  }
  return {
    width,
    height,
    channels: comps.length === 1 ? 1 : 3,
    pixels: render(comps, qt, width, height, maxH, maxV),
    shown,
    progressive,
    scans,
    complete,
    aspect,
  };
}

interface ScanInfo {
  progressive: boolean;
  ss: number;
  se: number;
  ah: number;
  al: number;
  restart: number;
  mcusPerLine: number;
  mcusPerColumn: number;
}

/** Decodes one scan's entropy-coded data from `start`; how far it got. */
function decodeScan(data: Uint8Array, start: number, comps: Component[], s: ScanInfo): { done: boolean; pos: number; mcus: number } {
  let pos = start;
  let bitBuf = 0;
  let bitCnt = 0;
  let eobrun = 0;
  const bit = (): number => {
    if (!bitCnt) {
      if (pos >= data.length) throw new EndOfData();
      const b = data[pos];
      if (b === 0xff) {
        if (pos + 1 >= data.length) throw new EndOfData();
        if (data[pos + 1] !== 0) throw new EndOfData(); // a marker: this scan's data has ended
        pos += 2;
      } else pos++;
      bitBuf = b;
      bitCnt = 8;
    }
    bitCnt--;
    return (bitBuf >> bitCnt) & 1;
  };
  const receive = (n: number) => {
    let v = 0;
    while (n--) v = (v << 1) | bit();
    return v;
  };
  const extend = (n: number) => {
    if (!n) return 0;
    const v = receive(n);
    return v < 1 << (n - 1) ? v - (1 << n) + 1 : v;
  };
  const huff = (t: Huffman) => {
    let code = 0;
    for (let l = 1; l <= 16; l++) {
      code = (code << 1) | bit();
      if (code <= t.maxcode[l]) return t.vals[t.valptr[l] + code - t.mincode[l]];
    }
    throw new EndOfData(); // corrupt
  };

  const baseline = (c: Component, o: number) => {
    const t = huff(c.dc!);
    c.pred += extend(t);
    c.coeffs[o] = c.pred;
    for (let k = 1; k < 64;) {
      const rs = huff(c.ac!);
      const r = rs >> 4;
      const sz = rs & 15;
      if (!sz) {
        if (r < 15) break;
        k += 16;
        continue;
      }
      k += r;
      if (k > 63) break;
      c.coeffs[o + ZIGZAG[k]] = extend(sz);
      k++;
    }
  };
  const dcFirst = (c: Component, o: number) => {
    const t = huff(c.dc!);
    c.pred += extend(t) * (1 << s.al);
    c.coeffs[o] = c.pred;
  };
  const dcRefine = (c: Component, o: number) => {
    if (bit()) c.coeffs[o] |= 1 << s.al;
  };
  const acFirst = (c: Component, o: number) => {
    if (eobrun > 0) {
      eobrun--;
      return;
    }
    for (let k = s.ss; k <= s.se;) {
      const rs = huff(c.ac!);
      const r = rs >> 4;
      const sz = rs & 15;
      if (!sz) {
        if (r < 15) {
          eobrun = (1 << r) - 1 + receive(r);
          break;
        }
        k += 16;
        continue;
      }
      k += r;
      if (k > 63) break;
      c.coeffs[o + ZIGZAG[k]] = extend(sz) * (1 << s.al);
      k++;
    }
  };
  const acRefine = (c: Component, o: number) => {
    // libjpeg's decode_mcu_AC_refine
    const p1 = 1 << s.al;
    const m1 = -1 << s.al;
    const co = c.coeffs;
    const refine = (z: number) => {
      if (bit() && (co[z] & p1) === 0) co[z] += co[z] >= 0 ? p1 : m1;
    };
    let k = s.ss;
    if (eobrun === 0) {
      for (; k <= s.se; k++) {
        const rs = huff(c.ac!);
        let r = rs >> 4;
        const sz = rs & 15;
        let val = 0;
        if (sz) val = bit() ? p1 : m1;
        else if (r !== 15) {
          eobrun = 1 << r;
          if (r) eobrun += receive(r);
          break;
        }
        for (; k <= s.se; k++) {
          const z = o + ZIGZAG[k];
          if (co[z] !== 0) refine(z);
          else if (--r < 0) break;
        }
        if (val && k <= s.se) co[o + ZIGZAG[k]] = val;
      }
    }
    if (eobrun > 0) {
      for (; k <= s.se; k++) {
        const z = o + ZIGZAG[k];
        if (co[z] !== 0) refine(z);
      }
      eobrun--;
    }
  };
  const decode = !s.progressive ? baseline : s.ss === 0 ? (s.ah ? dcRefine : dcFirst) : s.ah ? acRefine : acFirst;

  for (const c of comps) c.pred = 0;
  const single = comps.length === 1;
  const c0 = comps[0];
  const total = single ? c0.blocksPerLine * c0.blocksPerColumn : s.mcusPerLine * s.mcusPerColumn;
  let mcus = 0;
  try {
    while (mcus < total) {
      const n = s.restart ? Math.min(s.restart, total - mcus) : total - mcus;
      for (let i = 0; i < n; i++, mcus++) {
        if (single) {
          const row = Math.floor(mcus / c0.blocksPerLine);
          const col = mcus % c0.blocksPerLine;
          decode(c0, (row * c0.stride + col) * 64);
        } else {
          const mr = Math.floor(mcus / s.mcusPerLine);
          const mc = mcus % s.mcusPerLine;
          for (const c of comps) for (let y = 0; y < c.v; y++) for (let x = 0; x < c.h; x++) decode(c, ((mr * c.v + y) * c.stride + mc * c.h + x) * 64);
        }
      }
      if (mcus >= total) break;
      // a restart marker: realign to a byte, reset predictions
      bitCnt = 0;
      eobrun = 0;
      for (const c of comps) c.pred = 0;
      if (pos + 1 >= data.length) throw new EndOfData();
      if (data[pos] === 0xff && data[pos + 1] >= 0xd0 && data[pos + 1] <= 0xd7) pos += 2;
    }
  } catch (e) {
    if (!(e instanceof EndOfData)) throw e;
    return { done: false, pos, mcus };
  }
  // on to the next marker (not a stuffed byte or restart)
  while (pos + 1 < data.length && !(data[pos] === 0xff && data[pos + 1] !== 0 && (data[pos + 1] < 0xd0 || data[pos + 1] > 0xd7))) pos++;
  return { done: pos + 1 < data.length, pos, mcus };
}

// 1-D IDCT basis: COS[x * 8 + u] = C(u) / 2 * cos((2x + 1) u pi / 16)
const COS = new Float32Array(64);
for (let x = 0; x < 8; x++) for (let u = 0; u < 8; u++) COS[x * 8 + u] = (u ? 1 : Math.SQRT1_2) * 0.5 * Math.cos(((2 * x + 1) * u * Math.PI) / 16);

/** Dequantizes, inverse-transforms and color-converts the coefficients. */
function render(comps: Component[], qt: Int32Array[], width: number, height: number, maxH: number, maxV: number): Uint8Array {
  const planes = comps.map((c) => {
    const w = c.stride * 8;
    const rows = c.coeffs.length / 64 / c.stride;
    const plane = new Uint8Array(w * rows * 8);
    const q = qt[c.tq] ?? new Int32Array(64).fill(1);
    const blk = new Float32Array(64);
    const tmp = new Float32Array(64);
    for (let br = 0; br < rows; br++)
      for (let bc = 0; bc < c.stride; bc++) {
        const o = (br * c.stride + bc) * 64;
        for (let i = 0; i < 64; i++) blk[i] = c.coeffs[o + i] * q[i];
        // rows then columns
        for (let y = 0; y < 8; y++)
          for (let x = 0; x < 8; x++) {
            let sum = 0;
            for (let u = 0; u < 8; u++) sum += COS[x * 8 + u] * blk[y * 8 + u];
            tmp[y * 8 + x] = sum;
          }
        for (let x = 0; x < 8; x++)
          for (let y = 0; y < 8; y++) {
            let sum = 0;
            for (let v = 0; v < 8; v++) sum += COS[y * 8 + v] * tmp[v * 8 + x];
            const val = Math.round(sum + 128);
            plane[(br * 8 + y) * w + bc * 8 + x] = val < 0 ? 0 : val > 255 ? 255 : val;
          }
      }
    return { plane, w, sx: c.h / maxH, sy: c.v / maxV };
  });
  if (comps.length === 1) {
    const { plane, w } = planes[0];
    const out = new Uint8Array(width * height);
    for (let y = 0; y < height; y++) out.set(plane.subarray(y * w, y * w + width), y * width);
    return out;
  }
  const out = new Uint8Array(width * height * 3);
  const clamp = (v: number) => (v < 0 ? 0 : v > 255 ? 255 : Math.round(v));
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const [yy, cb, cr] = planes.map((p) => p.plane[Math.floor(y * p.sy) * p.w + Math.floor(x * p.sx)] ?? 128);
      const o = (y * width + x) * 3;
      out[o] = clamp(yy + 1.402 * (cr - 128));
      out[o + 1] = clamp(yy - 0.344136 * (cb - 128) - 0.714136 * (cr - 128));
      out[o + 2] = clamp(yy + 1.772 * (cb - 128));
    }
  return out;
}
