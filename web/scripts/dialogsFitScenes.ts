// The dialogs checked by dialogsFit.ts: how to open each on today's web (home or an editor) with real or test content.
import type { Page } from 'playwright-core';

export interface Scene {
  id: string;
  /** Opens the dialog on a freshly loaded page. */
  open: (page: Page) => Promise<void>;
  /** Hash route to load first (default home). */
  route?: string;
  /** Extra wait after opening, ms. */
  settle?: number;
}

/** The desk is the default interface: switch to today's web (home). */
async function web(page: Page): Promise<void> {
  await page
    .getByText('Too retro')
    .click({ timeout: 8000 })
    .catch(() => undefined);
  await page.waitForSelector('text=New game', { timeout: 15000 }).catch(() => page.waitForTimeout(2500));
}

async function moreMenu(page: Page, item: string | RegExp): Promise<void> {
  await web(page);
  await page.locator('.topbar-more > summary').click({ timeout: 8000 });
  await page.locator('.topbar-more .topbar-menu').getByText(item).first().click({ timeout: 8000 });
}

const menuScene = (id: string, item: string | RegExp): Scene => ({ id, open: (p) => moreMenu(p, item) });

/** A button on home with this exact label (first one shown). */
const homeButton = (id: string, label: string | RegExp, route = '/#/game/cd:nebula'): Scene => ({
  id,
  route,
  open: async (p) => {
    await web(p);
    await p.waitForTimeout(1500);
    await p.getByRole('button', { name: label }).first().click({ timeout: 8000 });
  },
});

/** A button on the home page's Starters tab (the How do I…? questions, How it works). */
const startersButton = (id: string, label: string | RegExp): Scene => ({
  id,
  open: async (p) => {
    await web(p);
    await p.getByRole('tab', { name: /Starters/ }).click({ timeout: 8000 });
    await p.waitForTimeout(1500);
    await p.getByRole('button', { name: label }).first().click({ timeout: 8000 });
  },
});

/** Makes a starter game (the New game dialog's "Ready to play") and waits for its editor. */
async function newProject(page: Page): Promise<void> {
  await web(page);
  await page.getByText('+ New game').first().click();
  await page.getByText('Ready to play').click();
  await page.waitForSelector('text=Optimize', { timeout: 30000 });
}

/** A button on the new game's Tools tab. */
const toolButton = (id: string, label: string | RegExp): Scene => ({
  id,
  open: async (p) => {
    await newProject(p);
    await p.getByRole('tab', { name: 'Tools' }).click({ timeout: 8000 });
    await p.getByRole('button', { name: label }).first().click({ timeout: 8000 });
  },
});

export const scenes: Scene[] = [
  {
    id: 'optimize',
    open: async (p) => {
      await newProject(p);
      await p
        .getByRole('button', { name: /Optimize/ })
        .first()
        .click({ timeout: 8000 });
    },
  },
  toolButton('before-you-upload', /Open the checklist/),
  toolButton('check-every-file', /Check every file/),
  toolButton('make-walkthrough', /Make one/),
  {
    id: 'keyboard-shortcuts',
    open: async (p) => {
      await newProject(p);
      await p.keyboard.press('Shift+Slash');
    },
  },
  {
    id: 'quick-open',
    open: async (p) => {
      await newProject(p);
      await p.keyboard.press('Control+p');
    },
  },
  {
    // the map editor's Generate dialog, on a new game's map with no roles set (its Missing roles panel open: the tallest case)
    id: 'generate-layout',
    open: async (p) => {
      await newProject(p);
      const id = new URL(p.url()).hash.split('/')[2];
      await p.evaluate((h) => (location.hash = h), `#/p/${id}/mygame.map`);
      await p.getByRole('button', { name: /Generate/ }).click({ timeout: 15000 });
      await p.waitForSelector('.gen-dialog', { timeout: 8000 });
    },
  },
  menuScene('sound-and-tour', /Sound and tour/),
  menuScene('ai-setup', /AI setup/),
  menuScene('backup-restore', /Back up/),
  menuScene('play-offline', /Play offline/),
  homeButton('download', 'Download'),
  homeButton('saves-and-scores', /Saves/),
  homeButton('walkthrough', 'Walkthrough'),
  startersButton('how-do-i', /How do I/),
  startersButton('how-it-works', /How it works/),
  startersButton('transcript', /^Transcript$/),
  {
    id: 'transcript-honors',
    open: async (p) => {
      await web(p);
      await p.getByRole('tab', { name: /Starters/ }).click({ timeout: 8000 });
      await p.waitForTimeout(1500);
      await p
        .getByRole('button', { name: /^Transcript$/ })
        .first()
        .click({ timeout: 8000 });
      await p.getByRole('tab', { name: 'Honors' }).click({ timeout: 8000 });
    },
  },
  {
    id: 'new-game',
    open: async (p) => {
      await web(p);
      await p.getByText('+ New game').first().click();
    },
  },
];
