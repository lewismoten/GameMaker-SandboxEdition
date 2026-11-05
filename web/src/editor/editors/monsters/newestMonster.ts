// The monster "+ New monster" just made, handed to the map editor once: the map opens with that
// slot as its brush in monster mode, so placing it takes no slot hunting. Editor state only; no file changes.
const newest = new WeakMap<object, number>();

export function noteNewestMonster(project: object, slot: number): void {
  newest.set(project, slot);
}

/** The slot noted since the map last opened, or undefined. Taking it clears it. */
export function takeNewestMonster(project: object): number | undefined {
  const slot = newest.get(project);
  newest.delete(project);
  return slot;
}
