// The monitor's name plate doubles as its DEGAUSS button, as on plenty of 1994 monitors:
// press it and the picture wobbles through the rainbow with a thunk and a hum, the way a
// tube shakes off the magnetism it picked up. Only the glass wobbles; the PC keeps going.
import { flash, pressable, say, stillMotion, turns } from "./propKit";
import { roomSound } from "./propSound";

const LINES = [
  "DEGAUSS! Thunk… mmmmmm. The colors are pure again.",
  "Thunk-wobble-hum. Every 1994 kid pressed this just to watch it.",
  "Degaussed. The purple blotch from the speaker magnet is gone (for now).",
];

export function degaussProp(plate: HTMLElement, screen: HTMLElement): () => void {
  const line = turns(LINES);
  return pressable(
    plate,
    "Degauss the monitor",
    () => {
      roomSound.degauss();
      flash(screen, stillMotion() ? "degauss-still" : "degauss", 1200);
      say(plate, line());
    },
    { id: "desk-degauss", title: "DEGAUSS: press to clear the picture’s colors" },
  );
}
