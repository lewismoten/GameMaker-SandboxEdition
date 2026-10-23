// The giant wristwatch on the wall (room/wallClock.ts), pressed: it ticks and beeps the
// hour like a sport watch, and now and then a cuckoo nobody can explain pops out of it. At
// 3:17 a.m. the fridge downstairs stirs (The Great Dairy Reckoning of 3:17 A.M.); at
// midnight the cuckoo comes out in a party hat for the brand-new day.
import { h } from "../../editor/core/ui";
import { flash, pressable, say } from "./propKit";
import { roomSound } from "./propSound";

const time = (d: Date) =>
  d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

const BEEPS = [
  (t: string) => `Beep-beep! It’s ${t}. Right on time, as usual.`,
  (t: string) => `Tick, tick… beep-beep! ${t}. Time flies when you’re making games.`,
  (t: string) => `${t}. The watch says “just one more level.” It always says that.`,
  (t: string) => `Beep-beep! ${t}, and it’s still water resistant (please don’t test that).`,
];

function cuckooArt(party: boolean): SVGElement {
  const el = h("span");
  el.innerHTML = `<svg viewBox="0 0 60 44" width="78" height="57" aria-hidden="true">
    <rect x="2" y="10" width="20" height="26" fill="#6b4423"/>
    <path d="M22 26 h10" stroke="#6b4423" stroke-width="3"/>
    <ellipse cx="40" cy="26" rx="12" ry="9" fill="#8c6a43"/>
    <circle cx="49" cy="19" r="7" fill="#a07a4c"/>
    <circle cx="51" cy="17" r="1.6" fill="#111"/>
    <path d="M55 19 l6 -1 -6 3 z" fill="#f2b632"/>
    <path d="M34 22 q6 -6 12 2" fill="none" stroke="#5e4022" stroke-width="2"/>
    ${party ? '<path d="M45 13 l5 -12 5 11 z" fill="#e8336d" stroke="#fff" stroke-width="1"/><circle cx="50" cy="1.5" r="2" fill="#ffd400"/>' : ""}
  </svg>`;
  return el.firstElementChild as SVGElement;
}

export function clockProp(clock: HTMLElement): () => void {
  let presses = 0;
  // the cuckoo, ready to pop out from behind the watch's face
  const bird = h("div", { class: "clock-cuckoo", "aria-hidden": "true" });
  clock.append(bird);
  const use = () => {
    presses++;
    const now = new Date();
    const t = time(now);
    const hr = now.getHours();
    const min = now.getMinutes();
    if (hr === 3 && min === 17) {
      roomSound.watch();
      flash(clock, "clock-fridge", 2400);
      say(clock, `3:17 a.m. Somewhere downstairs a fridge door creaks open. The dairy is stirring…`);
      return;
    }
    const midnight = hr === 0 && min < 5;
    if (midnight || presses % 3 === 0) {
      bird.replaceChildren(cuckooArt(midnight));
      flash(bird, "out", 1900);
      roomSound.cuckoo(midnight ? 3 : 2);
      say(
        clock,
        midnight
          ? `Midnight! The date flips to the ${now.getDate()}${ordinal(now.getDate())}. Cuckoo! Happy brand-new day.`
          : `Cuckoo! Cuckoo! (Nobody knows how a wristwatch got a cuckoo.) It’s ${t}.`,
        cuckooArt(midnight),
      );
      return;
    }
    roomSound.watch();
    flash(clock, "clock-tick", 700);
    say(clock, BEEPS[presses % BEEPS.length](t));
  };
  return pressable(clock, "", use, {
    id: "desk-clock",
    title: "The wall clock: press it to hear the time",
  });
}

const ordinal = (n: number) =>
  n % 100 >= 11 && n % 100 <= 13 ? "th" : (["th", "st", "nd", "rd"][n % 10] ?? "th");
