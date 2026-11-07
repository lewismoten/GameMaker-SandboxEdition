# `courier/`: Scoot's mail, postcards and packages

Part of the [source map](../README.md). The courier is Scoot, the desk buddy
([`desk/buddy/`](../desk/buddy/README.md)). This folder is what it carries, shared by its card on
the desk and SCOOT.EXE on the PC, so it loads nothing from `src/desk/` (the PC is also
`dos.html`'s; `dosPage/boundary.test.ts`).

- `tables.ts`: the curated tables, version 1: world names, landmarks, postcard palettes, phrases,
  stamp kinds and the mail table (one letter per BBS). Everything a courier shows is an id into
  these; nothing is typed.
- `courierStore.ts`: localStorage `gm-courier` (the backup's Desk section): the letters (ids, the
  desk clock's day, read or not), every letter ever delivered (so a deleted one never comes back),
  postcards and packages. `deliver` is the only way a letter arrives; nothing runs on a timer. It
  also reads and sets Scoot's Quiet switch where the desk buddy keeps it. Changes are announced
  with `COURIER_CHANGED`.
- `courierText.ts`: the words both faces show (sections, empty notes, dates, stamps, and
  `stampRows`, SCOOT.EXE's two stamps to a row).
- `stamps.ts`: what earns a stamp on this device's own postcard (one world name, rolled once
  from the table): a public catalog game played to its ending stamps its title; any Starter is
  the one Sample CD stamp; any graduation the one "Attended a graduation" stamp (never grades or
  honors); a secret game, a game of your own or one the catalog does not know is the same plain
  mystery stamp, given once it is played, with no id kept. `achievements/index.ts`
  `playAchievements` calls `earnStamp` for the web player, play.html, the desk and the DOS page.
  `catalogTitles` gives the card and SCOOT.EXE the games' titles (never a secret game's).
- `stampArt.ts`: each stamp kind's 20 x 24 pixel art (a perforated edge; a floppy disk, a
  compact disc, a mortarboard with a tassel, a question mark) as SVG.
- `scootExe.ts`: SCOOT.EXE in `C:\COMM`, a text-mode reader with Mail, Postcards, Packages and
  Setup.

Letters come from BBS calls: `retro/bbs/courierMail.ts` sends a board's letter as a mail packet
the first time a call to it connects. The card is `desk/buddy/courierCard.ts`.

Must not: name a secret game or keep its id (the store turns a secret game's stamp into the
mystery stamp as it writes and as it reads), count what is missing, or push play. Letters arrive only because of
something the player did.

Tests: `courierStore.test.ts` (the store, and the tables' words and secret-game check),
`stamps.test.ts` (the earning rules, one postcard here, every secret id fed in and never
stored), `stampArt.test.ts`, `courierText.test.ts` (dates and SCOOT.EXE's stamps) and
`retro/bbs/courierMail.test.ts` (the BBS letter).
