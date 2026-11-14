// FLAGS.EXE's command line, its counts of eggs and hearts (intermediate states, not just none and
// all), trophy tiers, the bill, the backup's text, and that its keys are the owners' and backed up.
import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { parseFlags, runFlags } from './flags';
import { BACKUP_KEYS, FlagError, HINT_CENTS_PER_MINUTE, ITEMS, overridesForCount, parseCount, parseTier } from './flagsItems';
import { parseBak } from './flagsBackup';
import { courseScope, parseGradeWord, withGrades } from './flagsDesk';
import { FLAGS_DIZ, FLAGS_NFO } from './flagsText';
import { FLAGS_HELP } from './flagsHelp';
import { sectionOfKey } from '../../backup/inventory';
import { statusOf as eggStatus } from '../../eggs/eggState';
import { huntComplete, statusOf as heartStatus } from '../../tinHearts/tinHearts';
import { TIER_NAMES, readTrophyOverrides, shownTier, tierOf } from '../../scoreTrophies/tiers';

const memory = () => {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k) };
};
const item = (id: string) => ITEMS.find((i) => i.id === id)!;

describe('FLAGS command line', () => {
  it('lists with no words, helps with /?, backs up and restores', () => {
    expect(parseFlags([])).toEqual({ kind: 'list' });
    expect(parseFlags(['/?'])).toEqual({ kind: 'help' });
    expect(parseFlags(['/backup'])).toEqual({ kind: 'backup' });
    expect(parseFlags(['/RESTORE'])).toEqual({ kind: 'restore' });
  });
  it('reads SET, CLEAR and RESET with their words', () => {
    expect(parseFlags(['set', 'hearts', '3'])).toEqual({ kind: 'do', verb: 'SET', what: 'HEARTS', words: ['3'] });
    expect(parseFlags(['RESET', 'ALL'])).toMatchObject({ kind: 'do', verb: 'RESET', what: 'ALL' });
  });
  it('says plainly what it will not do', () => {
    for (const bad of [['x'], ['SET'], ['SET', 'SAVEGAME'], ['CLEAR', 'ALL'], ['/X'], ['/BACKUP', 'SET']]) expect(parseFlags(bad).kind).toBe('error');
  });
});

describe('counts of eggs and hearts', () => {
  const states = Array.from({ length: 6 }, (_, i) => ({ id: `g${i}`, inSave: i === 1 || i === 4 }));
  const foundWith = (o: Record<string, 'added' | 'broken'>, f: typeof eggStatus) => states.filter((s) => f(s.inSave, o[s.id]).found).length;
  it('shows exactly n found for every n from none to all, eggs and hearts alike', () => {
    for (let n = 0; n <= states.length; n++) {
      const o = overridesForCount(states, n);
      expect(foundWith(o, eggStatus)).toBe(n);
      expect(foundWith(o, heartStatus)).toBe(n);
    }
  });
  it('needs no override where the saves already agree', () => {
    expect(overridesForCount(states, 6)).toEqual({ g0: 'added', g2: 'added', g3: 'added', g5: 'added' });
    expect(overridesForCount([{ id: 'a', inSave: true }], 1)).toEqual({});
  });
  it('3 of 5 hearts is not a finished hunt; all 5 is', () => {
    const five = Array.from({ length: 5 }, (_, i) => ({ id: `h${i}`, inSave: false }));
    const found = (n: number) => five.map((s) => ({ id: s.id, found: heartStatus(s.inSave, overridesForCount(five, n)[s.id]).found }));
    expect(huntComplete(found(3))).toBe(false);
    expect(huntComplete(found(4))).toBe(false);
    expect(huntComplete(found(5))).toBe(true);
    expect(huntComplete(found(0))).toBe(false);
  });
  it('takes numbers, ALL and NONE, and refuses the rest', () => {
    expect(parseCount(['3'], 13, 'Eggs')).toBe(3);
    expect(parseCount(['all'], 13, 'Eggs')).toBe(13);
    expect(parseCount(['none'], 13, 'Eggs')).toBe(0);
    for (const bad of [[], ['14'], ['-1'], ['x']]) expect(() => parseCount(bad, 13, 'Eggs')).toThrow(FlagError);
  });
});

describe('FLAGS items', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', memory());
    vi.stubGlobal('window', { dispatchEvent: () => true });
  });
  it('shows every trophy tier by name or number and goes back to the earned one', async () => {
    for (let t = 0; t <= 5; t++) {
      await item('TROPHY').set!(['best', String(t)]);
      expect(shownTier('best', 0)).toBe(t);
      expect(shownTier('total', 0)).toBe(tierOf('total', 0));
    }
    await item('TROPHY').set!(['total', 'Gaudy']);
    expect(readTrophyOverrides().total).toBe(5);
    await item('TROPHY').clear!(['total']);
    expect(readTrophyOverrides().total).toBeUndefined();
    await item('TROPHY').reset!();
    expect(readTrophyOverrides()).toEqual({});
    expect(parseTier('silver')).toBe(TIER_NAMES.indexOf('Silver'));
    expect(() => parseTier('9')).toThrow(FlagError);
  });
  it('sets and clears the phone bill by minutes', async () => {
    await item('BILL').set!(['30']);
    expect(await item('BILL').show()).toContain('$59.70');
    await item('BILL').clear!([]);
    expect(await item('BILL').show()).toContain('$0.00');
    await expect(item('BILL').set!(['x'])).rejects.toThrow(FlagError);
  });
  it('clears the registration mail and nothing else', async () => {
    localStorage.setItem('gm-reg-mail', '{}');
    localStorage.setItem('gm-reg-reply', '{}');
    localStorage.setItem('gm-mug', 'keep');
    await item('MAIL').clear!([]);
    expect(localStorage.getItem('gm-reg-mail')).toBeNull();
    expect(localStorage.getItem('gm-mug')).toBe('keep');
  });
  it('eggs reset also makes the cracked egg whole', async () => {
    localStorage.setItem('gm-egg-taps', '5');
    localStorage.setItem('gm-eggs', '{"a":"added"}');
    await item('EGGS').reset!();
    expect(localStorage.getItem('gm-egg-taps')).toBeNull();
    expect(localStorage.getItem('gm-eggs')).toBeNull();
  });
  it('offers no way to write a game save', () => {
    expect(item('SAVES').set).toBeUndefined();
    expect(item('SAVES').clear).toBeUndefined();
    expect(item('SAVES').reset).toBeUndefined();
  });
});

describe('FLAGS backup and keys', () => {
  it('every kept key belongs to a backup section, so a data backup carries it too', () => {
    for (const k of BACKUP_KEYS) expect(sectionOfKey(k), k).toBeDefined();
  });
  it("the hint line's rate is the hint line's", () => {
    expect(readFileSync('src/desk/room/phone/hintBill.ts', 'utf8')).toContain(`HINT_CENTS_PER_MINUTE = ${HINT_CENTS_PER_MINUTE}`);
  });
  it('reads back its own file and refuses another', () => {
    const text = `FLAGS.BAK 1  (x)\r\n${JSON.stringify({ at: 5, local: { 'gm-eggs': '{}', 'gm-mug': 'no' }, ach: { unlocked: { a: 1 } } })}\r\n`;
    const b = parseBak(text)!;
    expect(b.at).toBe(5);
    expect(b.local).toEqual({ 'gm-eggs': '{}' }); // only its own keys
    expect(b.ach.unlocked).toEqual({ a: 1 });
    expect(parseBak('hello')).toBeUndefined();
    expect(parseBak(null)).toBeUndefined();
  });
  it('help and BBS text fit 80 columns and carry the credits', () => {
    for (const l of [...FLAGS_HELP, ...FLAGS_DIZ, ...FLAGS_NFO]) expect(l.length).toBeLessThanOrEqual(79);
    expect(FLAGS_DIZ.at(-1)).toContain('Couriered by');
    expect(FLAGS_DIZ.length).toBeLessThanOrEqual(10);
  });
});

describe('FLAGS PLAYED', () => {
  it('rejects an unknown group and a count past the group', async () => {
    vi.stubGlobal('localStorage', memory());
    vi.stubGlobal('window', { dispatchEvent: () => true });
    await expect(item('PLAYED').set!(['NOPE', '1'])).rejects.toBeInstanceOf(FlagError);
    await expect(item('PLAYED').set!(['STARTERS', '99999'])).rejects.toBeInstanceOf(FlagError);
  });
});

describe('FLAGS and the bonus games', () => {
  it('does not explain how they open while none is revealed', async () => {
    vi.stubGlobal('localStorage', memory());
    vi.stubGlobal('window', { dispatchEvent: () => true });
    const lines: string[] = [];
    await runFlags({ screen: { print: (t: string) => lines.push(t) } } as never, ['SET', 'BONUS']);
    const text = lines.join('');
    expect(text).toContain('Don\'t know "BONUS"');
    expect(text).not.toMatch(/felt egg|tin heart/i);
  });
});

describe('FLAGS desk state (grades, courier, buddy, chicken, tour)', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', memory());
    vi.stubGlobal('window', { dispatchEvent: () => true });
  });
  it('grades the first n Starters of a stage, from none to all, and only that stage', async () => {
    const stage1 = courseScope('1');
    const stage2 = courseScope('2');
    await item('GRADES').set!(['2', '1', 'B']);
    for (let n = 0; n <= stage1.length; n++) {
      await item('GRADES').set!(['1', String(n), 'B']);
      const g = JSON.parse(localStorage.getItem('gm-course-grades') ?? '{}') as Record<string, string>;
      expect(stage1.filter((id) => g[id]).length).toBe(n);
      expect(stage2.filter((id) => g[id]).length).toBe(1);
    }
    expect(await item('GRADES').show()).toContain(`${stage1.length + 1} of`);
  });
  it('shows a middle tier: B counts toward a graduation, C does not', async () => {
    await item('GRADES').set!(['1', '3', 'B']);
    expect(await item('GRADES').show()).toMatch(/GPA 3[;,]/);
    expect(await item('GRADES').show()).toContain('1:3/');
    await item('GRADES').set!(['1', '3', 'C']);
    expect(await item('GRADES').show()).toContain('1:0/');
    expect(await item('GRADES').show()).toMatch(/GPA 2[;,]/);
    await item('GRADES').clear!(['1']);
    expect(await item('GRADES').show()).toContain('0 of');
    expect(withGrades({ a: 'A', b: 'B' }, ['a', 'b'], 1, 'C')).toEqual({ a: 'C' });
  });
  it('refuses a bad stage, count or grade in plain words', async () => {
    for (const bad of [[], ['9', '1'], ['1', '999'], ['1', 'x'], ['1', '1', 'F']]) await expect(item('GRADES').set!(bad)).rejects.toBeInstanceOf(FlagError);
    expect(parseGradeWord('b-')).toBe('B-');
  });
  it('puts 1 of 2 letters in the mail, then none, then all', async () => {
    await item('COURIER').set!(['MAIL', '1']);
    expect(await item('COURIER').show()).toContain('1 of 2 letters in the mail (1 unread)');
    await item('COURIER').set!(['MAIL', 'ALL']);
    expect(await item('COURIER').show()).toContain('2 of 2');
    await item('COURIER').clear!([]);
    expect(await item('COURIER').show()).toContain('0 of 2');
    await expect(item('COURIER').set!(['STAMPS', '1'])).rejects.toBeInstanceOf(FlagError);
    await expect(item('COURIER').set!(['MAIL', '3'])).rejects.toBeInstanceOf(FlagError);
    await item('COURIER').reset!();
    expect(localStorage.getItem('gm-courier')).toBeNull();
  });
  it('buddy keeps its other fields when set quiet, chicken flips, tour day validates', async () => {
    localStorage.setItem('gm-desk-buddy', JSON.stringify({ met: true, helloDay: '2026-11-01' }));
    await item('BUDDY').set!(['quiet']);
    expect(await item('BUDDY').show()).toBe('quiet; met, last hello 2026-11-01');
    await expect(item('BUDDY').set!(['loud'])).rejects.toBeInstanceOf(FlagError);
    await item('BUDDY').reset!();
    expect(await item('BUDDY').show()).toBe('chatty; not met yet');
    await item('CHICKEN').set!(['lady']);
    expect(await item('CHICKEN').show()).toContain('Lady Regina');
    await item('CHICKEN').reset!();
    expect(await item('CHICKEN').show()).toBe('Sir Reginald');
    await item('TOUR').set!(['2026-10-01']);
    expect(await item('TOUR').show()).toBe('2026-10-01');
    await expect(item('TOUR').set!(['2026-13-40'])).rejects.toBeInstanceOf(FlagError);
    await item('TOUR').clear!([]);
    expect(await item('TOUR').show()).toBe('no visit recorded');
  });
  it('is in the backup, and RESET ALL reaches it; Specials point to their own program', () => {
    for (const k of ['gm-course-grades', 'gm-courier', 'gm-desk-buddy', 'gm-chicken', 'gm-tour-seen']) expect(BACKUP_KEYS).toContain(k);
    for (const id of ['GRADES', 'COURIER', 'BUDDY', 'CHICKEN', 'TOUR']) expect(item(id).reset, id).toBeDefined();
    expect(item('SPECIALS').elsewhere).toContain('SPECIALS.EXE');
  });
});
