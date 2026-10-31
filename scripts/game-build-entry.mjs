// Runs one game's build.ts under vite-node and then exits at once: `vite-node ../scripts/game-build-entry.mjs <id>`.
// vite-node sometimes stays alive after the build is done (its esbuild helper keeps the loop open); the build job
// then waited out its whole timeout. Everything build.ts does is awaited before the import resolves.
const id = process.argv[2];
if (!/^[a-z0-9]+$/.test(id ?? '')) throw new Error('Give a game id.');
await import(`../games/${id}/build.ts`);
await new Promise((done) => process.stdout.write('', done));
process.exit(0);
