// Choosing between two routes through a scene when it has walking paths (walkPaths.ts): the
// bot's quickest one and one found keeping to the paths. A person walks along the road even
// when cutting across would be a little quicker, so the path route wins when it is more on the
// paths and costs only modestly more time; a long detour does not.

/** How a route played: its length and how much of its walking was on the paths. */
export interface RouteFit {
  /** Ticks the route takes. */
  ticks: number;
  /** Ticks the hero moved, and how many of those ended on a path block. */
  moving: number;
  onPath: number;
}

/** The path route may take this much longer than the quickest, as a share of it… */
export const PATH_SLACK = 0.5;
/** …and at least this many ticks longer (two seconds), so a short scene still has room to keep to the road. */
export const PATH_SLACK_TICKS = 36;
/** A quickest route at least this much on the paths already walks them: no second search. */
export const ON_PATH_ENOUGH = 0.9;

/** The share of a route's walking that was on the paths (1 when it never moved). */
export const pathShare = (r: Pick<RouteFit, 'moving' | 'onPath'>): number => (r.moving ? r.onPath / r.moving : 1);

/** True when the path route should be played instead of the quickest one. */
export function preferPathRoute(quickest: RouteFit, onPaths: RouteFit | undefined): boolean {
  if (!onPaths) return false;
  if (pathShare(onPaths) <= pathShare(quickest) + 0.05) return false;
  return onPaths.ticks <= Math.max(quickest.ticks * (1 + PATH_SLACK), quickest.ticks + PATH_SLACK_TICKS);
}
