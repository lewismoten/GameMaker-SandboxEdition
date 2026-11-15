// Public tier identifiers and per-file integrity metadata, shared by build and browser.
export const offlineTiers = {
  core: 'Core',
  games: 'Games',
  feelies: 'Feelies & library',
  speech: 'Spoken tour & phone',
  hardware: 'Hardware & native exports',
} as const;
export type OfflineTier = keyof typeof offlineTiers;
export interface OfflineFile {
  path: string;
  wire: number;
  stored: number;
  sha256: string;
  tier: OfflineTier;
}
export interface OfflineManifest {
  version: string;
  shell: string[];
  files: OfflineFile[];
}
export function selectedFiles(files: OfflineFile[], tiers: OfflineTier[]): OfflineFile[] {
  return files.filter((f) => f.tier === 'core' || tiers.includes(f.tier));
}
export function tierOf(path: string): OfflineTier {
  if (/^(pocket|mac|win|linux)\//.test(path)) return 'hardware';
  if (/^(tour\/.*\.ogg$|phone\/voice\/.*\.ogg$)/.test(path)) return 'speech';
  if (/^(trinkets|laser|magazine|ultimate|credits|extras|cast|videos)\//.test(path)) return 'feelies';
  if (/^games\/(shared\/|.*\.(zip|zpart|gmpak)$|.*\/walkthrough\.json\.gz$)/.test(path)) return 'games';
  return 'core';
}
