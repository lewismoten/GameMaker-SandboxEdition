// The context and contract of a graduation arrival lesson.
import type { Book } from '../book';
import type { Pal } from '../palette';
import type { StarterMap } from '../map';
import type { Timed } from '../graduationHall';

export interface NodCtx {
  /** A locked arrival’s top row: keep its sky lesson inside the view. */
  viewTop?: number;
  book: Book;
  pal: Pal;
  timed: Timed[];
  /** The block names (top first) of the stage's first guest from the Cast. */
  guest: string[];
}

export interface Nod {
  id: string;
  /** The Starter (games/<id>) whose lesson it echoes. */
  course: string;
  /** Words under COURSE nnn on its sign, and the line the manual uses. */
  say: string;
  note: string;
  /** The "How do I...?" question the nod answers, and the manual's account of how it is made (HTML). */
  how: string;
  made: string;
  /** Columns it takes, its sign included. */
  width: number;
  blocks(c: NodCtx): void;
  /** Stamps it with its sign's left edge at column x (the feature starts at x + 5); ground is row 10, things stand on row 9. */
  place(m: StarterMap, x: number, c: NodCtx): void;
}
