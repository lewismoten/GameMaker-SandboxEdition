// Tests for scripts/look.mjs (npm run look): argument parsing, shot-name resolution and the two bridge calls, with a fake fetch.
import { describe, expect, it } from 'vitest';
import { OCR_THRESHOLDS, look, mergeWords, parseArgs, parseTsv, preprocessArgs, resolveShot, tesseractArgs, textHas } from '../../scripts/look.mjs';

const shots = [{ name: 'CYD' }, null, { name: 'R-HDMI' }];

describe('look', () => {
  it('parses options', () => {
    expect(parseArgs(['R-HDMI', '--width', '640', '--crop', '0,0.5,1,0.5', '--expect', 'ok'])).toMatchObject({
      shot: 'R-HDMI',
      width: 640,
      crop: [0, 0.5, 1, 0.5],
      expect: 'ok',
      ocr: true,
    });
    expect(parseArgs([]).shot).toBeNull();
    expect(() => parseArgs(['1', '--crop', '1,2'])).toThrow(/crop/);
    expect(() => parseArgs(['1', '--width', '5'])).toThrow(/width/);
    expect(() => parseArgs(['1', '--say'])).toThrow(/unknown/);
  });
  it('parses the OCR options', () => {
    expect(parseArgs([])).toMatchObject({ ocrPsm: 11, ocrScale: 1.5 });
    expect(parseArgs(['--ocr-psm', '6', '--ocr-scale', '2'])).toMatchObject({ ocrPsm: 6, ocrScale: 2 });
    expect(() => parseArgs(['--ocr-psm', '2'])).toThrow(/psm/);
    expect(() => parseArgs(['--ocr-scale', '9'])).toThrow(/scale/);
    expect(() => parseArgs(['--ocr-psm'])).toThrow(/needs a value/);
  });
  it('builds the preprocessing and tesseract commands', () => {
    const a = preprocessArgs('in.jpg', 'out.png', 2, 200);
    expect(a.slice(-3, -1)).toEqual(['-vf', "format=gray,scale=iw*2:ih*2:flags=lanczos,lutyuv=y='if(gt(val,200),255,0)'"]);
    expect(a[a.indexOf('-i') + 1]).toBe('in.jpg');
    expect(a.at(-1)).toBe('out.png');
    expect(tesseractArgs('x.png', 6)).toEqual(['x.png', 'stdout', '--psm', '6', 'tsv']);
    expect(OCR_THRESHOLDS.length).toBeGreaterThan(1);
  });
  it('keeps confident words from tesseract TSV and merges reads', () => {
    const row = (conf, w) => ['5', '1', '1', '1', '1', '1', '0', '0', '9', '9', conf, w].join('\t');
    const tsv = ['level\tpage', row(90, 'BOOT'), row(30, 'xq'), row(75, '15'), row(80, 'HOST'), row(10, '')].join('\n');
    expect(parseTsv(tsv)).toEqual({ all: 'BOOT xq 15 HOST', text: 'BOOT HOST' });
    expect(mergeWords({ all: 'a Boot', text: 'Boot' }, { all: 'boot Host', text: 'boot Host' })).toEqual({ all: 'a Boot Host', text: 'Boot Host' });
  });
  it('resolves a slot, a name and a prefix', () => {
    expect(resolveShot(shots, '3')).toBe(3);
    expect(resolveShot(shots, 'cyd')).toBe(1);
    expect(resolveShot(shots, 'r-')).toBe(3);
    expect(() => resolveShot(shots, '2')).toThrow(/empty/);
    expect(() => resolveShot(shots, 'nope')).toThrow(/saved: 1 CYD, 3 R-HDMI/);
  });
  it('matches expected text loosely', () => {
    expect(textHas('Hello\n  World', 'hello world')).toBe(true);
    expect(textHas('abc', 'xyz')).toBe(false);
  });
  it('lists shots then goes once', async () => {
    const calls = [];
    const fake = async (url, init = {}) => {
      calls.push([url, init.method ?? 'GET', init.body, init.headers.Authorization]);
      if (url.endsWith('/api/shots')) return new Response(JSON.stringify(shots));
      return new Response(new Uint8Array([1, 2, 3]), { headers: { 'x-gj-settled': '1' } });
    };
    const r = await look({ shot: 'r-hdmi', width: 800, crop: null }, 'tok', fake);
    expect(r).toMatchObject({ slot: 3, settled: '1' });
    expect(r.jpeg.length).toBe(3);
    expect(calls).toHaveLength(2);
    expect(calls[1][1]).toBe('POST');
    expect(JSON.parse(calls[1][2])).toEqual({ shot: 3, width: 800 });
    expect(calls[1][3]).toBe('Bearer tok');
  });
  it('takes the current view with no shot', async () => {
    const urls = [];
    const fake = async (url) => {
      urls.push(url);
      return new Response(new Uint8Array([9]));
    };
    const r = await look({ shot: null, width: 640, crop: [0, 0, 0.5, 0.5] }, 't', fake);
    expect(r.slot).toBeNull();
    expect(urls).toEqual(['http://127.0.0.1:8787/api/snapshot.jpg?width=640&crop=0%2C0%2C0.5%2C0.5']);
  });
  it('says how to start the bridge when it is down', async () => {
    const down = async () => {
      throw new Error('ECONNREFUSED');
    };
    await expect(look({ shot: '1', width: 640 }, 't', down)).rejects.toThrow(/npm start/);
  });
});
