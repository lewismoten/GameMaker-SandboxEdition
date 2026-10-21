// Final Curtain's cover: the Paragon Theatre, 1936, after the show. The velvet curtains are
// parted on an empty stage, a spotlight falls on the real dagger, the ghost light burns, and
// Inspector Ada Penn's silhouette stands in the aisle.
import { type Ctx, blob, ell, fill, finish, glow, lin, poly, rad, stroke } from './paint';

/** One velvet curtain, gathered toward `side` (-1 left, 1 right). */
function curtain(c: Ctx, side: number, w: number, h: number): void {
  const edge = side < 0 ? 0 : w;
  const inner = side < 0 ? 150 : w - 150;
  const tie = 430;
  c.save();
  c.beginPath();
  c.moveTo(edge, 0);
  c.lineTo(edge + side * -40 + (inner - edge) * 1.1, 0);
  c.quadraticCurveTo(inner + side * 30, tie * 0.6, inner + side * 40, tie);
  c.quadraticCurveTo(inner - side * 30, tie + 120, inner + side * 10, h);
  c.lineTo(edge, h);
  c.closePath();
  c.clip();
  c.fillStyle = '#4a0610';
  c.fillRect(0, 0, w, h);
  // the folds
  for (let i = 0; i < 8; i++) {
    const fx = edge + (inner - edge) * (i / 7) * 1.1;
    c.fillStyle = lin(c, fx - 14, 0, fx + 14, 0, [
      [0, 'rgba(0,0,0,0.5)'],
      [0.5, 'rgba(255,90,90,0.4)'],
      [1, 'rgba(0,0,0,0.5)'],
    ]);
    c.fillRect(fx - 14, 0, 28, h);
  }
  c.restore();
  // the gold tieback
  stroke(c, '#e8b830', 8, [edge, tie - 20, inner + side * 36, tie]);
  ell(c, inner + side * 36, tie, 10, 14);
  fill(c, '#ffd860');
}

const paint = (c: Ctx, w: number, h: number): void => {
  // the dark stage house
  c.fillStyle = lin(c, 0, 0, 0, h, [
    [0, '#0a0406'],
    [1, '#1a0a0c'],
  ]);
  c.fillRect(0, 0, w, h);
  // the back wall of the set: a painted moonlit window for THE RAVEN'S BRIDE
  poly(c, [250, 250, 350, 250, 350, 370, 250, 370]);
  fill(c, lin(c, 0, 250, 0, 370, [
    [0, '#1a2a50'],
    [1, '#3a4a70'],
  ]));
  ell(c, 322, 280, 16, 16);
  fill(c, '#f0ead0');
  stroke(c, '#1a0a0c', 6, [300, 250, 300, 370]);
  stroke(c, '#1a0a0c', 6, [250, 310, 350, 310]);
  // the stage floor, boards running to the footlights
  poly(c, [60, 400, 540, 400, 640, 540, -40, 540]);
  fill(c, lin(c, 0, 400, 0, 540, [
    [0, '#3a2414'],
    [1, '#7a4a24'],
  ]));
  for (let i = -10; i <= 10; i++) stroke(c, 'rgba(0,0,0,0.35)', 1.5, [300 + i * 26, 400, 300 + i * 46, 540]);
  // the spotlight from the fly gallery onto the dagger
  c.save();
  c.globalCompositeOperation = 'lighter';
  poly(c, [280, 0, 330, 0, 400, 480, 220, 480]);
  c.fillStyle = lin(c, 0, 0, 0, 480, [
    [0, 'rgba(255,240,200,0.4)'],
    [1, 'rgba(255,240,200,0.1)'],
  ]);
  c.fill();
  c.restore();
  ell(c, 310, 470, 100, 26);
  fill(c, rad(c, 310, 470, 100, [
    [0, 'rgba(255,240,200,0.75)'],
    [1, 'rgba(255,240,200,0)'],
  ]));
  // the dagger, lying where Victor Crane fell
  c.save();
  c.translate(306, 466);
  c.rotate(-0.25);
  poly(c, [-10, -4, 70, -2, 84, 0, 70, 2, -10, 4]);
  fill(c, lin(c, 0, -4, 0, 4, [
    [0, '#ffffff'],
    [0.5, '#b8c0cc'],
    [1, '#5a606c'],
  ]));
  stroke(c, '#c89020', 6, [-10, -14, -10, 14]);
  stroke(c, '#2a1408', 7, [-12, 0, -40, 0]);
  ell(c, -42, 0, 5, 5);
  fill(c, '#c89020');
  c.restore();
  glow(c, 378, 448, 18, '#fff', 0.9);
  stroke(c, '#fff', 1.5, [378, 432, 378, 464]);
  stroke(c, '#fff', 1.5, [362, 448, 394, 448]);
  // a dropped program
  poly(c, [396, 500, 430, 494, 436, 514, 402, 520]);
  fill(c, '#e8dcc0');
  // the ghost light: a bare bulb on a stand, stage left
  stroke(c, '#2a2a2a', 4, [470, 470, 470, 380]);
  stroke(c, '#2a2a2a', 4, [450, 476, 470, 470, 490, 476]);
  ell(c, 470, 372, 9, 11);
  fill(c, '#fffbe0');
  glow(c, 470, 372, 90, '#ffe8a0', 0.7);
  // the curtains and the gilded proscenium
  curtain(c, -1, w, h);
  curtain(c, 1, w, h);
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(w, 0);
  c.lineTo(w, 90);
  c.quadraticCurveTo(w / 2, 20, 0, 90);
  c.closePath();
  fill(c, lin(c, 0, 0, 0, 90, [
    [0, '#2a0408'],
    [1, '#6a0a18'],
  ]));
  c.beginPath();
  c.moveTo(0, 96);
  c.quadraticCurveTo(w / 2, 26, w, 96);
  c.lineWidth = 12;
  c.strokeStyle = lin(c, 0, 0, w, 0, [
    [0, '#8a6010'],
    [0.5, '#ffe080'],
    [1, '#8a6010'],
  ]);
  c.stroke();
  // footlights along the stage lip
  for (let i = 0; i < 9; i++) glow(c, 40 + i * 65, 544, 30, '#ffd070', 0.5);
  poly(c, [-40, 540, 640, 540, 640, 560, -40, 560]);
  fill(c, '#1a0c06');
  // the seats, and Inspector Penn in the aisle: fedora, belted coat, flashlight
  for (let row = 0; row < 3; row++) {
    const y = 600 + row * 50;
    for (let i = -1; i < 12; i++) {
      const x = i * 56 + (row % 2) * 28;
      if (Math.abs(x - 170) < 50) continue;
      blob(c, [x, y + 60, x, y + 6, x + 24, y - 4, x + 48, y + 6, x + 48, y + 60]);
      fill(c, lin(c, 0, y - 4, 0, y + 40, [
        [0, '#5a0a14'],
        [1, '#100204'],
      ]));
    }
  }
  const ix = 170;
  const iy = 696;
  c.fillStyle = '#050203';
  blob(c, [ix - 60, iy + 20, ix - 44, iy - 120, ix - 46, iy - 186, ix - 20, iy - 204, ix + 20, iy - 204, ix + 46, iy - 186, ix + 44, iy - 120, ix + 62, iy + 20]);
  c.fill();
  ell(c, ix, iy - 222, 20, 24);
  c.fill();
  // the fedora brim and crown
  ell(c, ix, iy - 240, 46, 9, -0.06);
  c.fill();
  blob(c, [ix - 20, iy - 238, ix - 18, iy - 262, ix + 18, iy - 262, ix + 22, iy - 238]);
  c.fill();
  stroke(c, '#050203', 16, [ix + 36, iy - 180, ix + 66, iy - 140, ix + 80, iy - 152]);
  // her flashlight beam toward the stage
  c.save();
  c.globalCompositeOperation = 'lighter';
  poly(c, [ix + 82, iy - 156, 400, 440, 250, 500]);
  c.fillStyle = lin(c, ix + 82, iy - 156, 340, 460, [
    [0, 'rgba(255,250,220,0.5)'],
    [1, 'rgba(255,250,220,0.05)'],
  ]);
  c.fill();
  c.restore();
  // a rim of light on her shoulder from the stage
  stroke(c, 'rgba(255,220,160,0.6)', 2.5, [ix + 20, iy - 202, ix + 46, iy - 186, ix + 44, iy - 150]);
  stroke(c, 'rgba(255,220,160,0.6)', 2, [ix + 10, iy - 262, ix + 18, iy - 262, ix + 22, iy - 240, ix + 44, iy - 244]);
  finish(c, w, h, 'sleuth', 0.6);
};
export default paint;
