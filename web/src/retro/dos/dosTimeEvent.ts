// Fired on window each time TIME at a DOS prompt shows the time (shell.ts). The desk listens:
// where its wall clock isn't drawn, asking the PC for the time stands in for pressing the clock
// (desk/props/clock.ts). Nothing listens on the DOS page.
export const DOS_TIME_EVENT = 'gm-dos-time';
