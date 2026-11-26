// Leaving the Pi remote while Web Serial is still connecting.
import { expect, it, vi } from 'vitest';
import { SerialLink } from './serialLink';

it.each(['chooser', 'open'])('releases the connection when leaving during %s', async (stage) => {
  let resume!: () => void;
  const pending = new Promise<void>((resolve) => {
    resume = resolve;
  });
  const port = {
    open: vi.fn(async () => {
      if (stage === 'open') await pending;
    }),
    close: vi.fn(async () => {}),
    readable: new ReadableStream<Uint8Array>(),
    writable: new WritableStream<Uint8Array>(),
  };
  const route = new AbortController();
  const link = new SerialLink(vi.fn(), vi.fn());
  const connecting = link.connect(
    {
      requestPort: async () => {
        await pending;
        return port;
      },
    },
    stage === 'open' ? port : undefined,
    route.signal,
  );
  route.abort();
  resume();
  await connecting;
  expect(link.open).toBe(false);
  expect(port.open).toHaveBeenCalledTimes(stage === 'open' ? 1 : 0);
  expect(port.close).toHaveBeenCalledTimes(stage === 'open' ? 1 : 0);
});
