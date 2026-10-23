import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { createIso } from './iso9660';
import { bplist, dsStore } from './dsStore';
import { codeDirectories, hash } from './macSign';
import { appName, bundleId, infoPlist, macAppDmg, macAppFiles, macAppZip } from './macApp';
import { encodeRgbaPng, icns } from './macIcon';
import { readZip } from '../project/zip';
import { udzo } from './udif';

const player = new Uint8Array(readFileSync(resolve(__dirname, '../../public/mac/GameMakerPlayer')));
const enc = new TextEncoder();
const html = '<!doctype html><title>Test</title><p>game</p>';

/** The Rock Ridge names (NM) and modes (PX) in an ISO image's directory records. */
function rockRidge(img: Uint8Array): Map<string, number> {
  const out = new Map<string, number>();
  const dv = new DataView(img.buffer, img.byteOffset, img.byteLength);
  for (let i = 0; i + 4 < img.length; i++) {
    if (img[i] !== 0x4e || img[i + 1] !== 0x4d || img[i + 3] !== 1) continue; // "NM", version 1
    const len = img[i + 2];
    const name = new TextDecoder().decode(img.subarray(i + 5, i + len));
    // the PX entry comes just before NM in each record
    const px = i - 36;
    if (img[px] === 0x50 && img[px + 1] === 0x58) out.set(name, dv.getUint32(px + 4, true));
  }
  return out;
}

describe('iso9660', () => {
  it('writes a volume with Rock Ridge names, modes and links', () => {
    const img = createIso(
      [
        { path: 'My Game.app/Contents/MacOS/run', data: enc.encode('#!/bin/sh\n'), mode: 0o755 },
        { path: 'My Game.app/Contents/Info.plist', data: enc.encode('<plist/>') },
        { path: 'Applications', symlink: '/Applications' },
      ],
      { volume: 'My Game', date: new Date(Date.UTC(2026, 0, 1)) },
    );
    expect(img.length % 2048).toBe(0);
    expect(new TextDecoder().decode(img.subarray(16 * 2048 + 1, 16 * 2048 + 6))).toBe('CD001');
    expect(new TextDecoder().decode(img.subarray(16 * 2048 + 40, 16 * 2048 + 47))).toBe('My Game');
    const rr = rockRidge(img);
    expect(rr.get('My Game.app')).toBe(0o040755);
    expect(rr.get('run')).toBe(0o100755);
    expect(rr.get('Info.plist')).toBe(0o100644);
    expect(rr.get('Applications')).toBe(0o120755);
  });
});

describe('udif', () => {
  it('compresses a disk into chunks and ends with the koly trailer', async () => {
    const disk = new Uint8Array(3 * 1024 * 1024);
    disk.fill(7, 0, 1000);
    const dmg = await udzo(disk);
    expect(dmg.length).toBeLessThan(10000);
    const k = new DataView(dmg.buffer, dmg.byteOffset + dmg.length - 512, 512);
    expect(k.getUint32(0)).toBe(0x6b6f6c79); // "koly"
    expect(k.getUint32(492 + 4)).toBe(disk.length / 512);
    const xml = new TextDecoder().decode(dmg.subarray(k.getUint32(216 + 4), k.getUint32(216 + 4) + k.getUint32(224 + 4)));
    expect(xml).toContain('<key>blkx</key>');
  });
});

describe('dsStore', () => {
  it('writes a bplist00 and a Bud1 store', () => {
    const p = bplist({ a: true, b: 'x', c: { real: 1.5 }, d: 300 });
    expect(new TextDecoder().decode(p.subarray(0, 8))).toBe('bplist00');
    const ds = dsStore({ x: 0, y: 0, width: 600, height: 400, iconSize: 128, icons: { 'A.app': [100, 100], Applications: [400, 100] } });
    expect(new TextDecoder().decode(ds.subarray(4, 8))).toBe('Bud1');
    expect(ds.length).toBe(4 + 8192);
  });
});

describe('macIcon', () => {
  it('writes PNGs into an icns', async () => {
    const png = await encodeRgbaPng(new Uint8Array(4 * 4 * 4).fill(200), 4, 4);
    expect([...png.subarray(1, 4)].map((c) => String.fromCharCode(c)).join('')).toBe('PNG');
    const file = icns([['ic07', png]]);
    expect(new TextDecoder().decode(file.subarray(0, 4))).toBe('icns');
    expect(new DataView(file.buffer).getUint32(4)).toBe(file.length);
  });
});

describe('macApp', () => {
  it('names the app and its bundle', () => {
    expect(appName('A/B: C')).toBe('A-B- C.app');
    expect(bundleId("Teddy's Game")).toBe('com.lewismoten.gamemaker.teddy-s-game');
    const plist = infoPlist({ title: 'Fish & Chips', id: 'fish' });
    expect(plist).toContain('<string>Fish &amp; Chips</string>');
    expect(plist).toContain('com.lewismoten.gamemaker.fish');
  });

  it('re-seals the player for the app’s Info.plist and resources', async () => {
    const { files } = await macAppFiles({ title: 'Test Game', id: 'test', html, player });
    const get = (end: string) => files.find((f) => f.path.endsWith(end))!.data!;
    const bin = get('MacOS/GameMakerPlayer');
    const dirs = codeDirectories(bin);
    expect(dirs.length).toBeGreaterThanOrEqual(2); // arm64 and x86_64
    for (const d of dirs) {
      const slot = (n: number) => bin.subarray(d.at + d.hashOffset - n * d.hashSize, d.at + d.hashOffset - (n - 1) * d.hashSize);
      expect(slot(1)).toEqual((await hash(d.hash, get('Contents/Info.plist'))).subarray(0, d.hashSize));
      expect(slot(3)).toEqual((await hash(d.hash, get('_CodeSignature/CodeResources'))).subarray(0, d.hashSize));
    }
    expect(files.find((f) => f.path.endsWith('MacOS/GameMakerPlayer'))!.mode).toBe(0o755);
  });

  it('zips the app with the program executable', async () => {
    const zip = await macAppZip({ title: 'Test Game', id: 'test', html, player });
    const names = (await readZip(zip)).map((e) => e.name);
    expect(names).toContain('Test Game.app/Contents/MacOS/GameMakerPlayer');
    // central directory: "made by" Unix, mode 0100755 in the external attributes
    const dv = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
    const end = zip.length - 22;
    let at = dv.getUint32(end + 16, true);
    const modes = new Map<string, number>();
    while (dv.getUint32(at, true) === 0x02014b50) {
      const n = dv.getUint16(at + 28, true);
      modes.set(new TextDecoder().decode(zip.subarray(at + 46, at + 46 + n)), dv.getUint32(at + 38, true) >>> 16);
      at += 46 + n + dv.getUint16(at + 30, true) + dv.getUint16(at + 32, true);
    }
    expect(modes.get('Test Game.app/Contents/MacOS/GameMakerPlayer')).toBe(0o100755);
    expect(modes.get('Test Game.app/Contents/Info.plist')).toBe(0o100644);
  });

  // On a Mac: codesign accepts the app, and hdiutil mounts the disk image.
  it.runIf(process.platform === 'darwin')('makes an app codesign verifies, on a disk image macOS mounts', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'gm-mac-test-'));
    try {
      const o = { title: 'Test Game', id: 'test', html, player };
      const { files } = await macAppFiles(o);
      for (const f of files) {
        mkdirSync(dirname(join(dir, f.path)), { recursive: true });
        writeFileSync(join(dir, f.path), f.data!, { mode: f.mode });
      }
      execFileSync('codesign', ['--verify', '--deep', '--strict', join(dir, 'Test Game.app')]);
      writeFileSync(join(dir, 'test.dmg'), await macAppDmg(o));
      const attach = execFileSync('hdiutil', ['attach', '-nobrowse', '-readonly', '-mountrandom', dir, join(dir, 'test.dmg')], { encoding: 'utf8' });
      const [dev, , mount] = attach.trim().split('\n').pop()!.split('\t').map((s) => s.trim());
      try {
        execFileSync('test', ['-x', join(mount, 'Test Game.app/Contents/MacOS/GameMakerPlayer')]);
        execFileSync('codesign', ['--verify', '--deep', '--strict', join(mount, 'Test Game.app')]);
      } finally {
        execFileSync('hdiutil', ['detach', '-quiet', dev]);
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }, 30000);
});
