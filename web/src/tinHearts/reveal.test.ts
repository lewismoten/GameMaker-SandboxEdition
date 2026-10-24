// The trophy scene's timeline: Joe walks in with the diamond heart, sets it down, and the hatch on
// his chest opens on the golden heart; both his lines are said by the end, and it stays put after.
import { describe, expect, it } from 'vitest';
import { LINES, SCENE_SECONDS, sceneAt } from './reveal';

describe('the golden heart scene', () => {
  it('walks Joe in carrying the heart, sets it down, then opens the hatch', () => {
    expect(sceneAt(0)).toMatchObject({ walk: 0, heart: 0, hatch: 0, glow: 0, said: 0, mirror: true });
    expect(sceneAt(1).frame).toMatch(/^side/);
    expect(sceneAt(2.1)).toMatchObject({ walk: 1, frame: 'stand', hatch: 0 });
    expect(sceneAt(3.2).heart).toBe(1);
    expect(sceneAt(3.2).hatch).toBe(0);
    expect(sceneAt(4.6).hatch).toBe(1);
    expect(sceneAt(5.2).frame).toBe('blink');
  });

  it('says both lines, and its last picture holds', () => {
    expect(sceneAt(LINES[0].at).said).toBe(1);
    expect(sceneAt(SCENE_SECONDS).said).toBe(LINES.length);
    expect(sceneAt(99)).toEqual(sceneAt(SCENE_SECONDS + 1));
    expect(sceneAt(99)).toMatchObject({ walk: 1, heart: 1, hatch: 1, glow: 1, shake: 0, frame: 'stand' });
    for (const l of LINES) expect(l.text).not.toMatch(/health|pacemaker|grand/i);
  });
});
