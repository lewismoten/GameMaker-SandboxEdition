// Dev server on localhost only, opt in: a log of how the maintainer uses the site, sent to the dev
// server (scripts/devLog.ts) so Claude can see what was looked at, whether anyone is at the page,
// and every JavaScript error. A small switch in the bottom-left corner (🙈 off, 🐵 on) turns it on or off and is remembered.
// It records the screen and window size, the pointer (a few times a second), clicks (what was
// clicked), keys (outside text fields only; inside one, just that typing happened), the page
// route, scrolling, slow paints (LCP), slow clicks to the next paint (INP), long tasks and errors.
// After IDLE_MS with no mouse or keyboard it stops until the next mouse or key (or a reload).
const KEY = 'gm-dev-log';
const ROUTE = '/__gm-devlog';
const IDLE_MS = 5 * 60_000;
const POINTER_MS = 250;
const FLUSH_MS = 5000;

type Entry = Record<string, unknown> & { t: number; kind: string };

let on = false;
let idle = false;
let queue: Entry[] = [];
let lastInput = Date.now();
let lastPointer = 0;
const session = Math.random().toString(36).slice(2, 10);

function stored(): boolean {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

function log(kind: string, data: Record<string, unknown> = {}, always = false): void {
  if (!on || (idle && !always)) return;
  queue.push({ t: Date.now(), kind, session, route: location.hash || '#/', ...data });
  if (queue.length > 2000) queue = queue.slice(-1000);
}

function flush(beacon = false): void {
  if (!queue.length) return;
  const body = JSON.stringify(queue);
  queue = [];
  if (beacon && navigator.sendBeacon) navigator.sendBeacon(ROUTE, new Blob([body], { type: 'application/json' }));
  else void fetch(ROUTE, { method: 'POST', body, headers: { 'Content-Type': 'application/json' }, keepalive: true }).catch(() => undefined);
}

/** A short, readable name for what was clicked. */
function describe(el: Element | null): string {
  if (!el) return '';
  const target = el.closest('button, a, [role], input, select, textarea, label, canvas, summary') ?? el;
  const name = target.getAttribute('aria-label') ?? target.getAttribute('title') ?? (target.textContent ?? '').trim();
  const id = target.id ? `#${target.id}` : '';
  const role = target.getAttribute('role');
  return `${target.tagName.toLowerCase()}${id}${role ? `[${role}]` : ''} ${name.replace(/\s+/g, ' ').slice(0, 60)}`.trim();
}

const typing = (el: EventTarget | null) => el instanceof HTMLElement && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));

function sizes(): Record<string, unknown> {
  return { screen: [screen.width, screen.height], window: [innerWidth, innerHeight], dpr: devicePixelRatio };
}

/** Mouse or key: counts as someone being here (wakes an idle log). */
function input(): void {
  lastInput = Date.now();
  if (idle) {
    idle = false;
    log('back', sizes());
  }
}

function watchPerformance(): void {
  const watch = (type: string, fn: (e: PerformanceEntry) => void, extra: Record<string, unknown> = {}) => {
    try {
      new PerformanceObserver((l) => l.getEntries().forEach(fn)).observe({ type, buffered: true, ...extra });
    } catch {
      // not in this browser
    }
  };
  watch('largest-contentful-paint', (e) => log('lcp', { ms: Math.round(e.startTime) }, true));
  watch(
    'event',
    (e) => {
      if (e.duration >= 200) log('slow-interaction', { ms: Math.round(e.duration), event: e.name }, true);
    },
    { durationThreshold: 200 },
  );
  watch('longtask', (e) => {
    if (e.duration >= 200) log('long-task', { ms: Math.round(e.duration) }, true);
  });
}

function toggle(): HTMLButtonElement {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'dev-log-toggle';
  const paint = () => {
    b.textContent = on ? '🐵' : '🙈';
    b.title = on
      ? 'Dev only: your clicks, pointer and errors are logged to .for-lewis/debug (click to stop)'
      : 'Dev only: log your clicks, pointer and errors to .for-lewis/debug for Claude to review';
    b.setAttribute('aria-pressed', String(on));
  };
  b.setAttribute('aria-label', 'Dev log of this session');
  // a 24 px emoji in the corner, faint until pointed at (demo recordings and other controls share it)
  Object.assign(b.style, {
    position: 'fixed',
    left: '2px',
    bottom: '2px',
    zIndex: '2147483000',
    width: '24px',
    height: '24px',
    padding: '0',
    font: '14px/24px system-ui, sans-serif',
    border: '0',
    background: 'transparent',
    cursor: 'pointer',
    opacity: '0.45',
  });
  b.onpointerenter = b.onfocus = () => (b.style.opacity = '1');
  b.onpointerleave = b.onblur = () => (b.style.opacity = '0.45');
  b.onclick = () => {
    on = !on;
    try {
      localStorage.setItem(KEY, on ? '1' : '0');
    } catch {
      // private window: on until the page closes
    }
    if (on) {
      idle = false;
      lastInput = Date.now();
      log('start', { ...sizes(), agent: navigator.userAgent });
    } else flush();
    paint();
  };
  paint();
  return b;
}

/** Starts the switch and, when it was left on, the log. Only on a localhost dev server. */
export function startInteractionLog(): void {
  if (!['localhost', '127.0.0.1', '[::1]'].includes(location.hostname)) return;
  on = stored();
  document.body.append(toggle());
  if (on) log('start', { ...sizes(), agent: navigator.userAgent });
  watchPerformance();
  addEventListener(
    'pointermove',
    (e: PointerEvent) => {
      input();
      const now = Date.now();
      if (now - lastPointer < POINTER_MS) return;
      lastPointer = now;
      log('pointer', { x: e.clientX, y: e.clientY });
    },
    { passive: true },
  );
  addEventListener(
    'pointerdown',
    (e: PointerEvent) => {
      input();
      log('click', { x: e.clientX, y: e.clientY, button: e.button, on: describe(e.target as Element) });
    },
    { capture: true, passive: true },
  );
  addEventListener(
    'keydown',
    (e: KeyboardEvent) => {
      input();
      log('key', typing(e.target) ? { typing: true } : { key: e.key, ctrl: e.ctrlKey || e.metaKey || undefined, shift: e.shiftKey || undefined });
    },
    { capture: true },
  );
  addEventListener('wheel', () => input(), { passive: true });
  let scrolled = 0;
  addEventListener(
    'scroll',
    () => {
      if (Date.now() - scrolled < 500) return;
      scrolled = Date.now();
      log('scroll', { y: Math.round(scrollY) });
    },
    { passive: true, capture: true },
  );
  addEventListener('resize', () => log('resize', sizes()));
  addEventListener('hashchange', () => log('route', { to: location.hash }));
  document.addEventListener('visibilitychange', () => log('visibility', { state: document.visibilityState }, true));
  addEventListener('error', (e) =>
    log('error', { message: e.message, at: `${e.filename}:${e.lineno}:${e.colno}`, stack: (e.error as Error | undefined)?.stack?.slice(0, 2000) }, true),
  );
  addEventListener('unhandledrejection', (e) => {
    const r = e.reason as { message?: string; stack?: string } | undefined;
    log('error', { message: `Unhandled rejection: ${r?.message ?? String(e.reason)}`, stack: r?.stack?.slice(0, 2000) }, true);
  });
  setInterval(() => {
    if (on && !idle && Date.now() - lastInput > IDLE_MS) {
      log('idle', { quietMs: Date.now() - lastInput });
      idle = true;
    }
    flush();
  }, FLUSH_MS);
  addEventListener('pagehide', () => flush(true));
}
