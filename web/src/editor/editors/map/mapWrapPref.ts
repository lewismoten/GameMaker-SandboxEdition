// The map editor's Wrap toggle, remembered per map in the project's companion ("wrap" extra of the
// map file). A map never toggled follows the last choice made anywhere (the global preference);
// a Look-inside (read-only) game is never written to.
interface WrapProject {
  readOnly?: unknown;
  extras<T>(file: string, section: string, fallback: T): T;
  setExtras(file: string, section: string, value: unknown): void;
}

/** Whether this map opens wrapped: its own saved choice, else `globalPref`. */
export function wrapFor(project: WrapProject, file: string, globalPref: boolean): boolean {
  const own = project.extras<unknown>(file, 'wrap', undefined);
  return typeof own === 'boolean' ? own : globalPref;
}

/** Keeps this map's choice (nothing is written for a read-only project). */
export function rememberWrap(project: WrapProject, file: string, on: boolean): void {
  if (!project.readOnly) project.setExtras(file, 'wrap', on);
}
