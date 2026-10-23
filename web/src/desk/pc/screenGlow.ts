// The tube's light on its bezel: while the PC is on, the picture spills a faint glow onto the
// plastic round the glass, each edge taking the color of the part of the picture nearest it
// (a blue sky lights the top of the bezel blue, green grass the bottom green). Four times a
// second every picture showing on the tube is shrunk onto a 16 x 12 sample and its edges
// averaged; the colors go to CSS (--glow-t, -r, -b, -l on .crt, desk.css), which draws them as
// shadows round the glass, brighter when the room is dark (props/roomLight.ts).
const W = 16;
const H = 12;
const EVERY_MS = 250;

/** Each side's strip of the sample: x0, y0, x1, y1 (exclusive). */
const SIDES = { t: [0, 0, W, 4], r: [11, 0, W, H], b: [0, 8, W, H], l: [0, 0, 5, H] } as const;

export function screenGlow(desk: HTMLElement): () => void {
  const crt = desk.querySelector<HTMLElement>('.crt');
  if (!crt) return () => {};
  const sample = document.createElement('canvas');
  sample.width = W;
  sample.height = H;
  const g = sample.getContext('2d', { willReadFrequently: true });
  if (!g) return () => {};
  let lit = false;

  const clear = () => {
    if (!lit) return;
    lit = false;
    for (const side of Object.keys(SIDES)) crt.style.removeProperty(`--glow-${side}`);
  };

  const tick = () => {
    if (desk.dataset.power !== 'on' || desk.dataset.zoom !== 'false' || document.hidden) return clear();
    const box = crt.getBoundingClientRect();
    if (!box.width) return clear();
    g.fillStyle = '#000';
    g.fillRect(0, 0, W, H);
    for (const c of crt.querySelectorAll('canvas')) {
      const r = c.getBoundingClientRect();
      if (!r.width || !c.width || getComputedStyle(c).opacity === '0' || c.closest('[hidden]')) continue;
      try {
        g.drawImage(c, ((r.left - box.left) / box.width) * W, ((r.top - box.top) / box.height) * H, (r.width / box.width) * W, (r.height / box.height) * H);
      } catch {
        /* a canvas with nothing drawn yet */
      }
    }
    const px = g.getImageData(0, 0, W, H).data;
    for (const [side, [x0, y0, x1, y1]] of Object.entries(SIDES)) {
      let r = 0;
      let gg = 0;
      let b = 0;
      let n = 0;
      for (let y = y0; y < y1; y++)
        for (let x = x0; x < x1; x++) {
          const o = (y * W + x) * 4;
          r += px[o];
          gg += px[o + 1];
          b += px[o + 2];
          n++;
        }
      // a lit picture is mostly dark round its edges: lift it so the glow can be seen
      const lift = (v: number) => Math.min(255, Math.round((v / n) * 1.8));
      crt.style.setProperty(`--glow-${side}`, `${lift(r)} ${lift(gg)} ${lift(b)}`);
    }
    lit = true;
  };

  const id = setInterval(tick, EVERY_MS);
  tick();
  return () => {
    clearInterval(id);
    clear();
  };
}
