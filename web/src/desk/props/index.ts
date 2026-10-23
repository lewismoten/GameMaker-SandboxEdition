// The room's little things made pressable, each in a module of its own (desk/props/): the
// wall clock, the waste basket, the doorknob, the window (its glass, the moon and THE CHEZ going by), the
// curtains, the left speaker and the monitor's DEGAUSS. Called once the desk is built;
// what is only drawn on a wide window (the clock, the door, the basket) is skipped by Tab
// on a narrow one, since it isn't shown.
import { clockProp } from "./clock";
import { wastebasketProp } from "./wastebasket";
import { doorProp } from "./door";
import { windowProps } from "./window";
import { chezDriveBy } from "./chez";
import { curtainProps } from "./curtains";
import { speakerProp } from "./speaker";
import { degaussProp } from "./degauss";
import { hideBubble } from "./propKit";

export function deskProps(desk: HTMLElement): () => void {
  const q = (s: string) => desk.querySelector<HTMLElement>(s);
  const offs: (() => void)[] = [];
  const add = <T extends unknown[]>(
    f: (...a: { [K in keyof T]: HTMLElement }) => () => void,
    ...sel: { [K in keyof T]: string }
  ) => {
    const els = sel.map(q);
    if (els.every(Boolean)) offs.push(f(...(els as { [K in keyof T]: HTMLElement })));
  };
  add(clockProp, ".wall-clock");
  add(wastebasketProp, ".waste-basket");
  add(doorProp, ".room-door");
  add(windowProps, ".snow-window");
  add(chezDriveBy, ".snow-window"); // after windowProps: it rides in the window's hit layer
  add(curtainProps, ".snow-window");
  add(speakerProp, ".speaker.left");
  add(degaussProp, ".monitor .brand", ".monitor .screen-bezel");
  return () => {
    offs.forEach((f) => f());
    hideBubble();
  };
}
