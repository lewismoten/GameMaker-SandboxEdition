// Judges a replay of the Corner View title demo: no replay error, scenes 2 3 4 1, every key played.
// A replay error (WalkRun catches one thrown by the engine) fails the check even when the scenes and keys look right.
export interface DemoReplay {
  scenes: number[];
  keysLeft: number;
  error?: unknown;
}

/** The reason the demo fails, or undefined when it passes. */
export function judgeDemo(r: DemoReplay): string | undefined {
  if (r.error) return `the replay stopped on an error: ${r.error instanceof Error ? (r.error.stack ?? r.error.message) : String(r.error)}`;
  const seen = r.scenes.slice(0, 4).join(' ');
  if (seen !== '2 3 4 1' || r.keysLeft) {
    return `expected scenes 2 3 4 1 (three levels, the ending) with every key played; got ${seen} with ${r.keysLeft} keys unplayed`;
  }
  return undefined;
}
