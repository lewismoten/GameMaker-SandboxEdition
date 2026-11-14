// The page's title while the browser's print dialog is open. "Save as PDF" names the file, and
// sets the PDF's Title, from document.title, which on the site is the site's own name; so a
// manual would save as "Game-Maker: Sandbox Edition — the 1994 desk.pdf". The viewers set the
// publication's name for the print and put the page's title back when printing is done.
let saved: string | undefined;

/** Shows `title` as the document's title until `titleAfterPrint`. */
export function titleForPrint(title: string, doc: Document = document): void {
  saved ??= doc.title;
  doc.title = title;
}

/** Puts back the title `titleForPrint` replaced (nothing if it was not called). */
export function titleAfterPrint(doc: Document = document): void {
  if (saved === undefined) return;
  doc.title = saved;
  saved = undefined;
}
