// Leftover games in a zip: a .gam missing files, in a folder of its own, beside a whole game
// in the same zip (a test level, or an old copy the author left in). The import chooser
// lists it unticked with its missing-file count, as it does a leftover sharing a folder with
// the real game (importScan.ts); it can still be ticked. Loose folders are left alone: a
// folder of many games is many downloads, not one. No DOM.
import type { FoundGame } from './importScan';

const zipOf = (g: FoundGame) => (g.zips.length ? [g.zips[0].path, ...g.inner].join('\n') : undefined);

/** The .gam a found game plays, in capitals: "ADVTEST.GAM". */
function gamName(g: FoundGame): string {
  const gam = g.gam ?? g.paths.filter((p) => /\.gam$/i.test(p)).sort()[0];
  return (gam ? gam.slice(gam.replace(/\\/g, '/').lastIndexOf('/') + 1) : g.name).toUpperCase();
}

/** The games, those missing files beside a whole game of the same zip marked as leftovers. */
export function markZipLeftovers(games: FoundGame[]): FoundGame[] {
  const whole = new Set(games.filter((g) => !g.missing && !g.leftover).map(zipOf));
  return games.map((g) => {
    const zip = zipOf(g);
    if (!zip || !g.missing || g.leftover || !whole.has(zip)) return g;
    return { ...g, leftover: `${gamName(g)}: ${g.missing} of its files ${g.missing === 1 ? 'isn’t' : 'aren’t'} in the zip` };
  });
}
