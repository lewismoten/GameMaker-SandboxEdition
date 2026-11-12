// Tiny malformed archives exercise metadata extents and exact decoded lengths.
import { expect, it } from 'vitest';
import { createZip, readZip, type ZipEntry } from '@lewismoten/gamemaker-sandbox-archives/zip';

it('rejects stored ZIP data that extends into the central directory', async () => {
  const zip = await createZip([{ name: 'a', data: new Uint8Array([1]), store: true }]);
  const view = new DataView(zip.buffer);
  const central = view.getUint32(zip.length - 6, true);
  view.setUint32(central + 20, 1000, true);
  view.setUint32(central + 24, 1000, true);
  await expect(readZip(zip)).rejects.toThrow(/extent/);
});

it('rejects invalid local signatures and truncated directory names', async () => {
  const zip = await createZip([{ name: 'a', data: new Uint8Array([1]), store: true }]);
  const badSignature = zip.slice();
  badSignature[0] = 0;
  await expect(readZip(badSignature)).rejects.toThrow(/local header/);
  const view = new DataView(zip.buffer);
  const central = view.getUint32(zip.length - 6, true);
  view.setUint16(central + 28, 1000, true);
  await expect(readZip(zip)).rejects.toThrow(/directory entry/);
});

it('requires the inflated ZIP length to equal the declared length', async () => {
  const zip = await createZip([{ name: 'a', data: new Uint8Array(100).fill(7) }]);
  const view = new DataView(zip.buffer);
  const central = view.getUint32(zip.length - 6, true);
  expect(view.getUint16(central + 10, true)).toBe(8);
  view.setUint32(central + 24, 101, true);
  await expect(readZip(zip)).rejects.toThrow(/shorter/);
});

it('rejects ZIP entry counts and UTF-8 names that cannot fit their header fields', async () => {
  // Sparse length only: no files or payloads are constructed for the count regression.
  await expect(createZip(new Array<ZipEntry>(65536))).rejects.toThrow(/Too many entries/);
  await expect(createZip([{ name: 'a'.repeat(65536), data: new Uint8Array() }])).rejects.toThrow(/name is too long/);
  await expect(createZip([{ name: 'é'.repeat(32768), data: new Uint8Array() }])).rejects.toThrow(/name is too long/);
});

it('rejects unrepresentable ZIP sizes before reading or allocating file data', async () => {
  // A length-only double makes this a bounded validation test, not an allocation probe.
  for (const length of [0xffffffff, 0xfffffffe - 22]) {
    const data = { length } as Uint8Array;
    await expect(createZip([{ name: 'a', data }])).rejects.toThrow(/too large/);
  }
});

it('rejects ZIP file data overlapping another local header', async () => {
  const zip = await createZip([
    { name: 'a', data: new Uint8Array([1]), store: true },
    { name: 'b', data: new Uint8Array([2]), store: true },
  ]);
  const view = new DataView(zip.buffer);
  const central = view.getUint32(zip.length - 6, true);
  view.setUint32(central + 20, 2, true);
  view.setUint32(central + 24, 2, true);
  await expect(readZip(zip)).rejects.toThrow(/overlaps a local header/);
});
