// Native file copying is format-independent, detached from its source, and metadata-safe.
import { describe, expect, it, vi } from 'vitest';
import type { Project } from '../core/project';
import { emptyCompanion, setSection } from '../../project/companion';
import { GameFiles } from '../../project/files';
import { FILE_ORDER } from './fileKinds';
import { assetNames, primaryAsset, readAsset, sameAssetType, writeAsset } from './assetFiles';
import { copiedAsset, copyAsset } from './assetClipboard';

function project() {
  const companion = emptyCompanion();
  const value = {
    gam: 'game.gam',
    files: new GameFiles([['game.gam', Uint8Array.of(1)]]),
    companion,
    setExtras: (file: string, section: string, data: unknown) => setSection(companion, file, section, data),
  };
  return value as unknown as Project;
}

describe('native asset snapshots', () => {
  it('preserves every byte for every category and leaves the source independent', () => {
    const p = project(),
      bytes = Uint8Array.from({ length: 256 }, (_, i) => i);
    for (const kind of FILE_ORDER) {
      const ext = kind === 'other' ? 'dat' : kind,
        source = `source.${ext}`,
        target = `copy.${ext}`;
      p.files.set(source, bytes.slice());
      p.setExtras(source, 'groups', [{ name: 'Patch', cells: [0, 1] }]);
      const snapshot = readAsset(p, source)!;
      writeAsset(p, target, snapshot);
      snapshot.bytes[0] = 77;
      (snapshot.extras.groups as { cells: number[] }[])[0].cells[0] = 99;
      expect(p.files.get(target)).toEqual(bytes);
      expect(p.companion?.files[target].groups).toEqual([{ name: 'Patch', cells: [0, 1] }]);
      expect(p.files.get(source)).toEqual(bytes);
    }
  });
  it('replaces stale extras and handles case, unknown extensions, extensionless names and CD aliases', () => {
    const p = project();
    p.files.set('notes', Uint8Array.of(0, 255, 4));
    p.setExtras('notes', 'labels', ['One']);
    p.files.set('copy', Uint8Array.of(9));
    p.setExtras('copy', 'stale', true);
    writeAsset(p, 'copy', readAsset(p, 'notes')!);
    expect(p.files.get('copy')).toEqual(Uint8Array.of(0, 255, 4));
    expect(p.companion?.files.copy).toEqual({ labels: ['One'] });
    expect(sameAssetType('NOTES.DAT', 'copy.dat')).toBe(true);
    expect(sameAssetType('notes.dat', 'copy.hlp')).toBe(false);
    expect(sameAssetType('notes', 'copy')).toBe(true);
    expect(assetNames(p, 'other')).toEqual(['copy', 'notes']);
    p.gam = 'main-g.gam';
    p.files.set('main_g.gam', Uint8Array.of(7));
    expect(primaryAsset(p, 'MAIN_G.GAM')).toBe(true);
  });
  it('refuses incompatible or read-only writes before either bytes or extras change', () => {
    const p = project();
    p.files.set('source.bbl', Uint8Array.of(1, 2));
    p.files.set('target.map', Uint8Array.of(8));
    p.setExtras('target.map', 'old', true);
    expect(() => writeAsset(p, 'target.map', readAsset(p, 'source.bbl')!)).toThrow();
    expect(p.files.get('target.map')).toEqual(Uint8Array.of(8));
    expect(p.companion?.files['target.map']).toEqual({ old: true });
    p.files.set('target.bbl', Uint8Array.of(6));
    const attempted = vi.fn();
    p.readOnly = { title: 'Look only', attempted };
    expect(() => writeAsset(p, 'target.bbl', readAsset(p, 'source.bbl')!)).toThrow();
    expect(attempted).toHaveBeenCalledWith('target.bbl');
    expect(p.files.get('target.bbl')).toEqual(Uint8Array.of(6));
  });
  it('copies a detached clipboard snapshot and only offers matching categories', () => {
    const p = project();
    p.files.set('hero.cbl', Uint8Array.of(0, 255, 3));
    p.setExtras('hero.cbl', 'groups', [{ cells: [1, 2] }]);
    copyAsset(p, 'hero.cbl');
    p.files.get('hero.cbl')![0] = 88;
    const clip = copiedAsset('cbl')!;
    expect(clip.bytes).toEqual(Uint8Array.of(0, 255, 3));
    clip.bytes[0] = 99;
    (clip.extras.groups as { cells: number[] }[])[0].cells[0] = 77;
    expect(copiedAsset('cbl')?.bytes).toEqual(Uint8Array.of(0, 255, 3));
    expect(copiedAsset('cbl')?.extras.groups).toEqual([{ cells: [1, 2] }]);
    expect(copiedAsset('map')).toBeUndefined();
  });
});
