# `desk/buddy/`: Scoot, the desk buddy

Part of the [desk](../README.md).

A pocket LCD toy standing on the desk top between the PC and the Game-Maker box (on a phone, beside the Game-Maker box) with a
little pixel courier on its screen. It follows what happens on the desk and answers with a pose
and, now and then, one short line in a bubble. Pressing it opens a small card. It never pushes
play: no reminders, streaks, grades or totals still to go, and nothing about losing.

- `deskBuddy.ts` (and `deskBuddy.css`): the toy, its bubble (a polite live region) and its card
  (games played, badges, the game on the PC now, a Quiet switch). It listens for `DESK_PLAY`, new
  badges (`ACHIEVEMENT_UNLOCKED`), a new or better certificate frame (`diploma/frameLevel.ts`, on
  `ACHIEVEMENTS_CHANGED`) and three quiet minutes (it dozes). Loaded by `desk.ts` on its own.
- `courierCard.ts` (and `courierCard.css`): the card's four sections, the web face of SCOOT.EXE:
  Mail, Postcards, Packages and Setup (the Quiet switch), over the courier store
  ([`courier/`](../../courier/README.md)); the envelope at Scoot's shoulder when a letter is new,
  never a number.
- `buddyLines.ts`: the rules, no DOM: what each event gets, how often it may speak (`LINE_GAP`;
  levels only now and then), the Quiet switch, the once-a-day hello. Tests: `buddyLines.test.ts`,
  which also checks that no line pushes play.
- `buddyArt.ts`: the toy as SVG; each pose a 16 x 16 one-bit picture, so a CYD or e-ink face can
  use the same frames.
- `buddyStats.ts`: the small summary the card shows (and a slow face could show later).
- `buddyStore.ts`: localStorage `gm-desk-buddy` (quiet, met, last hello day), in the backup's
  Desk section.
- `deskPlay.ts`: the event `deskPc.ts` sends about the PC's game (title, scenes with a demo flag,
  stop), so the PC never loads the buddy.
