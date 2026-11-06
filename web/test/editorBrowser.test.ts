import { expect, it } from 'vitest';
import { editorBrowser } from './editorBrowser';

it('loads the audited Project source in an isolated browser fixture and closes it', async () => {
  const fixture = await editorBrowser();
  const url = fixture.page.url();
  try {
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
