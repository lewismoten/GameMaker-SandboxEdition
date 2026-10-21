# What's in the box: manuals and printables

Every Sandbox Software game (`games/<id>/` with `about.json`, `manual.json` and `disk/`) opens
its manual with `openGameManual(entry, cover?)` (`../gameManual.ts`). The viewer shows:

- **The manual**: `manual.json` pages flowed onto 5.5 x 8.5 inch booklet pages (long chapters
  continue on extra pages automatically), padded with Notes and Hall of Fame pages to whole
  folded sheets, with its own front cover (`manualCover.ts`: title in the box's colors, the manual's name, a screenshot and the hero), a back cover and two staples in the center
  spread. Any `P.O. Box` address gets a printed note that it is fictional.
- **What's in the box**: a tray of paper extras. Each one can be read on screen and printed.

Printing (🖨 Print…): this piece, the manual as a booklet (two pages a side on letter paper
turned sideways: print double-sided, fold the stack and staple the fold), or everything. The
browser's own Print command prints the manual page by page.

## Extras every game gets

Made from the catalog entry, the manual and the disk. Turn any off with `"skip"`.

| kind         | what                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `keycard`    | quick-reference card: every key bound in the game's `.chr` files. Directions (arrows, number pad corners, and letters such as W A S D Q E that run the same moves as an arrow) are drawn as an inverted-T, letter and number pad diagram; the rest are actions; PLAYGAME's F1-F6 and Esc along the bottom. Wording comes from `keys`, else from the manual's key tables                      |
| `postcard`   | registration postcard (both sides), marked paid                                                                                                                                                                                                                                                                                                                                              |
| `warranty`   | shareware license and limited warranty card                                                                                                                                                                                                                                                                                                                                                  |
| `newsletter` | The Sandbox Scoop: the next games, this game's `news`, a tip from its hint book                                                                                                                                                                                                                                                                                                              |
| `catalog`    | every Sandbox Software game, coming soon, order form (flows onto as many pages as the games need)                                                                                                                                                                                                                                                                                            |
| `bbs`        | THE -= S A N D B O X =- BBS ad, 1-412-555-SAND, 14,400 baud                                                                                                                                                                                                                                                                                                                                  |
| `hintoffer`  | hint book postcard: a two-sided promo card with the box art and a sample answer under red noise (only when the game has a `hintbook` item)                                                                                                                                                                                                                                                   |
| `worldmap`   | fold-out World Map: every scene as a card (number, name, a picture of where you arrive) and an arrow for each way between scenes, placed by the Game Integrator's Auto-arrange from the `.GAM` (`worldMap.ts`). On screen it unfolds into a view to zoom and drag; it prints as an overview plus full-size pages (A1, B1, ...) to trim and tape together. The hint book's cover points to it |
| `stickers`   | sticker sheet: title, `stickers` (the game's monsters and heroes), screenshots, Sandbox Software, the Sandbox BBS and Game-Maker: Sandbox Edition. On screen it offers Print Then Cut files for a Cricut or other cutting machine: a 300 dpi PNG with 1/16" bleed and an SVG of the cut lines, the same size and centered on each other                                                      |

## games/&lt;id&gt;/printables.json

`everywhere: true` runs a news story in every game's newsletter, not just this one's. All fields are optional. Types: `types.ts` (`PrintablesFile`).

```json
{
  "pitch": "One line for the catalog.",
  "skip": ["bbs"],
  "keys": { "Space": "Fire", "Z": "Plasma Lance" },
  "news": [{ "head": "A story for The Sandbox Scoop", "html": "<p>Simple HTML.</p>", "everywhere": true }],
  "stickers": [
    { "text": "GOOD DOG", "sub": "small line", "shape": "badge", "color": "#b3121a", "ink": "#fff" },
    { "text": "HONK!", "sub": "PARK GOOSE", "shape": "circle", "color": "#ffd23f", "ink": "#2a1408", "sprite": { "blocks": "park.mbl", "pal": "park.pal", "grid": [[31]] } },
    { "text": "TEDDY", "shape": "badge", "hero": { "chr": "teddy.chr", "cbl": "teddy.cbl", "pal": "backyard.pal" } }
  ],
  "items": [ ...in tray order, see below... ]
}
```

A sticker's `sprite` is rows of block numbers from a `.mbl`, `.cbl` or `.bbl` file (-1 leaves a cell empty); `hero` draws a character standing, from his `.chr` file. Shapes: `circle`, `rect`, `star` (a starburst), `badge`. The hero sticker also goes on the game's disk label.

Every item has `kind`, `title` (tray name), optional `note` (tray subtitle) and `promised: true`
when the manual promises it to registered players (it gets a REG seal). If the manual promises
something with registration, add it here so it is in the box.

A **map window** (`MapPanel`) is `{ "map": "x.map", "x": 0, "y": 0, "w": 16, "h": 10, "caption": "..." }`
in blocks; it is drawn from the game's real blocks and monsters.

| kind        | fields                                                                                                                                                                                                                                                                                                                                                                                                          |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `map`       | `heading`, `intro`, `panels` (map windows with `marks`: `{x, y, label, kind}` where kind is `secret` (red star), `start` (green arrow), `goal`, `shop`, `note`), `columns` (1 or 2), `legend`, `landscape`                                                                                                                                                                                                      |
| `hintbook`  | `intro`, `sections: [{ head, hints: [{ q, a }] }]`: answers are each drawn on a canvas: a very pale cyan among white decoy pen strokes as thick and light as the letters, cut by dense red lines (everything but the answer has full red, so only red film shows it; printing uses a stronger cyan for real cellophane); on screen a circle of red film follows the pointer, and there is a whole sheet to drag |
| `letter`    | `letterhead`, `address`, `date`, `to`, `body` (HTML), `signature`, `style`: `print`, `type` or `hand`                                                                                                                                                                                                                                                                                                           |
| `newspaper` | `masthead`, `date`, `price`, `headline`, `deck`, `columns` (HTML, one per column), `photo` (map window), `briefs: [[head, text]]`                                                                                                                                                                                                                                                                               |
| `journal`   | `heading`, `entries: [{ date, html }]` (handwritten on ruled paper)                                                                                                                                                                                                                                                                                                                                             |
| `idcard`    | `org`, `name`, `role`, `fields: [[label, value]]`, `color`, `ink`, `photo` (map window background), `portrait: { chr, cbl, pal }` (the hero's standing frame), `back`                                                                                                                                                                                                                                           |
| `chart`     | `heading`, `intro`, `tables: [{ head, note, columns, rows }]`                                                                                                                                                                                                                                                                                                                                                   |
| `starchart` | `heading`, `hub: { name, note }`, `sectors: [{ name, gate, color, worlds: [{ name, holds }] }]`, `notes`, `inset` (map window). Comes folded and unfolds on screen; prints landscape                                                                                                                                                                                                                            |

The catalog and newsletter announce `year2000` and `teddy` as coming soon until they appear in
the catalog; then their own entries (title, blurb, price, box shots, `pitch`) are used.

Write en-US spelling, and keep every address and phone number obviously fictional.
