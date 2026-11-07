// Tests: the batch interpreter (retro/dos/batch.ts) and each of RSD's .BAT files in C:\GM,
// read from the CD's gm folder, run through the real Shell.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { Shell } from '../src/retro/dos/shell';
import { file, FileSystem, folder, type DosNode, type ProgramRef } from '../src/retro/dos/vfs';
import { GM_DESIGNERS, gmProgramRef } from '../src/retro/dos/gmPrograms';
import { key, TextKeys } from '../src/retro/text/textInput';
import type { TextScreen } from '../src/retro/text/textScreen';

function bytesNode(name: string, bytes: Uint8Array, extra: Partial<DosNode> = {}): DosNode {
  return file(name, bytes.length, { ...extra, read: async () => bytes });
}

const GM_DIR = join(__dirname, '../../cd/gm');

/** A screen that keeps the text printed since the last clear, in order. */
function fakeScreen(log: string[]): TextScreen {
  const t = {
    cursorVisible: true,
    cursorX: 0,
    cursorY: 0,
    print: (s: string) => void log.push(s),
    clear: () => void log.push('<CLS>'),
  };
  return new Proxy(t, { get: (o, p) => (p in o ? o[p as keyof typeof o] : () => undefined) }) as unknown as TextScreen;
}

function setup(extra: DosNode[] = [], names?: string[]) {
  const log: string[] = [];
  const runs: { ref: ProgramRef; args: string[] }[] = [];
  const keys = new TextKeys();
  const files = (names ?? readdirSync(GM_DIR)).map((n) => {
    const up = n.toUpperCase();
    const bytes = new Uint8Array(readFileSync(join(GM_DIR, n)));
    return bytesNode(up, bytes, { run: gmProgramRef(up) });
  });
  const exes = [...GM_DESIGNERS, 'UTILITY.EXE', 'PLAYGAME.EXE', 'GM.EXE', 'IMAGE.EXE'].map((n) => file(n, 1, { run: gmProgramRef(n) }));
  const fs = new FileSystem();
  fs.addDrive({ letter: 'C', label: '', free: 0, root: async () => [folder('GM', () => [...files.filter((f) => !/\.EXE$/.test(f.name)), ...exes, ...extra])] });
  const shell = new Shell({
    screen: fakeScreen(log),
    keys,
    fs,
    run: async (ref, args) => void runs.push({ ref, args }),
  });
  const text = () => log.join('');
  return { shell, log, runs, keys, text };
}

const tick = () => new Promise((r) => setTimeout(r, 0));
const exe = (r: { ref: ProgramRef }) => (r.ref.kind === 'designer' ? r.ref.exe : r.ref.kind);

describe('batch interpreter', () => {
  const bat = (name: string, content: string) => bytesNode(name, new TextEncoder().encode(content), { run: { kind: 'batch' } });

  it('ECHO on shows the prompt and line; @ and ECHO OFF hide them; ECHO. keeps spaces', async () => {
    const t = setup([bat('T.BAT', 'echo one\n@echo off\necho.  two\necho three\n')]);
    await t.shell.execute('cd \\gm');
    await t.shell.execute('T');
    expect(t.text()).toBe('C:\\GM>echo one\none\n  two\nthree\n');
  });

  it('ECHO alone says its state; REM and labels print nothing', async () => {
    const t = setup([bat('T.BAT', '@echo off\necho\nrem hidden\n:lbl\necho on\necho\n')]);
    await t.shell.execute('T');
    expect(t.text()).toBe('ECHO is off\nC:\\>echo\nECHO is on\n');
  });

  it('%1 parameters, SHIFT, and IF "%1"=="" GOTO', async () => {
    const t = setup([bat('T.BAT', '@echo off\nif "%1"=="" goto none\necho got %1 %2\nshift\necho now %1\ngoto end\n:none\necho nothing\n:end\n')]);
    await t.shell.execute('t a b');
    expect(t.text()).toBe('got a b\nnow b\n');
    t.log.length = 0;
    await t.shell.execute('T');
    expect(t.text()).toBe('nothing\n');
  });

  it('IF EXIST and IF NOT EXIST, also with a path', async () => {
    const t = setup([
      bat('T.BAT', '@echo off\nif exist t.bat echo here\nif not exist nope.txt echo gone\nif exist \\gm\\t.bat echo path\nif exist \\nope\\x echo wrong\n'),
    ]);
    await t.shell.execute('cd \\gm');
    await t.shell.execute('T');
    expect(t.text()).toBe('here\ngone\npath\n');
  });

  it('IF ERRORLEVEL 0 is true and 1 false, as no program here fails', async () => {
    const t = setup([bat('T.BAT', '@echo off\nif errorlevel 1 echo bad\nif errorlevel 0 echo ok\n')]);
    await t.shell.execute('T');
    expect(t.text()).toBe('ok\n');
  });

  it('a missing label says so and ends the file', async () => {
    const t = setup([bat('T.BAT', '@echo off\ngoto nowhere\necho never\n')]);
    await t.shell.execute('T');
    expect(t.text()).toBe('Label not found\n');
  });

  it('CALL comes back; naming a .BAT without CALL replaces the file', async () => {
    const t = setup([
      bat('A.BAT', '@echo off\ncall b x\necho after call\nc\necho never\n'),
      bat('B.BAT', '@echo off\necho in b %1\n'),
      bat('C.BAT', '@echo off\necho in c\n'),
    ]);
    await t.shell.execute('a');
    expect(t.text()).toBe('in b x\nafter call\nin c\n');
  });

  it('a file that CALLs itself stops at 16 deep', async () => {
    const t = setup([bat('L.BAT', '@echo off\ncall l\n')]);
    await t.shell.execute('l');
    expect(t.text()).toBe('Batch file too deeply nested\n');
  });

  it('CLS clears; PAUSE waits for a key', async () => {
    const t = setup([bat('T.BAT', '@echo off\ncls\npause\necho done\n')]);
    const done = t.shell.execute('T');
    await tick();
    expect(t.text()).toContain('<CLS>Press any key to continue . . .');
    expect(t.text()).not.toContain('done');
    t.keys.push(key('x'));
    await done;
    expect(t.text()).toBe('<CLS>Press any key to continue . . .\ndone\n');
  });

  it('commands and programs go to the shell: CD, TYPE, a program with arguments', async () => {
    const t = setup([bat('T.BAT', '@echo off\ncd ..\ncd\nBLOCEDIT cOoL D\ncd gm\n'), bytesNode('N.TXT', new TextEncoder().encode('hi\r\n'))]);
    await t.shell.execute('cd \\gm');
    await t.shell.execute('T');
    expect(t.text()).toBe('C:\\\n');
    expect(t.runs.map((r) => [exe(r), r.args])).toEqual([['BLOCEDIT.EXE', ['cOoL', 'D']]]);
    expect(t.shell.prompt).toBe('C:\\GM>');
  });

  it('says what it cannot do, in plain words', async () => {
    const t = setup([bat('T.BAT', '@echo off\nset A=1\nfor %%x in (a) do echo %%x\ndir > x\nnosuch\n')]);
    await t.shell.execute('T');
    expect(t.text()).toBe(
      "SET is not supported in this PC's batch files\nFOR is not supported in this PC's batch files\nRedirection and pipes are not supported in this PC\nBad command or file name\n",
    );
  });

  it('Ctrl+C at PAUSE asks to terminate: N goes on, Y ends the file', async () => {
    const t = setup([bat('T.BAT', '@echo off\npause\necho two\npause\necho three\n')]);
    const done = t.shell.execute('T');
    await tick();
    t.keys.push({ ...key('c'), ctrl: true });
    await tick();
    t.keys.push(key('n'));
    await tick();
    expect(t.text()).toContain('^C\nTerminate batch job (Y/N)? N\n');
    expect(t.text()).toContain('two');
    t.keys.push({ ...key('c'), ctrl: true });
    await tick();
    t.keys.push(key('q'));
    await tick();
    t.keys.push(key('y'));
    await done;
    expect(t.text()).toContain('Terminate batch job (Y/N)? \nTerminate batch job (Y/N)? Y\n');
    expect(t.text()).not.toContain('three');
  });

  it('Ctrl+C typed while a command runs ends the file between lines when answered Y', async () => {
    const t = setup([bat('T.BAT', '@echo off\necho one\necho two\n')]);
    t.keys.push({ ...key('c'), ctrl: true });
    t.keys.push(key('y'));
    await t.shell.execute('T');
    expect(t.text()).toBe('^C\nTerminate batch job (Y/N)? Y\n');
  });
});

describe("RSD's batch files in C:\\GM", () => {
  const bats = readdirSync(GM_DIR).filter((n) => /\.bat$/i.test(n));

  it('are all eighteen, each a program the shell finds from anywhere on PATH', async () => {
    expect(bats.length).toBe(18);
    for (const n of bats) {
      const t = setup([], [...bats, ...readdirSync(GM_DIR).filter((f) => /\.(txt)$/i.test(f))]);
      t.keys.push(key('x'));
      await t.shell.execute('cd \\');
      await t.shell.execute(n.replace(/\.bat$/i, '').toLowerCase());
      expect(t.text(), n).not.toContain('Bad command');
    }
  });

  /** Menu entries (each launches a designer, then shows the Design menu again) */
  const DESIGNERS: [string, string][] = [
    ['PA', 'PALCHOS.EXE'],
    ['BL', 'BLOCEDIT.EXE'],
    ['MO', 'MONEDIT.EXE'],
    ['MA', 'MAPMAKER.EXE'],
    ['CH', 'CHAREDIT.EXE'],
    ['IM', 'image'],
    ['SO', 'SNDEDIT.EXE'],
    ['IN', 'GRATOR.EXE'],
  ];
  for (const [bat, program] of DESIGNERS)
    it(`${bat}.BAT clears, runs ${program}, then shows the Design menu`, async () => {
      const t = setup();
      await t.shell.execute('cd \\gm');
      await t.shell.execute(bat.toLowerCase());
      expect(t.log[0]).toBe('<CLS>');
      expect(t.runs.map(exe)).toEqual([program]);
      expect(t.runs[0].args).toEqual([]);
      expect(t.text()).toContain('D E S I G N   M E N U');
      expect(t.text()).toContain('Enter your choice:');
    });

  it('GMMENU.BAT shows the main menu and returns to the prompt for the choice', async () => {
    const t = setup();
    await t.shell.execute('gmmenu');
    const s = t.text();
    expect(s.startsWith('<CLS>')).toBe(true);
    for (const w of [
      'G A M E - M A K E R   V 3.0',
      'Recreational Software Designs',
      'PL      Play Games',
      'DE      Design Games',
      'UT      Use the Utilities',
      'AB      About Game-Maker',
      'QU      Quit',
      'HE      Help',
      'Enter your choice:',
    ])
      expect(s).toContain(w);
    expect(t.runs).toEqual([]);
  });

  it('MM.BAT goes back to the main menu', async () => {
    const t = setup();
    await t.shell.execute('mm');
    expect(t.text()).toContain('PL      Play Games');
  });

  it('DE.BAT lists the designers, MM and DH', async () => {
    const t = setup();
    await t.shell.execute('de');
    for (const w of ['PA      Palette Designer', 'IM      Image Reader', 'IN      Integrator', 'MM      Main Menu', 'DH      Design Help'])
      expect(t.text()).toContain(w);
  });

  it('PL.BAT runs PLAYGAME, then the main menu', async () => {
    const t = setup();
    await t.shell.execute('pl');
    expect(t.runs.map(exe)).toEqual(['playgame']);
    expect(t.text()).toContain('Enter your choice:');
  });

  it('UT.BAT clears, runs UTILITY, then the main menu', async () => {
    const t = setup();
    await t.shell.execute('ut');
    expect(t.log[0]).toBe('<CLS>');
    expect(t.runs.map(exe)).toEqual(['utility']);
    expect(t.text()).toContain('PL      Play Games');
  });

  it('AB.BAT types ABOUT.TXT, waits for a key, then the main menu', async () => {
    const t = setup();
    await t.shell.execute('cd \\gm');
    const done = t.shell.execute('ab');
    await tick();
    expect(t.text()).toContain('Press any key to continue . . .');
    expect(t.text()).not.toContain('Enter your choice');
    t.keys.push(key(' '));
    await done;
    expect(t.text()).toContain('Enter your choice:');
    expect(t.text()).toContain(readFileSync(join(GM_DIR, 'about.txt'), 'latin1').split(/\r?\n/)[0].trim().slice(0, 10));
  });

  it('HE.BAT types HELPBAT.TXT, waits, then the main menu; DH.BAT types HELPDESN.TXT, waits, then the Design menu', async () => {
    for (const [bat, txt, menu] of [
      ['he', 'helpbat.txt', 'PL      Play Games'],
      ['dh', 'helpdesn.txt', 'D E S I G N'],
    ]) {
      const t = setup();
      await t.shell.execute('cd \\gm');
      const done = t.shell.execute(bat);
      await tick();
      const first = readFileSync(join(GM_DIR, txt), 'latin1')
        .split(/\r?\n/)
        .find((l) => l.trim())!
        .trim();
      expect(t.text(), bat).toContain(first);
      expect(t.text(), bat).not.toContain(menu);
      t.keys.push(key('x'));
      await done;
      expect(t.text(), bat).toContain(menu);
    }
  });

  it('QU.BAT clears and goes up one folder, to C:\\', async () => {
    const t = setup();
    await t.shell.execute('cd \\gm');
    await t.shell.execute('qu');
    expect(t.log).toContain('<CLS>');
    expect(t.shell.prompt).toBe('C:\\>');
  });

  it('GOGM.BAT goes to C:\\GM, runs GM with its parameters, and comes back to C:\\', async () => {
    const t = setup();
    await t.shell.execute('gogm a b');
    expect(t.runs.map((r) => [exe(r), r.args])).toEqual([['gm', ['a', 'b']]]);
    expect(t.shell.prompt).toBe('C:\\>');
    expect(t.text()).toContain('C:\\>echo off\n');
  });
});
