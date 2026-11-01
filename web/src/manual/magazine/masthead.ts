// The magazine's name, its two issues and the cover price (in-story: every page here is free
// to read). Vol. is the year (1993 = Vol. 1) and No. the month, so No. 1 below is Vol. 1,
// No. 4 (April 1993) and No. 2 is Vol. 3, No. 1 (January 1995, the one on the 1994 desk).

/** One issue of the magazine: how it is addressed (open=turbobutton&vol=3&num=1) and what it calls itself. */
export interface MagIssue {
  /** Which of the two this is: 1 (a back issue) or 2 (the one on the desk). */
  which: 1 | 2;
  vol: number;
  num: number;
  /** The line printed under the masthead and in every folio. */
  issue: string;
  /** The date part alone (the CD label, the cover's season). */
  date: string;
  /** The month the cover is dated, as the cover prints it. */
  cover: string;
}

export const ISSUES: Record<1 | 2, MagIssue> = {
  1: { which: 1, vol: 1, num: 4, issue: 'Vol. 1, No. 4 · Spring 1993', date: 'April 1993', cover: 'Spring 1993' },
  2: { which: 2, vol: 3, num: 1, issue: 'Collector’s Issue · Vol. 3, No. 1 · January 1995', date: 'January 1995', cover: 'January 1995' },
};

/**
 * The issue an address names. The old address (vol=1&num=1, from before there were two) and an
 * address with no issue open No. 2, the one on the desk.
 */
export function issueFor(vol?: number | null, num?: number | null): MagIssue {
  return vol === ISSUES[1].vol && num === ISSUES[1].num ? ISSUES[1] : ISSUES[2];
}

/** The magazine's own words and price, and the issue lying on the desk (No. 2). */
export const MAG = {
  name: 'TURBO BUTTON',
  tagline: 'The Shareware Gamer’s Monthly',
  issue: ISSUES[2].issue,
  vol: ISSUES[2].vol,
  num: ISSUES[2].num,
  price: '$4.95 US · $5.95 CAN',
} as const;
