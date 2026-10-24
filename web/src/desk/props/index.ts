// The room's little things made pressable, each in a module of its own (desk/props/): the
// wall clock, the waste basket, the doorknob, the window (its glass, the moon, and what goes
// by outside: outside/), the curtains, the left speaker, the monitor's DEGAUSS, the black
// light and the overhead light's switch (roomLight.ts, which also darkens the room at
// night). Called once the desk is built (`pc` says whether a game is playing: nothing happens
// outside then); what is only drawn on a wide window (the clock, the door, the basket) is
// skipped by Tab on a narrow one, since it isn't shown.
import { clockProp } from './clock';
import { wastebasketProp } from './wastebasket';
import { doorProp } from './door';
import { windowProps } from './window';
import { outsideWindow } from './outside';
import { curtainProps } from './curtains';
import { speakerProp } from './speaker';
import { degaussProp } from './degauss';
import { blackLight } from './blacklight';
import { roomLight } from './roomLight';
import { screenGlow } from '../pc/screenGlow';
import { toyWhistle } from './zine/whistle';
import { hideBubble } from './propKit';

export function deskProps(desk: HTMLElement, pc: { gamePlaying(): boolean } = { gamePlaying: () => false }): () => void {
  const q = (s: string) => desk.querySelector<HTMLElement>(s);
  const offs: (() => void)[] = [];
  const add = <T extends unknown[]>(f: (...a: { [K in keyof T]: HTMLElement }) => () => void, ...sel: { [K in keyof T]: string }) => {
    const els = sel.map(q);
    if (els.every(Boolean)) offs.push(f(...(els as { [K in keyof T]: HTMLElement })));
  };
  add(clockProp, '.wall-clock');
  add(wastebasketProp, '.waste-basket');
  add(doorProp, '.room-door');
  add(windowProps, '.snow-window');
  const win = q('.snow-window');
  if (win) offs.push(outsideWindow(win, pc)); // after windowProps: they ride in the window's hit layer
  add(curtainProps, '.snow-window');
  add(speakerProp, '.speaker.left');
  add(degaussProp, '.monitor .brand', '.monitor .screen-bezel');
  offs.push(blackLight(desk));
  offs.push(roomLight(desk));
  offs.push(screenGlow(desk));
  offs.push(toyWhistle(desk));
  return () => {
    offs.forEach((f) => f());
    hideBubble();
  };
}
