// Reviewed challenge content and fresh-start contract; no catalog or player-state reads.
export const BACKYARD = Object.freeze({
  game: 'teddy',
  version: '1.4',
  hash: '6cdab4a8284008ef4337ae6916b924d9c0bfc24c1e254cd0e627d797e87b60a4',
  scene: 2,
  start: 'backyard-fresh-v1',
  rules: 'relay-untimed-v1',
  target: 'reach-maple-street',
});

/** Declarative only: a future runner must implement and verify this before offering Start. */
export const BACKYARD_START = Object.freeze({
  gam: 'teddy.gam',
  scene: 2,
  x: 6,
  y: 39,
  seed: 1,
  state: 'New Play from the pristine disk; character defaults; no save or high-score overlays.',
  rules: 'Untimed cooperative stage. Hints and retries allowed. Swap at the fedora using F2; stop on arrival at Maple Street.',
  finish: 'Leave the backyard through its normal exit; allow the complete drive clip and next introduction to finish.',
  result: 'Manually observed completion; no verified score or time claim.',
});
