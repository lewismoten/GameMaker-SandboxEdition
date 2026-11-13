# player/dosConfig

A TypeScript recreation of PLAYGAME's Configure screen (`DrawConfigScrn`, `AskConfigData`, `CuteBox`, `DrawSurf`
in `code/GM/PLAYGAME.C`, lines 4790 to 5132), shown on the 1994 PC's monitor instead of the web's setup dialog
(`../hardwareSetup.ts`). No DOS or x86 code runs here. The desk and `dos.html` both play through `retro/computer.ts`, which passes
`dosSetup: true` to the player; the web player and the editor keep the dialog.

| File          | What it holds                                                                                             |
| ------------- | --------------------------------------------------------------------------------------------------------- |
| `model.ts`    | Layout constants, the cursor moves of the arrow keys, starting values and the mapping to `hardwarePrefs`. |
| `draw.ts`     | The drawing with the C's coordinates and palette entries (320 x 200, 8 x 8 font).                         |
| `screen.ts`   | The key, mouse and blink loop, Help (`config.hlp` through the engine's `displayFile`) and the fade in.    |
| `helpText.ts` | Original `code/GM/CONFIG.HLP` text, with trailing blanks trimmed and the DOS end-of-file marker omitted. |
| `dosSetup.ts` | The same interface as `hardwareSetup`: `prepare(force)` for first run, FASTPLAY and CONFIG.BAT.           |

## Keys

Arrows move a blinking white cursor, Enter picks (or opens Help, or edits the driver name or path), Esc or Enter on
Done saves and goes on. While editing the driver name or path, Esc discards that text edit and returns to Configure;
it does not finish setup. Moving the mouse nudges the cursor and a click is Enter, as the C did.

## Choices and what the web does with them

The screen asks for more than the browser can use, so `hardwarePrefs` keeps the web's two fields and an optional `dos`
record with the rest:

- Sound: None is `speaker` (no sound card: effects on the PC speaker), Sound Blaster is `blaster`.
- VGA chip type: Auto-Detect is `auto`; every other chip type is `vga` (a browser draws the same 320 x 200).
- Port, interrupt, chip type and driver are kept in `dos` so the screen shows them again; the engine does not read them.

## Like the C, on purpose

The cursor starts on Help (the first label drawn at the left button). On the main Configure screen, Esc saves
rather than cancels. The interrupt list stores 2 and 10 as 1 and 9 while editing.
