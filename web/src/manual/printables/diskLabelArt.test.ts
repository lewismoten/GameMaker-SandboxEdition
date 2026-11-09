// Inspect the actual painter's text, not a separate copy of the label wording.
import { expect, it } from 'vitest';
import { paintDiskLabel } from './diskLabelArt';
import type { CatalogEntry } from '../../project/files';

it('prints the install command and full disk number on single and multiple disk labels', () => {
  for (const [disk, of] of [
    [1, 1],
    [1, 3],
    [3, 3],
  ]) {
    const text: string[] = [];
    const g = new Proxy(
      {
        fillText: (s: string) => text.push(s),
        measureText: (s: string) => ({ width: s.length * 5 }),
      },
      { get: (target, key) => target[key as keyof typeof target] ?? (() => undefined) },
    ) as unknown as CanvasRenderingContext2D;
    paintDiskLabel(g, { title: 'Test Game' } as CatalogEntry, {}, disk, of, 0);
    expect(text).toContain('To install: insert disk 1, type A:INSTALL');
    expect(text).toContain(`Disk ${disk} of ${of}`);
    expect(text.join('\n')).not.toContain('A:\\INSTALL');
  }
});
