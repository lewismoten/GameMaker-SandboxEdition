// Tests: Game-Maker's programs typed at the DOS prompt in C:\GM (retro/dos/gmPrograms.ts,
// gm.ts runDesigner/runUtility/xferplay): each name resolves, and quitting one run by hand
// puts text mode back (RestorePal) while one given cOoL leaves the screen for GM.
import { describe, expect, it, vi } from 'vitest';
import { Shell } from '../src/retro/dos/shell';
import { file, FileSystem, folder, type ProgramRef } from '../src/retro/dos/vfs';
import { GM_DESIGNERS, gmProgramRef } from '../src/retro/dos/gmPrograms';
import { key, TextKeys } from '../src/retro/text/textInput';
import type { TextScreen } from '../src/retro/text/textScreen';
import type { RetroHost } from '../src/retro/host';

const designerRuns: string[] = [];
vi.mock('../src/vga/blocedit', () => ({ program: { exe: 'BLOCEDIT.EXE', run: async () => void designerRuns.push('BLOCEDIT.EXE') } }));

/** The C:\GM programs, as runtime/run/GM has them (the .BATs and data run nothing here). */
const GM_FILES = [
  'BLOCEDIT.EXE',
  'CHAREDIT.EXE',
  'GM.EXE',
  'GRATOR.EXE',
  'IMAGE.EXE',
  'MAPMAKER.EXE',
  'MENU.EXE',
  'MONEDIT.EXE',
  'PALCHOS.EXE',
  'PLAYGAME.EXE',
  'SNDEDIT.EXE',
  'UTILITY.EXE',
  'XFERPLAY.EXE',
];

/** A screen that only counts what matters here: clears and palette resets. */
function fakeScreen(log: string[]): TextScreen {
  const t = {
    cursorVisible: true,
    chars: new Uint8Array(80 * 25),
    print: (s: string) => void log.push(`print ${s}`),
    clear: () => void log.push('clear'),
    resetPalette: () => void log.push('resetPalette'),
  };
  return new Proxy(t, { get: (o, p) => (p in o ? o[p as keyof typeof o] : () => undefined) }) as unknown as TextScreen;
}

describe('the GM folder programs', () => {
  it('every .EXE in C:\\GM runs something', () => {
    for (const n of GM_FILES) expect(gmProgramRef(n), n).toBeDefined();
    expect(gmProgramRef('GM.CFG')).toBeUndefined();
    expect(GM_DESIGNERS.map((e) => gmProgramRef(e))).toEqual(GM_DESIGNERS.map((exe) => ({ kind: 'designer', exe })));
    expect(gmProgramRef('UTILITY.EXE')).toEqual({ kind: 'utility' });
    expect(gmProgramRef('XFERPLAY.EXE')).toEqual({ kind: 'xferplay' });
  });

  const runs: { ref: ProgramRef; args: string[] }[] = [];
  const fs = new FileSystem();
  const gm = GM_FILES.map((n) => file(n, 1, { run: gmProgramRef(n) }));
  fs.addDrive({ letter: 'C', label: '', free: 0, root: async () => [folder('GM', () => gm)] });
  const shell = new Shell({ screen: fakeScreen([]), keys: new TextKeys(), fs, run: async (ref, args) => void runs.push({ ref, args }) });

  it('resolves each by name, any case, with or without .EXE, from C:\\GM and by path', async () => {
    const lines = GM_FILES.flatMap((n) => {
      const base = n.replace('.EXE', '');
      return [base, base.toLowerCase(), n.toLowerCase(), `C:\\GM\\${base}`, `\\gm\\${n}`];
    });
    await shell.execute('cd \\gm');
    for (const l of lines) {
      runs.length = 0;
      await shell.execute(l);
      expect(
        runs.map((r) => r.ref),
        l,
      ).toEqual([
        gmProgramRef(
          l
            .replace(/^.*\\/, '')
            .replace(/\.exe$/i, '')
            .toUpperCase() + '.EXE',
        ),
      ]);
    }
  });
});

function fakeHost(log: string[], keys: string[]): RetroHost {
  const k = new TextKeys();
  for (const n of keys) k.push(key(n));
  return {
    screen: fakeScreen(log),
    keys: k,
    designer: undefined,
    disk: () => undefined,
    workDir: () => ({ drive: 'C', parts: ['GM'] }),
  } as unknown as RetroHost;
}

describe('quitting a GM program run by hand', () => {
  it('a designer on its own clears to text mode; given cOoL it leaves the screen to GM', async () => {
    const { runDesigner } = await import('../src/retro/gm');
    const alone: string[] = [];
    await runDesigner(fakeHost(alone, []), 'BLOCEDIT.EXE', []);
    expect(designerRuns).toEqual(['BLOCEDIT.EXE']);
    expect(alone.slice(-2)).toEqual(['resetPalette', 'clear']);
    const chained: string[] = [];
    await runDesigner(fakeHost(chained, []), 'BLOCEDIT.EXE', ['cOoL', 'D']);
    expect(designerRuns).toHaveLength(2);
    expect(chained).not.toContain('resetPalette');
  });

  it('UTILITY: Esc leaves its menu, to the prompt; cOoL leaves the screen to GM', async () => {
    const { runUtility } = await import('../src/retro/gm');
    const alone: string[] = [];
    await runUtility(fakeHost(alone, ['Escape']), []);
    expect(alone.slice(-2)).toEqual(['resetPalette', 'clear']);
    const chained: string[] = [];
    await runUtility(fakeHost(chained, ['Escape']), ['cOoL', 'B']);
    expect(chained).not.toContain('resetPalette');
  });

  it('XFERPLAY in C:\\GM says its .GAM is missing and quits on a key', async () => {
    const { xferplay } = await import('../src/retro/gm');
    const log: string[] = [];
    await xferplay(fakeHost(log, ['Enter']));
    expect(log).toContain("print You are missing XFERPLAY.gam!  I can't do anything without it!");
    expect(log.slice(-2)).toEqual(['resetPalette', 'clear']);
  });
});
