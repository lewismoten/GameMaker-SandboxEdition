// Repository CYD policy: transparent penalties for the demands observed on one recorded route.
export interface CydMetrics {
  presses: number;
  spaceEnterShare: number;
  extraShare: number;
  changesPerSecond: number;
  peakChangesPerSecond: number;
  jumps: number;
  narrowJumps: number;
  narrowLandings: number;
}

export function scoreCyd(m: CydMetrics): { score: number; reasons: string[] } {
  const penalties = [
    { n: 35 * m.spaceEnterShare, reason: `${(100 * m.spaceEnterShare).toFixed(1)}% Space/Enter presses` },
    { n: 35 * m.extraShare, reason: `${(100 * m.extraShare).toFixed(1)}% extra-key presses` },
    { n: Math.min(15, 5 * m.changesPerSecond), reason: `${m.changesPerSecond.toFixed(2)} input changes/s` },
    { n: Math.min(5, Math.max(0, m.peakChangesPerSecond - 3)), reason: `${m.peakChangesPerSecond.toFixed(2)} peak changes/s` },
    { n: Math.min(25, 5 * m.narrowJumps), reason: `${m.narrowJumps} jump starts with under 3 ticks of combined early/late slack` },
    { n: Math.min(20, 2 * m.narrowLandings), reason: `${m.narrowLandings} landings on ledges at most 2 blocks wide` },
  ];
  return {
    score: Math.max(0, Math.round(100 - penalties.reduce((sum, p) => sum + p.n, 0))),
    reasons: penalties.filter((p) => p.n > 0).map((p) => p.reason),
  };
}
