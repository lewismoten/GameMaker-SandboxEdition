// A black-light poster of Doc Leo, made from Lewis's own photo of himself as the hobo clown:
// velvet black, flat fluorescent inks and neon outlines, on the wall by the big poster under
// a black-light tube. By day (the room's clock) it is a velvet poster in plain light; after
// dark the room dims, the tube comes on and the poster glows magenta, green, orange and
// blue. Only the wall dims: the PC, the lamp's pool, the props and their labels stay as they
// were, and with the desk lamp on the room is a little brighter. Pressed, the tube flickers
// (desk-blacklight).
import { h } from "../../editor/core/ui";
import { watchDaylight } from "../room/daylight";
import { flash, pressable, say, stillMotion, turns } from "./propKit";
import { roomSound } from "./propSound";

/** The two prints (games/kit/scans/blacklight.py, from Lewis's own hobo clown photo). */
const PRINT = (when: "day" | "night") =>
  h("img", {
    class: `bl-print ${when}`,
    src: `./desk/docleo-blacklight-${when}.webp`,
    alt: "",
    width: 360,
    height: 540,
    loading: "lazy",
    decoding: "async",
  });

const NIGHT = [
  "Bzzt… tink… tink. The black light flickers, and Doc Leo glows: a magenta nose, a green grin, an electric-blue fedora.",
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
  // the day print, and the glowing one over it, shown after dark
  const poster = h("div", { class: "bl-poster" }, PRINT("day"), PRINT("night"));
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
