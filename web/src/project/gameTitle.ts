// A game's title as boxes, labels and manuals print it: the main name big, the rest small.

/** "Main: Subtitle" split in two; "Main! Subtitle" too, the main name keeping its "!". */
export function splitTitle(title: string): [string, string] {
  const i = title.search(/:|!\s/);
  if (i < 0) return [title, ''];
  const cut = title[i] === '!' ? i + 1 : i;
  return [title.slice(0, cut), title.slice(i + 1).trim()];
}
