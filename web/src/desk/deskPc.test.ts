// Focusing Machine settings can fetch its chunk before the user opens the dialog.
import { expect, it, vi } from 'vitest';
import { deskPc } from './deskPc';

const unavailable = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error('Chunk unavailable');
  }),
);
vi.mock('./pc/machineDialog', () => unavailable());
vi.mock('./pc/captureStub', () => ({ captureStub: () => undefined }));

it('handles an unavailable settings chunk when the button receives focus', async () => {
  const machineBtn = new EventTarget();
  const scene = { machineBtn, powerBtn: new EventTarget(), crt: new EventTarget(), desk: { querySelector: () => null } };
  deskPc(scene as unknown as Parameters<typeof deskPc>[0], {} as Parameters<typeof deskPc>[1]);
  machineBtn.dispatchEvent(new Event('focus'));
  await vi.dynamicImportSettled();
  expect(unavailable).toHaveBeenCalledOnce();
});
