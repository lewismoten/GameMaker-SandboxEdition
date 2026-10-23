// A little plastic toy whistle, the prize out of a cereal box, lying on the desk behind the
// shareware catalog. Pick it up: under it is NO CARRIER, a photocopied
// hacker zine about the desk PC's power tools (zine.ts). The first time is an achievement.
import "./zine.css"; // (the whistle's place on the desk, and the zine's look)
import { h } from "../../../editor/core/ui";
import { pressable } from "../propKit";

const ART = `<svg viewBox="0 0 64 28" aria-hidden="true">
  <path d="M6 15 h22 v-6 h4 v12 h-26 q-3 0 -3 -3 q0 -3 3 -3 z" fill="#f2a01e" stroke="#8a5408"/>
  <circle cx="42" cy="15" r="11" fill="#f5b028" stroke="#8a5408"/>
  <circle cx="42" cy="15" r="6" fill="#d98a10"/>
  <rect x="27" y="9" width="6" height="4" fill="#3a2200" opacity="0.6"/>
  <path d="M52 8 q10 -6 10 4 q0 10 -9 8" fill="none" stroke="#c03a2a" stroke-width="2"/>
  <ellipse cx="38" cy="10" rx="4" ry="1.6" fill="#fff" opacity="0.5"/>
</svg>`;

export function toyWhistle(desk: HTMLElement): () => void {
  const home = desk.querySelector(".desk-left");
  if (!home) return () => {};
  const el = h("button", { class: "toy-whistle", type: "button" });
  el.innerHTML = ART;
  home.append(el);
  const off = pressable(el, "A toy whistle from a cereal box (and what's under it)", () => void import("./zine").then((m) => m.openZine(el)), {
    id: "desk-zine",
    title: "A toy whistle",
  });
  return () => {
    off();
    el.remove();
  };
}
