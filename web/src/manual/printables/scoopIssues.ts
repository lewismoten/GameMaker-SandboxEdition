// When each Sandbox Software game shipped, as YYYY-MM: the month of the issue of The Sandbox
// Scoop in its box. Issue numbers follow this order (scoopIssue.ts), and each game's own
// stories (games/<id>/printables.json "news") are written for its month: the game shipping,
// "Since last issue" on the one before, "In the workshop" teasing the next one, the studio's
// news "Around the Sandbox", and Letters. Read in order, the issues tell the studio's story.

/** Each game's release month, within its about.json year, in release order. */
export const SCOOP_MONTHS: Readonly<Record<string, string>> = {
  year2000: '1992-12',
  logic: '1995-02',
  blaster: '1995-04',
  maximus: '1995-06',
  sandcast: '1995-07',
  teddy: '1995-09',
  sleuth: '1995-10',
  brief: '1995-11',
  snowbound: '1995-12',
  depth: '1996-02',
  realm: '1996-05',
  teddy2: '1996-09',
  teddy3: '1997-06',
};

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** The issue's dateline ("December 1992"); a game with no month gets its year. */
export function scoopDateline(id: string, year = 1995): string {
  const m = /^(\d{4})-(\d\d)$/.exec(SCOOP_MONTHS[id] ?? '');
  return m ? `${MONTH_NAMES[Number(m[2]) - 1]} ${m[1]}` : String(year);
}
