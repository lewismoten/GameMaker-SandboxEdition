// Tests: the tools package's mesh packs (mesh/meshPack): a binary STL packed and unpacked is the same file byte
// for byte, and the vertex-number and byte-plane pieces read back what they wrote.
import { describe, expect, it } from 'vitest';
import { packIndices, packStl, unpackIndices, unpackStl, fromPlanes, toPlanes } from '@lewismoten/gamemaker-sandbox-tools/mesh/meshPack';
import { writeStl } from '@lewismoten/gamemaker-sandbox-tools/mesh/stl';
import type { Mesh } from '@lewismoten/gamemaker-sandbox-tools/mesh/mesh';
import { pack3mf, unpack3mf } from '@lewismoten/gamemaker-sandbox-tools/mesh/threeMfPack';
import { threeMfEntries, write3mf } from '@lewismoten/gamemaker-sandbox-tools/mesh/threeMf';
import { readZip, writeZip } from '@lewismoten/gamemaker-sandbox-tools/mesh/zipFile';
import { deflateRawSync, inflateRawSync } from 'node:zlib';

const tetra: Mesh = {
  positions: Float32Array.from([0, 0, 0, 10.25, 0, 0, 0, 7.5, 0, 0, 0, -3.125]),
  indices: Uint32Array.from([0, 2, 1, 0, 1, 3, 1, 2, 3, 0, 3, 2]),
};

describe('meshPack', () => {
  it('reads an STL back byte for byte, plain and colored', () => {
    for (const mesh of [tetra, { ...tetra, colors: Uint8Array.from([255, 0, 0, 0, 255, 0, 0, 0, 255, 90, 90, 90]) }]) {
      const stl = writeStl(mesh, { name: 'Test: a tetrahedron, mm' });
      const pack = packStl(stl);
      expect(pack.length).toBeLessThan(stl.length);
      expect(unpackStl(pack)).toEqual(stl);
    }
  });

  it('keeps a normal that is not the worked-out one, and an empty STL', () => {
    const stl = writeStl(tetra);
    new DataView(stl.buffer).setFloat32(84 + 50 + 4, 0.5, true);
    expect(unpackStl(packStl(stl))).toEqual(stl);
    const empty = writeStl({ positions: new Float32Array(), indices: new Uint32Array() });
    expect(unpackStl(packStl(empty))).toEqual(empty);
  });

  it('refuses a file that is not a binary STL', () => {
    expect(() => packStl(new TextEncoder().encode('solid x\nendsolid x\n'))).toThrow(/binary STL/);
    expect(() => unpackStl(new Uint8Array(8))).toThrow(/packed STL/);
  });

  it('packs vertex numbers in blocks and byte planes both ways', () => {
    const ix = [0, 1, 2, 2, 1, 3, 70000, 0, 5, 0, 1, 2];
    const starts = new Set([9]);
    expect([...unpackIndices(packIndices(ix, starts), ix.length, starts)]).toEqual(ix);
    const bytes = Uint8Array.from({ length: 24 }, (_, i) => i * 7);
    expect(fromPlanes(toPlanes(bytes, 4), 4)).toEqual(bytes);
  });

  it('makes a 3MF again with the same files inside, and refuses one it would not', () => {
    const parts = [
      { name: 'Color 1', color: [200, 30, 30] as [number, number, number], mesh: tetra },
      { name: 'Tom & "Jerry" <2>', color: [10, 20, 30.4] as [number, number, number], mesh: { ...tetra, positions: tetra.positions.map((v) => -v / 3) } },
    ];
    const codec = {
      deflate: (d: Uint8Array) => new Uint8Array(deflateRawSync(d, { level: 9 })),
      inflate: (d: Uint8Array) => new Uint8Array(inflateRawSync(d)),
    };
    const file = write3mf(parts, 'Test: two bodies', codec);
    const { title, parts: back } = unpack3mf(pack3mf(file, codec));
    expect(threeMfEntries(back, title)).toEqual(readZip(file, codec));
    expect(writeZip(threeMfEntries(back, title), codec)).toEqual(file);
    const other = writeZip([...readZip(file, codec), { name: 'extra.txt', data: new Uint8Array(3) }]);
    expect(() => pack3mf(other, codec)).toThrow(/made again/);
  });
});
