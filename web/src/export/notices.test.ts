import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { thirdPartyNotices } from './notices';
import { readResources, RT } from './peResources';
import { winExe, winExeZip } from './winApp';
import { linuxAppFiles } from './linuxApp';
import { macAppZip, NOTICES_FILE } from './macApp';
import { readZip } from '../project/zip';

const pub = (p: string) => new Uint8Array(readFileSync(resolve(__dirname, '../../public', p)));
const html = '<!doctype html><title>T</title>';
const dec = new TextDecoder('utf-8', { ignoreBOM: true }); // keep the Windows text's byte order mark

describe('third-party notices', () => {
  it('name what each player contains', () => {
    const win = thirdPartyNotices('windows');
    expect(win.startsWith('﻿')).toBe(true);
    expect(win).toContain('\r\n');
    for (const s of [
      'Copyright (c) 2026 Lewis Moten',
      'Copyright (C) Microsoft Corporation',
      'Copyright (c) 2017 Serge Zaitsev',
      'by the mingw-w64 project',
      'Copyright (c) Zig contributors',
    ])
      expect(win).toContain(s);
    const linux = thirdPartyNotices('linux');
    for (const s of ['Copyright (c) 2026 Lewis Moten', 'Copyright (c) Zig contributors', 'GNU C Library', 'WebKitGTK']) expect(linux).toContain(s);
    expect(linux).not.toContain('mingw');
    expect(thirdPartyNotices('mac')).toContain('Copyright (c) 2026 Lewis Moten');
  });

  it('travel in every download', async () => {
    const exe = await winExe({ title: 'T', id: 't', html, player: pub('win/GameMakerPlayer-x64.exe') });
    expect(dec.decode(readResources(exe).find((r) => r.type === RT.RCDATA && r.name === 'NOTICES')!.data)).toBe(thirdPartyNotices('windows'));
    const winZip = await readZip(await winExeZip({ title: 'T', id: 't', html, player: pub('win/GameMakerPlayer-x64.exe') }));
    expect(winZip.map((e) => e.name)).toEqual(['T.exe', 'THIRD-PARTY-NOTICES.txt']);
    const { files } = await linuxAppFiles({
      title: 'T',
      id: 't',
      html,
      players: { x86_64: pub('linux/GameMakerPlayer-x86_64'), aarch64: pub('linux/GameMakerPlayer-aarch64') },
    });
    expect(dec.decode(files.find((f) => f.path === 'T/THIRD-PARTY-NOTICES.txt')!.data)).toBe(thirdPartyNotices('linux'));
    const macZip = await readZip(await macAppZip({ title: 'T', id: 't', html, player: pub('mac/GameMakerPlayer') }));
    expect(dec.decode(macZip.find((e) => e.name === NOTICES_FILE)!.data)).toBe(thirdPartyNotices('mac'));
  });
});
