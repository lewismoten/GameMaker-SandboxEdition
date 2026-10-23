// THE CHEZ, Lewis's tomato-red CitiCar, drawn on a canvas from the side in the shared side
// view's measurements (games/kit/chez.ts, measured off the photos; chezArt.test.ts keeps the
// two the same, since the dev server can't load files from outside web/): x along the car, y
// down, the ground at 20. A straight wedge from the low nose over the hood and windshield to
// the short BLACK roof, one door window (no quarter window behind it), the dark racing stripes
// with red between and a white pinstripe round them, stepping up in an S curve over the rear
// quarter, white wheels with chrome caps, plain square bumpers. Facing left it shows the
// passenger side, with the charge port at the rear, and Doc Leo at the wheel through the
// door window. The plate, THE CHEZ, is on the back.
type Pt = [number, number];

export const CHEZ_BODY: Pt[] = [
  [7.9, 1.3],
  [17.9, 1.3],
  [36.0, 13.2],
  [36.0, 14.4],
  [26.1, 14.4],
  [26.1, 18.1],
  [13.7, 18.1],
  [13.7, 14.4],
  [5.2, 14.4],
];
export const CHEZ_WINDOW: Pt[] = [
  [12.5, 2.8],
  [18.5, 2.8],
  [24.5, 8.3],
  [13.0, 8.3],
];
export const CHEZ_POD: Pt[] = [
  [30.0, 9.1],
  [30.5, 8.6],
  [32.0, 8.6],
  [32.4, 9.2],
  [32.4, 10.6],
];
export const CHEZ_WHEELS = [9.35, 31.1];
export const CHEZ_AXLE = 16.75;
const TIRE = 3.25;
const ROOF_EDGE = 2.05;
// the stripes' band: its middle along the front, the S-curve step up over the rear quarter
// (from KINK[1] back to KINK[0]) and where it ends at the back
const BAND = 12.5;
const KINK: [number, number] = [10.0, 13.0];
const RISE = 2.6;
const BAND_END = 6.9;

/** How far up the stripes have stepped at x (0 along the front, RISE over the rear quarter). */
export function stripeStep(x: number): number {
  const [a, b] = KINK;
  if (x >= b) return 0;
  if (x <= a) return RISE;
  const t = (b - x) / (b - a);
  return RISE * t * t * (3 - 2 * t);
}

const path = (c: CanvasRenderingContext2D, pts: Pt[]) => {
  c.beginPath();
  pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
};

/** Doc Leo at the wheel, seen through the door window: his chewed fedora, a red nose, a grin. */
function docLeo(c: CanvasRenderingContext2D): void {
  c.save();
  path(c, CHEZ_WINDOW);
  c.clip();
  // the corduroy jacket's shoulder and the green tie
  c.fillStyle = "#7a5a32";
  c.fillRect(17, 6.6, 6, 2);
  c.fillStyle = "#3c9a3c";
  c.fillRect(20.2, 6.6, 0.8, 2);
  // the face, looking ahead (toward the nose, x 36)
  c.fillStyle = "#f2c9a0";
  c.beginPath();
  c.ellipse(20.2, 5.2, 1.7, 1.9, 0, 0, Math.PI * 2);
  c.fill();
  // stubble and the grin
  c.fillStyle = "rgba(60,50,40,0.35)";
  c.beginPath();
  c.ellipse(20.6, 6.3, 1.3, 0.75, 0, 0, Math.PI);
  c.fill();
  c.strokeStyle = "#5a1a10";
  c.lineWidth = 0.22;
  c.beginPath();
  c.arc(21.1, 5.9, 0.6, 0.2, Math.PI - 0.6);
  c.stroke();
  c.fillStyle = "#1a1a1a";
  c.fillRect(21.0, 4.6, 0.35, 0.35);
  // the red nose
  c.fillStyle = "#e0242c";
  c.beginPath();
  c.arc(22.0, 5.3, 0.62, 0, Math.PI * 2);
  c.fill();
  // the fedora: brim and a dented crown
  c.fillStyle = "#5a4632";
  c.fillRect(18.0, 3.4, 4.6, 0.5);
  c.beginPath();
  c.moveTo(18.8, 3.5);
  c.lineTo(19.0, 2.2);
  c.lineTo(20.2, 2.6);
  c.lineTo(21.5, 2.1);
  c.lineTo(21.8, 3.5);
  c.closePath();
  c.fill();
  c.restore();
}

/**
 * Draws THE CHEZ with its box's bottom left on the ground at (x, ground), `k` pixels to the
 * kit's unit, facing left (driving right to left, the passenger side showing).
 */
export function drawChez(c: CanvasRenderingContext2D, x: number, ground: number, k: number): void {
  c.save();
  // mirrored: the kit's x runs nose-right; facing left, unit u lands at x + (40 - u) * k
  c.translate(x + 40 * k, ground - 20 * k);
  c.scale(-k, k);
  // a shadow on the snow
  c.fillStyle = "rgba(40,50,70,0.25)";
  c.beginPath();
  c.ellipse(20.5, 20, 18, 1.2, 0, 0, Math.PI * 2);
  c.fill();
  // white steel wheels and chrome caps on black tires
  for (const wx of CHEZ_WHEELS) {
    for (const [r, col] of [
      [TIRE, "#161618"],
      [2.0, "#f2eee4"],
      [1.0, "#b8bcc4"],
    ] as const) {
      c.fillStyle = col;
      c.beginPath();
      c.arc(wx, CHEZ_AXLE, r, 0, Math.PI * 2);
      c.fill();
    }
  }
  // plain square black bumpers
  c.fillStyle = "#1a1a1e";
  c.fillRect(35.2, 13.0, 2.0, 1.8);
  c.fillRect(3.9, 12.8, 2.0, 1.8);
  // the tomato-red body and its headlight pod
  const red = c.createLinearGradient(0, 1.3, 0, 18.1);
  red.addColorStop(0, "#ff6a50");
  red.addColorStop(0.55, "#e8402c");
  red.addColorStop(1, "#b02018");
  c.fillStyle = red;
  path(c, CHEZ_BODY);
  c.fill();
  path(c, CHEZ_POD);
  c.fill();
  c.save();
  path(c, CHEZ_BODY);
  c.clip();
  // the black roof
  c.fillStyle = "#141416";
  c.fillRect(0, 0, 40, ROOF_EDGE);
  // the racing stripes: a white pinstripe round a dark pair with red between them, stepping up
  const band = (w: number, col: string, d = 0) => {
    c.strokeStyle = col;
    c.lineWidth = w;
    c.beginPath();
    for (let u = 36; u >= BAND_END; u -= 0.25) {
      const y = BAND - stripeStep(u) + d;
      if (u === 36) c.moveTo(u, y);
      else c.lineTo(u, y);
    }
    c.stroke();
  };
  c.lineCap = "butt";
  band(1.9, "#fff4e8");
  band(1.5, "#e8402c");
  band(0.5, "#26262a", -0.5);
  band(0.5, "#26262a", 0.5);
  c.restore();
  // the door window, with Doc Leo in it, and the windshield's edge
  const glass = c.createLinearGradient(0, 2.8, 0, 8.3);
  glass.addColorStop(0, "#a8d8f0");
  glass.addColorStop(1, "#2a4a6a");
  c.fillStyle = glass;
  path(c, CHEZ_WINDOW);
  c.fill();
  docLeo(c);
  c.strokeStyle = "#d8eef8";
  c.lineWidth = 0.35;
  c.beginPath();
  c.moveTo(18.3, 1.7);
  c.lineTo(27.2, 7.5);
  c.stroke();
  // the door's seams and handle
  c.strokeStyle = "#7a1006";
  c.lineWidth = 0.3;
  c.beginPath();
  c.moveTo(12.1, 2.2);
  c.lineTo(13.7, 18.1);
  c.moveTo(26.1, 8.3);
  c.lineTo(26.1, 18.1);
  c.stroke();
  c.fillStyle = "#d8d8e0";
  c.fillRect(14.5, 10.6, 1.5, 0.6);
  // the headlight, the amber marker up front, the red one at the back, the charge port
  c.fillStyle = "#fff8c0";
  c.fillRect(32.1, 8.9, 0.5, 1.1);
  c.fillStyle = "#ffa020";
  c.fillRect(30.4, 10.9, 1.2, 0.8);
  c.fillStyle = "#e01818";
  c.fillRect(7.1, 12.4, 1.2, 0.8);
  c.fillStyle = "#7a1006";
  c.fillRect(6.6, 5.0, 1.3, 1.3);
  c.restore();
  // the plate on the back (not mirrored, so it reads): THE CHEZ, just past the rear bumper
  const px = x + (40 - 4.6) * k;
  const py = ground - 20 * k + 11.1 * k;
  c.fillStyle = "#f4f2e8";
  c.fillRect(px - 0.2 * k, py, 2.6 * k, 1.5 * k);
  c.fillStyle = "#1a3a8a";
  c.font = `bold ${Math.max(3, 0.9 * k)}px Arial, sans-serif`;
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.fillText("THE CHEZ", px + 1.1 * k, py + 0.78 * k, 2.4 * k);
}
