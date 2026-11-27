// Tracks the lamp transition in the title demo, after the off-dial lesson.
export interface LampFrame {
  tick: number;
  stoppedAt: number;
  dialsOn: number;
  dialsOff: number;
  lamp: boolean;
  sparkAtLamp: boolean;
  lightVisible: boolean;
}

export class DemoLesson {
  private previous?: LampFrame;
  litAt = -1;
  visibleAt = -1;

  observe(frame: LampFrame): void {
    const prev = this.previous;
    if (
      this.litAt < 0 &&
      prev?.lamp &&
      !frame.lamp &&
      frame.stoppedAt > 0 &&
      frame.tick > frame.stoppedAt &&
      prev.dialsOn === 2 &&
      prev.dialsOff === 0 &&
      frame.dialsOn === 2 &&
      frame.dialsOff === 0 &&
      (prev.sparkAtLamp || frame.sparkAtLamp)
    )
      this.litAt = frame.tick;
    if (this.litAt > 0 && frame.lightVisible && this.visibleAt < 0) this.visibleAt = frame.tick;
    this.previous = frame;
  }
}
