// This graduation's themed levels with the approved shared-palette plaques.
import { buildLevels as originalLevels } from '../../kit/starter/graduationLevel';
import { microSigns } from './microSigns';
import { cfg } from './config';

export function buildLevels() {
  return microSigns(originalLevels(cfg), cfg);
}
