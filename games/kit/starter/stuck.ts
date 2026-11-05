// The starter bot's "am I blocked?" rule, pure so it can be tested.
// Default: x unchanged for 3 ticks. With `jitter`: also blocked when the best x
// reached toward the goal has not improved for 6 ticks (a solid monster shoves Kit +-4 px).

export interface Stuck {
  /** Feed this tick's x; true when Kit counts as blocked. */
  update(x: number): boolean;
  /** Forget progress after a jump (the same-x memory is kept, as before). */
  reset(x: number): void;
}

export function makeStuck(startX: number, dir: 'left' | 'right', jitter = false): Stuck {
  let lastX = startX;
  let same = 0;
  let best = startX;
  let noGain = 0;
  return {
    update(x) {
      same = x === lastX ? same + 1 : 0;
      lastX = x;
      if (!jitter) return same >= 3;
      if (dir === 'right' ? x > best : x < best) {
        best = x;
        noGain = 0;
      } else noGain++;
      return same >= 3 || noGain >= 6;
    },
    reset(x) {
      same = -16;
      best = x;
      noGain = -16;
    },
  };
}
