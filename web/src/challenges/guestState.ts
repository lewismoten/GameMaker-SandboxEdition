// Visit-only storage capability for a future guest runner; never opens browser storage.
import { GameFiles } from '@lewismoten/gamemaker-sandbox-engine/core/gameFiles';

/** Caller supplies a complete pristine disk, never the owner's overlaid GameFiles. */
export function createGuestState(pristine: GameFiles, presentation: Readonly<Record<string, string>> = {}) {
  // GameFiles.copy() shares byte arrays and streams. Deep-copy here, with no streaming hooks.
  const files = new GameFiles(pristine.entries().map(([name, bytes]) => [name, bytes.slice()]));
  const settings = new Map(Object.entries(presentation));
  let closed = false;
  const requireOpen = () => {
    if (closed) throw new Error('Guest run is closed.');
  };
  files.guard = requireOpen;
  return {
    files,
    persistent: false as const,
    setting(name: string): string | undefined {
      requireOpen();
      return settings.get(name);
    },
    setSetting(name: string, value: string): void {
      requireOpen();
      settings.set(name, value);
    },
    close(): void {
      if (closed) return;
      files.onChange = undefined;
      for (const name of files.names()) files.delete(name);
      settings.clear();
      closed = true;
    },
  };
}
