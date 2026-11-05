// Tests: the cOoL word GM.EXE gives MENU, PLAYGAME and IMAGE (retro/dos/okMsg.ts).
import { describe, expect, it } from 'vitest';
import { Shell } from '../src/retro/dos/shell';
import { file, FileSystem, type ProgramRef } from '../src/retro/dos/vfs';
import { hasOkMsg, MENU_REFUSAL, OKMSG } from '../src/retro/dos/okMsg';
import { TextKeys } from '../src/retro/text/textInput';
import type { TextScreen } from '../src/retro/text/textScreen';

describe('hasOkMsg (strcmp, argc as in C)', () => {
  it('matches the exact case only', () => {
    expect(OKMSG).toBe('cOoL');
    expect(hasOkMsg(['cOoL'], 2)).toBe(true);
    expect(hasOkMsg(['cool'], 2)).toBe(false);
    expect(hasOkMsg(['COOL'], 2)).toBe(false);
    expect(hasOkMsg([], 2)).toBe(false);
  });
  it('MENU also needs a third word (argc >= 3)', () => {
    expect(hasOkMsg(['cOoL'], 3)).toBe(false);
    expect(hasOkMsg(['cOoL', 'K'], 3)).toBe(true);
    expect(hasOkMsg(['K', 'cOoL'], 3)).toBe(false);
  });
  it('puts MENU.C line 39 at column 19, row 20, yellow', () => {
    expect(MENU_REFUSAL).toMatchObject({ x: 19, y: 20, color: 14, text: 'This program must be run under Game-Maker!' });
  });
});

describe('the prompt passes the word through untouched', () => {
  const runs: { ref: ProgramRef; args: string[] }[] = [];
  const screen = new Proxy(
    { print: () => {}, cursorVisible: true },
    { get: (t, p) => (p in t ? t[p as keyof typeof t] : () => undefined) },
  ) as unknown as TextScreen;
  const fs = new FileSystem();
  fs.addDrive({
    letter: 'C',
    label: '',
    free: 0,
    root: async () => [
      file('MENU.EXE', 1, { run: { kind: 'menu' } }),
      file('PLAYGAME.EXE', 1, { run: { kind: 'playgame' } }),
      file('IMAGE.EXE', 1, { run: { kind: 'image' } }),
    ],
  });
  const shell = new Shell({ screen, keys: new TextKeys(), fs, run: async (ref, args) => void runs.push({ ref, args }) });
  it('keeps the case of each word', async () => {
    await shell.execute('PLAYGAME cOoL');
    await shell.execute('image cool');
    await shell.execute('MENU cOoL K');
    await shell.execute('MENU');
    expect(runs.map((r) => [r.ref.kind, r.args])).toEqual([
      ['playgame', ['cOoL']],
      ['image', ['cool']],
      ['menu', ['cOoL', 'K']],
      ['menu', []],
    ]);
  });
});
