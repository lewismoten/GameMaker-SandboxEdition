// The text "Copy error details" puts on the clipboard: the message, the build, the route, the
// browser's name and the screen size. Nothing else (no stack with file paths of the player's own
// files, no game contents, no storage). It is only copied when the player presses the button.

export interface ErrorInfo {
  message: string;
  /** Where in the site's own code it happened, e.g. "main.js:1:2". */
  at?: string;
}

/** A short browser name from the user agent (the name only, no version or system). */
export function browserName(ua: string): string {
  if (/Edg\//.test(ua)) return 'Edge';
  if (/OPR\/|Opera/.test(ua)) return 'Opera';
  if (/Firefox\/|FxiOS/.test(ua)) return 'Firefox';
  if (/Chrome\/|CriOS/.test(ua)) return 'Chrome';
  if (/Safari\//.test(ua)) return 'Safari';
  return 'unknown';
}

/** A readable message from whatever was thrown or rejected. */
export function messageOf(reason: unknown): string {
  if (reason instanceof Error) return reason.message || reason.name;
  if (typeof reason === 'string') return reason;
  return 'Something went wrong';
}

export interface Env {
  commit?: string;
  href: string;
  userAgent: string;
  width: number;
  height: number;
}

export function currentEnv(): Env {
  return {
    commit: import.meta.env.VITE_COMMIT as string | undefined,
    href: location.href,
    userAgent: navigator.userAgent,
    width: innerWidth,
    height: innerHeight,
  };
}

/** The route is the page and its hash; the query string is left out (it can name a link's source). */
export function routeOf(href: string): string {
  try {
    const u = new URL(href);
    return u.pathname + u.hash;
  } catch {
    return '';
  }
}

export function formatDetails(info: ErrorInfo, env: Env): string {
  return [
    `Error: ${info.message.slice(0, 500)}`,
    info.at ? `At: ${info.at}` : '',
    `Build: ${env.commit ? env.commit.slice(0, 9) : 'unknown'}`,
    `Route: ${routeOf(env.href)}`,
    `Browser: ${browserName(env.userAgent)}`,
    `Screen: ${env.width}x${env.height}`,
  ]
    .filter(Boolean)
    .join('\n');
}

/** True when the clipboard took the text; false when it is missing or refuses (iOS often does). */
export async function copyText(text: string, clipboard: { writeText: (t: string) => Promise<void> } | undefined): Promise<boolean> {
  try {
    if (!clipboard) return false;
    await clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
