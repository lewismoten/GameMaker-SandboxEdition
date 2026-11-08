// Courier ids (a screen's home id, a trip id): UUID version 4 in shape and random, with a mark and
// a check digit so a mistyped or damaged one is caught. Of the 32 hex digits (0 to 31, dashes left
// out, groups 8-4-4-4-12):
//
//   digit 12  '4'      the UUID version (standard)
//   digit 13  'c'      the courier mark, so an eye can spot one of ours: xxxxxxxx-xxxx-4cxx-...
//   digit 16  8 to b   the UUID variant (standard)
//   digit 24  check    Luhn mod 16 over the other 31 digits in order (the 5th group's fifth digit)
//
// The rest, 114 bits, comes from crypto.randomUUID or crypto.getRandomValues and is derived from
// nothing: no time, MAC, hardware or serial number, user agent or world name. The check catches every
// single-digit typo and most swapped neighbors. It is NOT security: the code is open, so anyone can
// make a valid id; the capsule's CRC-32 and the store's guards do the real checking.
//
// Portable to C for the CYD and the Pi as written: fill 16 bytes from the hardware RNG (ESP32:
// esp_random() with the radio on, or bootloader_random_enable(); Pi: /dev/hwrng or getrandom),
// never from the efuse MAC or a serial number; set the version, mark and variant digits; then the
// check digit from luhn16 below (a loop over 31 digits, no tables).

const VERSION_AT = 12;
const MARK_AT = 13;
const VARIANT_AT = 16;
const CHECK_AT = 24;
const MARK = 0xc;
const SHAPE = /^[0-9a-f]{8}-[0-9a-f]{4}-4c[0-9a-f]{2}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

/** Luhn mod 16: the digit that makes the sequence check out (from the right, every second digit doubled, its two base-16 digits added). */
export function luhn16(digits: readonly number[]): number {
  let sum = 0;
  let double = true;
  for (let i = digits.length - 1; i >= 0; i--) {
    let v = digits[i] * (double ? 2 : 1);
    v = Math.floor(v / 16) + (v % 16);
    sum += v;
    double = !double;
  }
  return (16 - (sum % 16)) % 16;
}

const others = (d: readonly number[]) => d.filter((_, i) => i !== CHECK_AT);
const dashed = (d: readonly number[]) => {
  const s = d.map((x) => x.toString(16)).join('');
  return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20)}`;
};

/** A new courier id from 128 random bits (`randomUUID` false uses getRandomValues, as a page outside a secure context must). */
export function makeCourierId(randomUUID = typeof crypto.randomUUID === 'function'): string {
  const hex = randomUUID
    ? crypto.randomUUID().replace(/-/g, '')
    : Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join('');
  const d = [...hex].map((c) => parseInt(c, 16));
  d[VERSION_AT] = 4;
  d[MARK_AT] = MARK;
  d[VARIANT_AT] = 8 | (d[VARIANT_AT] & 3);
  d[CHECK_AT] = luhn16(others(d));
  return dashed(d);
}

/** Whether `v` is a courier id: the shape and mark first (quick), then the check digit. */
export function isCourierId(v: unknown): v is string {
  if (typeof v !== 'string' || !SHAPE.test(v)) return false;
  const d = [...v.replace(/-/g, '')].map((c) => parseInt(c, 16));
  return luhn16(others(d)) === d[CHECK_AT];
}
