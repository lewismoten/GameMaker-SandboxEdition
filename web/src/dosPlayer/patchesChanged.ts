// Tells an open editor that a project's DOS player patches were saved from outside it (the
// desk's PLAYHACK.EXE, projectPatches.ts), in this tab or another, so the editor takes them in
// and its next autosave keeps them instead of writing its older copy back.
import type { PlayerPatches } from './patchRules';

const CHANNEL = 'gm-player-patches';

interface PatchesChanged {
  projectId: string;
  patches: PlayerPatches;
}

const listeners = new Set<(c: PatchesChanged) => void>();
let channel: BroadcastChannel | undefined;

function open(): BroadcastChannel | undefined {
  try {
    if (!channel) {
      channel = new BroadcastChannel(CHANNEL);
      channel.onmessage = (e: MessageEvent<PatchesChanged>) => listeners.forEach((l) => l(e.data));
    }
  } catch {
    /* no BroadcastChannel */
  }
  return channel;
}

/** Announces a project's new patches to this tab's and other tabs' editors. */
export function announcePatches(projectId: string, patches: PlayerPatches): void {
  const c = { projectId, patches };
  listeners.forEach((l) => l(c));
  open()?.postMessage(c);
}

/** Hears patches saved from outside the editor; returns the unsubscribe. */
export function onPatchesChanged(fn: (projectId: string, patches: PlayerPatches) => void): () => void {
  const l = (c: PatchesChanged) => fn(c.projectId, c.patches);
  listeners.add(l);
  open();
  return () => listeners.delete(l);
}
