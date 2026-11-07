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
- `capsule.ts`: capsule v1, what Scoot carries between screens as a file (SCOOT.SCT, 512 bytes at
  most): magic `SCT1`, version, table version, the courier's world id, trip id, home id, the id of
  the screen that wrote it, packages (empty for now) and the postcards it collected (each a
  screen's id, its world id and its stamps; a catalog game as a 32-bit hash of its id), then a
  CRC-32. No text fields, so no name of any kind rides along. `decodeCapsule` checks size, magic,
  version, checksum and every count and id before anything is written.
- `trips.ts`: Send Scoot on a trip, a visitor arriving, sending it home and welcoming Scoot home.
  This screen's home postcard never travels and no postcard from this screen comes back to it; a
  capsule this screen wrote is refused politely; a trip visits a screen once and comes home once
  (deduped by trip id); one visitor at a time.
- `capsuleFile.ts`: saving SCOOT.SCT through the browser's download and opening one through its
  file picker (the card's Setup and SCOOT.EXE's Setup).
- `scootExe.ts`: SCOOT.EXE in `C:\COMM`, a text-mode reader with Mail, Postcards, Packages and
  Setup.

Letters come from BBS calls: `retro/bbs/courierMail.ts` sends a board's letter as a mail packet
the first time a call to it connects. The card is `desk/buddy/courierCard.ts`.

Ids: the home id, the id of the screen that wrote a capsule and the trip id are UUID version 4
only: 122 random bits from `crypto.randomUUID` or `crypto.getRandomValues`, derived from nothing (no
time, MAC, hardware or serial number, user agent or world name), so screens in one household cannot
be linked by them. Other versions are refused (v1 holds a time and a MAC, v6/v7 a time, v3/v5 a hash
of a name). The CYD and Pi ports make theirs the same way from the hardware random number generator
(ESP32: `esp_random()` with the radio on, or `bootloader_random_enable()`; Pi: its hardware RNG), never
from the efuse MAC or a serial number. A capsule carries only the courier's home id and world (a
curated id), its postcards and the trip id.

Must not: name a secret game or keep its id (the store turns a secret game's stamp into the
mystery stamp as it writes and as it reads), count what is missing, or push play. Letters arrive only because of
something the player did.

Tests: `courierStore.test.ts` (the store, and the tables' words and secret-game check),
`capsule.test.ts` (round trip, v4 ids, refusals), `trips.test.ts` (two screens' storage in turn:
a visit and homecoming, refusals with nothing written, replays, a secret game as the mystery stamp),
`stamps.test.ts` (the earning rules, one postcard here, every secret id fed in and never
stored), `stampArt.test.ts`, `courierText.test.ts` (dates and SCOOT.EXE's stamps) and
`retro/bbs/courierMail.test.ts` (the BBS letter).
