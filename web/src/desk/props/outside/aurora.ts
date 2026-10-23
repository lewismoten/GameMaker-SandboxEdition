// The northern lights, rippling green and violet over the hills on a clear winter night:
// soft curtains of light that sway, brighten and fade.
import { roomSound } from '../propSound';
import type { OutsideEvent } from './outside';

export const aurora: OutsideEvent = {
  kind: 'aurora',
  id: 'desk-aurora',
  label: 'The northern lights',
  when: 'night',
  ms: 16_000,
  start: () => roomSound.shimmer(6),
  draw(c, p, t) {
    const fade = Math.sin(Math.PI * p);
    c.save();
    c.globalCompositeOperation = 'lighter';
    for (const [color, base, amp, phase] of [
      ['60,255,140', 160, 26, 0],
      ['150,90,255', 136, 20, 2],
      ['80,220,200', 180, 18, 4],
    ] as const) {
      for (let x = 80; x < 320; x += 3) {
        const top = base - 60 + Math.sin(x / 34 + t / 1800 + phase) * amp;
        const bottom = base + Math.sin(x / 50 + t / 2400 + phase) * 10;
        const shine = (0.5 + 0.5 * Math.sin(x / 13 + t / 700 + phase)) * fade * 0.3;
        const grad = c.createLinearGradient(0, top, 0, bottom);
        grad.addColorStop(0, `rgba(${color},0)`);
        grad.addColorStop(0.75, `rgba(${color},${shine.toFixed(3)})`);
        grad.addColorStop(1, `rgba(${color},0)`);
        c.fillStyle = grad;
        c.fillRect(x, top, 3, bottom - top);
      }
    }
    c.restore();
    return fade > 0.2 ? [90, 80, 220, 120] : undefined;
  },
  press() {
    roomSound.shimmer(2);
    return 'The northern lights ripple green and violet over the hills. You hardly ever see them. Make it count!';
  },
};
