// Validate the sequence of scene entries from the title demo.
export function talksToPipOnce(trail: readonly number[]): boolean {
  return trail.filter((scene) => scene === 4).length === 1;
}
