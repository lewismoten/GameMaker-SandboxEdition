// What a game health check reports (an Issue), what it reads (a FileSource) and the few
// helpers the home page's badge needs before any check runs, apart from the check itself
// (health.ts), so a page that shows a badge loads the file readers only when it checks.

export type Severity = 'error' | 'warning';

export interface Issue {
  severity: Severity;
  /** What kind of problem, for grouping in the report. */
  kind: 'missing' | 'link' | 'name' | 'empty' | 'unreadable' | 'game' | 'dos';
  /** The file the problem is in or about. */
  file?: string;
  message: string;
}

/** What the check needs to know about a game's files. Contents may be partial (see `get`). */
export interface FileSource {
  names(): string[];
  /** Contents, when known. A quick check only loads the .gam, .lst and .bkd files. */
  get(name: string): Uint8Array | undefined;
  /** Size in bytes, when known without loading. */
  byteSize?(name: string): number | undefined;
}

/** The files a game might need to be checked quickly: the .gam and graphic scripts. */
export const QUICK_CHECK_FILE = /\.(gam|lst|bkd)$/i;

export function worstSeverity(issues: Issue[]): Severity | undefined {
  return issues.some((i) => i.severity === 'error') ? 'error' : issues.length ? 'warning' : undefined;
}
