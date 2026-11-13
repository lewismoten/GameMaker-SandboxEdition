# `input/`: keys, pads and touches that stand in for a PC

Part of the [source map](../README.md). Input adapters and key-name hints for PLAYGAME and
the desk's DOS.

- `macKeys.ts`: hints beside PC key names on a Mac or iPad. The engine workspace's [`src/input/keyboard.ts`](../../packages/engine/src/input/keyboard.ts) maps DOM keys to PC scan codes; its `chords.ts` turns arrow pairs into keypad keys only when the game binds them. The hints do not remap input themselves.
- `virtualKeys.ts`: keys pressed with a mouse or finger (the desk's drawn keyboard, the play page's on-screen keys). It dispatches synthetic `keydown`/`keyup` events to the supplied target, not trusted physical-key events or browser shortcuts. Shift, Ctrl and Alt can stay latched for the next key; `releaseAll()` releases held keys and modifiers when the keyboard is taken away.
- `gamepad.ts`: the first connected Gamepad API controller as the game port's joystick (position 0 to 8, two buttons PLAYGAME reads, two more for the desk's pad).
- `deskJoystick.ts`: the desk's game pad as a joystick beside any real gamepad (`GetJoyPos` in `code/GM/JSTICKC.C`).
- `padTurbo.ts`: the GRAVITAS pad's 4 BUTTON / TURBO switch.
