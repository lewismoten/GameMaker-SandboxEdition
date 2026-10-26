// A Finder .DS_Store file, so a disk image opens as a tidy window: icon view, no toolbar
// or sidebar, a set size, and each icon where we put it (the game on the left, the
// Applications shortcut on the right). Finder reads it from the root of the mounted image.
//
// Format (reverse-engineered; see the Python ds_store package's buddy.py and store.py):
// four bytes 00 00 00 01, then a "buddy allocator" whose offsets count from byte 4:
//   header      "Bud1", offset and size of the bookkeeping block, the offset again, 16 zeros
//   bookkeeping block count, 0, the blocks' addresses (offset | log2 size; 256 slots per
//               page), the table of contents ("DSDB" -> block number), 32 free lists
//   DSDB        the B-tree's root node, levels, records, nodes, page size
//   leaf node   0 (a leaf), the record count, the records
// A record is a file name (length, UTF-16BE), a four-letter property code, a four-letter
// type and its value. Window settings are binary property lists (bplist00, below).

type Plist = boolean | number | string | { real: number } | { [key: string]: Plist };

/** A binary property list (bplist00) of booleans, integers, reals, ASCII strings and dictionaries. */
export function bplist(root: Plist): Uint8Array {
  const objects: number[][] = [];
  const add = (v: Plist): number => {
    const index = objects.length;
    objects.push([]);
    let bytes: number[];
    if (typeof v === 'boolean') bytes = [v ? 0x09 : 0x08];
    else if (typeof v === 'number') {
      if (!Number.isInteger(v) || v < 0 || v > 0xffffffff) throw new Error('bplist: unsupported integer');
      bytes = v < 256 ? [0x10, v] : v < 65536 ? [0x11, v >> 8, v & 255] : [0x12, v >>> 24, (v >>> 16) & 255, (v >>> 8) & 255, v & 255];
    } else if (typeof v === 'string') {
      const chars = [...v].map((c) => c.charCodeAt(0));
      if (chars.some((c) => c > 127)) throw new Error('bplist: ASCII strings only');
      bytes = [...(chars.length < 15 ? [0x50 | chars.length] : [0x5f, 0x10, chars.length]), ...chars];
    } else if ('real' in v && typeof v.real === 'number') {
      const b = new DataView(new ArrayBuffer(8));
      b.setFloat64(0, v.real);
      bytes = [0x23, ...new Uint8Array(b.buffer)];
    } else {
      const keys = Object.keys(v).sort();
      const keyRefs = keys.map((k) => add(k));
      const valueRefs = keys.map((k) => add((v as Record<string, Plist>)[k]));
      bytes = [...(keys.length < 15 ? [0xd0 | keys.length] : [0xdf, 0x10, keys.length]), ...keyRefs, ...valueRefs];
    }
    objects[index] = bytes;
    return index;
  };
  add(root);
  if (objects.length > 255) throw new Error('bplist: too many objects');
  const body: number[] = [...new TextEncoder().encode('bplist00')];
  const offsets: number[] = [];
  for (const o of objects) {
    offsets.push(body.length);
    body.push(...o);
  }
  const tableAt = body.length;
  const offsetSize = tableAt < 256 ? 1 : 2;
  for (const off of offsets) body.push(...(offsetSize === 1 ? [off] : [off >> 8, off & 255]));
  const trailer = new DataView(new ArrayBuffer(32));
  trailer.setUint8(6, offsetSize);
  trailer.setUint8(7, 1);
  trailer.setUint32(12, objects.length);
  trailer.setUint32(20, 0);
  trailer.setUint32(28, tableAt);
  return Uint8Array.from([...body, ...new Uint8Array(trailer.buffer)]);
}

interface DsRecord {
  name: string;
  code: string;
  type: 'blob' | 'long' | 'type' | 'bool';
  value: Uint8Array | number | string | boolean;
}

function recordBytes(r: DsRecord): number[] {
  const out: number[] = [];
  const u32 = (v: number) => out.push(v >>> 24, (v >>> 16) & 255, (v >>> 8) & 255, v & 255);
  const ascii4 = (s: string) => out.push(...[...s].map((c) => c.charCodeAt(0)));
  u32(r.name.length);
  for (let i = 0; i < r.name.length; i++) {
    const c = r.name.charCodeAt(i);
    out.push(c >> 8, c & 255);
  }
  ascii4(r.code);
  ascii4(r.type);
  if (r.type === 'blob') {
    const b = r.value as Uint8Array;
    u32(b.length);
    out.push(...b);
  } else if (r.type === 'long') u32(r.value as number);
  else if (r.type === 'type') ascii4(r.value as string);
  else out.push(r.value ? 1 : 0);
  return out;
}

interface FinderWindow {
  /** Window position and content size, in points. */
  x: number;
  y: number;
  width: number;
  height: number;
  iconSize: number;
  /** Where each item's icon is centered, by file name. */
  icons: { [name: string]: [x: number, y: number] };
}

/** A .DS_Store that shows the folder as `w` says. */
export function dsStore(w: FinderWindow): Uint8Array {
  const bwsp = bplist({
    ContainerShowSidebar: false,
    ShowSidebar: false,
    ShowStatusBar: false,
    ShowTabView: false,
    ShowToolbar: false,
    ShowPathbar: false,
    SidebarWidth: 0,
    WindowBounds: `{{${w.x}, ${w.y}}, {${w.width}, ${w.height}}}`,
  });
  const icvp = bplist({
    arrangeBy: 'none',
    backgroundType: 0,
    backgroundColorRed: { real: 1 },
    backgroundColorGreen: { real: 1 },
    backgroundColorBlue: { real: 1 },
    gridOffsetX: { real: 0 },
    gridOffsetY: { real: 0 },
    gridSpacing: { real: 100 },
    iconSize: { real: w.iconSize },
    labelOnBottom: true,
    showIconPreview: true,
    showItemInfo: false,
    textSize: { real: 13 },
    viewOptionsVersion: 1,
  });
  const records: DsRecord[] = [
    { name: '.', code: 'bwsp', type: 'blob', value: bwsp },
    { name: '.', code: 'icvp', type: 'blob', value: icvp },
    { name: '.', code: 'vSrn', type: 'long', value: 1 },
    { name: '.', code: 'vstl', type: 'type', value: 'icnv' },
  ];
  for (const [name, [x, y]] of Object.entries(w.icons)) {
    const loc = new Uint8Array(16);
    const dv = new DataView(loc.buffer);
    dv.setUint32(0, x);
    dv.setUint32(4, y);
    loc.set([255, 255, 255, 255, 255, 255, 0, 0], 8);
    records.push({ name, code: 'Iloc', type: 'blob', value: loc });
  }
  // Finder's order: names compared case-insensitively, then the property codes
  records.sort((a, b) => {
    const [x, y] = [a.name.toLowerCase(), b.name.toLowerCase()];
    return x < y ? -1 : x > y ? 1 : a.code < b.code ? -1 : a.code > b.code ? 1 : 0;
  });

  // Blocks: the bookkeeping block at 2048 (2 KB), DSDB at 32 (32 bytes), the leaf at 4096 (4 KB).
  const PAGE = 4096;
  const leaf = [0, 0, 0, 0, ...u32b(records.length), ...records.flatMap(recordBytes)];
  if (leaf.length > PAGE) throw new Error('Too many icons for one .DS_Store page.');
  const file = new Uint8Array(4 + 2 * PAGE);
  const dv = new DataView(file.buffer);
  const at = (offset: number) => 4 + offset;
  dv.setUint32(0, 1);
  file.set([0x42, 0x75, 0x64, 0x31], at(0)); // "Bud1"
  dv.setUint32(at(4), 2048);
  dv.setUint32(at(8), 2048);
  dv.setUint32(at(12), 2048);
  // bookkeeping
  let p = at(2048);
  const put = (v: number) => {
    dv.setUint32(p, v);
    p += 4;
  };
  put(3);
  put(0);
  const addresses = [2048 | 11, 32 | 5, PAGE | 12];
  for (let i = 0; i < 256; i++) put(addresses[i] ?? 0);
  put(1);
  file[p++] = 4;
  file.set([0x44, 0x53, 0x44, 0x42], p); // "DSDB"
  p += 4;
  put(1);
  // free lists: the space no block uses, as buddies (64 ... 1024 inside the file, then
  // 8 KB, 16 KB ... up to the allocator's 2 GB)
  for (let i = 0; i < 32; i++) {
    const free = (i >= 6 && i <= 10) || (i >= 13 && i <= 30) ? [2 ** i] : [];
    put(free.length);
    free.forEach(put);
  }
  // DSDB: root node 2, no levels above the leaf, the record count, one node, the page size
  p = at(32);
  [2, 0, records.length, 1, PAGE].forEach(put);
  file.set(leaf, at(PAGE));
  return file;
}

function u32b(v: number): number[] {
  return [v >>> 24, (v >>> 16) & 255, (v >>> 8) & 255, v & 255];
}
