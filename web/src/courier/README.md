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
- `courierText.ts`: the words both faces show (sections, empty notes, dates, stamps).
- `scootExe.ts`: SCOOT.EXE in `C:\COMM`, a text-mode reader with Mail, Postcards, Packages and
  Setup.

Letters come from BBS calls: `retro/bbs/courierMail.ts` sends a board's letter as a mail packet
the first time a call to it connects. The card is `desk/buddy/courierCard.ts`.

Must not: name a secret game, count what is missing, or push play. Letters arrive only because of
something the player did.

Tests: `courierStore.test.ts` (the store, and the tables' words and secret-game check) and
`retro/bbs/courierMail.test.ts` (the BBS letter).
