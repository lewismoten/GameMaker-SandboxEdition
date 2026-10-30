// Public, browser-safe indexed drawing APIs preserve dimensions, masks and shared-cell fills.
import { describe, expect, it } from 'vitest';
import { Pixels, turn90, turn180, flipX, flipY, shiftPixels, floodFill } from '@lewismoten/gamemaker-sandbox-tools/images';

describe('indexed surface tools', () => {
  it('transforms non-square pictures without losing palette indices or changing the source', () => {
    const p = new Pixels(2,3);p.px.set([1,2,3,4,5,255]);
    const turned=turn90(p);expect([turned.w,turned.h]).toEqual([3,2]);expect([...turned.px]).toEqual([5,3,1,255,4,2]);
    expect([...flipX(p).px]).toEqual([2,1,4,3,255,5]);expect([...flipY(p).px]).toEqual([5,255,3,4,1,2]);expect([...turn180(p).px]).toEqual([255,5,4,3,2,1]);
    expect([...p.px]).toEqual([1,2,3,4,5,255]);
  });
  it('shifts with wrapping on each dimension and supports shifts larger than the picture', () => {
    const p=new Pixels(2,3);p.px.set([1,2,3,4,5,6]);
    expect([...shiftPixels(p,1,0).px]).toEqual([2,1,4,3,6,5]);expect(shiftPixels(shiftPixels(p,7,-9),-7,9).px).toEqual(p.px);
  });
  it('does not cross missing cells and follows original pixels when a writer changes aliases ahead of the fill', () => {
    const masked=new Uint8Array(6);floodFill(masked,3,2,0,0,7,x=>x!==1);expect([...masked]).toEqual([7,0,0,7,0,0]);
    const shared=new Uint8Array(6);floodFill(shared,6,1,0,0,9,()=>true,(x,_y,v)=>{shared[x]=v;shared[(x+3)%6]=v;});expect([...shared]).toEqual([9,9,9,9,9,9]);
  });
  it('rejects incompatible dimensions and ignores a seed outside the picture or inside a hole', () => {
    expect(()=>floodFill(new Uint8Array(8),3,3,0,0,1)).toThrow(RangeError);
    const pixels=new Uint8Array(4);floodFill(pixels,2,2,-1,0,5);floodFill(pixels,2,2,0,0,5,()=>false);expect(pixels.some(Boolean)).toBe(false);
  });
});
