# piRemote/

The Pi remote (`#/pi-remote`): a keyboard for the Raspberry Pi Zero W running sandbox-kernel and
Game-Maker OS, over the Pi's USB serial port with Web Serial (Chrome or Edge on a computer, over
https or localhost). Nothing on the site links to it.

- `piRemotePage.ts`: the page. Connect asks for the Pi's port (USB `cafe:4011`, "Zero W M0
  recovery") and sends `INFO` to open the kernel's session. Each on-screen key goes down on
  pointer down and up on pointer up or when the pointer leaves it; Enter or Space on a focused
  key is a short tap. Shift, Ctrl and Alt latch until the next key or a second click. The
  physical keyboard goes to the Pi only while its switch is on (off by default; Ctrl+Alt+K or
  the switch turns it off; leaving the window lets every key up). Info, Run Game-Maker OS
  (`RUN GMOS.ELF`) and a log of the Pi's lines.
- `protocol.ts`: the wire format (`KEY <code> <down|up>`, `INFO`, `RUN <NAME>`, one line each
  ended by `\n`), reply sorting and a line splitter. It matches sandbox-kernel's
  `scripts/usb_kernel.py` and `docs/m1.md` ("USB input commands").
- `keymap.ts`: Linux input key codes by `KeyboardEvent.code`, and the on-screen layout.
- `heldKeys.ts`: which keys are held and by what, so a key goes down once and up once.
- `serialLink.ts`: the Web Serial port: ordered writes, a read loop of lines.
- `soundSwitch.ts`: the **Pi sound** switch (off by default; its click starts the browser's
  audio). While on, the Pi's `SND` log lines (Game-Maker OS's sound events: `SND game`, `music
  start|stop`, `voc`, `beep`, `stopall`, `end`; its `docs/play.md`) play here; off, a closed port
  or `SND stopall` stops everything. A game the site does not have says so.
- `soundLine.ts`: the `SND` line parser. `soundGame.ts`: the site game a Pi folder and `.GAM`
  name. `piSound.ts`: plays the events with the engine's `AudioEngine` (OPL2/CMF music, `.VOC`
  clips, the `.SND`'s PC speaker tunes) from the site's files, at the visitor's volume and Games
  setting. `sound.test.ts` tests all three.
- `protocol.test.ts`: the encoder against usb_kernel.py's lines and codes, and the held keys.

Next: sending a kernel, a file or a game folder (`PUT2`, `PUTF`) as usb_kernel.py does.
