# `player/`: the embeddable game player

Part of the [source map](../README.md). A self-contained player (canvas, input and audio around `runGame()`) used by the play page, web exports and the editor's test runs.

- `player.ts`, `player.css`: the canvas, press-to-start overlay and errors.
- `exactScale.ts`, `.css`: even pixels at any size.
- `hardwareSetup.ts`, `hardwarePrefs.ts`: optional first-run video/audio choices, kept in the browser and never written into a game's DOS files.
- `speedPick.ts`: "Run like a..." slows the game loop to an older machine.
- `touch.ts`, `moveKeys.ts`: the touch d-pad and which keys it sends.
- `screenKeys.ts`: a panel of on-screen keys (Esc, F1 to F10, Enter, Space...).
- `cursorHide.ts`: hides the mouse pointer once it rests.
- [`dosConfig/`](dosConfig/README.md): PLAYGAME's own Configure screen on the 1994 PC's monitor.
