// When a game in My games was last edited, said the way people say it: "today",
// "yesterday", a weekday within the week, then the date.
const DAY = 86_400_000;

export function editedWhen(updated: number, now = Date.now(), locale?: string): string {
  const start = (t: number) => {
    const d = new Date(t);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  };
  const days = Math.round((start(now) - start(updated)) / DAY);
  if (days <= 0) return 'Edited today';
  if (days === 1) return 'Edited yesterday';
  const d = new Date(updated);
  if (days < 7) return `Edited ${d.toLocaleDateString(locale, { weekday: 'long' })}`;
  const sameYear = d.getFullYear() === new Date(now).getFullYear();
  return `Edited ${d.toLocaleDateString(locale, sameYear ? { month: 'short', day: 'numeric' } : { month: 'short', day: 'numeric', year: 'numeric' })}`;
}
