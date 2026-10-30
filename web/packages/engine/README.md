# Game-Maker: Sandbox Edition browser engine

`@lewismoten/gamemaker-sandbox-engine` runs RSD Game-Maker games from their original DOS files in a browser. It is the same TypeScript engine used by the Game-Maker: Sandbox Edition web player. The package includes its audio worklet and TypeScript declarations; it does not include games or the site's editor and catalog.

Install from your configured npm registry:

```sh
npm install @lewismoten/gamemaker-sandbox-engine
```

If your registry requires authentication or a scope mapping, configure npm using that registry's instructions.

Pass the files from one game's DOS directory to `GameFiles`. Names are case insensitive and use DOS 8.3 names. `GameFiles.mainGame()` finds a `.GAM` file. Keep the original file names and bytes; the game refers to its other files by name.

```ts
import { GameFiles, Machine, runGame } from '@lewismoten/gamemaker-sandbox-engine';

const input = document.querySelector<HTMLInputElement>('#files')!;
const canvas = document.querySelector<HTMLCanvasElement>('#screen')!;
const play = document.querySelector<HTMLButtonElement>('#play')!;
let files: GameFiles | undefined;

input.addEventListener('change', async () => {
  const entries = await Promise.all(
    Array.from(input.files ?? [], async (file): Promise<[string, Uint8Array]> => [
      file.name,
      new Uint8Array(await file.arrayBuffer()),
    ]),
  );
  files = new GameFiles(entries);
  play.disabled = !files.mainGame();
});

play.addEventListener('click', async () => {
  if (!files) return;
  const gam = files.mainGame();
  if (!gam) throw new Error('Choose a game directory containing a .GAM file');

  const machine = new Machine(canvas, files);
  try {
    await machine.audio.resume(); // the click is a user gesture
    await runGame(machine, gam);
  } finally {
    machine.destroy();
  }
});
```

```html
<input id="files" type="file" webkitdirectory multiple aria-label="Game directory" />
<button id="play" disabled>Play</button>
<canvas id="screen" tabindex="0" aria-label="Game screen"></canvas>
<style>
  #screen { width: min(100%, 960px); aspect-ratio: 8 / 5; image-rendering: pixelated; }
</style>
```

`Machine` owns the screen, keyboard and audio. Call `machine.destroy()` when play finishes or the containing page closes. `runGame` accepts `RunOptions` for callbacks, joystick input, playback and the optional DOS player appearance. The game may write saves or high scores into `GameFiles`; use `files.onChange` to persist those bytes. The package targets modern browsers and ES modules.

## Native player screens

The package includes the complete DOS player front end. The example above shows
its title images or animation and menu before play. The menu offers instructions,
storyline, credits, top scores and quitting; during play the native function keys
open help, inventory, load and save screens. Include the files named by the game's
`.GAM` file, along with any saved games or high scores you want to keep.

`runGame` uses these screens by default. For a direct play test, pass
`{ skipTitle: true }` to start a new game at its initial scene link; its normal
ending screens and menu still follow when play ends. `RunOptions.player` accepts
DOS player customizations for words, colors, frames, positions, timing and function
keys. `gmHelp` optionally supplies Game-Maker's own help text before the game's
instructions. See the exported `RunOptions` type for these settings and callbacks.

Observe actual life loss with `onLifeLost`, including the last life, or the final
result and score with `onPlayEnd`. Recorded demo playback does not emit either
callback. Persist `GameFiles.onChange` to retain save files and high scores between
visits.

The source is MIT licensed; see `LICENSE` and `NOTICE.md` for credits.

## Build from source

This folder owns all its source in `src/`, plus its build configuration, license and notices. It can be copied outside the repository: run `npm install` and `npm run verify` here to build and test a packed consumer. Within the monorepo, run `npm ci` at the repository root, then `npm run build -w @lewismoten/gamemaker-sandbox-engine`. Run `npm pack` here to inspect a local distribution. Tarballs are build artifacts and should not be committed.

Repository automation is documented in the [package release guide](https://github.com/lewismoten/GameMaker-SandboxEdition/blob/master/docs/package-releases.md).

`RunOptions.onLifeLost` observes each player death, including the final life.
`onPlayEnd(score, how, gained)` reports `won`, `lost`, or `quit` once a play ends.
Neither callback runs during demo or walkthrough playback. These callbacks do not
change DOS gameplay or the game files.
