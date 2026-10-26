// The DOS player dialog's tabs: one per screen XFERPLAY draws (the main menu, the high scores,
// F2's status and so on), then the F-keys and the player's shared colors. Each tab holds every
// patch of its screen, in sections by kind: words, positions, frames, colors, then times.
import { PATCHES, type PatchEntry, type PatchGroup, type PatchScreen } from '../../../../dosPlayer/patchTable';

export interface ScreenTab {
  screen: PatchScreen;
  label: string;
}

/** The tabs, in the order a player meets the screens. */
export const SCREEN_TABS: ScreenTab[] = [
  { screen: 'menu', label: 'Main menu' },
  { screen: 'text', label: 'Text pages' },
  { screen: 'hiscores', label: 'High scores' },
  { screen: 'newHiscore', label: 'New high score' },
  { screen: 'status', label: 'Status (F2)' },
  { screen: 'drop', label: 'Drop picker' },
  { screen: 'save', label: 'Save (F5)' },
  { screen: 'load', label: 'Load (F6)' },
  { screen: 'help', label: 'Help (F1)' },
  { screen: 'about', label: 'About (F10)' },
  { screen: 'missing', label: 'Missing files' },
  { screen: 'play', label: 'F-keys' },
  { screen: 'all', label: 'Colors' },
];

const SECTIONS: [PatchGroup, string][] = [
  ['words', 'Words'],
  ['positions', 'Positions'],
  ['frames', 'Frames'],
  ['colors', 'Colors'],
  ['times', 'Times'],
  ['keys', 'Keys'],
];

export interface ScreenSection {
  group: PatchGroup;
  label: string;
  entries: PatchEntry[];
}

/** A screen's patches by kind, in table order within each; kinds it has none of are left out. */
export function screenSections(screen: PatchScreen): ScreenSection[] {
  const mine = PATCHES.filter((e) => e.screen === screen);
  return SECTIONS.map(([group, label]) => ({ group, label, entries: mine.filter((e) => e.group === group) })).filter((s) => s.entries.length);
}
