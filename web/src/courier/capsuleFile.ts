// A capsule as a file the player keeps: saved as SCOOT.SCT through the browser's download, and
// opened through its file picker. Shared by Scoot's card and SCOOT.EXE. Never reads more than a
// capsule's 512 bytes (and one more, so an oversized file is refused, not cut short).
import { CAPSULE_MAX } from './capsule';

export const CAPSULE_FILE = 'SCOOT.SCT';

/** Saves `bytes` as SCOOT.SCT. */
export function saveCapsuleFile(bytes: Uint8Array): void {
  const url = URL.createObjectURL(new Blob([bytes.slice()], { type: 'application/octet-stream' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = CAPSULE_FILE;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** The first bytes of a file the player picks (undefined when they cancel). */
export async function readCapsuleFile(file: File): Promise<Uint8Array> {
  return new Uint8Array(await file.slice(0, CAPSULE_MAX + 1).arrayBuffer());
}

/** Opens the file picker; resolves with the chosen file's bytes, or undefined when it is closed. */
export function pickCapsuleFile(): Promise<Uint8Array | undefined> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.sct,application/octet-stream';
    input.addEventListener('change', () => {
      const f = input.files?.[0];
      resolve(f ? readCapsuleFile(f) : undefined);
    });
    input.addEventListener('cancel', () => resolve(undefined));
    input.click();
  });
}
