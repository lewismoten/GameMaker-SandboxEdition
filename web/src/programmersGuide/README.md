# programmersGuide/

The Programmer's Guide to Game-Maker 3.0 (`#/programmers-guide`, a card on the Library's shelf), and
the words of the 1994 booklet in the Game-Maker box.

- `chapters.ts`: the chapters in order (the contents page) and `loadChapter`, which loads one chapter's
  Markdown from `chapters/<id>.md` when its page opens.
- `chapters/*.md`: the text. Each starts with one `#` title; `##` and `###` headings follow. Marks in
  brackets: the causes of a limit (`[16-bit]`, `[64K]`, `[VGA]`, `[PIT]`, `[file]`, `[DOS]`, `[design]`),
  `[inference]`, `[estimate]` and `[not yet checked in DOSBox]`. Write the last one for anything read
  from the source and not yet run in DOSBox. Keep a citation in an inline code span.
- `citations.ts`: turns `PG:2344`, `BLOC.H:35-52`, `code/GM/FILE:n` and `engine/...ts:n` into GitHub links
  (`sourceFiles.ts` lists the files of `code/GM`; the test checks it against the folder, and that the cited
  lines exist).
- `render.ts`: Markdown to page elements (the reader of `manual/printables/markdownBlocks.ts`), with the
  marks as labels, tables in a box that scrolls on its own and the citations as links.
- `programmersGuidePage.ts` and `programmersGuide.css`: the contents, a chapter, and `#/programmers-guide/all`
  (every chapter on one page; the Print button saves it as a PDF).
- `booklet1994.md`: "Technical Reference and Limits", in the period voice, read by
  `manual/printables/techRef.ts` into a stapled booklet in the Game-Maker box (`gmItems.ts`). It has no
  source lines and no quirks. The file-format atlas in `chapters/formats.md` mirrors its layouts and examples, adds source citations and marks codec differences; `chapters/architecture.md` covers the DOS launcher and its command-tail/exit-code protocol.
