// Real IndexedDB and mounted save-note channels: never reuse an old Saved label for new edits.
import { expect, it, vi } from 'vitest';
import { editorBrowser } from '../../../test/editorBrowser';

// Each test starts its own Vite server and browser, which takes much longer on a busy machine.
vi.setConfig({ testTimeout: 90_000 });

it.each([390, 1440])(
  'shows dirty, saving, success, failure and remounted state at %spx',
  async (width) => {
    const fixture = await editorBrowser();
    await fixture.page.setViewportSize({ width, height: 900 });
    try {
      const result = await fixture.page.evaluate<{
        dirty: string;
        dirtyFlash: string;
        dirtyVisible: boolean;
        saving: string;
        saved: string;
        failed: string;
        replayed: string;
        persistedDuring: boolean;
        persistedAfter: boolean;
      }>(`(async () => {
      const { Project } = await import('/src/editor/core/project.ts');
      const { GameFiles } = await import('/src/project/files.ts');
      const { saveNote } = await import('/src/editor/shell/saveNote.ts');
      const { loadRecord } = await import('/src/project/storage.ts');
      const p = new Project('save-note-regression', 'Save state', 'a.gam', new GameFiles());
      let note = saveNote(p); document.querySelector('#host').replaceChildren(note.el);
      try {
        await p.saveNow();
        p.files.set('a.txt', Uint8Array.of(65));
        const dirty = note.el.textContent;
        const flash = document.querySelector('.save-flash');
        const dirtyFlash = flash.textContent;
        const dirtyVisible = flash.classList.contains('on') && getComputedStyle(flash).display !== 'none';
        const persistedDuring = !!(await loadRecord(p.id)).files['a.txt'];
        const save = p.saveNow(); const saving = note.el.textContent;
        await save; const saved = note.el.textContent;
        const persistedAfter = !!(await loadRecord(p.id)).files['a.txt'];
        const transaction = IDBDatabase.prototype.transaction;
        IDBDatabase.prototype.transaction = function() { throw new DOMException('Injected refusal', 'QuotaExceededError'); };
        try { await p.saveNow(); } catch {} finally { IDBDatabase.prototype.transaction = transaction; }
        const failed = note.el.textContent;
        note.dispose(); note = saveNote(p); document.querySelector('#host').replaceChildren(note.el);
        const replayed = note.el.textContent;
        await p.saveNow();
        return { dirty, dirtyFlash, dirtyVisible, saving, saved, failed, replayed, persistedDuring, persistedAfter };
      } finally { note.dispose(); }
    })()`);
      expect(result.dirty).toContain('Unsaved');
      expect(result.dirtyFlash).toContain('Unsaved');
      expect(result.dirtyVisible).toBe(width < 1200);
      expect(result.saving).toBe('Saving…');
      expect(result.saved).toContain('Saved');
      expect(result.failed).toContain('Not saved');
      expect(result.replayed).toBe(result.failed);
      expect(result.persistedDuring).toBe(false);
      expect(result.persistedAfter).toBe(true);
    } finally {
      await fixture.close();
    }
  },
  90_000,
);

it('announces failures and recovery immediately, keeps explicit saves to one voice, and cancels on disposal', async () => {
  const fixture = await editorBrowser();
  try {
    await fixture.page.clock.install();
    await fixture.page.evaluate(`(async () => {
      const { saveNote } = await import('/src/editor/shell/saveNote.ts');
      let listen, complete, reject;
      let calls = 0;
      const project = {
        onSaveState(fn) { listen = fn; return () => {}; },
        saveNow() { calls++; return new Promise((yes, no) => { complete = yes; reject = no; }); },
      };
      const note = saveNote(project);
      document.querySelector('#host').append(note.el);
      const region = document.querySelector('p.sr-only[role=status]');
      const messages = [];
      const observer = new MutationObserver(() => messages.push(region.textContent));
      observer.observe(region, { childList: true });
      const tick = async () => { await Promise.resolve(); await Promise.resolve(); };
      const key = () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 's', ctrlKey: true }));
      window.saveTest = { note, region, messages, listen: (...args) => listen(...args), key,
        complete: () => complete(), reject: () => reject(new Error('Quota')), calls: () => calls, observer };
      listen('saved');
      listen('dirty');
      listen('saving');
      listen('failed', new Error('Quota')); await tick();
      for (let i = 0; i < 5; i++) { listen('failed', new Error('Quota')); await tick(); }
    })()`);
    expect(await fixture.page.evaluate('window.saveTest.messages')).toEqual(['Not saved: Quota. Download a .zip to keep your work.']);
    await fixture.page.clock.runFor(1600);
    expect(await fixture.page.evaluate('window.saveTest.messages.length')).toBe(1);
    await fixture.page.evaluate(`(async () => {
      const t = window.saveTest;
      t.listen('dirty'); t.listen('saving'); t.listen('saved');
      await Promise.resolve();
    })()`);
    expect(await fixture.page.evaluate('window.saveTest.messages')).toEqual([
      'Not saved: Quota. Download a .zip to keep your work.',
      'Saved in this browser again after the save problem. Download a .zip to keep a copy.',
    ]);
    await fixture.page.evaluate(`(() => {
      const t = window.saveTest; t.messages.length = 0;
      t.listen('saved'); t.listen('dirty');
    })()`);
    await fixture.page.clock.runFor(1600);
    expect(await fixture.page.evaluate('window.saveTest.messages')).toEqual([]);
    await fixture.page.evaluate(`(async () => {
      const t = window.saveTest; t.messages.length = 0;
      t.key(); t.key(); t.listen('saving'); t.listen('saved'); t.complete();
      await Promise.resolve(); await Promise.resolve();
    })()`);
    await fixture.page.clock.runFor(1600);
    expect(await fixture.page.evaluate('window.saveTest.calls()')).toBe(1);
    expect(await fixture.page.evaluate('window.saveTest.messages')).toEqual(['Saved in this browser. Download keeps a copy on your computer.']);
    await fixture.page.evaluate(`(async () => {
      const t = window.saveTest; t.messages.length = 0;
      t.key(); t.listen('failed', new Error('Quota')); t.reject();
      await Promise.resolve(); await Promise.resolve();
    })()`);
    await fixture.page.clock.runFor(1600);
    expect(await fixture.page.evaluate('window.saveTest.messages')).toEqual(['Not saved: Quota. Download a .zip to keep your work.']);
    await fixture.page.evaluate(`(() => {
      const t = window.saveTest; t.messages.length = 0;
      t.key(); t.listen('saving'); t.listen('dirty'); t.complete();
    })()`);
    await fixture.page.clock.runFor(2000);
    expect(await fixture.page.evaluate('window.saveTest.messages')).toEqual([]);
    expect(await fixture.page.evaluate('window.saveTest.note.el.textContent')).toBe('Unsaved changes…');
    await fixture.page.evaluate(`(() => {
      const t = window.saveTest; t.messages.length = 0;
      t.key(); t.listen('saved'); t.note.dispose(); t.complete(); t.key();
    })()`);
    await fixture.page.clock.runFor(2000);
    expect(await fixture.page.evaluate('window.saveTest.messages')).toEqual([]);
    expect(await fixture.page.evaluate('window.saveTest.calls()')).toBe(4);
    expect(await fixture.page.evaluate('window.saveTest.region.isConnected')).toBe(false);
    expect(await fixture.page.evaluate('document.querySelectorAll(".toast").length')).toBe(0);
    await fixture.page.evaluate('window.saveTest.observer.disconnect()');
  } finally {
    await fixture.close();
  }
}, 90_000);
