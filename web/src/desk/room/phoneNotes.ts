// Notes taped to the wall under the phone, for a kid who lets themselves in after school:
// who to call and when, and a sticky note about the door. Click to read them larger.
// The numbers are 555-01xx, the range kept for made-up numbers.
import "./phoneNotes.css";
import { h } from "../../editor/core/ui";

const NUMBERS: [string, string][] = [
  ["Mom at work", "555-0148 x210"],
  ["Dad at work", "555-0187"],
  ["Dad’s pager", "555-0199"],
  ["Grandma", "555-0123"],
  ["Jenny (sitter)", "867-5309"],
];

/** The card and the sticky note (also shown beside the phone's keypad: phone/dialPad.ts). */
export function notes(): HTMLElement {
  return h(
    "div",
    { class: "pn-notes" },
    h(
      "div",
      { class: "pn-card" },
      h("div", { class: "pn-head" }, "IMPORTANT NUMBERS"),
      h(
        "ul",
        null,
        ...NUMBERS.map(([who, num]) =>
          h("li", null, h("span", null, who), h("b", null, num)),
        ),
      ),
      h(
        "p",
        { class: "pn-pager" },
        "Page Dad: dial, wait for the beeps, punch in the house phone number, then press #",
      ),
      h(
        "p",
        { class: "pn-warn" },
        "Do NOT call us at work unless it’s an EMERGENCY!!",
      ),
      h("p", { class: "pn-911" }, "Real emergency → 911"),
      h("p", { class: "pn-sign" }, "♥ Mom"),
    ),
    h(
      "div",
      { class: "pn-sticky" },
      "DON’T answer the door for anyone you don’t know!",
      h("br"),
      "Keep it locked.",
    ),
  );
}

function readLarger(): void {
  const close = () => {
    window.removeEventListener("keydown", onKey, true);
    overlay.remove();
  };
  const onKey = (e: KeyboardEvent) => {
    e.stopImmediatePropagation(); // not for the PC underneath
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    }
  };
  const overlay = h(
    "div",
    {
      class: "desk-overlay pn-overlay",
      role: "dialog",
      "aria-label": "Notes under the phone",
    },
    h("button", { class: "close", onclick: close }, "Close (Esc)"),
    h("div", { class: "pn-large" }, notes()),
  );
  overlay.addEventListener("click", (e) => e.target === overlay && close());
  window.addEventListener("keydown", onKey, true);
  document.body.append(overlay);
}

export function phoneNotes(): HTMLElement {
  return h(
    "button",
    {
      class: "phone-notes",
      onclick: readLarger,
      title: "Notes under the phone: who to call (click to read)",
      "aria-label":
        "Notes under the phone: phone numbers for Mom, Dad, Grandma and the sitter, and don’t answer the door",
    },
    h("div", { class: "pn-small", "aria-hidden": "true" }, notes()),
  );
}
