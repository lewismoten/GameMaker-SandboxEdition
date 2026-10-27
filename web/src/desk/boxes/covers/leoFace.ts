// Doc Leo's face for the painted covers (teddy, teddy2, teddy3): his own face paint, white round
// both eyes and round the mouth, painted gray stubble, wire glasses, and his own nose and
// cheeks a little sunburned. Drawn in docLeo()'s frame: the face is centered at (0, -326).
import { type Ctx, blob, ell, fill, rad, seeded, stroke } from './paint';

/** Paints the face, stubble to nose, before the fedora goes on. */
export function leoFace(c: Ctx): void {
  // the face and the painted gray stubble along the jaw
  ell(c, 0, -326, 36, 42);
  fill(c, '#f4c8a4');
  blob(c, [-35, -334, -32, -298, 0, -282, 32, -298, 35, -334, 18, -316, 0, -312, -18, -316]);
  fill(c, 'rgba(90,96,108,0.5)');
  const r = seeded('doc-leo-stubble');
  c.fillStyle = 'rgba(50,54,62,0.55)';
  for (let i = 0; i < 70; i++) {
    const a = Math.PI * (0.05 + r() * 0.9);
    const d = 0.8 + r() * 0.2;
    c.fillRect(Math.cos(a) * 32 * d - 1, -322 + Math.sin(a) * 38 * d - 1, 2, 2);
  }
  // sunburned cheeks
  for (const sx of [-1, 1]) {
    ell(c, sx * 23, -318, 8, 6);
    fill(c, 'rgba(236,110,110,0.45)');
  }
  // white round the mouth, and the big smile
  blob(c, [-18, -310, 0, -316, 18, -310, 20, -296, 0, -288, -20, -296]);
  fill(c, '#fbfbf8');
  c.beginPath();
  c.arc(0, -308, 11, 0.35, Math.PI - 0.35);
  c.lineWidth = 3;
  c.strokeStyle = '#8a1010';
  c.stroke();
  // white round both eyes, painted brows over them, the wire glasses
  for (const ex of [-15, 15]) {
    blob(c, [ex - 13, -340, ex - 6, -354, ex + 6, -354, ex + 13, -340, ex + 6, -327, ex - 6, -327]);
    fill(c, '#fbfbf8');
    ell(c, ex, -339, 3.5, 4);
    fill(c, '#1a1a1a');
    ell(c, ex + 1.2, -340.5, 1.2, 1.2);
    fill(c, '#fff');
    c.beginPath();
    c.arc(ex, -339, 10, 0, Math.PI * 2);
    c.lineWidth = 1.6;
    c.strokeStyle = '#8a8a94';
    c.stroke();
    c.beginPath();
    c.arc(ex, -357, 9, Math.PI * 1.15, Math.PI * 1.85);
    c.lineWidth = 3;
    c.strokeStyle = '#1a1a1a';
    c.stroke();
  }
  stroke(c, '#8a8a94', 1.6, [-5, -340, 5, -340]);
  stroke(c, '#8a8a94', 1.6, [-25, -340, -35, -336]);
  stroke(c, '#8a8a94', 1.6, [25, -340, 35, -336]);
  // his own nose, a little sunburned
  blob(c, [-2, -336, 4, -334, 8, -320, 4, -316, -6, -316, -8, -321]);
  fill(
    c,
    rad(c, 0, -322, 10, [
      [0, '#f6a8a0'],
      [1, '#e88a86'],
    ]),
  );
  ell(c, 1, -326, 2, 2.5);
  fill(c, 'rgba(255,255,255,0.55)');
}
