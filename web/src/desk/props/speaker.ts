// The left desk speaker (pc/speakers.ts), the one without the knob, tapped: a thump of
// bass and a word about it.
import { flash, pressable, say, turns } from "./propKit";
import { roomSound } from "./propSound";

const LINES = [
  "Thump! The bass lives in this one. The volume knob lives in the other one.",
  "Hold it to your ear and you can hear the ocean. (That’s the PC’s fan.)",
  "Testing… testing… one, two. Is this thing on? It is now.",
  "It hums along with the PC. It knows all the songs, and none of the words.",
];

export function speakerProp(speaker: HTMLElement): () => void {
  const line = turns(LINES);
  return pressable(
    speaker,
    "Left speaker: give it a tap",
    () => {
      roomSound.thump();
      flash(speaker, "thump", 450);
      say(speaker, line());
    },
    { id: "desk-speaker" },
  );
}
