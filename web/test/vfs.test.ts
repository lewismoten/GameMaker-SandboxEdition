import { describe, expect, it } from 'vitest';
import { dirLine, file, resolvePath } from '../src/retro/dos/vfs';

describe('retro DOS file system', () => {
  const cwd = (d: string) => (d === 'C' ? ['GM'] : d === 'D' ? ['GAMEWARE'] : []);
  it('resolves absolute, relative and per-drive paths', () => {
    expect(resolvePath('\\GAMES', 'C', cwd)).toEqual({ drive: 'C', parts: ['GAMES'] });
    expect(resolvePath('SAMPLE', 'C', cwd)).toEqual({ drive: 'C', parts: ['GM', 'SAMPLE'] });
    expect(resolvePath('..', 'C', cwd)).toEqual({ drive: 'C', parts: [] });
    expect(resolvePath('d:nebula', 'C', cwd)).toEqual({ drive: 'D', parts: ['GAMEWARE', 'NEBULA'] });
    expect(resolvePath('A:\\', 'C', cwd)).toEqual({ drive: 'A', parts: [] });
    expect(resolvePath('c:/gm/../comm', 'A', cwd)).toEqual({ drive: 'C', parts: ['COMM'] });
  });
  it('formats DIR lines like DOS 6', () => {
    expect(dirLine(file('gm.exe', 12345, { date: new Date(1994, 9, 20, 15, 5) }))).toBe('GM       EXE        12,345 10-20-94   3:05p');
  });
});
