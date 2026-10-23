import { describe, expect, it } from 'vitest';
import { dosDate, dosTime, parseDosDate, parseDosTime } from './deskClock';

const base = new Date(1994, 9, 23, 14, 5, 6, 780);
const hm = (d?: Date) => (d ? [d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds()] : undefined);

describe('TIME', () => {
  it('prints the time as DOS 6.22 does', () => {
    expect(dosTime(new Date(1994, 9, 23, 21, 41, 7, 120))).toBe(' 9:41:07.12p');
    expect(dosTime(new Date(1994, 9, 23, 0, 5, 0, 0))).toBe('12:05:00.00a');
    expect(dosTime(new Date(1994, 9, 23, 12, 0, 0, 0))).toBe('12:00:00.00p');
  });
  it('reads 24-hour times', () => {
    expect(hm(parseDosTime('23:30', base))).toEqual([23, 30, 0, 0]);
    expect(hm(parseDosTime('7', base))).toEqual([7, 0, 0, 0]);
    expect(hm(parseDosTime('3:17:20.5', base))).toEqual([3, 17, 20, 500]);
    expect(hm(parseDosTime('7.05.09', base))).toEqual([7, 5, 9, 0]);
    expect(hm(parseDosTime('0:00', base))).toEqual([0, 0, 0, 0]);
  });
  it('reads a and p', () => {
    expect(hm(parseDosTime('11:30p', base))).toEqual([23, 30, 0, 0]);
    expect(hm(parseDosTime('11:30 PM', base))).toEqual([23, 30, 0, 0]);
    expect(hm(parseDosTime('12:00a', base))).toEqual([0, 0, 0, 0]);
    expect(hm(parseDosTime('12:15p', base))).toEqual([12, 15, 0, 0]);
    expect(hm(parseDosTime('9a', base))).toEqual([9, 0, 0, 0]);
  });
  it('keeps the day it was typed on', () => {
    const d = parseDosTime('1:00', base)!;
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([1994, 9, 23]);
  });
  it('turns down what DOS calls an invalid time', () => {
    for (const bad of ['24:00', '12:60', '1:2:60', '13:00p', '0:30a', 'noon', '', '1:30x', '-1', '1::2']) expect(parseDosTime(bad, base)).toBeUndefined();
  });
});

describe('DATE', () => {
  it('prints the date as DOS 6.22 does', () => {
    expect(dosDate(new Date(1994, 9, 23))).toBe('Sun 10-23-1994');
  });
  it('reads month-day-year with -, / or .', () => {
    const ymd = (d?: Date) => (d ? [d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getHours()] : undefined);
    expect(ymd(parseDosDate('12-25-94', base))).toEqual([1994, 12, 25, 14]);
    expect(ymd(parseDosDate('1/2/1995', base))).toEqual([1995, 1, 2, 14]);
    expect(ymd(parseDosDate('2.29.96', base))).toEqual([1996, 2, 29, 14]);
    expect(ymd(parseDosDate('3-4-05', base))).toEqual([2005, 3, 4, 14]);
  });
  it('turns down what DOS calls an invalid date', () => {
    for (const bad of ['13-01-94', '2-30-94', '2-29-95', '4-31-94', '0-1-94', '1-1-1979', '1-1-2100', 'today', '10-23', '']) expect(parseDosDate(bad, base)).toBeUndefined();
  });
});
