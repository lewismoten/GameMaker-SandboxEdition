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

## Read a game file in Node.js

The format modules need no browser. This reads a `.GAM` file from the original CD (run it from the repository root) and lists its scene titles:

```ts
import { readFileSync } from 'node:fs';
import { parseGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { fromCp437 } from '@lewismoten/gamemaker-sandbox-engine/text/cp437';

const game = parseGame(readFileSync('cd/gameware/peach/peach.gam'));
console.log(`${game.scenes.length} scenes: ${game.scenes.slice(2, 4).map((s) => fromCp437(s.desc)).join(' and ')}`);
// prints: 20 scenes: Grasslands 1 and Grasslands 2
```

A test (`web/test/readmeExamples.test.ts`) runs this block in Node against the built package and compares what it prints with the `// prints:` line.

Parsed descriptions are DOS byte strings, not Unicode. For a game name outside DOS use
`gameTitle(game)` from `formats/game`: it decodes CP437 and trims decorative menu frames.
For other DOS labels use `fromCp437`; for DOS text-file bytes use `cp437Text` from `text/cp437`,
which retains ASCII controls so the caller can handle line endings and DOS EOF. Neither API
is for already decoded Unicode, JSON, HTML or UTF-8 text. Keep the parsed fields and original
bytes for DOS rendering and round trips; convert only at the presentation boundary.

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

Hosts can call `machine.audio.setSoundCard(enabled)` to change the optional sound-card
output during play. Removing it pauses FM and cuts digital effects without stopping the
PC speaker. Restoring it resumes the loaded song, or starts the latest song requested
while absent. `soundCardEnabled` reports the current card state; returning the card
preserves a disabled music preference. An explicit song stop remains stopped. Normal DOS-compatible startup
behavior is unchanged unless the host opts into live card control.
Set the audio card state before `runGame` and call the same method for later switches;
effects then use the PC speaker while the card is absent. `RunOptions.noSoundCard` retains
the original startup-only detection, including its fixed speaker-only choice for that run.

## Incremental picture decoding

`formats/jpeg` exports `decodePartialJpeg(bytes)` for baseline and progressive Huffman JPEGs.
Pass only the bytes received so far. `shown` marks pixels with completed luminance/DC blocks;
`pixels` holds grayscale or RGB data. A partial first progressive scan reveals only its
completed blocks; later scans retain the previous coefficients until each MCU is complete.
Restart markers preserve already decoded MCUs. `scans` counts fully delimited scans and
`complete` reports an end-of-image marker. The decoder does not invent data for unread blocks.

`RunOptions.onLifeLost` observes each player death, including the final life.
`onPlayEnd(score, how, gained)` reports `won`, `lost`, or `quit` once a play ends.
Neither callback runs during demo or walkthrough playback. These callbacks do not
change DOS gameplay or the game files.

`Machine.onItem` is an observer hook: `showGraphic` calls it as each picture, cartoon, text page or slide list begins (the walkthrough player's item marks). It never changes timing or behavior.

## Subpath exports

Everything is also importable from its own subpath, for example `import { parseBlocks } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks'`, so a Node script or a bundler can take one module without the player:

- `formats/*`: readers and writers for the DOS files: `blocks`, `character`, `cmf`, `cmfEdit`, `cmfPreview`, `cmfSong`, `fli`, `fliFrames`, `fliLimits`, `game`, `gif`, `gifProgressive`, `graphicScripts`, `highscore`, `jpeg`, `map`, `monster`, `palette`, `recording`, `sound`, `voc`, and `binary` (byte helpers).
- `engine/*`: the PLAYGAME port: `machine`, `game`, `world`, `scene`, `scroll`, `render`, `showGraphic`, `menus`, `monsters`, `character`, `keys`, `funcKeys`, `touch`, `recorder`, `playGain`, `playerLook`, `slowPc`.
- `audio/*`: OPL2 and CMF playback: `opl`, `cmfPlayer`, `cmfLoad`, `engine`, `mix`, `output`, `context`.
- `gfx/*`: `screen`, `font8x8`, `cp437Glyphs`, `colorVision` (color-vision simulation matrices); `text/cp437`.
- `input/*`: `keyboard`, `scancodes`, `chords`, `deskMouse`.
- `core/gameFiles` (`GameFiles`) and `player/*` (`fileExtensions`, `patchRules`, `patchTable`).

## Supported environments

Playback needs a browser with canvas, Web Audio and keyboard events (the `Machine` class owns them). The file-format, decoding and simulation modules have no DOM dependency and also run in Node.js 22.12 or later, which is the version the package declares in `engines`. It ships as ES modules with TypeScript declarations.

## Developing

This package's source lives in [the project's repository](https://github.com/lewismoten/GameMaker-SandboxEdition), in `web/packages/engine`. The folder holds all its source in `src/`, plus its build configuration, license and notices. It can be copied outside the repository: run `npm install` and `npm run verify` there to build and test a packed consumer. Inside the repository, run `npm ci` at the root, then `npm run build -w @lewismoten/gamemaker-sandbox-engine`. Run `npm pack` in the package folder to inspect a local distribution. Tarballs are build artifacts and should not be committed. The [monorepo guide](https://github.com/lewismoten/GameMaker-SandboxEdition/blob/master/docs/monorepo.md) covers the workspace layout, and the [package release guide](https://github.com/lewismoten/GameMaker-SandboxEdition/blob/master/docs/package-releases.md) covers publishing.
