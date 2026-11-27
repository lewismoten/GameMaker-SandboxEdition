/** Thrown where a change was refused, so the rest of that change (a rename's delete, say) never runs. */
export class ReadOnlyError extends Error {
  constructor(what: string) {
    super(`This game is open to look at only: ${what} was not changed.`);
    this.name = 'ReadOnlyError';
  }
}
