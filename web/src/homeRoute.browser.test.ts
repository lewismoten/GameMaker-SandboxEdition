// Hold the home module request while the app's hash router opens the Library.
import { afterAll, beforeAll, expect, it } from 'vitest';
import { editorBrowser } from '../test/editorBrowser';

let fixture: Awaited<ReturnType<typeof editorBrowser>>;
beforeAll(async () => {
  fixture = await editorBrowser();
});
afterAll(async () => fixture?.close());

it('keeps the Library visible when the home module finishes loading after navigation', async () => {
  const { page } = fixture;
  let releaseHome!: () => void;
  const held = new Promise<void>((resolve) => (releaseHome = resolve));
  await page.route('**/editor/shell/home.ts', async (route) => {
    await held;
    await route.fulfill({ contentType: 'text/javascript', body: "export function renderHome(root) { root.textContent = 'Home'; }" });
  });
  await page.route('**/library/libraryPage.ts', (route) =>
    route.fulfill({ contentType: 'text/javascript', body: "export function renderLibrary(root) { root.textContent = 'Library'; }" }),
  );
  await page.evaluate(() => {
    document.querySelector('#host')!.id = 'app';
    history.replaceState(null, '', '#/');
  });
  await Promise.all([page.waitForRequest('**/editor/shell/home.ts'), page.evaluate("import('/src/main.ts')")]);
  await page.getByRole('link', { name: 'Library', exact: true }).click();
  const content = page.locator('#content');
  await content.getByText('Library', { exact: true }).waitFor();
  releaseHome();
  // Join the same module load after the router, so its continuation has run.
  await page.evaluate("import('/src/editor/shell/home.ts')");
  expect(await content.textContent()).toBe('Library');
});
