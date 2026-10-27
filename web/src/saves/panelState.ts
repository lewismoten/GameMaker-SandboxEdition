// The Saves & scores panel's shared state: what is open, the game's saves as read, the slots and
// table being edited, and the calls each part makes back into the panel (draw again, reload, say).
// savesPanel.ts makes one per visit; the slot, high-score and backup views read and change it.
import type { BackupSummary, GameLabels, GameSaves, HighScore, SavedGame, SaveMap } from '../project/saveData';
import type { Camera } from './saveMapView';

export interface SavesTarget {
  /** The save id ('game:<catalog id>' or 'project:<id>'). */
  saveId: string;
  title: string;
  /** The game's .gam file name. */
  gam: string | null;
  /** All the game's files (for names, pictures, and the high-score table it came with). */
  files(): Promise<{ get(name: string): Uint8Array | undefined }>;
  /** The home page's game key, to keep the open part in the address. */
  key?: string;
}

export type View = number | 'scores' | 'backups';

/** A slot being edited: the working copy and name, until saved or undone. */
export interface WorkSlot {
  save: SavedGame;
  name: string;
}

export interface Panel {
  readonly target: SavesTarget;
  view: View;
  saves?: GameSaves;
  labels?: GameLabels;
  disk?: { get(name: string): Uint8Array | undefined };
  backups: BackupSummary[];
  /** Slots being edited. */
  readonly work: Map<number, WorkSlot>;
  /** The high-score table being edited. */
  scores?: HighScore[];
  /** Whether this visit has backed the saves up yet (cleared to take a fresh one). */
  backedUp: boolean;
  /** Slots whose unlimited sequences are shown. */
  readonly openUnlimited: Set<number>;
  /** The last word on moving the hero in a slot (why he can't go there, or where he went). */
  readonly whereSay: Map<number, { text: string; error: boolean }>;
  /** Each slot's map view (kept while the panel is drawn again), for its level. */
  readonly cameras: Map<number, { scene: number; camera: Camera }>;
  /** A save's whole level, drawn once (moving the hero keeps it). */
  readonly mapCache: WeakMap<SavedGame, SaveMap>;
  /** The right-hand side, where a slot, the high scores or the backups are drawn. */
  readonly main: HTMLElement;
  /** A message in the dialog's footer. */
  toast(message: string, kind?: 'info' | 'error'): void;
  render(): void;
  renderNav(): void;
  go(v: View): void;
  reload(): Promise<void>;
  /** Backs the saves up once, before the first change of this visit. */
  safety(): Promise<void>;
  dirtySlot(slot: number): boolean;
  dirtyScores(): boolean;
}
