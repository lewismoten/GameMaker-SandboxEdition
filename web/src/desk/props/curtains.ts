// The red curtains either side of the window (room/snowWindow.ts), tugged: they swish on
// the rod, and once in a while there's a tail sticking out from behind one.
import { h } from "../../editor/core/ui";
import { flash, pressable, say, turns } from "./propKit";
import { roomSound } from "./propSound";

const LINES: { text: string; tail?: boolean }[] = [
  { text: "Swish! Still snowing out there. Shovel later, make games now." },
  { text: "A brown tail is sticking out from behind the curtain. Gwinn is hiding. (Badly.)", tail: true },
  { text: "Swish. A dust bunny rolls out. Teddy will deal with it. Teddy will not deal with it." },
  { text: "You pull the curtain shut for a second, then open it again. Snow is better than no snow." },
];

export function curtainProps(win: HTMLElement): () => void {
  const line = turns(LINES);
  const offs = [...win.querySelectorAll<HTMLElement>(".sw-curtain")].map((c) => {
    const left = c.classList.contains("left");
    const tail = h("div", { class: "sw-tail", "aria-hidden": "true" });
    c.append(tail);
    return pressable(
      c,
      `${left ? "Left" : "Right"} curtain`,
      () => {
        const l = line();
        roomSound.swish();
        flash(c, "swish", 900);
        if (l.tail) flash(tail, "out", 3200);
        say(c, l.text);
      },
      { id: "desk-curtains" },
    );
  });
  return () => offs.forEach((f) => f());
}
