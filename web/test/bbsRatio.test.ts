// The Sandbox BBS's upload/download ratio: free files, the ten on the house, and what an upload
// earns.
import { describe, expect, it } from 'vitest';
import { filePoints, kb, mayDownload, newAccount, NEW_USER_FILES, RATIO, ratioText, recordDownload, recordUpload } from '../src/retro/bbs/ratio';

describe('the Sandbox BBS ratio', () => {
  it('gives a new caller ten files on the house', () => {
    expect(filePoints(newAccount())).toBe(NEW_USER_FILES);
  });

  it('runs out after the free files, then FREE files still download', () => {
    let a = newAccount();
    for (let i = 0; i < NEW_USER_FILES; i++) a = recordDownload(a, 1000, false);
    expect(filePoints(a)).toBe(0);
    expect(mayDownload(a, false)).toBe(false);
    expect(mayDownload(a, true)).toBe(true);
  });

  it('never counts FREE files against the ratio', () => {
    let a = newAccount();
    for (let i = 0; i < 50; i++) a = recordDownload(a, 2048, true);
    expect(a.dlFiles).toBe(50);
    expect(a.dlBytes).toBe(50 * 2048);
    expect(filePoints(a)).toBe(NEW_USER_FILES);
  });

  it('earns a point a call and five downloads an upload', () => {
    let a = { ...newAccount(), counted: NEW_USER_FILES };
    expect(mayDownload(a, false)).toBe(false);
    a = { ...a, calls: 1 };
    expect(filePoints(a)).toBe(1);
    a = recordUpload(a, 5000);
    expect(filePoints(a)).toBe(1 + RATIO);
    expect(a.ulBytes).toBe(5000);
  });

  it('shows the ratio and sizes like the board did', () => {
    const a = recordDownload(recordDownload(newAccount(), 1500, false), 600, true);
    expect(ratioText(a)).toBe('0:2');
    expect(kb(a.dlBytes)).toBe('3K');
    expect(kb(1_500_000)).toBe('1,465K');
  });
});
