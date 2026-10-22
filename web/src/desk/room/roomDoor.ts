// The bedroom door, on the wall right of the desk: a six-panel door with a brass knob and
// a hand-lettered KEEP OUT sign taped at eye level. Like the clock across the room, it
// shows only when the window has wall to spare beside the desk (stage.ts: .wide-wall).
import "./roomDoor.css";
import { h } from "../../editor/core/ui";

export function roomDoor(): HTMLElement {
  return h(
    "div",
    { class: "room-door", "aria-hidden": "true" },
    h(
      "div",
      { class: "rd-door" },
      ...Array.from({ length: 6 }, () => h("div", { class: "rd-panel" })),
      h("div", { class: "rd-knob" }),
      h(
        "div",
        { class: "rd-sign" },
        h("b", null, "KEEP OUT!"),
        h("span", null, "this means YOU"),
      ),
    ),
  );
}
