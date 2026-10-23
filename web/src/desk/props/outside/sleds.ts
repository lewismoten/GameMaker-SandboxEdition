// Two kids trudging left to right along the street with their sleds in tow, off to the big
// hill: puffy coats, knit hats with pompoms, the sleds' red runners sliding behind.
import { roomSound } from "../propSound";
import { across, STREET, type OutsideEvent } from "./outside";

function kid(c: CanvasRenderingContext2D, x: number, g: number, t: number, coat: string, hat: string): void {
  const step = Math.sin(t / 140);
  const bob = Math.abs(step) * 1.2;
  // legs, walking
  c.strokeStyle = "#2a3550";
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(x, g - 9 - bob);
  c.lineTo(x - 3 * step, g);
  c.moveTo(x, g - 9 - bob);
  c.lineTo(x + 3 * step, g);
  c.stroke();
  // the coat, an arm out behind holding the rope
  c.fillStyle = coat;
  c.fillRect(x - 4.5, g - 20 - bob, 9, 12);
  // the face and the hat with its pompom
  c.fillStyle = "#f2c9a0";
  c.beginPath();
  c.arc(x, g - 23 - bob, 3.6, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = hat;
  c.fillRect(x - 4, g - 28 - bob, 8, 4);
  c.beginPath();
  c.arc(x, g - 29 - bob, 1.8, 0, Math.PI * 2);
  c.fill();
}

function sled(c: CanvasRenderingContext2D, x: number, g: number, from: number): void {
  c.strokeStyle = "#3a2a1a";
  c.lineWidth = 0.8;
  c.beginPath();
  c.moveTo(from, g - 15);
  c.lineTo(x + 18, g - 5);
  c.stroke();
  c.fillStyle = "#a8743a";
  c.fillRect(x, g - 6, 18, 3);
  c.strokeStyle = "#c81e1e";
  c.lineWidth = 1.4;
  c.beginPath();
  c.moveTo(x, g - 2);
  c.lineTo(x + 17, g - 2);
  c.quadraticCurveTo(x + 21, g - 2, x + 20, g - 6);
  c.stroke();
}

export const sleds: OutsideEvent = {
  kind: "sleds",
  id: "desk-sleds",
  label: "Kids going by with their sleds",
  when: "day",
  ms: 14_000,
  start: () => roomSound.crunch(8),
  draw(c, p, t) {
    const x = across(p, 90, false);
    const g = STREET;
    sled(c, x, g, x + 28);
    kid(c, x + 30, g, t, "#d23a3a", "#2fae5a");
    sled(c, x + 40, g, x + 70);
    kid(c, x + 72, g + 1, t + 200, "#2f6ad2", "#f2c22a");
    return [x, g - 32, 80, 32];
  },
  press() {
    roomSound.crunch(1);
    return "Two kids trudge by with their sleds, off to the big hill behind the school. Snow day!";
  },
};
