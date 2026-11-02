// Renders the Sand logo sting once for a build run: `vite-node ../scripts/logo-build-entry.mjs <out.fli>`.
// Seventeen games add the same SANDLOGO.FLI; build-games.mjs points them at this file through SANDLOGO_FLI.
import { renameSync, writeFileSync } from 'node:fs';
delete process.env.SANDLOGO_FLI;
const out = process.argv[2];
if (!out) throw new Error('Give the output file.');
const { sandLogoFli } = await import('../games/kit/sandlogo.ts');
writeFileSync(`${out}.tmp`, sandLogoFli());
renameSync(`${out}.tmp`, out);
await new Promise((done) => process.stdout.write('', done));
process.exit(0);
