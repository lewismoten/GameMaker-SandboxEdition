// "Run like a…" in the player's corner: modern computer, 486, 386, 286 or an IBM PS/1. A DOS game cannot change the
// CPU, so the player does it from outside: it charges each pass of the game loop what the old
// machine would have taken (engine/slowPc.ts), including the freeze while a .voc is read from
// disk and the black screen while a level's files are read. The game's files and rules are untouched; modern computer (the default) charges nothing.
import './speedPick.css';
import { costsFor, SPEED_CHOICES, type SpeedChoice } from '@lewismoten/gamemaker-sandbox-engine/engine/slowPc';
import type { SpeedSetting } from '@lewismoten/gamemaker-sandbox-engine/engine/scene';

const LABELS: Record<SpeedChoice, string> = {
  today: 'modern computer',
  '486': '486 (66 MHz)',
  '386': '386 (33 MHz)',
  '286': '286 (12 MHz)',
  ps1: 'IBM PS/1 Model 2011 (286, 10 MHz, 1 MB)',
};

/** Adds the control to the corner; `speed` is the object the running game reads every tick. */
export function speedPick(corner: HTMLElement, speed: SpeedSetting): HTMLSelectElement {
  const label = document.createElement('label');
  label.className = 'gm-speed';
  label.title = 'Slow the game the way an old PC would: the picture, walking, monsters, and the pauses while a sound or a level loads from disk (estimates)';
  const select = document.createElement('select');
  for (const c of SPEED_CHOICES) select.append(Object.assign(document.createElement('option'), { value: c, textContent: LABELS[c] }));
  select.addEventListener('change', () => {
    speed.slowPc = costsFor(select.value as SpeedChoice);
  });
  label.append('Run like a ', select);
  corner.prepend(label);
  return select;
}

/** Shift+F6 switches between gameplay and the toolbar while plain Tab stays a DOS key. */
export function toolbarKeyboard(canvas: HTMLCanvasElement, corner: HTMLElement, picker: HTMLSelectElement, releaseKeys: () => void): void {
  const hint = 'Shift+F6 switches between the game and toolbar';
  canvas.title = hint;
  canvas.setAttribute('aria-description', hint);
  for (const el of [canvas, corner]) {
    el.addEventListener(
      'keydown',
      (e) => {
        if (e.key === 'F6' && e.shiftKey && !e.altKey && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          e.stopPropagation();
          if (!e.repeat) (el === canvas ? picker : canvas).focus();
        }
      },
      true,
    );
  }
  corner.addEventListener('focusin', releaseKeys);
  // Keep native Tab navigation and button activation, including Space on keyup.
  for (const type of ['keydown', 'keyup']) corner.addEventListener(type, (e) => e.stopPropagation());
}
