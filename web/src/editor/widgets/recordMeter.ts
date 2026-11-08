// The recording meter: how much of the 64 KB a DOS sound may take is used, with the seconds
// left, shown while the microphone records and read out for screen readers. See audio/vocLimit.ts.
import './recordMeter.css';
import { h } from '../core/ui';

interface RecordMeter {
  el: HTMLElement;
  /** Shows the room for a new recording (before it starts), in samples. */
  arm(maxSamples: number): void;
  /** Updates it as the recording grows (samples recorded so far). */
  tick(recorded: number): void;
  /** Says the recording stopped itself at the limit. */
  full(): void;
  /** Hides it. */
  hide(): void;
}

export function recordMeter(rate: number): RecordMeter {
  const bar = h('meter', { min: 0, max: 1, value: 0, 'aria-label': 'Recording time used of the 64 KB a DOS sound can take' });
  const text = h('span', { class: 'rec-meter-text' });
  const el = h('div', { class: 'rec-meter hint', role: 'group', 'aria-label': 'Recording size', hidden: true }, bar, text);
  let max = 1;
  const secs = (n: number) => `${(n / rate).toFixed(1)} s`;
  const show = (recorded: number) => {
    bar.max = max;
    bar.value = Math.min(max, recorded);
    text.textContent = `${secs(Math.max(0, max - recorded))} left of ${secs(max)} (a DOS sound must be under 64 KB)`;
  };
  return {
    el,
    arm(maxSamples) {
      max = Math.max(1, maxSamples);
      el.hidden = false;
      el.classList.remove('full');
      show(0);
    },
    tick: show,
    full() {
      el.hidden = false;
      el.classList.add('full');
      bar.value = max;
      text.textContent = `Stopped at ${secs(max)}: a DOS sound must be under 64 KB.`;
    },
    hide() {
      el.hidden = true;
    },
  };
}
