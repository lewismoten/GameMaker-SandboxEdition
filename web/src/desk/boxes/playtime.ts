// How long a game takes, for the "Over N hours of gameplay!" burst on its box (about.json
// box.hours, drawn by gameBox.ts). Every game's claim comes from its walkthrough (the bot's
// perfect run, games/<id>/walkthrough.json) by one shared scale, so the claims keep the games'
// lengths relative to one another: a game whose walkthrough plays 30 minutes claims six times
// the hours of one that plays 5. games/kit/playtime.ts writes the figures.

/** Chapters that are watched, not played: the title cartoon, the story, the ending and the credits. */
export const NOT_PLAY = /^(Opening|Story|Ending|Credits)$/;

/**
 * Claimed minutes of play per minute of the walkthrough. A first-time player wanders, dies,
 * reads the signs and replays a level; 25 lands the median game (about 7 walkthrough minutes)
 * on 3 hours, the figure most of the boxes printed before the walkthroughs existed.
 */
export const PLAY_SCALE = 25;

export interface Timeline {
  fps: number;
  frames: number;
  chapters: { title: string; frame: number }[];
}

/** Minutes of the walkthrough spent playing levels (every chapter but NOT_PLAY ones). */
export function playMinutes(t: Timeline): number {
  let frames = 0;
  t.chapters.forEach((c, i) => {
    if (NOT_PLAY.test(c.title)) return;
    frames += (t.chapters[i + 1]?.frame ?? t.frames) - c.frame;
  });
  return frames / t.fps / 60;
}

/** The hours a box claims for a game whose walkthrough plays this many minutes: round(minutes × PLAY_SCALE / 60), at least 1. */
export function claimedHours(minutes: number): number {
  return Math.max(1, Math.round((minutes * PLAY_SCALE) / 60));
}
