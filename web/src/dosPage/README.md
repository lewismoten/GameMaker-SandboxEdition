# `dosPage/`: `dos.html`, the PC on its own

Part of the [source map](../README.md). The 1994 PC without the desk around it: it boots quickly,
fills the window, and has a bar above it and a one-row footer below it.

Entry point: `dos.html` loads `dosPage.ts`.

- `dosPage.ts`: puts the page together: the PC (`retro/computer.ts`), the bar, the disk menu, the footer and the tour hook.
- `dosPage.css`: the page's layout.
- `moreMenu.ts`: the ⋯ menu with the controls used less often (reset, the Sound Blaster card, and so on).
- `diskMenu.ts`: the disk box as a menu: every disk the desk's box holds (`retro/dos/disks.ts`).
- `lineSpeed.ts`: the modem speed as a control, because there is no desk modem to click.
- `keypad.ts`: the keys DOS and Game-Maker need on a phone or tablet with no keyboard.
- `footer.ts`: the one-row footer: the on-screen keys, the page's links and the status line.

Must not: import anything under `src/desk/`, up front or on demand. `dos.html` has no desk.
Share code with the desk through `retro/` or `input/` instead.

Tests: `boundary.test.ts` walks every import reachable from `dosPage/dosPage.ts` and from `retro/computer.ts` and fails on a path into `desk/`.

Check: `cd web && npx vitest run src/dosPage`, then open `/dos.html` on your own dev server port
and look at the bar at phone width and desktop width.

Registration panels load through `regSideLater` when GM first asks, after the initial monitor render.
