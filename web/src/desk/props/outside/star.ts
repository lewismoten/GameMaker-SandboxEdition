// A shooting star streaking across the night sky, over the part of the window the monitor
// doesn't hide.
import { roomSound } from "../propSound";
import type { OutsideEvent } from "./outside";

export const star: OutsideEvent = {
  kind: "star",
  id: "desk-star",
  label: "A shooting star",
  when: "night",
  ms: 2_400,
  start: () => roomSound.twinkle(),
  draw(c, p) {
    const x = 100 + p * 170;
    const y = 90 + p * 70; // (the view's top is cut off by the wall)
    const g = c.createLinearGradient(x - 60, y - 25, x, y);
    g.addColorStop(0, "rgba(255,255,255,0)");
    g.addColorStop(1, "rgba(255,255,255,0.95)");
    c.strokeStyle = g;
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(x - 60, y - 25);
    c.lineTo(x, y);
    c.stroke();
    c.fillStyle = "#fff";
    c.fillRect(x - 1.5, y - 1.5, 3, 3);
    return [x - 50, y - 30, 70, 45];
  },
  press() {
    roomSound.twinkle();
    return "Caught it! A shooting star. Make a wish (a bug-free build?).";
  },
};
