// Closing a painter releases its preference listeners even when preferences never change.
import { expect, it, vi } from 'vitest';
import { FakeDoc } from '../../../test/fakeDom';
import { blockColorHelp } from './blockColorHelp';
import * as prefs from './colorHelpPrefs';

it('releases every color help subscription on repeated painter closes', () => {
  const active = new Set<() => void>();
  const subscribe = vi.spyOn(prefs, 'onColorHelp').mockImplementation((fn) => {
    active.add(fn);
    return () => active.delete(fn);
  });
  vi.stubGlobal('document', new FakeDoc());
  try {
    for (let i = 0; i < 10; i++) {
      const panel = blockColorHelp(() => new Uint8Array(768));
      document.body.append(panel.el);
      panel.dispose();
      panel.el.remove();
    }
    expect(active.size).toBe(0);
  } finally {
    subscribe.mockRestore();
    vi.unstubAllGlobals();
  }
});
