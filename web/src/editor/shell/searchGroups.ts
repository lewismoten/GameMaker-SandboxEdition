// The groups Overview › Files search sorts its results into, apart from searchIndex.ts so the search
// box can title them without loading the index and its parsers.
export type SearchGroup = 'files' | 'text' | 'controls' | 'player';

export const GROUP_TITLES: Record<SearchGroup, string> = {
  files: 'File names',
  text: 'Words inside files',
  controls: 'Companion notes and names',
  player: 'DOS player fields',
};
