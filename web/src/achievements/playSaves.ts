// Shared save callbacks for the full-window player and the desk/DOS player.
import { writeSaveFile } from '../project/storage';
import { playWrote } from './index';
import { checkHighScores } from './highScores';

export function playSaves(saveId: string | undefined, gam: string): { onFileWrite?: (name: string, bytes: Uint8Array) => Promise<void> } {
  if (!saveId) return {};
  // Read only overlays, not the pristine disk table. Bundles persist but earn no site badges.
  void checkHighScores(saveId, gam);
  return {
    onFileWrite: async (name, bytes) => {
      playWrote(saveId, name);
      await writeSaveFile(saveId, name, bytes);
      if (/\.his$/i.test(name)) await checkHighScores(saveId, gam);
    },
  };
}
