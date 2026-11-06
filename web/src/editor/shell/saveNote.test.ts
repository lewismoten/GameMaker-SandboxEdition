// Real IndexedDB and mounted save-note channels: never reuse an old Saved label for new edits.
import { expect, it } from 'vitest';
import { editorBrowser } from '../../../test/editorBrowser';

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
  30_000,
);
