// The polite, dismissable notice shown when "Record the whole tour" could not start recording.
import { h } from '../editor/core/ui';
import type { AskResult } from './tourRecorder';

/** What to tell the viewer, or undefined when recording did start. */
export function recordNoticeText(r: AskResult): string | undefined {
  if (r.recorder) return undefined;
  const why = r.reason === 'unsupported' ? 'this browser cannot record the tab' : 'screen sharing was declined';
  return `Recording didn’t start: ${why}. The tour will play without recording.`;
}

/** A status line with a Dismiss button, added to the page; call `.remove()` to take it away. */
export function showRecordNotice(text: string): HTMLElement {
  const el = h(
    'div',
    { class: 'tour-notice', role: 'status' },
    h('span', null, text),
    h('button', { type: 'button', class: 'tour-notice-x', 'aria-label': 'Dismiss this notice', onclick: () => el.remove() }, 'Dismiss'),
  );
  document.body.append(el);
  return el;
}
