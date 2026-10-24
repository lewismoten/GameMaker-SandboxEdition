// Mrs. Novak's TTY script: turns end with GA or SK, topics come up once, and she signs off kindly.
import { describe, expect, it } from 'vitest';
import { endsTurn, GOODBYE, GREETING, newTalk, reply } from './ttyTalk';
import { ttyText } from './baudot';

describe('the TTY conversation', () => {
  it('knows when a turn ends', () => {
    expect(endsTurn('hi there ga')).toBe(true);
    expect(endsTurn('THX GA OR SK')).toBe(true);
    expect(endsTurn('BYE SK SK')).toBe(true);
    expect(endsTurn('I AM GAME')).toBe(false);
    expect(endsTurn('HELLO')).toBe(false);
  });

  it('greets, explains, and ends every turn with GA', () => {
    const talk = newTalk();
    const hi = reply(talk, 'HI GA');
    expect(hi.text).toMatch(/^OH HI!.* GA$/);
    expect(reply(talk, 'WHAT DOES GA MEAN Q GA').text).toMatch(/^GA MEANS GO AHEAD/);
    expect(reply(talk, 'HOW DOES UR TTY WORK Q GA').text).toMatch(/ABOUT 6 A SECOND/);
    expect(reply(talk, 'what is the relay q ga').text).toMatch(/OPERATOR/);
    expect(reply(talk, 'IS IT SNOWING Q GA').text).toMatch(/XXX CARDINALS/);
  });

  it('brings a topic up once, then moves on', () => {
    const talk = newTalk();
    reply(talk, 'HELLO GA');
    const first = reply(talk, 'TELL ME ABOUT TURBO GA').text;
    expect(first).toMatch(/TURBO CODE/);
    expect(reply(talk, 'TURBO GA').text).not.toBe(first);
  });

  it('asks if you are there after an empty turn', () => {
    expect(reply(newTalk(), 'GA').text).toBe('U THERE Q GA');
  });

  it('offers GA OR SK after a long talk, and signs off with SK SK', () => {
    const talk = newTalk();
    let last = '';
    for (let i = 0; i < 7; i++) last = reply(talk, 'OK GA').text;
    expect(last).toMatch(/GA OR SK$/);
    const bye = reply(talk, 'THX GA OR SK');
    expect(bye).toEqual({ text: GOODBYE, end: true });
    expect(GOODBYE).toMatch(/SK SK$/);
  });

  it('only types what a TTY can send', () => {
    const talk = newTalk();
    const lines = [GREETING, GOODBYE];
    for (const turn of [
      'HI GA',
      'WHO IS THIS GA',
      'HOW R U GA',
      'SCHOOL GA',
      'WHAT DOES SK MEAN GA',
      'TTY GA',
      'RELAY GA',
      'TURBO GA',
      'SNOW GA',
      'HELP GA',
      'DOOR GA',
      'OK GA',
    ])
      lines.push(reply(talk, turn).text);
    for (const l of lines) expect(ttyText(l)).toBe(l);
  });
});
