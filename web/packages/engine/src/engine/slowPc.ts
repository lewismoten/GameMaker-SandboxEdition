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
  /** Each animated map cell redrawn on screen that tick (up to 170 dirty rectangles, DIRTRECT.C MAXDIRTY). */
  cellMs?: number;
  /** Disk read of a .voc (PlaySbVocFile reads the whole file on the game's own thread): fixed cost to open it. */
  vocOpenMs?: number;
  /** ...and how many bytes a millisecond the disk then delivers. */
  vocBytesPerMs?: number;
  /**
   * The largest .voc the far heap still has room for (PlaySbVocFile `new`s the whole file; when that
   * fails it returns FALSE and the game goes on without the sound). An estimate: 640 KB less DOS,
   * drivers and PLAYGAME's own data. Left out, any size fits.
   */
  vocHeapBytes?: number;
  /**
   * The timer interrupt waits while the disk is read (the BIOS read keeps interrupts off), so the music,
   * which PlayIt advances one step per interrupt, stands still for the read: the FM chip holds the notes
   * it was playing, and the song goes on afterward from where it stopped, later than it would have been.
   */
  readHoldsMusic?: boolean;
  /** The timer interrupt itself (entry, EOI, PlayIt's bookkeeping; the BIOS clock every 8th), per interrupt. */
  isrMs?: number;
  /** Each CMF event PlayIt hands the FM driver (the driver call, without its register writes). */
  fmEventMs?: number;
  /** Each OPL2 register write: about 3.3 µs after the address and 23 µs after the data, waited out on the ISA bus. */
  fmWriteMs?: number;
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

/** What one game tick costs with `monsters` drawn on screen and `cells` animated map cells redrawn. */
export function tickCost(pc: PcCosts, monsters: number, cells = 0): number {
  return pc.tickMs + pc.monsterMs * monsters + (pc.cellMs ?? 0) * Math.min(cells, 170);
}

/** What one DrawScroll call costs when it drew `strips` new 4 pixel strips. */
export function scrollCost(pc: PcCosts, strips: number): number {
  return pc.scrollPassMs + pc.stripMs * strips;
}

/**
 * "Run like a..." in the player: the same cost model as TURBO_OFF for three machines of the
 * period. Every number is an ESTIMATE from period hardware figures, not a measurement
 * (programmer's guide chapters 10b and 12). A quiet tick is the game's work plus the copy of
 * the changed rectangles to the screen. The timer interrupt and the music (about 1% of a 286)
 * are charged per interrupt (songIsrMs). Today (no costs) is a fast modern machine.
 */
export type SpeedChoice = 'today' | '486' | '386' | '286' | 'ps1';

export const SPEED_CHOICES: readonly SpeedChoice[] = ['today', '486', '386', '286', 'ps1'];

export const SPEED_PRESETS: Record<Exclude<SpeedChoice, 'today'>, PcCosts> = {
  // 286 at 12 MHz, IDE disk about 400 KB/s, 30 ms to open a file; 20 monsters fill a tick
  '286': { tickMs: 20, monsterMs: 1.8, scrollPassMs: 3.3, stripMs: 2, cellMs: 0.25, vocOpenMs: 30, vocBytesPerMs: 400, ...music(0.035, 0.033) },
  // 386DX-33, disk about 800 KB/s, 18 ms to open
  '386': { tickMs: 9, monsterMs: 0.8, scrollPassMs: 1.5, stripMs: 0.8, cellMs: 0.12, vocOpenMs: 18, vocBytesPerMs: 800, ...music(0.016, 0.015) },
  // 486DX2-66, disk about 1.5 MB/s, 12 ms to open
  '486': { tickMs: 4, monsterMs: 0.35, scrollPassMs: 0.7, stripMs: 0.4, cellMs: 0.05, vocOpenMs: 12, vocBytesPerMs: 1500, ...music(0.007, 0.006) },
  // IBM PS/1 Model 2011: a 286 at 10 MHz (the 286-12's CPU costs times 1.2), 1 MB, a small slow hard disk
  // (about 80 ms to find a file and about 150 KB/s after that), no disk cache, no EMS. PLAYGAME reads a
  // .voc whole from the disk every time it plays one and keeps nothing between plays, so the cache a
  // roomier PC might have added never helps here; the extra 384 KB above 640 KB is out of PLAYGAME's reach.
  // DOS 4 lives in the PS/1's ROM, so only its data takes conventional memory (about 45 KB more for the
  // game than a DOS loaded from disk): about 145 KB of the far heap is left once DOS's data, drivers and
  // the game's own data have their share.
  ps1: {
    tickMs: 24,
    monsterMs: 2.2,
    scrollPassMs: 4,
    stripMs: 2.4,
    cellMs: 0.3,
    vocOpenMs: 80,
    vocBytesPerMs: 150,
    vocHeapBytes: 145_000,
    ...music(0.042, 0.04),
  },
};

/**
 * The music's share of a slow PC (all estimates): the disk read holds the timer, the interrupt's own cost,
 * and the FM driver's per-event cost. A register write costs the same on every machine of the period
 * (the waits are the chip's, timed on the 8 MHz ISA bus).
 */
function music(isrMs: number, fmEventMs: number): Pick<PcCosts, 'readHoldsMusic' | 'isrMs' | 'fmEventMs' | 'fmWriteMs'> {
  return { readHoldsMusic: true, isrMs, fmEventMs, fmWriteMs: 0.03 };
}

/** The costs for a choice; undefined for Today (nothing is charged). */
export function costsFor(choice: SpeedChoice): PcCosts | undefined {
  return choice === 'today' ? undefined : SPEED_PRESETS[choice];
}

/**
 * How long reading a voice of `bytes` freezes the game: open plus transfer. PLAYGAME reads
 * the whole file before the tick goes on, so game time stops, and the sound only starts once the
 * read is over (the player waits that long). On a PC with readHoldsMusic the music stops for it too
 * (musicHoldMs). 0 when the PC has no disk figures (TURBO_OFF) or on Today.
 */
export function vocStallMs(pc: PcCosts | undefined, bytes: number): number {
  if (vocWontFit(pc, bytes)) return pc!.vocOpenMs ?? 0; // the file is opened, then the allocation fails
  if (!pc || pc.vocOpenMs === undefined || !pc.vocBytesPerMs) return 0;
  return pc.vocOpenMs + bytes / pc.vocBytesPerMs;
}

/** How long the music stands still for a disk read of `readMs` (0 on Today, the desk turbo, or a PC whose timer keeps going). */
export function musicHoldMs(pc: PcCosts | undefined, readMs: number): number {
  return pc?.readHoldsMusic ? readMs : 0;
}

/** True when the far heap cannot hold a .voc of `bytes`: PlaySbVocFile returns FALSE and nothing plays. */
export function vocWontFit(pc: PcCosts | undefined, bytes: number): boolean {
  return !!pc && pc.vocHeapBytes !== undefined && bytes > pc.vocHeapBytes;
}
