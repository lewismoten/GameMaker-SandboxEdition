// The DOS player panel's presets, after what 1990s authors did to their players with a hex
// editor: A-J Games' Builder blanked the menu and high-score words (its menu picture carries its
// own), and A-J Games' Rōdïp renamed the status words to fit its story.
import type { PlayerPatches } from './patchRules';

interface PlayerPreset {
  id: string;
  label: string;
  /** Patches this preset sets (null: remove them all). */
  patches: PlayerPatches | null;
}

const blank = (ids: string[]): PlayerPatches => Object.fromEntries(ids.map((id) => [id, '']));

export const PLAYER_PRESETS: PlayerPreset[] = [
  {
    id: 'builder',
    label: 'Blank the menu words (as Builder did)',
    patches: blank([
      'str.menu.play',
      'str.menu.instructions',
      'str.menu.storyline',
      'str.menu.credits',
      'str.menu.highScores',
      'str.menu.quit',
      'str.hiscore.title',
      'str.hiscore.anyKey',
    ]),
  },
  {
    id: 'rodip',
    label: 'Rename the status words (as Rōdïp did)',
    patches: { 'str.invent.hitpoints': 'Energy:    %d', 'str.invent.lives': 'Failsafes: %d', ...blank(['str.hiscore.title', 'str.hiscore.anyKey']) },
  },
  { id: 'reset', label: 'Reset all', patches: null },
];
