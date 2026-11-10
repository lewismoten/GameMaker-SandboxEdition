# `player/`: the embeddable game player

Part of the [source map](../README.md). A self-contained player (canvas, input and audio around `runGame()`) used by the play page, web exports and the editor's test runs.

- `player.ts`, `player.css`: the canvas, press-to-start overlay and errors.
- `exactScale.ts`, `.css`: even pixels at any size.
- `hardwareSetup.ts`, `hardwarePrefs.ts`: optional first-run video/audio choices, kept in the browser and never written into a game's DOS files.
- `speedPick.ts`: "Run like a..." slows the game loop to an older machine.
- `touch.ts`, `moveKeys.ts`: the touch d-pad and which keys it sends.
- `screenKeys.ts`: a panel of on-screen keys (Esc, F1 to F10, Enter, Space...).
- `snapshot.ts`: the full-window play page’s camera button; loads the PNG encoder on the first screenshot request and copies the visible palette indices and current VGA palette into an unscaled PNG. `Screen.dosCropped` follows PLAYGAME’s CropScreen/UnCropScreen boundaries, including full-size function-key screens.
- `cursorHide.ts`: hides the mouse pointer once it rests.
- [`dosConfig/`](dosConfig/README.md): PLAYGAME's own Configure screen on the 1994 PC's monitor.

On `play.html`, **Save screenshot** (the camera in the corner) downloads exactly the DOS screen: 312 × 196 during a level, 320 × 200 for pictures, animations, text pages, menus and function-key screens. No browser controls, scaling or smoothing are included. Press F12 to save and focus the camera during play; Enter or Space saves again, and Escape returns focus to the game. Tab reaches it before play starts. Clicking or tapping keeps the game’s focus. The button fades with the idle pointer and reappears on pointer movement or keyboard focus. Files use `<game-id>-scene-<number>-YYYYMMDD-HHMMSS.png` during play and `<game-id>-screen-YYYYMMDD-HHMMSS.png` otherwise, with local time.
