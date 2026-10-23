import { describe, expect, it } from 'vitest';
import { visitorSystem } from './download';

const nav = (userAgent: string, platform = '', maxTouchPoints = 0) => ({ userAgent, platform, maxTouchPoints });

describe('the Download chooser', () => {
  it('chooses the visitor’s own system first', () => {
    expect(visitorSystem(nav('Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Win32'))).toBe('windows');
    expect(visitorSystem(nav('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'MacIntel'))).toBe('mac');
    expect(visitorSystem(nav('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'MacIntel', 5))).toBe('web'); // an iPad
    expect(visitorSystem(nav('Mozilla/5.0 (X11; Linux x86_64)', 'Linux x86_64'))).toBe('linux');
    expect(visitorSystem(nav('Mozilla/5.0 (Linux; Android 14)', 'Linux armv8l'))).toBe('web');
    expect(visitorSystem(nav('Mozilla/5.0 (X11; CrOS x86_64 14541.0.0)', 'Linux x86_64'))).toBe('web');
    expect(visitorSystem(nav('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)', 'iPhone'))).toBe('web');
  });
});
