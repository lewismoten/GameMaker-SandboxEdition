# Game-Maker: Sandbox Edition browser engine

`@lewismoten/gamemaker-sandbox-engine` runs RSD Game-Maker games from their original DOS files in a browser. It is the same TypeScript engine used by the Game-Maker: Sandbox Edition web player. The package includes its audio worklet and TypeScript declarations; it does not include games or the site's editor and catalog.

Build a tarball from this repository with `cd web/packages/engine && npm pack`. The package has not been published to the npm registry. Install the tarball with `npm install ./lewismoten-gamemaker-sandbox-engine-3.1.0.tgz`.

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

The source is MIT licensed; see `LICENSE` and `NOTICE.md` for credits.

## Publishing

The [release workflow](../../../.github/workflows/publish-engine.yml) publishes this package to
GitHub Packages when an `engine-v<version>` tag is pushed. The tagged commit must be on
`master`, and `<version>` must exactly match this package's `package.json` (for example,
`engine-v3.1.0`). Merge the package changes to `master` before pushing the tag.

The workflow uses GitHub's `GITHUB_TOKEN` with package write permission. It checks the source,
builds the package, and publishes it to GitHub Packages. No package is published by ordinary
branch pushes. Publishing to npm is a separate, manual decision; this workflow does not use
an npm token.
