# `fortKnox/`: Teddy's toy safe and leftover game money

Part of the [source map](../README.md). It was the desk's piggy bank; the saved data kept its
name (`piggy-bank.json`) so older saves still read.

- `hook.ts` hears a catalog game's real session and stores its visible money counter only when it
  wins. `money.ts` keeps the latest completed amount per game beside the score trophies' save
  data (unchanged), so backups carry it.
- `store.ts` is the safe's own record, `fort-knox.json` in the same save: whether the door has
  been opened, the pretend coins spent and the treats bought. The balance is the games' money
  less what was spent. The backup's trophies section merges it (`backup/sections/trophies.ts`).
- `dial.ts` is the lock with no DOM, modeled on a real safe lock (sources in its header): 60 ticks
  (numbers go up clockwise, so turning right lowers the one under the pointer), two loose wheels
  and the drive cam, whose own gate is the third. A pin and the fly it pushes leave a lash of
  almost a whole lap, so after a reversal nothing but the cam moves for nearly a turn, then the
  cam picks up wheel B, and B a lap later picks up wheel A. The door opens when every wheel's gate is
  under the fence, worked out from where the wheels stand (`opens`, `gates`). Dialing: right at
  least three laps to the first number, left past it once and stop on the second the second time
  round, right straight to the third; `spin` is the reset (three laps right). `turnDial` reports
  in `picks` the tick a pin picks up a wheel, for the faint tap (`roomSound.wheelTap`).
  `COMBINATION` is hidden on the sticky note under the phone (`desk/room/phoneNotes.ts`).
- `treats.ts` is the treat store's list (generic names, prices in pretend coins, one free
  imaginary treat that can be bought any number of times).
- `safeSpot.ts` places the safe on the desk after the first catalog win; `safeDialog.ts` is its
  close-up (drag, scroll or arrow keys on the dial, or a number box that turns it there; the store when open). `safeArt.ts`,
  `teddyArt.ts` and `gwinnArt.ts` (Gwinn, the troublemaker dog, beside Teddy; the jerky strip is Gwinny Snaps) draw them in SVG.

Drawn by Claude Sonnet 5.5 from Lewis's description of his childhood bank. Tests: `dial.test.ts`.
