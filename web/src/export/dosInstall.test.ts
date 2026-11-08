// Installation support travels with the normal editor/catalog DOS ZIP, without touching game bytes.
import { describe, expect, it } from 'vitest';
import { readZip } from '@lewismoten/gamemaker-sandbox-archives/zip';
import { GameFiles } from '../project/files';
import { exportDos } from './exportDos';

import { dosInstallFiles, isGeneratedDosInstall } from './dosInstall';

const runtime = { player: Uint8Array.of(1), driver: Uint8Array.of(2), help: Uint8Array.of(3) };
const options = { title: 'Test', gam: 'test.gam', runtime };

it('adds ASCII CRLF installer and manual instructions without changing the runtime or game', async () => {
  const game = Uint8Array.of(0, 26, 255);
  const entries = await readZip((await exportDos(new GameFiles([['test.gam', game]]), options)).zip);
  const files = new Map(entries.map((e) => [e.name, e.data]));
  expect(files.has('INSTALL.BAT')).toBe(true);
  expect(files.has('INSTALL.TXT')).toBe(true);
  for (const name of ['INSTALL.BAT', 'INSTALL.TXT']) {
    const bytes = files.get(name)!;
    expect([...bytes].every((b) => b < 128)).toBe(true);
    expect(new TextDecoder().decode(bytes)).not.toMatch(/(?<!\r)\n|\r(?!\n)/);
  }
  expect(files.get('TEST.GAM')).toEqual(game);
  expect(files.get('TEST.EXE')).toEqual(runtime.player);
  expect(files.get('SNDBLAST.DRV')).toEqual(runtime.driver);
  expect(files.get('CONFIG.HLP')).toEqual(runtime.help);
  expect(new TextDecoder().decode(files.get('CONFIG.BAT'))).toBe('@ECHO OFF\r\nTEST config\r\n');
  const bat = new TextDecoder().decode(files.get('INSTALL.BAT'));
  expect(bat).toContain('SET GMIDRV=C:');
  expect(bat).toContain('IF NOT "%GMIDRV%"=="%1" GOTO failed');
  expect(bat).toContain('IF NOT "%GMIDRV%"=="C:" GOTO failed');
  expect(bat).toContain('COPY /B *.* %GMIDRV%\\TEST /V');
  expect(bat).not.toContain('COPY /B *.* %GMIDRV%\\TEST\\ /V');
  expect(bat).toContain('ECHO   %GMIDRV%\r\nECHO   CD \\TEST\r\nECHO   CONFIG\r\nECHO   TEST.EXE');
  expect(bat).toContain('Run CONFIG once');
  expect(bat).toContain('IF NOT EXIST %GMIDRV%\\TEST\\NUL GOTO failed');
  const txt = new TextDecoder().decode(files.get('INSTALL.TXT'));
  expect(txt).toContain('Hold Escape until the screen goes black');
  expect(txt).toContain('slow computer');
  expect(txt).toContain('mismatched IRQ/DMA');
  for (const text of ['INSTALL D:', 'COPY /B A:\\*.* C:\\TEST /V', 'TEST.EXE', 'Ctrl+C', 'IRQ 7', 'DMA 1', '220', 'music', 'B:', 'ZIP'])
    expect(txt).toContain(text);
});

it('can re-export a DOS download without colliding with its generated instructions', async () => {
  const first = await exportDos(new GameFiles([['test.gam', Uint8Array.of(1)]]), options);
  const { readHostedZip } = await import('../project/hostedZip');
  const files = new GameFiles(await readHostedZip(first.zip));
  const again = await exportDos(files, options);
  const entries = await readZip(again.zip);
  expect(entries.filter((e) => e.name === 'INSTALL.TXT')).toHaveLength(1);
});

// Parse only the deliberately small COMMAND.COM subset this generator uses. This is a
// DOSBox-free syntax guard, not a claim that a modern command interpreter proves DOS 3.3.
it('stays inside a short-line DOS 3.3 batch grammar with resolvable labels', () => {
  for (const count of [1, 2, 99]) {
    const lines = new TextDecoder().decode(dosInstallFiles('TEST', count)[0].data).split('\r\n').filter(Boolean);
    const labels = new Set(lines.filter((line) => line.startsWith(':')).map((line) => line.slice(1)));
    expect(labels.size).toBe(lines.filter((line) => line.startsWith(':')).length);
    for (const line of lines) {
      expect(line.length).toBeLessThan(127);
      expect(line).toMatch(
        /^(?:@ECHO OFF|REM .+|ECHO(?: .*)?|PAUSE|SET GMIDRV=.*|:[a-z0-9]{1,8}|GOTO [a-z0-9]{1,8}|MD %GMIDRV%\\TEST|COPY \/B \*\.\* %GMIDRV%\\TEST \/V|IF (?:NOT )?(?:"[^"]*"=="[^"]*"|EXIST \S+) GOTO [a-z0-9]{1,8}|FOR %%F IN \(\*\.\*\) DO IF NOT EXIST %GMIDRV%\\TEST\\%%F GOTO failed)$/,
      );
      const target = /(?:^| )GOTO ([a-z0-9]+)$/.exec(line)?.[1];
      if (target) expect(labels.has(target), target).toBe(true);
    }
  }
});

it('recognizes only byte-exact generated support, including numbered disk sets', () => {
  for (const count of [1, 2, 99]) {
    for (const file of dosInstallFiles('TEST', count)) {
      expect(isGeneratedDosInstall(file.name, file.data, 'TEST')).toBe(true);
      expect(isGeneratedDosInstall(file.name, file.data.slice(1), 'TEST')).toBe(false);
    }
  }
  expect(() => dosInstallFiles('BAD NAME')).toThrow();
  expect(() => dosInstallFiles('TEST', 100)).toThrow();
  expect(new TextDecoder().decode(dosInstallFiles('A%B')[0].data)).toContain('A%%B');
});

describe('installation filename collisions', () => {
  for (const name of ['install.bat', 'install.txt']) {
    it(`refuses to overwrite the game's own ${name}`, async () => {
      await expect(
        exportDos(
          new GameFiles([
            ['test.gam', Uint8Array.of(1)],
            [name, Uint8Array.of(9)],
          ]),
          options,
        ),
      ).rejects.toThrow(/INSTALL/);
    });
  }
});
