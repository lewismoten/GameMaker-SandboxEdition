// Guards for the guide's printable listing; real COMMAND.COM execution is a separate check.
import { describe, expect, it } from 'vitest';
import { BOX } from './chaptersBox';
import { INSTALL_BAT, INSTALL_LESSON } from './installScript';

describe('Chapter 18 DOS installation example', () => {
  it('prints every batch line once, in order, in short page-sized parts', () => {
    const parts = [...INSTALL_LESSON.matchAll(/<pre><code>([\s\S]*?)<\/code><\/pre>/g)].map((m) => m[1]);
    expect(parts).toHaveLength(5);
    expect(`${parts.join('\n')}\n`).toBe(INSTALL_BAT);
    expect(parts.every((p) => p.split('\n').length <= 18)).toBe(true);
    expect(BOX.html).toContain(INSTALL_LESSON);
  });

  it('teaches literal drive-relative A:INSTALL only after selecting the floppy root', () => {
    expect(INSTALL_LESSON).toContain('<code>A:</code>, then <code>CD \\</code>, then');
    expect(INSTALL_LESSON).toContain('<code>A:INSTALL</code> for <code>C:\\SANDBOX</code>');
    expect(INSTALL_LESSON).toContain('<code>A:INSTALL GAMES</code>');
    expect(INSTALL_LESSON).toContain('<code>B:INSTALL</code>');
    expect(INSTALL_LESSON).toContain('A:INSTALL does not change the current drive');
  });

  it('includes a real named-game label image with an accessible install-line alternative', () => {
    expect(INSTALL_LESSON).toMatch(/<img[^>]+src="[^"]+"[^>]+alt="Snowbound[^"\n]*A:INSTALL/);
    expect(INSTALL_LESSON).toContain('Figure 18-1.');
    expect(INSTALL_LESSON).toContain('not the SANDBOX example’s game files');
  });

  it('uses ASCII, short labels and only DOS 3.3 internal commands', () => {
    expect(INSTALL_BAT).toMatch(/^[\x09\x0a\x20-\x7e]+$/);
    const lines = INSTALL_BAT.trim().split('\n');
    const labels = lines.filter((l) => l.startsWith(':')).map((l) => l.slice(1));
    expect(new Set(labels).size).toBe(labels.length);
    expect(labels.every((l) => l.length <= 8)).toBe(true);
    for (const line of lines) {
      expect(line.length).toBeLessThanOrEqual(127);
      if (!line.startsWith(':')) expect(line).toMatch(/^@?(ECHO|IF|SET|GOTO|PAUSE|MD|COPY|FOR|REM)( |$)/);
      for (const [, target] of line.matchAll(/GOTO (\w+)/g)) expect(labels).toContain(target);
    }
    expect(INSTALL_BAT).not.toMatch(/SET \/P|CHOICE|COPY \/Y|IF ERRORLEVEL|%~|&&|\|\|/i);
  });

  it('uses SANDBOX for both destinations and the printed hard-drive launch', () => {
    expect(INSTALL_BAT).toContain('SET GMIDIR=C:\\SANDBOX');
    expect(INSTALL_BAT).toContain('SET GMIDIR=C:\\GAMES\\SANDBOX');
    expect(INSTALL_BAT).toContain('ECHO C:\nECHO CD %GMIDIR%\nECHO CONFIG\nECHO SANDBOX.EXE');
    expect(INSTALL_LESSON).not.toMatch(/DEMO|GLUB/);
    expect(INSTALL_BAT.indexOf('MD C:\\GAMES')).toBeLessThan(INSTALL_BAT.indexOf('MD %GMIDIR%'));
    expect(INSTALL_BAT).toContain('IF NOT EXIST %GMIDIR%\\NUL GOTO failed');
  });

  it('retries wrong disks, preserves source drive and avoids the DOS 3.3 trailing-slash COPY trap', () => {
    for (const n of [1, 2]) {
      expect(INSTALL_BAT).toContain(`IF EXIST DISK${n}.ID GOTO copy${n}`);
      expect(INSTALL_BAT).toContain(`GOTO disk${n}`);
    }
    expect(INSTALL_BAT.match(/^COPY \/B \*\.\* %GMIDIR% \/V$/gm)).toHaveLength(2);
    expect(INSTALL_BAT.match(/^FOR %%F IN/gm)).toHaveLength(2);
    expect(INSTALL_BAT).not.toMatch(/^(?:[A-Z]:|CD |DEL |ERASE |RD )/m);
    expect(INSTALL_LESSON).toContain('old DOS COPY skips empty files');
    expect(INSTALL_LESSON).toContain('identical <code>INSTALL.BAT</code>');
  });

  it('labels disk two as illustrative and does not promise automatic copy success', () => {
    expect(INSTALL_BAT).toContain('REM Disk 2 is ONLY an example of multi-disk installation.');
    expect(INSTALL_LESSON).toContain('Disk two below is only an example');
    expect(INSTALL_LESSON).toContain('A game that fits on\n  one disk needs only one.');
    expect(INSTALL_BAT.match(/Any COPY error\?/g)).toHaveLength(2);
    expect(INSTALL_BAT).toContain('The game may be incomplete.');
    expect(INSTALL_BAT).not.toContain('Installation successful');
    expect(INSTALL_LESSON).toContain('not a truncated file');
  });
});
