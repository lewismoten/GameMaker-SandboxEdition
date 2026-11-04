// What a part of the site that cannot load tells the visitor.
import { describe, expect, it, vi } from 'vitest';
import { loadFailureText, reloadForNewest } from '../src/offline/loadFailure';

describe('load failure notice', () => {
  it('offline: says it was not saved for offline use and how to keep it', () => {
    expect(loadFailureText(false)).toMatch(/offline use/);
    expect(loadFailureText(false)).toMatch(/Play offline/);
  });

  it('online: asks for a reload', () => {
    expect(loadFailureText(true)).toMatch(/Reload/);
  });

  it('Reload: just reloads with no new version waiting', () => {
    const reload = vi.fn();
    expect(reloadForNewest(undefined, reload)).toBe(false);
    expect(reload).toHaveBeenCalledOnce();
  });

  it('Reload: lets a waiting new version take over first (the page reloads when it has)', () => {
    const reload = vi.fn();
    const postMessage = vi.fn();
    expect(reloadForNewest({ postMessage }, reload)).toBe(true);
    expect(postMessage).toHaveBeenCalledWith({ type: 'skip-waiting' });
    expect(reload).not.toHaveBeenCalled();
  });
});
