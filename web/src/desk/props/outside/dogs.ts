// Dogs loose on the street, running right to left: Gwinn out in front (chocolate brown, a
// pink collar) with somebody's red mitten in her mouth, Teddy (red-gold, a white chest, short
// corgi legs, one ear a little shorter) hot on her heels, snow flying.
import { roomSound } from "../propSound";
import { across, STREET, type OutsideEvent } from "./outside";

interface Dog {
  body: string;
  belly: string;
  legs: number; // how long
  len: number;
  corgi: boolean;
}
const GWINN: Dog = { body: "#5a3520", belly: "#6e4429", legs: 7, len: 22, corgi: false };
const TEDDY: Dog = { body: "#d98b3a", belly: "#fbf6ec", legs: 4, len: 20, corgi: true };

/** A dog running left, its nose at x. */
function dog(c: CanvasRenderingContext2D, d: Dog, x: number, g: number, t: number): void {
  const gait = Math.sin(t / 55);
  const top = g - d.legs - 8;
  // legs, galloping
  c.strokeStyle = d.body;
  c.lineWidth = 2.2;
  c.beginPath();
  for (const [lx, ph] of [[x + 5, 1], [x + 8, -1], [x + d.len - 3, -1], [x + d.len, 1]] as const) {
    c.moveTo(lx, top + 6);
    c.lineTo(lx + gait * ph * 3, g);
  }
  c.stroke();
  // the body, the chest, the tail
  c.fillStyle = d.body;
  c.beginPath();
  c.ellipse(x + d.len / 2 + 2, top + 3, d.len / 2, 4.5, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = d.belly;
  c.beginPath();
  c.ellipse(x + 5, top + 5, 3.5, 3, 0, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = d.body;
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(x + d.len + 1, top + 1);
  c.lineTo(x + d.len + 5, top - 3 + gait * 2);
  c.stroke();
  // the head, ears, eye, nose
  c.fillStyle = d.body;
  c.beginPath();
  c.ellipse(x + 1, top - 2, 4.5, 4, 0, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  if (d.corgi) {
    // Teddy's tall pointed ears, the near one a little shorter
    c.moveTo(x + 1, top - 5);
    c.lineTo(x + 2, top - 11);
    c.lineTo(x + 4, top - 5);
    c.moveTo(x + 3.5, top - 5);
    c.lineTo(x + 5.5, top - 9.5);
    c.lineTo(x + 6.5, top - 4);
  } else {
    // Gwinn's soft ears flying back
    c.ellipse(x + 4.5, top - 3, 3, 1.6, 0.6 + gait * 0.3, 0, Math.PI * 2);
  }
  c.fill();
  c.fillStyle = "#111";
  c.fillRect(x - 3.8, top - 2.5, 1.6, 1.4);
  c.fillRect(x - 0.5, top - 4, 1, 1);
  if (!d.corgi) {
    c.fillStyle = "#ec6aa8";
    c.fillRect(x + 3, top - 1, 2, 4);
  }
}

export const dogs: OutsideEvent = {
  kind: "dogs",
  id: "desk-dogs",
  label: "Dogs running loose",
  when: "day",
  ms: 6_500,
  start: () => roomSound.woof(3),
  draw(c, p, t) {
    const x = across(p, 80);
    const g = STREET;
    // snow kicked up behind them
    c.fillStyle = "rgba(255,255,255,0.85)";
    for (let i = 0; i < 10; i++) c.fillRect(x + 24 + ((i * 17 + t / 9) % 60), g - 3 - ((i * 7 + t / 30) % 8), 1.6, 1.6);
    dog(c, GWINN, x, g, t);
    // the stolen red mitten
    c.fillStyle = "#d42020";
    c.fillRect(x - 6, g - 15, 4, 5);
    dog(c, TEDDY, x + 34, g, t + 90);
    return [x - 8, g - 26, 70, 26];
  },
  press() {
    roomSound.woof(2);
    return "Gwinn tears past with somebody’s red mitten, Teddy right behind her, ears up (one a little shorter). Loose again! It wasn’t her. (It was her.)";
  },
};
