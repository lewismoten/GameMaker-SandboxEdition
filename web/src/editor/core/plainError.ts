// What went wrong, in words a player understands: a failed download or a full browser are
// said plainly instead of as "Failed to fetch" or "QuotaExceededError"; our own messages
// (already plain) pass through.
export function plainError(e: unknown): string {
  const err = e instanceof Error ? e : new Error(String(e));
  const msg = err.message;
  if (err.name === 'QuotaExceededError' || /quota/i.test(msg))
    return 'This browser has run out of room for saved games. Download a .zip of the games you want to keep, delete a few, and try again.';
  if (err.name === 'AbortError') return 'Stopped before it finished.';
  if ((err.name === 'TypeError' && /fetch|network|load failed/i.test(msg)) || /^NetworkError/i.test(msg))
    return 'A download didn’t get through. Check the internet connection and try again.';
  const status = /^Could not fetch \S+ \((\d+)\)/.exec(msg);
  if (status) return `A file it needs couldn’t be downloaded (error ${status[1]}). Reload the page and try again.`;
  return msg || 'Something went wrong.';
}
