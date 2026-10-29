// What an ePub is made of before it is packed (pack.ts): its metadata, its chapters as XHTML
// fragments, and the pictures they use. Each reader's builder (*Book.ts here) fills one in from
// the same source its on-screen pages come from.

/** A file in the book besides the chapters: a picture, by its path inside the book's folder. */
export interface EpubFile {
  /** Relative to the package folder, e.g. 'images/p3.png'. */
  path: string;
  /** Its media type ('image/png', 'image/jpeg', 'image/gif', 'image/svg+xml'). */
  type: string;
  data: Uint8Array;
}

/** A heading inside a chapter, listed under it in the table of contents. */
export interface EpubPart {
  title: string;
  /** The id of the element it links to, in the chapter's body. */
  id: string;
}

export interface EpubChapter {
  /** Names its file (chapter ids are unique in a book): 'c3' gives 'c3.xhtml'. */
  id: string;
  title: string;
  /** The body's inside, as well-formed XHTML (xhtml.ts writes it). */
  body: string;
  parts?: EpubPart[];
  /** Left out of the table of contents (still read in order). */
  unlisted?: boolean;
}

export interface EpubBook {
  /** A stable name for the identifier ('manual/snowbound'): the same book keeps the same id. */
  key: string;
  title: string;
  /** Who wrote it, as the piece itself says. */
  creator: string;
  publisher?: string;
  /** Its in-story date: a year or a full date. */
  date?: string;
  description?: string;
  /** The cover picture (also listed as the book's first page). */
  cover?: EpubFile & { alt: string };
  chapters: EpubChapter[];
  files: EpubFile[];
  /** Styles of its own, after the shared ones (style.ts). */
  css?: string;
}
