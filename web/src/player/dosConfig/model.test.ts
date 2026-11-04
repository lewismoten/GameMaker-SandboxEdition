import { describe, expect, it } from 'vitest';
import { BUT_C, DRVR_C, INT_C, LAST_C, PORT_C, VCARD_C, choose, fromHardware, moveCursor, splitDriver, toHardware } from './model';

describe('cursor stops', () => {
  it('count as AskConfigData counts them', () => {
    expect([PORT_C, DRVR_C, INT_C, VCARD_C, BUT_C, LAST_C]).toEqual([2, 7, 9, 14, 24, 25]);
  });
  it('move Down and Up one stop and wrap at both ends', () => {
    expect(moveCursor(3, 'down')).toBe(4);
    expect(moveCursor(LAST_C, 'down')).toBe(0);
    expect(moveCursor(0, 'up')).toBe(LAST_C);
  });
  it('move Right and Left between the columns like the C switch', () => {
    expect(moveCursor(0, 'right')).toBe(VCARD_C); // None -> Auto-Detect
    expect(moveCursor(PORT_C, 'right')).toBe(INT_C); // port 220 -> interrupt 2
    expect(moveCursor(INT_C + 4, 'right')).toBe(VCARD_C + 7); // interrupt 10 -> ATI
    expect(moveCursor(VCARD_C, 'right')).toBe(0); // Auto-Detect -> None
    expect(moveCursor(DRVR_C, 'right')).toBe(VCARD_C + 9);
    expect(moveCursor(DRVR_C + 1, 'right')).toBe(BUT_C);
    expect(moveCursor(BUT_C, 'right')).toBe(LAST_C);
    expect(moveCursor(LAST_C, 'right')).toBe(DRVR_C + 1);
    expect(moveCursor(BUT_C, 'left')).toBe(DRVR_C + 1);
    expect(moveCursor(INT_C, 'left')).toBe(PORT_C);
    expect(moveCursor(VCARD_C + 9, 'left')).toBe(DRVR_C);
  });
});

describe('choices', () => {
  const s = fromHardware();
  it('start as a PC with no BLASTER setting and the standard driver', () => {
    expect(s).toEqual({ sound: 1, port: 0x220, irq: 7, vga: 0, driverName: 'sndblast.drv', driverPath: '.\\' });
  });
  it('are set by Enter on the stop', () => {
    expect(choose(s, 0).sound).toBe(0);
    expect(choose(s, PORT_C + 3).port).toBe(0x250);
    expect(choose(s, INT_C + 4).irq).toBe(9);
    expect(choose(s, VCARD_C + 6).vga).toBe(6);
  });
  it('split a driver at its last backslash', () => {
    expect(splitDriver('C:\\SB\\sndblast.drv')).toEqual({ name: 'sndblast.drv', path: 'C:\\SB\\' });
    expect(splitDriver('x.drv')).toEqual({ name: 'x.drv', path: '' });
  });
});

describe('the browser preferences', () => {
  it('map None to PC speaker only and Auto-Detect to auto', () => {
    const h = toHardware({ ...fromHardware(), sound: 0 });
    expect(h.sound).toBe('speaker');
    expect(h.video).toBe('auto');
  });
  it('map every other chip type to the standard VGA and keep the DOS-only fields', () => {
    const h = toHardware({ ...fromHardware(), vga: 8, irq: 9, port: 0x240, driverPath: '', driverName: 'a.drv' });
    expect(h).toEqual({ sound: 'blaster', video: 'vga', dos: { vga: 8, port: 0x240, irq: 10, driver: '.\\a.drv' } });
  });
  it('turn the even-count interrupts into the real 2 and 10 and back', () => {
    const dos = (irq: number) => ({ vga: 0, port: 0x220, irq, driver: '.\\s.drv' });
    expect(toHardware({ ...fromHardware(), irq: 1 }).dos?.irq).toBe(2);
    expect(fromHardware({ sound: 'blaster', video: 'auto', dos: dos(2) }).irq).toBe(1);
    expect(fromHardware({ sound: 'blaster', video: 'auto', dos: dos(10) }).irq).toBe(9);
    expect(fromHardware({ sound: 'blaster', video: 'auto', dos: dos(4) }).irq).toBe(7);
  });
  it('read what the web dialog saved: speaker is None, standard VGA is Standard VGA', () => {
    const s = fromHardware({ sound: 'speaker', video: 'vga' });
    expect([s.sound, s.vga]).toEqual([0, 1]);
  });
  it('ignore a chip type that disagrees with the saved auto/standard choice', () => {
    expect(fromHardware({ sound: 'blaster', video: 'auto', dos: { vga: 5, port: 0x220, irq: 7, driver: 'a' } }).vga).toBe(0);
  });
  it('repair a bad port', () => {
    expect(fromHardware({ sound: 'blaster', video: 'auto', dos: { vga: 0, port: 0x300, irq: 7, driver: 'a' } }).port).toBe(0x220);
  });
});
