// Where the Assistant (assistant/bridge, loaded only when opened) finds the open project: the
// editor's workspace puts itself here while it is open. Tiny and with no imports to run, so the
// workspace can hold it without loading anything of the Assistant's.
import type { Project } from '../editor/core/project';
import type { RunOptions } from '../engine/game';

/** What the workspace offers the Assistant. */
export interface AssistantHost {
  readonly project: Project;
  readonly currentFile: string | undefined;
  /** The editor (or the play test) area, for screenshots. */
  readonly editorArea: HTMLElement;
  readonly playing: boolean;
  open(file: string): void;
  /** Starts a play test: from the title, or at the first way into a level; `watch` hears the game. */
  playTest(scene: number | undefined, watch: Pick<RunOptions, 'onSession' | 'onPlayEnd'>): boolean;
  /** Stops a play test, back to the file that was open. */
  stopPlay(): void;
}

let current: AssistantHost | undefined;
const listeners = new Set<(h: AssistantHost | undefined) => void>();

export function setAssistantHost(host: AssistantHost | undefined): void {
  current = host;
  for (const l of listeners) l(host);
}

export function assistantHost(): AssistantHost | undefined {
  return current;
}

/** Hears the workspace come and go (another project opened, the home page shown). */
export function onAssistantHost(fn: (h: AssistantHost | undefined) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
