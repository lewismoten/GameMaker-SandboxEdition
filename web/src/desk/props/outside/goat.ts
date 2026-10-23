// A goat wanders along the street right to left, stops, sees you, SCREAMS and faints stiff
// on its side; then gets up, shakes it off and wanders on. (The Third Goat from the Left,
// probably: its scream and faint are that game's own sounds.)
import { roomSound } from "../propSound";
import { outsidePlaying, STREET, type OutsideEvent } from "./outside";
import { VIEW } from "../../room/snowWindow";

const STOP = 190; // where it stops, in the part of the view the monitor doesn't hide

function goatShape(c: CanvasRenderingContext2D, x: number, g: number, tip: number, step: number): void {
  c.save();
  // fainted: tipped over on its side, legs out stiff
  c.translate(x, g);
  c.scale(1.5, 1.5); // a goat-sized goat beside the houses
  c.translate(12, 0);
  c.rotate((tip * Math.PI) / 2);
  c.translate(-12, 0);
  c.strokeStyle = "#5a5048";
  c.lineWidth = 1.8;
  c.beginPath();
  for (const [lx, ph] of [[4, 1], [7, -1], [17, -1], [20, 1]] as const) {
    c.moveTo(lx, -9);
    c.lineTo(lx + step * ph * 2 * (1 - tip), 0);
  }
  c.stroke();
  c.fillStyle = "#ece6da";
  c.beginPath();
  c.ellipse(12, -12, 11, 5.5, 0, 0, Math.PI * 2);
  c.fill();
  // the head, facing left, horns and a beard
  c.beginPath();
  c.ellipse(-1, -18, 4, 3.4, -0.3, 0, Math.PI * 2);
  c.fill();
  c.fillRect(1, -18, 4, 6);
  c.strokeStyle = "#8a7a60";
  c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(1, -21);
  c.quadraticCurveTo(4, -26, 7, -24);
  c.stroke();
  c.fillStyle = "#cfc6b4";
  c.beginPath();
  c.moveTo(-3, -15);
  c.lineTo(-2, -11);
  c.lineTo(0, -15);
  c.fill();
  c.fillStyle = "#111";
  c.fillRect(-2.2, -19.5, 1.3, 1.3);
  c.restore();
}

export const goat: OutsideEvent = {
  kind: "goat",
  id: "desk-goat",
  label: "A goat in the street",
  when: "day",
  ms: 13_000,
  start() {
    // the scream when it stops and sees you, the faint as it keels over (if it's still
    // there to be seen)
    setTimeout(() => outsidePlaying() && roomSound.gameVoc("goat", "scream.voc"), 3_600);
    setTimeout(() => outsidePlaying() && roomSound.gameVoc("goat", "faint.voc"), 4_400);
  },
  draw(c, p, t) {
    const g = STREET;
    // walk in (to 0.28), stop and scream (0.33), keel over (to 0.38), lie there, get up
    // (0.72 to 0.78) and wander off (from 0.8)
    const x = p < 0.28 ? VIEW.w + 10 - (p / 0.28) * (VIEW.w + 10 - STOP) : p < 0.8 ? STOP : STOP - ((p - 0.8) / 0.2) * (STOP + 40);
    const tip = p < 0.33 ? 0 : p < 0.38 ? (p - 0.33) / 0.05 : p < 0.72 ? 1 : p < 0.78 ? 1 - (p - 0.72) / 0.06 : 0;
    const walking = p < 0.28 || p > 0.8;
    goatShape(c, x, g, tip, walking ? Math.sin(t / 110) : 0);
    if (p > 0.28 && p < 0.36) {
      // AAAAAH
      c.fillStyle = "#fff";
      c.font = "bold 9px Arial, sans-serif";
      c.fillText("AAAH!", x - 26, g - 42);
    }
    return [x - 12, g - 45, 52, 45];
  },
  press() {
    roomSound.gameVoc("goat", "bleat.voc");
    return "A goat wanders by, sees you, SCREAMS, and faints flat. It’s fine. It gets up. (The third goat from the left, probably.)";
  },
};
