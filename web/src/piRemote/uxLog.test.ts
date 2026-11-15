// The Pi log's filter, grouping and status line, and the key guard (fake events).
import { describe, expect, it } from 'vitest';
import { LogModel, isNoisy, stateLine } from './logModel';
import { scrollKeyCode, targetKeepsKey } from './keyGuard';

describe('LogModel', () => {
  it('hides boot, asset and CRC lines until everything is shown', () => {
    const m = new LogModel();
    m.add('log', 'BOOT stage 1');
    m.add('log', 'ASSET load 12 bytes');
    m.add('log', 'frame crc=ab12');
    m.add('log', 'menu opened');
    expect(m.visible(false, false).map((e) => e.text)).toEqual(['menu opened']);
    expect(m.visible(true, false)).toHaveLength(4);
  });

  it('hides SND lines only while sound plays here', () => {
    const m = new LogModel();
    m.add('log', 'SND beep a/B.SND 3');
    expect(m.visible(false, false)).toHaveLength(1);
    expect(m.visible(false, true)).toHaveLength(0);
  });

  it('groups repeats with a count; noisy lines ignore changing numbers', () => {
    const m = new LogModel();
    m.add('log', 'tick');
    m.add('log', 'tick');
    m.add('log', 'ASSET read 10');
    m.add('log', 'ASSET read 20');
    expect(m.entries.map((e) => [e.text, e.count])).toEqual([
      ['tick', 2],
      ['ASSET read 20', 2],
    ]);
  });

  it('keeps errors and warnings visible, marked, and bounded', () => {
    const m = new LogModel(5);
    m.add('log', 'BOOT failed to open card');
    m.add('error', 'ERR not-ready');
    m.add('log', 'warning: slow card');
    expect(m.visible(false, false).map((e) => e.level)).toEqual(['error', 'error', 'warn']);
    for (let i = 0; i < 20; i++) m.add('log', `line ${i}`);
    expect(m.entries.length).toBe(5);
  });

  it('learns the game and screen mode', () => {
    const m = new LogModel();
    m.program('GMOS.ELF');
    expect(m.add('log', 'SND game SANDBOX QUEST.GAM')).toBe(true);
    m.add('log', 'video mode: 320x200');
    expect(stateLine(m.state)).toBe('Running GMOS.ELF · game SANDBOX/QUEST.GAM · screen mode 320x200');
    m.add('log', 'SND end');
    expect(m.state.game).toBeUndefined();
    expect(stateLine({})).toMatch(/Nothing/);
    expect(isNoisy('hello')).toBe(false);
  });
});

describe('key guard', () => {
  const ev = (code: string, mods: Partial<KeyboardEvent> = {}) => ({ code, ctrlKey: false, altKey: false, metaKey: false, ...mods });
  it('names only scrolling keys, without modifiers', () => {
    expect(scrollKeyCode(ev('ArrowUp'))).toBe('ArrowUp');
    expect(scrollKeyCode(ev('Space'))).toBe('Space');
    expect(scrollKeyCode(ev('Tab'))).toBeUndefined();
    expect(scrollKeyCode(ev('ArrowUp', { metaKey: true }))).toBeUndefined();
  });
  it('lets fields keep their keys and buttons keep Space', () => {
    const fake = (matches: string) => ({ tagName: 'X', closest: (sel: string) => (sel.includes(matches) ? {} : null) }) as unknown as EventTarget;
    const input = fake('input');
    const btn = fake('button');
    const body = fake('zzz');
    expect(targetKeepsKey(input, 'ArrowLeft')).toBe(true);
    expect(targetKeepsKey(btn, 'Space')).toBe(true);
    expect(targetKeepsKey(btn, 'ArrowDown')).toBe(false);
    expect(targetKeepsKey(body, 'Space')).toBe(false);
    expect(targetKeepsKey(null, 'Space')).toBe(false);
  });
});
