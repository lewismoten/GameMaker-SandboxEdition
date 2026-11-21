// Public file name and cached FLI encoding for the Sandbox Software logo sting.
import { existsSync, readFileSync } from 'node:fs';
import { encodeFli } from '@lewismoten/gamemaker-sandbox-engine/formats/fli';
import { sandLogoFrames } from './sandlogo/frames';

/** The logo's file name on every disk. */
export const SANDLOGO = 'sandlogo.fli';

let fli: Uint8Array | undefined;

/** SANDLOGO.FLI: the sting as an Autodesk Animator FLI (its own palette, delta frames). */
export function sandLogoFli(): Uint8Array {
  // build-games.mjs renders the sting once (scripts/logo-build-entry.mjs) and every game's build reads that file
  const shared = process.env.SANDLOGO_FLI;
  if (!fli && shared && existsSync(shared)) fli = new Uint8Array(readFileSync(shared));
  if (!fli) {
    const { frames, palettes, palette, speed } = sandLogoFrames();
    fli = encodeFli(frames, palette, { speed, palettes });
  }
  return fli;
}
