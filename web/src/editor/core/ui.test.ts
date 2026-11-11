// A modal keeps Escape to itself, so the screen underneath doesn't also react to it.
import { afterEach, expect, it, vi } from 'vitest';
import { FakeDoc } from '../../../test/fakeDom';
import { modal } from './ui';

afterEach(() => vi.unstubAllGlobals());

it('stops Escape at the dialog and resolves undefined on cancel', async () => {
  const doc = new FakeDoc();
  vi.stubGlobal('document', doc);
  const p = modal('First', () => doc.createTextNode('Body') as never);
  const dlg = doc.body.children.find((c) => c.tag === 'dialog')!;
  expect(dlg.open).toBe(true);
  expect((dlg.fire('keydown', { key: 'Escape' }) as { stopped: boolean }).stopped).toBe(true);
  expect((dlg.fire('keydown', { key: 'a' }) as { stopped: boolean }).stopped).toBe(false);
  dlg.fire('cancel');
  expect(await p).toBeUndefined();
  expect(dlg.open).toBe(false);
});
