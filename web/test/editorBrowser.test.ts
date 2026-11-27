// A competing listener can claim a fixture port after the reservation closes.
import { createServer } from 'node:net';
import { expect, it, vi } from 'vitest';
import { createServer as createViteServer } from 'vite';
import { editorBrowser } from './editorBrowser';

vi.mock('vite', { spy: true });

it('opens the editor fixture when another listener takes its first port', async () => {
  const vite = await vi.importActual<typeof import('vite')>('vite');
  const competitor = createServer();
  vi.mocked(createViteServer).mockImplementationOnce(async (config) => {
    await new Promise<void>((resolve, reject) => {
      competitor.once('error', reject);
      competitor.listen(config?.server?.port, '127.0.0.1', resolve);
    });
    return vite.createServer(config);
  });
  try {
    const fixture = await editorBrowser();
    try {
      expect(await fixture.page.locator('#host').count()).toBe(1);
    } finally {
      await fixture.close();
    }
  } finally {
    competitor.close();
  }
});
it('loads the audited Project source in an isolated browser fixture and closes it', async () => {
  const fixture = await editorBrowser();
  const url = fixture.page.url();
  try {
    expect(new URL(url).port).not.toBe('5173');
    expect(
      await fixture.page.evaluate(`(async () => {
        const { Project } = await import('/src/editor/core/project.ts');
        return typeof Project;
      })()`),
    ).toBe('function');
    expect(await fixture.page.locator('#host').count()).toBe(1);
  } finally {
    await fixture.close();
  }
  await expect(fetch(url)).rejects.toThrow();
}, 30_000);
