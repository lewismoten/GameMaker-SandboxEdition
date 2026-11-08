// The BIOS ID string along the bottom of the POST screen, as 1990s BIOSes printed one: a date,
// the chipset and a board code nobody reads. Its board code is the first 8 hex digits of the git
// commit the site was built from (VITE_COMMIT, set in vite.config.ts); git takes them uppercase.

/** The ID line, e.g. `07/21/93-AWK-486DX2-A1F9A5C5-00`; zeros when the commit isn't known. */
export function biosId(commit: string | undefined = import.meta.env.VITE_COMMIT as string | undefined): string {
  const code = /^[0-9a-f]{8}/i.exec(commit ?? '')?.[0].toUpperCase() ?? '00000000';
  return `07/21/93-AWK-486DX2-${code}-00`;
}
