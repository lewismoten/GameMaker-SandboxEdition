// A black-light poster of Doc Leo, velvet black with fluorescent outlines, on the wall by the
// big poster, under a black-light tube. By day (the room's clock) it is just a velvet poster
// in plain light; after dark the room dims, the tube comes on and the poster glows magenta,
// green and orange. Only the wall dims: the PC, the lamp's pool, the props and their labels
// stay as they were, and with the desk lamp on the room is a little brighter. Pressed, the
// tube flickers (desk-blacklight).
import { h } from "../../editor/core/ui";
import { watchDaylight } from "../room/daylight";
import { flash, pressable, say, stillMotion, turns } from "./propKit";
import { roomSound } from "./propSound";

const ART = `<svg viewBox="0 0 90 136" aria-hidden="true">
  <g fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.4">
    <g class="bl-o">
      <path d="M12 41 q33 -9 66 0"/>
      <path d="M23 39 q-1 -22 22 -24 q23 2 22 24"/>
      <path d="M30 24 l5 4 l4 -5 M54 22 l3 5"/>
      <path d="M17 120 q3 -26 21 -32 M73 120 q-3 -26 -21 -32"/>
      <path d="M24 108 l5 2 M66 108 l-5 2" stroke-width="1.6"/>
    </g>
    <g class="bl-g">
      <ellipse cx="45" cy="63" rx="21" ry="24"/>
      <path d="M33 53 q4 -3 8 0 M49 53 q4 -3 8 0" stroke-width="1.8"/>
      <circle cx="37" cy="58" r="2.2"/><circle cx="53" cy="58" r="2.2"/>
      <path d="M30 76 q15 16 30 0" stroke-dasharray="0.1 3.2" stroke-width="2"/>
      <path d="M34 88 l11 8 l11 -8"/>
      <path d="M45 96 l-5 6 l5 16 l5 -16 z"/>
    </g>
    <g class="bl-m">
      <circle cx="45" cy="66" r="6" fill="currentColor"/>
      <path d="M33 74 q12 11 24 0"/>
    </g>
  </g>
  <text class="bl-m" x="45" y="132" text-anchor="middle" font-family="'Arial Black', Arial, sans-serif" font-size="11" font-weight="900" letter-spacing="1">DOC LEO</text>
</svg>`;

const NIGHT = [
  "Bzzt… tink… tink. The black light flickers, and Doc Leo glows: a magenta nose, a green tie, an orange fedora.",
  "Tink-tink-bzzzz. Every white sock in the room glows too. (Yes, even that one.)",
  "The tube flickers. In 1994 this was the height of interior design.",
];
const DAY = [
  "Click… tink. The black light flickers on for a second. By day it’s just a velvet poster of Doc Leo.",
  "Tink. Black lights don’t do much in daylight. Come back after dark.",
];

export function blackLight(desk: HTMLElement): () => void {
  const scene = desk.querySelector<HTMLElement>(".desk-scene");
  if (!scene) return () => {};
  const dim = h("div", { class: "bl-dim", "aria-hidden": "true" });
  const tube = h("div", { class: "bl-tube", "aria-hidden": "true" });
  const poster = h("div", { class: "bl-poster" });
  poster.innerHTML = ART;
  scene.prepend(dim);
  // on the wall beside the big poster, next after it when you Tab along the wall
  const big = scene.querySelector(".poster");
  if (big) big.after(tube, poster);
  else scene.append(tube, poster);

  let night = false;
  const night1 = turns(NIGHT);
  const day1 = turns(DAY);
  const off = pressable(
    poster,
    "Black-light poster of Doc Leo: flicker the black light",
    () => {
      roomSound.flicker();
      flash(desk, stillMotion() ? "bl-blink" : "bl-flicker", 1000);
      say(poster, night ? night1() : day1());
    },
    { id: "desk-blacklight" },
  );
  const stop = watchDaylight((light) => {
    night = light < 0.5;
    desk.classList.toggle("bl-night", night);
  });
  return () => {
    off();
    stop();
    desk.classList.remove("bl-night");
    for (const el of [dim, tube, poster]) el.remove();
  };
}
