// 32x16 test artwork: R=30+6*x, G=20+10*y, B=60*floor(x/8), encoded locally
// with libjpeg-turbo 3.2.0 cjpeg (quality 70, 1x1 sampling). No encoder code is bundled.
import { describe, expect, it } from 'vitest';
import { decodePartialJpeg } from '@lewismoten/gamemaker-sandbox-engine/formats/jpeg';

const baseline = Uint8Array.from(
  Buffer.from(
    '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAoHBwgHBgoICAgLCgoLDhgQDg0NDh0VFhEYIx8lJCIfIiEmKzcvJik0KSEiMEExNDk7Pj4+JS5ESUM8SDc9Pjv/2wBDAQoLCw4NDhwQEBw7KCIoOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozv/wAARCAAQACADAREAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDz+Kw9q8mVYqlXNGKw9q9KVY76Vc0YrD2r0pVT0KVc0IrD2r0ZVjvpVylFYe1fmsqp+bUq5oxWHtXpSrHfSrmjFYe1ejKsehSrmjFYe1elKqd9Kuf/2Q==',
    'base64',
  ),
);
const progressive = Uint8Array.from(
  Buffer.from(
    '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAoHBwgHBgoICAgLCgoLDhgQDg0NDh0VFhEYIx8lJCIfIiEmKzcvJik0KSEiMEExNDk7Pj4+JS5ESUM8SDc9Pjv/2wBDAQoLCw4NDhwQEBw7KCIoOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozv/wgARCAAQACADAREAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABAMG/8QAFwEBAQEBAAAAAAAAAAAAAAAABAMGAf/aAAwDAQACEAMQAAABz5OoTdKUIQiGazSUoQlCU3//xAAWEAADAAAAAAAAAAAAAAAAAAAAAQL/2gAIAQEAAQUCUCgUCgUCgUCg/8QAFREBAQAAAAAAAAAAAAAAAAAAAgD/2gAIAQMBAT8BLi4uLi4uLi7/xAAWEQADAAAAAAAAAAAAAAAAAAAAAQL/2gAIAQIBAT8BdjsdDsdDsdjo/8QAFBABAAAAAAAAAAAAAAAAAAAAMP/aAAgBAQAGPwIP/8QAFBABAAAAAAAAAAAAAAAAAAAAMP/aAAgBAQABPyEFVV//2gAMAwEAAgADAAAAEBSuof/EABQRAQAAAAAAAAAAAAAAAAAAADD/2gAIAQMBAT8QD/8A/wD/xAAUEQEAAAAAAAAAAAAAAAAAAAAw/9oACAECAQE/EABEH//EABUQAQEAAAAAAAAAAAAAAAAAAABh/9oACAEBAAE/EJpppppppv/Z',
    'base64',
  ),
);
const restarted = Uint8Array.from(
  Buffer.from(
    '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAoHBwgHBgoICAgLCgoLDhgQDg0NDh0VFhEYIx8lJCIfIiEmKzcvJik0KSEiMEExNDk7Pj4+JS5ESUM8SDc9Pjv/2wBDAQoLCw4NDhwQEBw7KCIoOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozv/wAARCAAQACADAREAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/90ABAAB/9oADAMBAAIRAxEAPwDz+Kw9q8mVYqlXP//Q5CKw9qzlWPRpVz//0cGKw9q7pVT6GlXP/9KjFYe1e/KsfYUq5//TxIrD2r5SVU8alXP/1KsVh7V40qxy0q5//9WeKw9q55VjalXP/9bYisPauqVU9WlXP//Z',
    'base64',
  ),
);
const decode = (bytes: Uint8Array, end = bytes.length) => decodePartialJpeg(bytes.subarray(0, end))!;
const shown = (bytes: Uint8Array) => bytes.reduce((n, v) => n + v, 0);

describe('incremental JPEG MCUs', () => {
  it('reveals only the first completed DC blocks while the initial progressive scan arrives', () => {
    expect(shown(decode(progressive, 242).shown)).toBe(0);
    const first = decode(progressive, 243);
    expect(first.scans).toBe(0);
    expect(shown(first.shown)).toBe(64);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 32; x++) expect(first.shown[y * 32 + x]).toBe(x < 8 && y < 8 ? 1 : 0);
    expect(shown(decode(progressive, 248).shown)).toBe(256);
    expect(shown(decode(progressive, 257).shown)).toBe(512);
  });
  it('rolls back a partial baseline MCU, including components already decoded in it', () => {
    expect(decode(baseline, 627).pixels).toEqual(decode(baseline, 623).pixels);
    expect(shown(decode(baseline, 627).shown)).toBe(0);
    expect(shown(decode(baseline, 665).shown)).toBe(256);
  });
  it('preserves the previous progressive scan until a refinement block is complete', () => {
    const before = decode(progressive, 291);
    expect(decode(progressive, 292).pixels).toEqual(before.pixels);
    expect(decode(progressive, 293).pixels).not.toEqual(before.pixels);
  });
  it('retains a committed MCU while a restart marker is still arriving', () => {
    const marker = restarted.findIndex((b, i) => b === 255 && restarted[i + 1] === 0xd0);
    expect(marker).toBeGreaterThan(0);
    const before = decode(restarted, marker);
    expect(shown(before.shown)).toBe(64);
    expect(decode(restarted, marker + 1).pixels).toEqual(before.pixels);
    expect(decode(restarted, marker + 2).pixels).toEqual(before.pixels);
    expect(decode(restarted).pixels).toEqual(decode(baseline).pixels);
  });
  it('finishes baseline and progressive encodings as the same full picture', () => {
    const a = decode(baseline),
      b = decode(progressive);
    expect(a.complete).toBe(true);
    expect(b.complete).toBe(true);
    expect(b.scans).toBe(10);
    expect(shown(a.shown)).toBe(512);
    expect(shown(b.shown)).toBe(512);
    expect(a.pixels).toEqual(b.pixels);
    // Independent libjpeg decode: these first RGB pixels differ by at most one IDCT roundoff.
    expect(Array.from(a.pixels.slice(0, 6))).toEqual([31, 23, 2, 34, 22, 0]);
  });
  it('lets damaged compressed bytes affect decoded blocks without changing earlier data', () => {
    const damaged = baseline.slice();
    damaged[670] ^= 0x20;
    const clean = decode(baseline),
      noisy = decode(damaged);
    expect(noisy.pixels).not.toEqual(clean.pixels);
    expect(noisy.pixels.slice(0, 32 * 8 * 3)).toEqual(clean.pixels.slice(0, 32 * 8 * 3));
    expect(baseline[670]).not.toBe(damaged[670]);
  });
});
