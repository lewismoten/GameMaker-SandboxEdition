// Preset icons for the Synth group and the Classic lead: each lead and pad is its own object
// (a saw blade, a fuzz pedal, a referee whistle, a retro sunset screen, a sun, a sweeping knob,
// a wobbling ripple, a keyboard synth). The plain wave screens stay in presetIcons.ts.
import { canvas } from './iconCanvas';

export const SYNTH_ICONS: Record<string, () => string[]> = {
  'lead-saw': () => {
    const c = canvas();
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6;
      const p = (r: number, d: number) => [Math.round(9.5 + r * Math.cos(a + d)), Math.round(9.5 + r * Math.sin(a + d))];
      const [x0, y0] = p(7.5, 0);
      const [x1, y1] = p(9.6, 0.3);
      c.line(x0, y0, x1, y1, 'k').line(...(p(7.5, 0.5) as [number, number]), x1, y1, 'k');
    }
    c.ell(9.5, 9.5, 7, 7, 'g').ell(9.5, 9.5, 2, 2, 'k').px(5, 5, 'w').px(6, 4, 'w').px(4, 6, 'w').line(9, 9, 15, 14, 'k');
    return c.rows();
  },
  lead: () => {
    const c = canvas().box(0, 2, 20, 16, 'n').box(1, 3, 18, 7, 'k', 'k');
    [3, 7, 11, 15].forEach((x, i) =>
      c
        .ell(x + 1, 5, 1.5, 1.5, 'w')
        .px(x + 1, 4, 'k')
        .px(x + 1 + (i % 2), 6, 'r'),
    );
    c.fill(2, 8, 16, 1, 'y');
    c.fill(2, 11, 16, 5, 'w');
    for (const x of [4, 6, 9, 11, 13, 16]) c.fill(x, 11, 1, 3, 'k');
    for (let x = 3; x < 17; x += 2) c.fill(x, 14, 1, 2, 'g');
    return c.rows();
  },
  'fuzz-stab': () => {
    const c = canvas().box(4, 1, 12, 18, 'r').ell(7.5, 5, 1.5, 1.5, 'w').ell(12.5, 5, 1.5, 1.5, 'w').px(7, 4, 'k').px(13, 5, 'k');
    c.fill(6, 8, 8, 4, 'w');
    c.line(7, 10, 8, 9, 'k').line(8, 9, 9, 11, 'k').line(9, 11, 11, 9, 'k').line(11, 9, 12, 11, 'k').line(12, 11, 13, 10, 'k');
    c.ell(10, 15.5, 2.5, 2.5, 'g').px(10, 15, 'w').px(14, 2, 'y');
    return c.rows();
  },
  'whistle-lead': () => {
    const c = canvas().fill(1, 9, 9, 4, 'k').fill(2, 10, 8, 2, 'g').ell(13, 11.5, 5, 5, 'g').fill(9, 6, 5, 1, 'k').fill(10, 7, 3, 1, 'k');
    c.ell(13, 12, 1.5, 1.5, 'w').px(12, 11, 'k').ell(13.5, 3.5, 2.5, 2.5, 'r').fill(13, 3, 1, 1, '.').fill(13, 4, 1, 1, '.');
    c.line(0, 3, 2, 4, 'c').line(0, 6, 2, 6, 'c').line(17, 14, 19, 16, 'c');
    return c.rows();
  },
  'pad-80s': () => {
    // a retro sunset screen: a striped sun over a glowing grid
    const c = canvas().box(0, 2, 20, 16, 'p').ell(10, 9, 5, 5, 'y').fill(0, 12, 20, 5, 'p').fill(5, 9, 11, 1, 'r').fill(5, 11, 11, 1, 'p');
    for (const y of [12, 14, 16]) c.fill(1, y, 18, 1, 'c');
    for (let x = -10; x <= 30; x += 4) c.line(10, 12, x, 16, 'c');
    return c.fill(0, 2, 20, 1, 'k').fill(0, 17, 20, 1, 'k').fill(0, 2, 1, 16, 'k').fill(19, 2, 1, 16, 'k').rows();
  },
  'pad-warm': () => {
    const c = canvas();
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6;
      c.line(
        Math.round(9.5 + 5.5 * Math.cos(a)),
        Math.round(9.5 + 5.5 * Math.sin(a)),
        Math.round(9.5 + 9 * Math.cos(a)),
        Math.round(9.5 + 9 * Math.sin(a)),
        i % 2 ? 'o' : 'y',
      );
    }
    c.ell(9.5, 9.5, 4.5, 4.5, 'y', 'o').fill(8, 8, 1, 1, 'k').fill(11, 8, 1, 1, 'k').fill(8, 11, 4, 1, 'o');
    return c.rows();
  },
  'pad-sweep': () => {
    const c = canvas();
    for (let i = 0; i <= 8; i++) {
      const a = Math.PI * (0.8 + (i * 1.4) / 8);
      c.ell(Math.round(9.5 + 8.6 * Math.cos(a)), Math.round(11 + 8.6 * Math.sin(a)), 0.5, 0.5, i > 5 ? 'c' : 'b', i > 5 ? 'c' : 'b');
    }
    c.ell(9.5, 11, 6, 6, 'g').ell(9.5, 11, 3.5, 3.5, 'w').line(9, 11, 13, 6, 'k').line(10, 11, 14, 6, 'k').px(1, 0, 'k');
    return c.rows();
  },
  'pad-wobble': () => {
    // a pad synth's panel: a screen showing the LFO's sine wave, knobs, and a strip of pads
    const c = canvas().box(0, 2, 20, 16, 'g').box(2, 4, 16, 7, 'k', 'k').fill(3, 5, 14, 5, 'k');
    for (let x = 3; x < 17; x++) c.px(x, 7 + Math.round(2 * Math.sin((x - 3) * 0.9)), 'c');
    for (const x of [4, 9, 14]) c.ell(x + 0.5, 13.5, 1.5, 1.5, 'w').px(x + 1, 12, 'k');
    for (const x of [2, 6, 10, 14]) c.box(x, 16, 4, 2, 'p');
    return c.rows();
  },
};
