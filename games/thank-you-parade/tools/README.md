# The Thank-You Parade tools

From the repository root, build the parade disk with `npm run build:games -- --game thank-you-parade`. Run the following commands from `web/`.

| Command                                                                           | Result                                                                                                                 |
| --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `npx vite-node ../games/thank-you-parade/tools/check.ts`                          | Checks for invisible walls and plays every level without losing a life. Set `BOT_LOG=1` for step-by-step output.       |
| `npx vite-node ../games/thank-you-parade/tools/walkthrough.ts`                    | Replays the bot route and rewrites the game's tracked `walkthrough.json`.                                              |
| `npx vite-node ../games/thank-you-parade/tools/shots.ts <outDir>`                 | Writes selected game screenshots, including the title and cartoon frames.                                              |
| `npx vite-node ../games/thank-you-parade/tools/levelShots.ts <outDir> [file ...]` | Writes a PNG of each whole level with monsters. Pass level file names to select individual maps.                       |
| `npx vite-node ../games/thank-you-parade/tools/preview.ts <outDir>`               | Writes design previews, including block sheets, maps, disk pictures and the Penny and Marge pose sheet (`heroes.png`). |
