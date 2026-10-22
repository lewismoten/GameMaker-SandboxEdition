// Tests: DEL / ERASE and RD in the retro PC's COMMAND.COM (retro/dos/shell.ts), and DOS
// wildcards (retro/dos/vfs.ts).
import { describe, expect, it } from 'vitest';
import { Shell } from '../src/retro/dos/shell';
import { dosMatch, file, FileSystem, liveFolder, type DosNode } from '../src/retro/dos/vfs';
import { key, TextKeys } from '../src/retro/text/textInput';
import type { TextScreen } from '../src/retro/text/textScreen';

/** A screen that keeps what's printed. */
function fakeScreen() {
  const s = { text: '', cursorX: 0, cursorY: 0, cursorVisible: true, print: (t: string) => void (s.text += t) };
  return new Proxy(s, { get: (t, p) => (p in t ? t[p as keyof typeof t] : () => undefined) }) as unknown as TextScreen & { text: string };
}

/** C:\IMAGES (deletable pictures), C:\DOWNLOAD\EMPTY (an empty removable folder), D: (a CD). */
function pc() {
  const images = new Set(['TEDDY.GIF', 'CHEZ.JPG', 'GWINN.JPG']);
  let emptyGone = false;
  const fs = new FileSystem();
  const pics = () => [...images].map((n): DosNode => file(n, 100, { remove: () => void images.delete(n) }));
  fs.addDrive({
    letter: 'C',
    label: '',
    free: 0,
    root: async () => [
      liveFolder('IMAGES', pics),
      liveFolder('DOWNLOAD', () => (emptyGone ? [] : [Object.assign(liveFolder('EMPTY', () => []), { remove: () => void (emptyGone = true) })])),
      file('COMMAND.COM', 1),
    ],
  });
  fs.addDrive({ letter: 'D', label: 'CD', free: 0, root: async () => [file('README.TXT', 10)] });
  const screen = fakeScreen();
  const keys = new TextKeys();
  const shell = new Shell({ screen, keys, fs, run: async () => {} });
  const run = async (line: string) => {
    screen.text = '';
    await shell.execute(line);
    return screen.text;
  };
  return { images, run, keys, emptyGone: () => emptyGone };
}

describe('DOS wildcards', () => {
  it('match names and extensions separately', () => {
    expect(dosMatch('*.*', 'TEDDY.GIF')).toBe(true);
    expect(dosMatch('*.*', 'README')).toBe(true);
    expect(dosMatch('*.GIF', 'TEDDY.GIF')).toBe(true);
    expect(dosMatch('*.GIF', 'CHEZ.JPG')).toBe(false);
    expect(dosMatch('T?DDY.*', 'TEDDY.GIF')).toBe(true);
    expect(dosMatch('teddy.gif', 'TEDDY.GIF')).toBe(true);
    expect(dosMatch('*', 'TEDDY.GIF')).toBe(false);
    expect(dosMatch('*', 'README')).toBe(true);
  });
});

describe('DEL', () => {
  it('deletes one file, by name or ERASE', async () => {
    const { images, run } = pc();
    expect(await run('DEL C:\\IMAGES\\CHEZ.JPG')).toBe('');
    expect(images.has('CHEZ.JPG')).toBe(false);
    await run('erase \\images\\teddy.gif');
    expect([...images]).toEqual(['GWINN.JPG']);
  });

  it('deletes by wildcard', async () => {
    const { images, run } = pc();
    await run('CD \\IMAGES');
    await run('DEL *.JPG');
    expect([...images]).toEqual(['TEDDY.GIF']);
  });

  it('says File not found', async () => {
    const { images, run } = pc();
    expect(await run('DEL \\IMAGES\\NOPE.GIF')).toContain('File not found');
    expect(await run('DEL \\IMAGES\\*.BMP')).toContain('File not found');
    expect(images.size).toBe(3);
    expect(await run('DEL')).toContain('Required parameter missing');
  });

  it('asks before deleting everything (*.* or a folder)', async () => {
    const { images, run, keys } = pc();
    keys.push(key('N'));
    keys.push(key('Enter'));
    expect(await run('DEL \\IMAGES\\*.*')).toContain('All files in directory will be deleted!');
    expect(images.size).toBe(3);
    keys.push(key('Y'));
    keys.push(key('Enter'));
    await run('DEL \\IMAGES');
    expect(images.size).toBe(0);
  });

  it('refuses files that cannot be deleted', async () => {
    const { run } = pc();
    expect(await run('DEL D:\\README.TXT')).toContain('Access denied');
    expect(await run('DEL C:\\COMMAND.COM')).toContain('Access denied');
  });
});

describe('RD', () => {
  it('removes an empty folder, not a full one', async () => {
    const { run, emptyGone } = pc();
    expect(await run('RD \\IMAGES')).toContain('directory not empty');
    expect(await run('RD \\DOWNLOAD\\EMPTY')).toBe('');
    expect(emptyGone()).toBe(true);
    expect(await run('RD \\NOPE')).toContain('Invalid path');
  });
});
