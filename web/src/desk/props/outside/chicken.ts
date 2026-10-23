// Sir Reginald Cluckington III, Doc Leo's rubber chicken, sailing past the window in a long
// arc, spinning end over end. Rubber chickens can't fly. Nobody told him.
import { roomSound } from "../propSound";
import { VIEW } from "../../room/snowWindow";
import type { OutsideEvent } from "./outside";

export const chicken: OutsideEvent = {
  kind: "chicken",
  id: "desk-chicken",
  label: "A rubber chicken flying past",
  when: "any",
  ms: 8_000,
  start: () => roomSound.squawk(1),
  draw(c, p) {
    const x = 70 + p * (VIEW.w - 20);
    const y = 280 - Math.sin(p * Math.PI) * 150; // (the view's top is cut off by the wall)
    c.save();
    c.translate(x, y);
    c.rotate(p * Math.PI * 5);
    // the yellow rubber body, the neck and head, the red comb and wattle, the orange beak
    c.fillStyle = "#ffd93a";
    c.beginPath();
    c.ellipse(0, 0, 9, 4.5, 0, 0, Math.PI * 2);
    c.fill();
    c.fillRect(6, -7, 3, 6);
    c.beginPath();
    c.arc(8, -8.5, 3, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#e0242c";
    c.fillRect(6.5, -12.5, 3.5, 2);
    c.fillRect(9, -6.5, 1.5, 2.5);
    c.fillStyle = "#f08a1c";
    c.beginPath();
    c.moveTo(10.5, -9);
    c.lineTo(14, -8);
    c.lineTo(10.5, -7.2);
    c.fill();
    c.fillStyle = "#111";
    c.fillRect(8.4, -9.8, 1, 1);
    // its dangling feet
    c.strokeStyle = "#f08a1c";
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(-3, 4);
    c.lineTo(-4, 9);
    c.moveTo(1, 4);
    c.lineTo(1, 9);
    c.stroke();
    c.restore();
    return [x - 22, y - 22, 44, 44];
  },
  press() {
    roomSound.squawk(1);
    return "SQUAWK! Sir Reginald Cluckington III sails past the window. Rubber chickens can’t fly. Nobody told him.";
  },
};
