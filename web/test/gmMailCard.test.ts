// The mail-in registration card: what it asks, the number it brings back, and no real address.
import { describe, expect, it } from 'vitest';
import { CARD_NAME_MAX, SERIAL, cardCheck, checkRegistration, regFile } from '../src/retro/gmReg/registration';
import { OWNER_ADDRESS, RSD_ADDRESS, mailCheck, replyTo } from '../src/retro/gmReg/mailCard';

describe('the mail-in registration card', () => {
  it('asks only for a name before it can be mailed', () => {
    expect(mailCheck('Teddy')).toBeUndefined();
    expect(mailCheck('  ')).toMatch(/name/);
    expect(mailCheck('A'.repeat(CARD_NAME_MAX + 1))).toMatch(/at most/);
  });

  it('comes back with a registration number GM accepts', () => {
    for (const name of ['Teddy', '  Gwinn ', 'Doc Leo', 'Z'.repeat(CARD_NAME_MAX)]) {
      const reply = replyTo({ name, bought: 'Post office', computer: '386' });
      expect(reply.name).toBe(name.trim());
      expect(reply.serial).toBe(SERIAL);
      expect(cardCheck(reply.name, reply.number)).toBeUndefined();
      expect(checkRegistration(regFile(reply.name, SERIAL, reply.number))).toEqual({ kind: 'registered', userName: reply.name });
    }
  });

  it('carries no real street address or P.O. box', () => {
    const text = [...RSD_ADDRESS, ...OWNER_ADDRESS].join('\n');
    expect(text).not.toMatch(/P\.?\s*O\.?\s*Box|\bBox\s+\d/i);
    expect(text).toMatch(/Joystick Way/);
    expect(text).toMatch(/Anytown, USA/);
  });
});
