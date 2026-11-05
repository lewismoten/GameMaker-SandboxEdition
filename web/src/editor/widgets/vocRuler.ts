// A time ruler under a .VOC waveform: seconds and game ticks (1/18.2 s), with a yellow zone
// where a slow PC may stutter and a red zone where it likely will, and a mark at 64 KB. It is a
// visual warning only: the whole sound still records and plays. Zones carry a label and a
// pattern as well as a color. Thresholds are estimates (audio/vocLimit.ts).
import './vocRuler.css';
import { h } from '../core/ui';
import { TICK_MS, stutterLevel, stutterNote, vocBytesFor } from '../../audio/vocLimit';
import { rulerPlan } from './vocRulerPlan';

interface VocRuler {
  el: HTMLElement;
  /** Draws the ruler for a sound of this many samples. */
  set(samples: number): void;
}

const LEVEL_TEXT = {
  ok: 'Short enough: should not stall play on a slow PC.',
  maybe: 'Yellow: may stutter on slower PCs.',
  likely: 'Red: likely to stutter on slower PCs.',
  toobig: 'Red, past 64 KB: DOS cannot load a sound this big.',
} as const;

export function vocRuler(rate: number): VocRuler {
  const track = h('div', { class: 'voc-ruler-track' });
  const note = h('div', { class: 'voc-ruler-note hint', role: 'status' });
  const el = h(
    'div',
    { class: 'voc-ruler', tabindex: '0', role: 'group', 'aria-label': 'Time ruler: seconds, game ticks and how long a sound may stall DOS play' },
    track,
    note,
  );
  const zone = (cls: string, from: number, to: number, label: string) =>
    h(
      'div',
      { class: `voc-zone ${cls}`, style: `left:${(from * 100).toFixed(3)}%;width:${((to - from) * 100).toFixed(3)}%`, title: label },
      h('span', null, label),
    );
  const mark = (cls: string, at: number, label?: string) =>
    h('div', { class: cls, style: `left:${(at * 100).toFixed(3)}%` }, label ? h('span', null, label) : null);

  return {
    el,
    set(samples) {
      track.replaceChildren();
      const p = rulerPlan(samples, rate);
      if (p.yellowAt < 1) track.append(zone('voc-yellow', p.yellowAt, Math.min(1, p.redAt), 'may stutter'));
      if (p.redAt < 1) track.append(zone('voc-red', p.redAt, 1, 'likely stutters'));
      for (const t of p.ticks) track.append(mark('voc-tick', t));
      for (const { s, at } of p.seconds) track.append(mark('voc-sec', at, `${s} s`));
      if (p.limitAt !== undefined) track.append(mark('voc-64k', p.limitAt, '64 KB'));
      const bytes = vocBytesFor(Math.max(1, samples));
      const level = stutterLevel(bytes);
      note.replaceChildren(
        `${LEVEL_TEXT[level]} ` + (level === 'ok' ? '' : stutterNote(bytes)),
        ` Ticks: small marks are game ticks (${TICK_MS} ms each), long marks are seconds. These times are estimates.`,
      );
      note.classList.toggle('warn', level !== 'ok');
    },
  };
}
