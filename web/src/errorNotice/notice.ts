// The error notice: a small bar at the bottom of the page with a plain message, "Copy error
// details" and Dismiss. Loaded only when something breaks (watch.ts imports it dynamically).
// If the Clipboard API refuses (iOS often does), the details appear in a selectable text box.
import { copyText, currentEnv, formatDetails, type ErrorInfo } from './details';

const STYLE = `
.gm-error-notice{position:fixed;left:8px;right:8px;bottom:8px;z-index:2147483000;box-sizing:border-box;max-width:560px;margin:0 auto;padding:10px 12px;background:#1d1d24;color:#fff;border:2px solid #ffd54a;border-radius:8px;font:14px/1.4 system-ui,sans-serif;box-shadow:0 4px 16px rgba(0,0,0,.5)}
.gm-error-notice p{margin:0 0 8px}
.gm-error-notice .gm-error-row{display:flex;flex-wrap:wrap;gap:8px}
.gm-error-notice button{min-height:32px;min-width:32px;padding:4px 12px;font:inherit;color:#111;background:#ffd54a;border:2px solid #ffd54a;border-radius:6px;cursor:pointer}
.gm-error-notice button.gm-error-dismiss{color:#fff;background:transparent;border-color:#fff}
.gm-error-notice button:focus-visible,.gm-error-notice textarea:focus-visible{outline:3px solid #fff;outline-offset:2px}
.gm-error-notice textarea{display:block;box-sizing:border-box;width:100%;height:7em;margin:8px 0 0;font:12px/1.3 ui-monospace,monospace;color:#111;background:#fff;border:2px solid #ffd54a}
`;

let live: HTMLElement | null = null;
let latest: ErrorInfo | null = null;

function build(): HTMLElement {
  if (!document.getElementById('gm-error-style')) {
    const s = document.createElement('style');
    s.id = 'gm-error-style';
    s.textContent = STYLE;
    document.head.append(s);
  }
  const root = document.createElement('div');
  root.className = 'gm-error-notice';
  root.setAttribute('role', 'alert');
  root.setAttribute('aria-live', 'assertive');
  const p = document.createElement('p');
  p.textContent = 'Something went wrong. You can keep going, or copy the details to tell the maker. Nothing is sent anywhere.';
  const status = document.createElement('p');
  status.setAttribute('aria-live', 'polite');
  status.className = 'gm-error-status';
  const row = document.createElement('div');
  row.className = 'gm-error-row';
  const copyBtn = document.createElement('button');
  copyBtn.type = 'button';
  copyBtn.textContent = 'Copy error details';
  const dismiss = document.createElement('button');
  dismiss.type = 'button';
  dismiss.className = 'gm-error-dismiss';
  dismiss.textContent = 'Dismiss';
  row.append(copyBtn, dismiss);
  root.append(p, status, row);
  copyBtn.addEventListener('click', () => {
    const text = formatDetails(latest ?? { message: 'Something went wrong' }, currentEnv());
    void copyText(text, navigator.clipboard).then((ok) => {
      root.querySelector('textarea')?.remove();
      if (ok) {
        status.textContent = 'Copied.';
        return;
      }
      status.textContent = 'Your browser would not copy. Select this text and copy it.';
      const box = document.createElement('textarea');
      box.readOnly = true;
      box.value = text;
      box.setAttribute('aria-label', 'Error details');
      root.append(box);
      box.focus();
      box.select();
    });
  });
  dismiss.addEventListener('click', () => {
    root.remove();
    live = null;
  });
  return root;
}

/** Shows the notice (or updates it) for the latest error. */
export function showError(info: ErrorInfo): void {
  latest = info;
  if (live?.isConnected) return;
  live = build();
  document.body.append(live);
}
