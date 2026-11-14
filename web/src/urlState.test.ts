import { describe, expect, it } from 'vitest';
import { parseHash } from './urlState';

describe('parseHash params', () => {
  it('reads settings', () => {
    expect(parseHash('#/p/abc/file.mon?monster=3').params.monster).toBe('3');
  });
  it('keeps __proto__ and constructor as plain keys with no prototype', () => {
    const { params } = parseHash('#/x?__proto__=a&constructor=b');
    expect(Object.getPrototypeOf(params)).toBeNull();
    expect(Object.keys(params).sort()).toEqual(['__proto__', 'constructor']);
    expect(params.constructor).toBe('b');
    expect(parseHash('#/x').params.constructor).toBeUndefined();
    expect(parseHash('#/x').params.toString).toBeUndefined();
  });
});
