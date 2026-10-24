/**
 * The emulated slow PC behind the desk's TURBO button (turbo off).
 *
 * A 486DX2-66's turbo switch did not make it a 286. On most boards turbo off turned off
 * the CPU cache (some also dropped the bus or core clock), which left the machine at
 * roughly 286-16 to 386-25 speed, depending on the board. So turbo off here is "about a
 * fast 286": the PC Lewis played these games on, where they ran fine.
 *
 * Why they ran fine: playgame's main loop (PLAYGAME.C playscene) does two kinds of work.
 *  - Once per NewTimer interrupt (8 per game tick, 145.6 Hz), DrawScroll while the view
 *    scrolls. On a VGA/SVGA card this is hardware scrolling: it moves the CRTC start
 *    address, draws only the new 4 pixel strips at the edge (drawhorizside/
 *    drawvertside: 320x4 or 4x200 pixels each) and erases/redraws the character. It never
 *    redraws the whole screen.
 *  - Once per 18.2 Hz game tick: move and redraw the character and the monsters on screen,
 *    animate blocks, copy the dirty rectangles to the screen, check links.
 * On a 286-class PC a still tick costs about 15 ms plus a millisecond or so per monster on
 * screen, well under the 55 ms a tick lasts, so the game keeps full pace. Scrolling only
 * runs once per pass of the loop, and the pass that runs the game tick takes several
 * interrupts' worth of time; DrawScroll is called with a step of 1 however many
 * interrupts went by (its `speed` argument is commented out), so those scroll steps are
 * simply lost and the view trails the character a little more. Only a crowded screen
 * that is also scrolling can take longer than a tick, and then playgame skips the missed
 * tick (OldClock jumps to TimerCounter) instead of catching up.
 *
 * The figures below are estimates for that machine, in milliseconds. They are kept
 * deliberately simple and deterministic (no wall clock): the same keys give the same
 * game, and recordings replay the same way.
 */
export interface PcCosts {
  /** A game tick with nothing on screen but the character. */
  tickMs: number;
  /** Each monster drawn on screen that tick (move, erase, masked draw, dirty rect). */
  monsterMs: number;
  /** One DrawScroll call (Bresenham step, CRTC update, character erase/redraw). */
  scrollPassMs: number;
  /** Each new 4 pixel edge strip DrawScroll draws and copies to the screen. */
  stripMs: number;
}

/** A 486DX2-66 with turbo off: about a 286-16. */
export const TURBO_OFF: PcCosts = {
  tickMs: 15,
  monsterMs: 1.2,
  scrollPassMs: 2.5,
  stripMs: 1.5,
};

/**
 * Keeps track of the time the slow PC still owes on work it started, counted in NewTimer
 * interrupts. While it owes a whole interrupt or more, that loop pass never happens.
 */
export class SlowCpu {
  /** Milliseconds of work still running. */
  owed = 0;

  constructor(private readonly interruptMs: number) {}

  /**
   * Called once per NewTimer interrupt: true when the PC is still busy with earlier work
   * and this interrupt's pass of the main loop (scroll step, game tick) is lost.
   */
  busy(): boolean {
    if (this.owed >= this.interruptMs) {
      this.owed -= this.interruptMs;
      return true;
    }
    // finished within this interrupt; the rest of it is free
    this.owed = 0;
    return false;
  }

  spend(ms: number): void {
    this.owed += ms;
  }

  reset(): void {
    this.owed = 0;
  }
}

/** What one game tick costs with `monsters` drawn on screen. */
export function tickCost(pc: PcCosts, monsters: number): number {
  return pc.tickMs + pc.monsterMs * monsters;
}

/** What one DrawScroll call costs when it drew `strips` new 4 pixel strips. */
export function scrollCost(pc: PcCosts, strips: number): number {
  return pc.scrollPassMs + pc.stripMs * strips;
}
