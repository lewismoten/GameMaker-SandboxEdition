// Exercise the Uses panel with a key that opens the second lock.
import { afterEach, beforeEach, expect, it } from 'vitest';
import { editorBrowser } from '../../../../test/editorBrowser';

let fixture: Awaited<ReturnType<typeof editorBrowser>>;
beforeEach(async () => {
  fixture = await editorBrowser();
  await fixture.page.evaluate(`(async () => {
    const { rolesPanel } = await import('/src/editor/editors/blocks/rolesPanel.ts');
    const { emptyBlock } = await import('/packages/engine/src/formats/blocks.ts');
    const { defaultPalette } = await import('/packages/engine/src/formats/palette.ts');
    const { Project } = await import('/src/editor/core/project.ts');
    const { GameFiles } = await import('/src/project/files.ts');
    const project = new Project('test', 'Test', 'test.gam', new GameFiles());
    const blocks = Array.from({length: 6}, (_, i) => emptyBlock(i));
    Object.assign(blocks[5], {obj: 1, effect: 21, eamt: 1});
    const panel = rolesPanel({project, blocks, file: 'keys.bbl', current: () => 5, pal: defaultPalette});
    panel.refresh();
    document.body.append(panel.el);
    window.savedRole = () => project.extras('keys.bbl', 'roles', {})[5];
  })()`);
});
afterEach(async () => fixture?.close());

it.each([/^Key, suggested/i, /^Accept all/i])('keeps the suggested lock number with %s', async (name) => {
  await fixture.page.getByRole('button', { name }).click();
  expect(await fixture.page.evaluate('window.savedRole()')).toEqual({ roles: ['key'], pair: 2 });
});
