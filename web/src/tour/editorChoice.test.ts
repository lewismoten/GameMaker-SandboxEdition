// The editor page's tour plays the overview and only the sub-chapter for the open editor.
import { describe, expect, it } from 'vitest';
import { CHAPTERS } from './chapters/index';
import { editorChapterIds } from './editorChoice';

describe('editorChapterIds', () => {
  it('adds the sub-chapter for the open file', () => {
    expect(editorChapterIds('#/p/look:logic/kitchen.map')).toEqual(['editor', 'edit-map']);
    expect(editorChapterIds('#/p/look:logic/kitchen.BBL')).toEqual(['editor', 'edit-blocks']);
    expect(editorChapterIds('#/p/look:logic/watt.chr')).toEqual(['editor', 'edit-monsters']);
    expect(editorChapterIds('#/p/look:logic/watt.pal')).toEqual(['editor', 'edit-palette']);
  });
  it('plays just the overview when no editor matches', () => {
    expect(editorChapterIds('#/p/look:logic')).toEqual(['editor']);
    expect(editorChapterIds('#/p/look:logic/readme.txt')).toEqual(['editor']);
  });
  it('names only chapters that exist, on the editor page', () => {
    for (const id of Object.values({ a: 'edit-map', b: 'edit-blocks', c: 'edit-monsters', d: 'edit-palette' }))
      expect(CHAPTERS.find((c) => c.id === id)?.page).toBe('editor');
  });
});
