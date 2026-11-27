// Tracks the first gate lesson during the title demo.
import { GATES_ONE } from '../src/levels';

export class DemoGate {
  private ticks = 0;
  private bumped = false;
  private previousX = NaN;
  passed = false;

  tick(x: number, right: boolean, open: boolean): void {
    const gate = GATES_ONE[0] * 20;
    const blocked = right && !open && x === this.previousX && x >= gate - 26 && x < gate - 14;
    this.ticks = blocked ? this.ticks + 1 : 0;
    if (this.ticks >= 6) this.bumped = true;
    if (this.bumped && open && this.previousX <= gate && x > gate) this.passed = true;
    this.previousX = x;
  }
}
