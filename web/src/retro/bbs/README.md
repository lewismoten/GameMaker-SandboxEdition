# `retro/bbs/`: the terminal and the BBSes

Part of [`retro/`](../README.md) and the [source map](../../README.md). TERMINAL.EXE, the modem, and the (recreated or made-up) boards it dials. The parent README has the details of each board.

Entry point: `bbs.ts` (TERMINAL.EXE and its dialing directory), started from the DOS prompt.

- Mail for Scoot: `courierMail.ts` sends a board's letter (`courier/tables.ts`) as a QWK mail packet the first time a call to it connects; SCOOT.EXE reads it.
- Terminal and line: `bbs.ts`, `term.ts` (the screen, pipe color codes, status bar), `pacedQueue.ts` and `wrapWords.ts` (text paced by the line speed), `lineSpeed.ts` and `lineSpeedControls.ts` (the modem speed, with page controls), `modem.ts` (dial sounds), `transfer.ts`, `pkunzip.ts`, `pager.ts`.
- THE -= S A N D B O X =- BBS: `sandbox.ts`, `bbsName.ts` (+ `.css`), `ansiArt.ts`, `ratio.ts`, `rsdLine.ts`, `signup.ts`, `signupAccounts.ts`, `warezArea.ts`, `ticTacToe.ts` and `ticTacToeDoor.ts`, `pickup.ts`, `fileId.ts`, `bardMonths.ts`.
- The GIF Gallery: `gifArea.ts`, `gallery.ts`, `gallery.json`.
- The Sofa: `sofa.ts`, `sofaFiles.ts`, `sofaPhone.ts`, `sofaPictures.ts`, `sofaSpam.ts`.
- Text telephones: `tdd.ts`, `baudot.ts`, `ttyInfo.ts`, `ttyTalk.ts`.

Phone numbers on any board are 555-01xx; the exceptions are listed in `AGENTS.md`.

Must not: import anything under `src/desk/`. The PC is shared with `dos.html`, and `dosPage/boundary.test.ts` walks every import reachable from `retro/computer.ts` and fails on a path into `desk/`.

Tests: `noStarters`, `baudot`, `courierMail`, `downloadGif`, `fileId.picture`, `gifProgress`, `lineSpeed`, `modem`, `pager`, `rsdLine`, `signup`, `signupAccounts`, `term.pacing`, `ticTacToe` and `ttyTalk`, each a `.test.ts` here.

Check: `cd web && npx vitest run src/retro/bbs`; for a look, dial a board on `/dos.html`.
