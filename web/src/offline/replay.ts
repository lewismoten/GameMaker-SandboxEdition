// Is this page a Wayback Machine replay? Detected only by the replay's own markers: the globals its
// injected script (wombat) defines, or an address under /web/<14 digit timestamp>/. A replay has no
// service workers, only the files that were saved, and a notice that fits: see offline.ts.

/** True in an archive replay; false on any normal host (a few property checks, nothing else). */
export function inArchiveReplay(): boolean {
  const w = window as unknown as Record<string, unknown>;
  // wombat rewrites location to the original address, so the module's own address counts too
  return '__wm' in w || '_WBWombat' in w || /\/web\/\d{14}[a-z_]{0,3}\//.test(import.meta.url);
}

/** The calm one-line note for a part the archive did not save. */
export const REPLAY_MISSING = "This is an archived copy; some parts weren't saved.";
