// Bound intermediate live-region updates without timers that can overwrite a terminal outcome.
/** Create one per operation. Visible progress should update separately on every callback. */
export function progressAnnouncements(
  say: (text: string) => void,
  interval = 5000,
  now: () => number = () => performance.now(),
): {
  progress: (text: string) => void;
  finish: (text: string) => void;
} {
  let last = -Infinity;
  let previous: string | undefined;
  let finished = false;
  return {
    progress(text) {
      if (finished || text === previous || now() - last < interval) return;
      previous = text;
      last = now();
      say(text);
    },
    finish(text) {
      finished = true;
      say(text);
    },
  };
}
