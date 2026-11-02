// What the disk-space tool reports: a Step is one consolidation it can apply (with the words
// for its preview), a Note is something it noticed but will not change by itself.
import type { GameFiles } from '../../project/files';

/** Where a block set's blocks went in a step: `at` maps old block numbers to new ones (blocks that stayed are left out). `file` and `into` are the same for blocks joined inside one set. */
export interface BlockMove {
  file: string;
  into: string;
  at: ReadonlyMap<number, number>;
}

export interface Step {
  kind: 'bbl' | 'mbl' | 'cbl' | 'mon' | 'pal' | 'look' | 'sync';
  /** The file that stays and the file that goes. */
  keep: string;
  drop: string;
  /** Bytes the game's files shrink by (the dropped file's size). */
  saves: number;
  /** One plain line: what merges into what. */
  title: string;
  /** What changes, one line each (shown in the preview before anything is applied). */
  changes: string[];
  /** Every file apply() changes, for the undo snapshot. */
  touches: string[];
  /** Where blocks moved, so the names and groups kept in the companion can follow (remapExtras.ts). */
  moves?: BlockMove[];
  /** Rewrites the files (and the .gam) in place. The caller keeps the undo snapshot. */
  apply(files: GameFiles, gam: string): void;
}

/** A near-miss or a suggestion for the author to do by hand; the tool does not apply it. */
export interface Note {
  kind: 'bbl' | 'mbl' | 'cbl' | 'mon' | 'pal';
  title: string;
  why: string;
}

export interface Plan {
  steps: Step[];
  notes: Note[];
}
