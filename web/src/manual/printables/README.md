# What's in the box: manuals and printables

Every Sandbox Software game (`games/<id>/` with `about.json`, `manual.json` and `disk/`) opens
its manual with `openGameManual(entry, cover?)` (`../gameManual.ts`). The viewer shows:

- **The manual**: `manual.json` pages flowed onto 5.5 x 8.5 inch booklet pages (long chapters
  continue on extra pages automatically), padded with Notes and Hall of Fame pages to whole
  folded sheets, with the box front as the cover, a back cover and two staples in the center
  spread. Any `P.O. Box` address gets a printed note that it is fictional.
- **What's in the box**: a tray of paper extras. Each one can be read on screen and printed.

Printing (🖨 Print…): this piece, the manual as a booklet (two pages a side on letter paper
turned sideways: print double-sided, fold the stack and staple the fold), or everything. The
browser's own Print command prints the manual page by page.

## Extras every game gets

Made from the catalog entry, the manual and the disk. Turn any off with `"skip"`.

| kind         | what                                                                      |
| ------------ | ------------------------------------------------------------------------- |
| `keycard`    | quick-reference card: every key bound in the game's `.chr` files, plus PLAYGAME's F1-F6 and Esc. Wording comes from `keys`, else from the manual's key tables |
| `postcard`   | registration postcard (both sides), marked paid                           |
| `warranty`   | shareware license and limited warranty card                               |
| `newsletter` | The Sandbox Scoop: the next games, this game's `news`, a tip from its hint book |
| `catalog`    | every Sandbox Software game, coming soon, order form                      |
| `bbs`        | THE -= S A N D B O X =- BBS ad, 1-412-555-SAND, 14,400 baud                |
| `hintoffer`  | hint book order slip (only when the game has a `hintbook` item)           |
| `stickers`   | sticker sheet: title, screenshots, logos, plus `stickers`                 |

## games/&lt;id&gt;/printables.json

All fields are optional. Types: `types.ts` (`PrintablesFile`).

```json
{
  "pitch": "One line for the catalog.",
  "skip": ["bbs"],
  "keys": { "Space": "Fire", "Z": "Plasma Lance" },
  "news": [{ "head": "A story for The Sandbox Scoop", "html": "<p>Simple HTML.</p>" }],
  "stickers": [{ "text": "GOOD DOG", "sub": "small line", "shape": "badge", "color": "#b3121a", "ink": "#fff" }],
  "items": [ ...in tray order, see below... ]
}
```

Every item has `kind`, `title` (tray name), optional `note` (tray subtitle) and `promised: true`
when the manual promises it to registered players (it gets a REG seal). If the manual promises
something with registration, add it here so it is in the box.

A **map window** (`MapPanel`) is `{ "map": "x.map", "x": 0, "y": 0, "w": 16, "h": 10, "caption": "..." }`
in blocks; it is drawn from the game's real blocks and monsters.

| kind        | fields                                                                                       |
| ----------- | -------------------------------------------------------------------------------------------- |
| `map`       | `heading`, `intro`, `panels` (map windows with `marks`: `{x, y, label, kind}` where kind is `secret` (red star), `start` (green arrow), `goal`, `shop`, `note`), `columns` (1 or 2), `legend`, `landscape` |
| `hintbook`  | `intro`, `sections: [{ head, hints: [{ q, a }] }]`: answers print under red noise; the viewer has a draggable red film |
| `letter`    | `letterhead`, `address`, `date`, `to`, `body` (HTML), `signature`, `style`: `print`, `type` or `hand` |
| `newspaper` | `masthead`, `date`, `price`, `headline`, `deck`, `columns` (HTML, one per column), `photo` (map window), `briefs: [[head, text]]` |
| `journal`   | `heading`, `entries: [{ date, html }]` (handwritten on ruled paper)                           |
| `idcard`    | `org`, `name`, `role`, `fields: [[label, value]]`, `color`, `ink`, `photo` (map window background), `portrait: { chr, cbl, pal }` (the hero's standing frame), `back` |
| `chart`     | `heading`, `intro`, `tables: [{ head, note, columns, rows }]`                                  |
| `starchart` | `heading`, `hub: { name, note }`, `sectors: [{ name, gate, color, worlds: [{ name, holds }] }]`, `notes`, `inset` (map window). Comes folded and unfolds on screen; prints landscape |

The catalog and newsletter announce `year2000` and `teddy` as coming soon until they appear in
the catalog; then their own entries (title, blurb, price, box shots, `pitch`) are used.

Write en-US spelling, and keep every address and phone number obviously fictional.
