// The story cartoons, by file name: the FLIs the slide lists play at the story's turns
// (screens.ts strings them in). Each is drawn in its own file.
import { beamFli } from './beam';
import { bellFli } from './bell';
import { doorFli, homeFli } from './dogHouse';
import { goldFli } from './gold';
import { starFli } from './star';

export function cartoons(): Record<string, Uint8Array> {
  return {
    'door.fli': doorFli(),
    'bell.fli': bellFli(),
    'beam.fli': beamFli(),
    'star.fli': starFli(),
    'gold.fli': goldFli(),
    'home.fli': homeFli(),
  };
}
