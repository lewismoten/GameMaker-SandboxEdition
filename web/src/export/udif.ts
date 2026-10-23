// A compressed Apple disk image (UDIF "UDZO", the usual .dmg) around a raw disk image, in
// plain JavaScript: the raw image cut into chunks, each zlib-compressed (or marked empty),
// then an XML property list whose "blkx" entry maps the chunks back to the disk's sectors,
// then the 512-byte "koly" trailer saying where everything is.
//
// Layout (reverse-engineered; see "Demystifying the DMG File Format", newosxbook.com, and
// libdmg-hfsplus): sectors are 512 bytes; numbers are big-endian; checksums are CRC-32.
//   mish (blkx table)  'mish', version 1, first sector, sector count, data offset, buffers
//                      needed, descriptor, 24 reserved, checksum (type, bits, 128 bytes),
//                      chunk count, then 40-byte chunks: type, comment, first sector,
//                      sector count, compressed offset, compressed length
//   koly               'koly', version 4, header size 512, flags, running data fork offset,
//                      data fork offset and length, resource fork offset and length,
//                      segment number and count, segment id (16), data checksum, XML offset
//                      and length, 120 reserved, master checksum, image variant, sector
//                      count, 12 reserved
import { crc32 } from '../project/zip';
import { concat } from './macIcon';

const SECTOR = 512;
const CHUNK_SECTORS = 2048; // 1 MB of disk per chunk
const ZLIB = 0x80000005;
const ZERO = 0x00000002;
const RAW = 0x00000001;
const END = 0xffffffff;
const CRC32 = 2;

async function zlib(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([data as BlobPart]).stream().pipeThrough(new CompressionStream('deflate'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function u64(dv: DataView, at: number, v: number): void {
  dv.setUint32(at, Math.floor(v / 2 ** 32));
  dv.setUint32(at + 4, v >>> 0);
}

/** A UDIF checksum field: type, size in bits, then 128 bytes (a CRC-32 in the first 4). */
function checksum(dv: DataView, at: number, crc: number): void {
  dv.setUint32(at, CRC32);
  dv.setUint32(at + 4, 32);
  dv.setUint32(at + 8, crc);
}

const b64 = (bytes: Uint8Array) => {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
};

/** `raw` (a whole disk, e.g. an ISO image; padded to 512-byte sectors) as a compressed .dmg. */
export async function udzo(raw: Uint8Array, name = 'whole disk (Apple_ISO : 0)'): Promise<Uint8Array> {
  const padded = raw.length % SECTOR ? concat([raw, new Uint8Array(SECTOR - (raw.length % SECTOR))]) : raw;
  const sectors = padded.length / SECTOR;
  const fork: Uint8Array[] = [];
  const chunks: [type: number, sector: number, count: number, offset: number, length: number][] = [];
  let offset = 0;
  for (let s = 0; s < sectors; s += CHUNK_SECTORS) {
    const count = Math.min(CHUNK_SECTORS, sectors - s);
    const part = padded.subarray(s * SECTOR, (s + count) * SECTOR);
    if (part.every((b) => b === 0)) {
      chunks.push([ZERO, s, count, offset, 0]);
      continue;
    }
    const packed = await zlib(part);
    const [type, body] = packed.length < part.length ? [ZLIB, packed] : [RAW, part];
    chunks.push([type, s, count, offset, body.length]);
    fork.push(body);
    offset += body.length;
  }
  chunks.push([END, sectors, 0, offset, 0]);
  const data = concat(fork);
  const diskCrc = crc32(padded);

  const mish = new Uint8Array(204 + 40 * chunks.length);
  const m = new DataView(mish.buffer);
  mish.set([0x6d, 0x69, 0x73, 0x68]); // "mish"
  m.setUint32(4, 1);
  u64(m, 8, 0);
  u64(m, 16, sectors);
  u64(m, 24, 0);
  m.setUint32(32, 0x808); // buffers needed (as hdiutil writes)
  m.setUint32(36, 0xfffffffe); // block descriptor (as hdiutil writes)
  checksum(m, 64, diskCrc);
  m.setUint32(200, chunks.length);
  chunks.forEach(([type, sector, count, off, len], i) => {
    const at = 204 + i * 40;
    m.setUint32(at, type);
    u64(m, at + 8, sector);
    u64(m, at + 16, count);
    u64(m, at + 24, off);
    u64(m, at + 32, len);
  });

  const xml = new TextEncoder().encode(`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>resource-fork</key>
	<dict>
		<key>blkx</key>
		<array>
			<dict>
				<key>Attributes</key>
				<string>0x0050</string>
				<key>CFName</key>
				<string>${name}</string>
				<key>Data</key>
				<data>${b64(mish)}</data>
				<key>ID</key>
				<string>0</string>
				<key>Name</key>
				<string>${name}</string>
			</dict>
		</array>
	</dict>
</dict>
</plist>
`);

  const koly = new Uint8Array(512);
  const k = new DataView(koly.buffer);
  koly.set([0x6b, 0x6f, 0x6c, 0x79]); // "koly"
  k.setUint32(4, 4);
  k.setUint32(8, 512);
  k.setUint32(12, 1); // flattened
  u64(k, 16, 0);
  u64(k, 24, 0);
  u64(k, 32, data.length);
  u64(k, 40, 0);
  u64(k, 48, 0);
  k.setUint32(56, 1);
  k.setUint32(60, 1);
  // segment id: any 16 bytes, from the data's checksum so the same input gives the same file
  for (let i = 0; i < 4; i++) k.setUint32(64 + i * 4, crc32(concat([data.subarray(0, 4096), Uint8Array.of(i)])));
  checksum(k, 80, crc32(data));
  u64(k, 216, data.length);
  u64(k, 224, xml.length);
  // master checksum: the CRC-32 of every blkx table's checksum, in order
  const sums = new Uint8Array(4);
  new DataView(sums.buffer).setUint32(0, diskCrc);
  checksum(k, 352, crc32(sums));
  k.setUint32(488, 2); // image variant (as hdiutil writes)
  u64(k, 492, sectors);
  return concat([data, xml, koly]);
}
