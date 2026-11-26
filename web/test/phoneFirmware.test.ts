// The phone's tracked firmware hex (games/year2000/phone/firmware/phone.hex and deluxe/'s) matches what gpasm makes of its
// phone.asm today, so the circuit board ZIP never ships a stale hex. Only recompilation needs gpasm.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const phone = resolve(import.meta.dirname, '../../games/year2000/phone');
const hasGpasm = ((): boolean => {
  try {
    execFileSync('gpasm', ['--version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
})();

describe('the phone firmware hex', () => {
  for (const build of ['.', 'deluxe']) {
    const dir = join(phone, build, 'firmware');
    it(`has the required firmware inputs for ${build}`, () => {
      for (const file of ['phone.asm', 'phone.hex']) expect(readFileSync(join(dir, file)).length).toBeGreaterThan(0);
    });

    it.skipIf(!hasGpasm)(
      `is current for ${build === '.' ? 'the Junior Lab' : 'the Deluxe'} build (run tools/build_firmware.sh after editing phone.asm)`,
      () => {
        const tmp = mkdtempSync(join(tmpdir(), 'phone-hex-'));
        try {
          execFileSync('gpasm', ['-p', 'p16f628a', '-w2', '-o', join(tmp, 'phone.hex'), join(dir, 'phone.asm')], { stdio: 'ignore' });
          expect(readFileSync(join(dir, 'phone.hex'), 'utf8')).toBe(readFileSync(join(tmp, 'phone.hex'), 'utf8'));
        } finally {
          rmSync(tmp, { recursive: true, force: true });
        }
      },
    );
  }
});
