// The town's snow plow, rumbling right to left along the street: an orange truck with its
// yellow blade angled out front throwing a spray of snow, its amber beacon turning.
import { roomSound } from "../propSound";
import { across, STREET, type OutsideEvent } from "./outside";

const LINES = [
  "The town plow rumbles by and buries the end of the driveway again. Shovel time (that’s how this Game-Maker got paid for, back in ’92).",
  "Scraaape. The plow goes by, its beacon turning. School’s probably still on. Probably.",
];
let line = 0;

export const plow: OutsideEvent = {
  kind: "plow",
  id: "desk-plow",
  label: "The snow plow going by",
  when: "day",
  ms: 10_000,
  start: () => roomSound.rumble(10),
  draw(c, p, t) {
    const x = across(p, 84);
    const g = STREET;
    // the spray of snow off the blade
    c.fillStyle = "rgba(255,255,255,0.9)";
    for (let i = 0; i < 14; i++) {
      const k = (i * 37 + Math.floor(t / 60)) % 23;
      c.fillRect(x - 8 - k * 0.9, g - 6 - ((i * 13 + t / 40) % 20), 2, 2);
    }
    // the blade, angled
    c.fillStyle = "#f2c22a";
    c.beginPath();
    c.moveTo(x - 10, g - 1);
    c.lineTo(x - 4, g - 16);
    c.lineTo(x + 4, g - 14);
    c.lineTo(x + 2, g - 1);
    c.fill();
    // the dump body and the cab (it faces left)
    c.fillStyle = "#e0761a";
    c.fillRect(x + 26, g - 30, 50, 20);
    c.fillStyle = "#b85a10";
    c.fillRect(x + 26, g - 14, 50, 4);
    c.fillStyle = "#f08a1a";
    c.fillRect(x + 4, g - 30, 22, 22);
    c.fillStyle = "#a8d4ee";
    c.fillRect(x + 7, g - 27, 11, 8);
    c.fillStyle = "#2a2a2a";
    c.fillRect(x + 2, g - 10, 76, 3);
    // the amber beacon, turning
    c.fillStyle = Math.sin(t / 120) > 0 ? "#ffb020" : "#8a5a10";
    c.fillRect(x + 13, g - 34, 5, 4);
    // wheels
    for (const wx of [x + 14, x + 54, x + 66]) {
      c.fillStyle = "#151515";
      c.beginPath();
      c.arc(wx, g - 5, 5.5, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#888";
      c.beginPath();
      c.arc(wx, g - 5, 2, 0, Math.PI * 2);
      c.fill();
    }
    return [x - 10, g - 36, 90, 36];
  },
  press() {
    roomSound.rumble(1.2);
    return LINES[line++ % LINES.length];
  },
};
