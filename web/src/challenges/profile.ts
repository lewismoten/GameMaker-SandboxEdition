// Reviewed challenge content and fresh-start contract; no catalog or player-state reads.
export const BACKYARD = Object.freeze({
  game: 'teddy',
  version: '1.3',
  hash: '17ea01fcd9e974f9b8ed68b7aa95780b6b7da4f90f8046db2e80275e9af5d27b',
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
