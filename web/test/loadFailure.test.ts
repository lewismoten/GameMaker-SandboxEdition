// What a part of the site that cannot load tells the visitor.
import { describe, expect, it } from 'vitest';
import { loadFailureText } from '../src/offline/loadFailure';

describe('load failure notice', () => {
  it('offline: says it was not saved for offline use and how to keep it', () => {
    expect(loadFailureText(false)).toMatch(/offline use/);
    expect(loadFailureText(false)).toMatch(/Play offline/);
  });

  it('online: asks for a reload', () => {
    expect(loadFailureText(true)).toMatch(/Reload/);
  });
});
