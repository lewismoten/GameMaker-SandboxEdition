// Extra dialog fixtures exercise the real exported views without changing user data.
import type { Page } from 'playwright-core';
import type { Scene } from './dialogsFitScenes';

/** Import the real dialog module in the page; do not await its close promise. */
const moduleScene = (id: string, module: string, fn: string, args: unknown[] = []): Scene => ({
  id,
  open: async (page: Page) => {
    await page.waitForSelector('.topbar', { timeout: 15000 });
    const needsProject = /\$(project|palette|blocks|game|scene|scenes|version|paletteFile)/.test(JSON.stringify(args));
    if (needsProject) {
      await page.getByText('+ New game').first().click();
      await page.getByText('Ready to play').click();
      await page.waitForSelector('text=Optimize', { timeout: 30000 });
      await page.waitForTimeout(500);
    }
    // A string expression keeps vite-node from rewriting browser imports as SSR helpers.
    await page.evaluate(`(async () => {
      const { module, fn, args, needsProject } = ${JSON.stringify({ module, fn, args, needsProject })};
      const styles = module.startsWith('editor/editors/blocks/') ? ['editor/editors/blocks/blocks.css', 'editor/editors/blocks/groupView.css']
        : module.startsWith('editor/editors/palette/') ? ['editor/editors/palette/palette.css']
        : module === 'editor/disk/compareDialog' ? ['editor/disk/diskTool.css'] : [];
      // Vite may re-optimize dependencies and reload mid-import under load (the first import then
      // rejects with "Failed to fetch dynamically imported module", and the browser caches that
      // failure), so retry once, after a pause, with a fresh URL.
      const load = async (url) => {
        try { return await import(url); } catch (error) {
          await new Promise((done) => setTimeout(done, 1500));
          return await import(url + '?retry=' + Date.now());
        }
      };
      await Promise.all(styles.map((style) => load('/src/' + style)));
      const api = await load('/src/' + module + '.ts');
      let project, palette, blocks;
      if (needsProject) {
        const { loadProject } = await import('/src/project/storage.ts');
        const { Project } = await import('/src/editor/core/project.ts');
        const id = location.hash.split('/')[2];
        const stored = await loadProject(id);
        if (!stored) throw new Error('Ready-to-play fixture did not persist');
        project = new Project(id, stored.record.name, stored.record.gam, stored.files, stored.record.companion);
        palette = project.paletteFor('mygame.map').palette;
        const { parseBlocks, BLOCK_COUNTS } = await import('/packages/engine/src/formats/blocks.ts');
        blocks = parseBlocks(project.files.get(project.files.byExtension('bbl')[0]), BLOCK_COUNTS.bbl);
      }
      const revive = (value) => {
        if (value === '$noop') return () => undefined;
        if (value === '$project') return project;
        if (value === '$palette') return palette;
        if (value === '$paletteFile') return project.files.byExtension('pal')[0];
        if (value === '$blocks') return blocks;
        if (value === '$game') return project.game();
        if (value === '$scene') return project.game().scenes[1];
        if (value === '$scenes') return project.game().scenes;
        if (value === '$version') return new Map(project.files.entries());
        if (Array.isArray(value)) return value.map(revive);
        if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, revive(item)]));
        return value;
      };
      void api[fn](...args.map(revive));
    })()`);
  },
});

/** The Library's per-game Disk labels print shop, opened as its shelf does (a real catalog entry). */
const diskLabels: Scene = {
  id: 'disk-labels',
  open: async (page: Page) => {
    await page.waitForSelector('.topbar', { timeout: 15000 });
    await page.evaluate(`(async () => {
      const { loadCatalogList } = await import('/src/project/files.ts');
      const { openPrintShop } = await import('/src/manual/printables/printShop.ts');
      const list = await loadCatalogList();
      const entry = list.find((e) => e.kind === 'shareware' && !e.secret) ?? list[0];
      void openPrintShop('disklabels', entry);
    })()`);
  },
  settle: 1500,
  themeFirst: true,
};

export const extraScenes: Scene[] = [
  diskLabels,
  moduleScene('describe-game', 'assistant/chat/homeDescribe', 'askDescription'),
  moduleScene('quick-color-check', 'editor/colorHelp/quickCheck', 'openQuickCheck'),
  moduleScene('import-history', 'editor/shell/importHistoryDialog', 'showImportHistory'),
  moduleScene('recently-deleted-empty', 'editor/shell/recentlyDeletedDialog', 'showRecentlyDeleted', ['$noop']),
  moduleScene('damaged-copies-empty', 'editor/shell/damagedCopiesDialog', 'showDamagedCopies', ['$noop']),
  moduleScene('community-submit', 'community/submit', 'submitCommunityGame'),
  moduleScene('sand-key', 'library/sandNote', 'showSandKey'),
  moduleScene('imported-note', 'imported/noteDialog', 'editGameNote', [{ id: 'dialog-audit-fixture', name: 'Audit fixture' }]),
  moduleScene('link-waiting', 'linkIn/dialogs', 'waitingDialog', ['Waiting for the game…', '$noop']),
  moduleScene('link-confirm', 'linkIn/dialogs', 'askToOpen', [
    { from: 'a local file', via: 'link', name: 'Audit fixture', files: 15, bytes: 123456, mode: 'edit', target: 'web', keptAs: 'Audit fixture (my copy)' },
  ]),
  moduleScene('link-error', 'linkIn/dialogs', 'showLinkError', ['The game could not be fetched.', { cors: true }]),
  moduleScene('prompt-text', 'editor/core/ui', 'promptText', ['Rename a file', 'New file name', 'mygame.map']),
  moduleScene('confirm-action', 'editor/core/ui', 'confirmDialog', ['Remove a file?', 'This removes the selected file from this copy.', 'Remove']),
  moduleScene('new-block-group', 'editor/editors/blocks/groupDialogs', 'newGroupDialog', [
    { title: 'New group', name: 'Audit group', cols: 2, rows: 2, blocksFor: '$noop' },
  ]),
  moduleScene('choose-rgb-color', 'editor/editors/palette/colorPicker', 'pickColor', [[128, 128, 128]]),
  moduleScene('replace-colors', 'editor/editors/blocks/recolorDialog', 'recolorDialog', ['$palette', 1, 2, true]),
  moduleScene('copy-palette-range', 'editor/editors/palette/paletteCopy', 'paletteCopy', ['$project', '$paletteFile', '$palette', 1, 8]),
  moduleScene('copy-reserved-colors-empty', 'editor/editors/palette/paletteRoleCopy', 'paletteRoleCopy', ['$project', '$palette']),
  moduleScene('choose-background-block', 'editor/widgets/blockChooser', 'chooseBlock', ['Choose a background block', '$blocks', '$palette', 1]),
  moduleScene('make-edge-set', 'editor/editors/blocks/edgeSetDialog', 'edgeSetDialog', ['$blocks', 1, '$palette']),
  moduleScene('suggested-groups-empty', 'editor/editors/blocks/groupDialogs', 'suggestDialog', [
    { suggestions: [], blocks: '$blocks', pal: '$palette', transparent: false, from: 'the ready-to-play fixture' },
  ]),
  moduleScene('instruction-card', 'editor/tools/cards/cardDialog', 'instructionCardDialog', ['$project', '$scene']),
  moduleScene('level-card', 'editor/tools/cards/cardDialog', 'levelCardDialog', ['$project', '$game', 1]),
  moduleScene('opening-sting', 'editor/tools/opening/openingDialog', 'openingDialog', ['$project', '$scene', '$scenes']),
  moduleScene('sound-effect-maker', 'editor/tools/sfxMaker', 'sfxMaker', ['$project']),
  moduleScene('file-picker', 'editor/widgets/filePicker', 'pickFile', ['$project', 'bbl']),
  moduleScene('compare-checkpoint', 'editor/disk/compareDialog', 'compareDialog', ['$project', '$version']),
  moduleScene('bot-demo', 'editor/editors/recording/botDemoDialog', 'botDemoDialog', ['$project']),
];
