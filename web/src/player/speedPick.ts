// "Run like a…" in the player's corner: Today, 486, 386, 286 or an IBM PS/1. A DOS game cannot change the
// CPU, so the player does it from outside: it charges each pass of the game loop what the old
// machine would have taken (engine/slowPc.ts), including the freeze while a .voc is read from
// disk. The game's files and rules are untouched; Today (the default) charges nothing.
import './speedPick.css';
import { costsFor, SPEED_CHOICES, type SpeedChoice } from '@lewismoten/gamemaker-sandbox-engine/engine/slowPc';
import type { SpeedSetting } from '@lewismoten/gamemaker-sandbox-engine/engine/scene';

const LABELS: Record<SpeedChoice, string> = {
  today: 'Today',
  '486': '486 (66 MHz)',
  '386': '386 (33 MHz)',
  '286': '286 (12 MHz)',
  ps1: 'IBM PS/1 Model 2011 (286, 10 MHz, 1 MB)',
};

/** Adds the control to the corner; `speed` is the object the running game reads every tick. */
export function speedPick(corner: HTMLElement, speed: SpeedSetting, canvas: HTMLElement): void {
  const label = document.createElement('label');
  label.className = 'gm-speed';
  label.title = 'Slow the game the way an old PC would: the picture, walking, monsters and the pause while a sound loads from disk (estimates)';
  const select = document.createElement('select');
  for (const c of SPEED_CHOICES) select.append(Object.assign(document.createElement('option'), { value: c, textContent: LABELS[c] }));
  select.addEventListener('change', () => {
    speed.slowPc = costsFor(select.value as SpeedChoice);
    canvas.focus();
  });
  // keys typed here must not reach the game; Esc or Tab leaves
  select.addEventListener('keydown', (e) => e.stopPropagation());
  label.append('Run like a ', select);
  corner.prepend(label);
}
