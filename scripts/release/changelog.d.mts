export const REPO: string;
export function extractSection(text: string, version: string): string | null;
export function latestVersion(text: string): string | null;
export function hasNoChanges(section: string | null): boolean;
export function cutRelease(text: string, opts: { version: string; date: string; prefix: string }): string;
