import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildResourceSection, MACHINE_ARM64, MACHINE_X64, peChecksum, peLayout, readResources, RT, writeResources, type PeResource } from './peResources';
import { exeName, infoText, parseInfo, versionInfo, winExe, winExeZip, winId } from './winApp';
import { groupIcon, icoFile, ICON_SIZES, winIconImages } from './winIcon';
import { readZip } from '../project/zip';

const players = {
  x64: new Uint8Array(readFileSync(resolve(__dirname, '../../public/win/GameMakerPlayer-x64.exe'))),
  arm64: new Uint8Array(readFileSync(resolve(__dirname, '../../public/win/GameMakerPlayer-arm64.exe'))),
};
const dec = new TextDecoder();
const html = '<!doctype html><title>Test</title><p>game ' + '♪'.repeat(5000) + '</p>';
const options = { title: 'Teddy’s Test: Game', id: 'Teddy Test', html, author: 'Lewis Moten', year: 2026 };

/** Every string of a version resource's StringFileInfo (key → value), read from its blocks. */
function versionStrings(data: Uint8Array): Record<string, string> {
  const dv = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const out: Record<string, string> = {};
  const str = (at: number) => {
    let s = '';
    for (let c; (c = dv.getUint16(at, true)); at += 2) s += String.fromCharCode(c);
    return [s, at + 2] as const;
  };
  const walk = (at: number, end: number, depth: number) => {
    while (at < end) {
      const len = dv.getUint16(at, true);
      const valueLen = dv.getUint16(at + 2, true);
      const type = dv.getUint16(at + 4, true);
      const [key, after] = str(at + 6);
      let v = after + ((4 - (after & 3)) & 3);
      if (depth === 3 && type === 1) out[key] = str(v)[0];
      v += type === 1 ? valueLen * 2 : valueLen;
      if (depth < 3) walk(v + ((4 - (v & 3)) & 3), at + len, depth + 1);
      at += len + ((4 - (len & 3)) & 3);
    }
  };
  walk(0, data.length, 0);
  return out;
}

/** The headers agree with the sections: contiguous in the file, in order in memory, SizeOfImage and checksum right. */
function checkHeaders(exe: Uint8Array, checksum = true): void {
  const l = peLayout(exe);
  const dv = new DataView(exe.buffer, exe.byteOffset, exe.byteLength);
  for (let i = 1; i < l.sections.length; i++) {
    const [a, b] = [l.sections[i - 1], l.sections[i]];
    expect(b.ptr).toBe(a.ptr + a.raw);
    expect(b.va).toBeGreaterThanOrEqual(a.va + a.vsize);
    expect(b.va % l.sectionAlign).toBe(0);
    expect(b.raw % l.fileAlign).toBe(0);
  }
  const last = l.sections[l.sections.length - 1];
  expect(exe.length).toBe(last.ptr + last.raw);
  expect(dv.getUint32(l.opt + 56, true)).toBe(Math.ceil((last.va + last.vsize) / l.sectionAlign) * l.sectionAlign);
  if (checksum) expect(dv.getUint32(l.opt + 64, true)).toBe(peChecksum(exe, l.opt + 64));
  // the base relocations stay where their directory says
  const reloc = l.sections.find((s) => s.name === '.reloc')!;
  expect(dv.getUint32(l.dirs + 5 * 8, true)).toBe(reloc.va);
}

describe('the Windows player', () => {
  it('is a 64-bit GUI program for x64 and for arm64, with resources before its relocations', () => {
    for (const [arch, exe] of Object.entries(players)) {
      const l = peLayout(exe);
      expect(l.machine).toBe(arch === 'x64' ? MACHINE_X64 : MACHINE_ARM64);
      expect(l.is64).toBe(true);
      expect(new DataView(exe.buffer).getUint16(l.opt + 68, true)).toBe(2); // the Windows GUI subsystem
      expect(l.sections.map((s) => s.name).slice(-2)).toEqual(['.rsrc', '.reloc']);
      const types = readResources(exe).map((r) => r.type);
      expect(types).toContain(RT.MANIFEST);
      expect(types).toContain(RT.GROUP_ICON);
      checkHeaders(exe, false); // the linker leaves the checksum 0
    }
  });

  it('reads back the resources it writes, unchanged', () => {
    const before = readResources(players.x64);
    const again = writeResources(players.x64, before);
    expect(readResources(again)).toEqual(before);
    checkHeaders(again);
  });
});

describe('peResources', () => {
  it('sorts named entries before numbered ones and keeps names upper case', () => {
    const r = (type: number | string, name: number | string, n: number): PeResource => ({ type, name, lang: 0, data: Uint8Array.of(n) });
    const section = buildResourceSection([r(10, 7, 1), r(10, 'GAME', 2), r(3, 1, 3), r(10, 'INFO', 4)], 0x1000);
    const dv = new DataView(section.buffer);
    expect([dv.getUint16(12, true), dv.getUint16(14, true)]).toEqual([0, 2]); // two numbered types
    expect(dv.getUint32(16, true)).toBe(3); // icons first
    expect(() => buildResourceSection([r(10, 'game', 1)], 0x1000)).toThrow(/upper case/);
  });

  it('refuses a signed program, and anything that is not one', () => {
    expect(() => peLayout(new TextEncoder().encode('not a program at all, not at all, no, not even a little bit.....'))).toThrow(/MZ/);
    const signed = players.x64.slice();
    const l = peLayout(signed);
    new DataView(signed.buffer).setUint32(l.dirs + 4 * 8 + 4, 16, true);
    expect(() => writeResources(signed, [])).toThrow(/signed/);
  });
});

describe('winApp', () => {
  it('names the program for Windows', () => {
    expect(exeName('Teddy’s Test: Game')).toBe('Teddy’s Test- Game.exe');
    expect(exeName('A/B\\C?*"<>|')).toBe('A-B-C-.exe');
    expect(exeName(' ...Dots... ')).toBe('Dots.exe');
    expect(exeName('CON')).toBe('CON game.exe');
    expect(exeName('')).toBe('Game.exe');
    expect(winId('Teddy Test')).toBe('teddy-test');
  });

  it('writes INFO that parses back', () => {
    const info = parseInfo(infoText({ title: 'Back\\slash\nand line', id: 'x', author: 'Lewis Moten', year: 2026 }));
    expect(info.title).toBe('Back\\slash\nand line');
    expect(info.id).toBe('x');
    expect(info.credits).toMatch(/^By Lewis Moten, 2026\.\n\nPlays with Game-Maker: Sandbox Edition/);
    expect(info.site).toMatch(/^https:\/\//);
  });

  it('writes version information', () => {
    const v = versionInfo({ title: 'My Game', id: 'my-game', version: '2.3', author: 'Teddy', year: 1995 });
    expect(new DataView(v.buffer).getUint16(0, true)).toBe(v.length);
    expect(versionStrings(v)).toMatchObject({ FileDescription: 'My Game', ProductName: 'My Game', FileVersion: '2.3', CompanyName: 'Teddy', OriginalFilename: 'My Game.exe', InternalName: 'my-game', LegalCopyright: '© 1995 Teddy' });
  });

  it('puts the game, its info, icon and version into the program (x64 and arm64)', async () => {
    for (const player of Object.values(players)) {
      const exe = await winExe({ ...options, player });
      checkHeaders(exe);
      const res = readResources(exe);
      const get = (type: number, name: number | string) => res.find((r) => r.type === type && r.name === name)?.data;
      expect(dec.decode(get(RT.RCDATA, 'GAME'))).toBe(html);
      expect(parseInfo(dec.decode(get(RT.RCDATA, 'INFO')))).toMatchObject({ title: options.title, id: 'teddy-test' });
      expect(versionStrings(get(RT.VERSION, 1)!).FileDescription).toBe(options.title);
      // the group icon names each RT_ICON by id, with its size
      const group = new DataView(get(RT.GROUP_ICON, 1)!.buffer);
      expect(group.getUint16(4, true)).toBe(ICON_SIZES.length);
      ICON_SIZES.forEach((size, i) => {
        expect(group.getUint8(6 + i * 14)).toBe(size % 256);
        expect(group.getUint16(6 + i * 14 + 12, true)).toBe(i + 1);
        expect(group.getUint32(6 + i * 14 + 8, true)).toBe(get(RT.ICON, i + 1)!.length);
      });
      // the manifest (DPI awareness) is kept
      expect(dec.decode(get(RT.MANIFEST, 1))).toContain('PerMonitorV2');
      // nothing left over from the template
      expect(res.filter((r) => r.type === RT.ICON)).toHaveLength(ICON_SIZES.length);
    }
  });

  it('zips the program', async () => {
    const zip = await winExeZip({ ...options, player: players.x64 }, new Date(Date.UTC(2026, 0, 1)));
    const [entry] = await readZip(zip);
    expect(entry.name).toBe('Teddy’s Test- Game.exe');
    expect(dec.decode(readResources(entry.data).find((r) => r.name === 'GAME')!.data)).toBe(html);
  });
});

describe('winIcon', () => {
  it('makes an .ico file with bitmaps and PNGs', async () => {
    const images = await winIconImages(undefined);
    const ico = icoFile(images);
    const dv = new DataView(ico.buffer);
    expect([dv.getUint16(0, true), dv.getUint16(2, true), dv.getUint16(4, true)]).toEqual([0, 1, ICON_SIZES.length]);
    images.forEach((img, i) => {
      const at = dv.getUint32(6 + i * 16 + 12, true);
      expect(ico.subarray(at, at + img.data.length)).toEqual(img.data);
      if (img.size >= 64) expect([...img.data.subarray(1, 4)]).toEqual([0x50, 0x4e, 0x47]); // PNG
      else expect(new DataView(img.data.buffer).getInt32(8, true)).toBe(img.size * 2); // bitmap, with its mask
    });
    expect(groupIcon(images, 5).length).toBe(6 + 14 * images.length);
  });
});
