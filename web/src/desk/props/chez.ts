// THE CHEZ drives by: in the daytime (by the room's clock), every few minutes at random,
// Lewis's red CitiCar goes past the window along the street, Doc Leo at the wheel, with an
// electric motor's quiet whirr. Never without motion. Press it while it passes (a button
// rides along with it, so Tab finds it too) and Doc Leo honks his bike horn.
import { addSkyExtra, VIEW } from "../room/snowWindow";
import { daylight } from "../room/daylight";
import { drawChez } from "./chezArt";
import { hitArea, pressable, say, stillMotion, turns } from "./propKit";
import { roomSound } from "./propSound";

const PASS_MS = 11_000;
const K = 1.5; // pixels of the window view to the kit unit: 60 x 30, on the street in front of the houses
const GROUND = VIEW.h - 18; // the street, where the fire engine drives
const pct = (v: number, of: number) => `${((v / of) * 100).toFixed(2)}%`;

const HONKS = [
  "Honk honk! Doc Leo waves from THE CHEZ, Lewis’s red CitiCar. Not a sound from the motor: it’s electric.",
  "Honk honk! THE CHEZ hums by at a stately 25 mph, Doc Leo at the wheel, racing stripes and all.",
  "Honk honk! Doc Leo tips his fedora. Sir Reginald Cluckington III is riding shotgun, buckled in.",
];

export function chezDriveBy(win: HTMLElement): () => void {
  const layer = win.querySelector<HTMLElement>(".sw-hits");
  if (!layer) return () => {};
  const button = hitArea("sw-chez");
  button.hidden = true;
  Object.assign(button.style, { width: pct(40 * K, VIEW.w), height: pct(22 * K, VIEW.h), top: pct(GROUND - 22 * K, VIEW.h), borderRadius: "30%" });
  layer.append(button);
  const honk = turns(HONKS);
  const off = pressable(
    button,
    "THE CHEZ driving by, Doc Leo at the wheel: honk",
    () => {
      roomSound.honk();
      say(button, honk());
    },
    { id: "desk-chez" },
  );

  let passing = false;
  /** One pass, right to left, along the street. */
  const drive = () => {
    if (passing || stillMotion() || !win.isConnected) return;
    passing = true;
    button.hidden = false;
    roomSound.whirr(PASS_MS / 1000);
    addSkyExtra(win, (ctx, ms) => {
      const p = ms / PASS_MS;
      if (p >= 1 || !win.isConnected) {
        passing = false;
        if (document.activeElement === button) (button.closest(".snow-window")?.querySelector<HTMLElement>(".sw-glass") ?? button).focus();
        button.hidden = true;
        return false;
      }
      const x = VIEW.w + 10 - p * (VIEW.w + 80);
      drawChez(ctx, x, GROUND, K);
      button.style.left = pct(x, VIEW.w);
      return true;
    });
  };

  // every few minutes, at random, if it is day outside
  let timer = 0;
  const later = () => {
    timer = window.setTimeout(() => {
      if (!win.isConnected) return;
      if (daylight() >= 0.5 && !document.hidden) drive();
      later();
    }, 120_000 + Math.random() * 180_000);
  };
  later();
  // (tests and the curious can send it round now: dispatchEvent(new Event('gm-chez-drive-by')))
  const now = () => (daylight() >= 0.5 ? drive() : undefined);
  addEventListener("gm-chez-drive-by", now);
  return () => {
    off();
    clearTimeout(timer);
    removeEventListener("gm-chez-drive-by", now);
  };
}
