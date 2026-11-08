# `input/`: keys, pads and touches that stand in for a PC

Part of the [source map](../README.md). Each file turns something that is not a PC keyboard or
joystick into what PLAYGAME and the desk's DOS expect.

- `macKeys.ts`: how to press PC keys on a Mac keyboard (no Home/End/PgUp/PgDn, keypad or Insert); shown beside key names on a Mac.
- `virtualKeys.ts`: keys pressed with a mouse or finger (the desk's drawn keyboard, the play page's on-screen keys); each press becomes a real keydown/keyup.
- `gamepad.ts`: the first connected Gamepad API controller as the game port's joystick (position 0 to 8, two buttons PLAYGAME reads, two more for the desk's pad).
- `deskJoystick.ts`: the desk's game pad as a joystick beside any real gamepad (`GetJoyPos` in `code/GM/JSTICKC.C`).
- `padTurbo.ts`: the GRAVITAS pad's 4 BUTTON / TURBO switch.
