import { describe, expect, it } from 'vitest';
import { MAX_ZOOM, MIN_ZOOM, resetCam, turnCam, zoomCam } from './orbitCamera';
import { zoomAt } from './svgViewer';
import { isSvgHref } from './feelieItems';
import { sceneBody } from './balloonCubeScene';

describe('the orbit camera', () => {
  it('zooms between half size and four times, and no further', () => {
    const cam = { yaw: 0, pitch: 0, zoom: 1 };
    for (let i = 0; i < 40; i++) zoomCam(cam, 1.3);
    expect(cam.zoom).toBe(MAX_ZOOM);
    for (let i = 0; i < 80; i++) zoomCam(cam, 0.7);
    expect(cam.zoom).toBe(MIN_ZOOM);
  });
  it('turns, stops the pitch short of straight up, and resets to its start', () => {
    const cam = { yaw: 0.6, pitch: 0.3, zoom: 2 };
    turnCam(cam, 1, 5);
    expect(cam.yaw).toBeCloseTo(1.6);
    expect(cam.pitch).toBe(1.2);
    resetCam(cam, { yaw: 0.6, pitch: 0.3, zoom: 1 });
    expect(cam).toEqual({ yaw: 0.6, pitch: 0.3, zoom: 1 });
  });
});

describe('the die’s scene camera', () => {
  it('draws a different picture when the viewer turns or zooms, and the same one when it does not', () => {
    const size = { w: 300, h: 250, art: false };
    const plain = sceneBody(3.4, 't', size);
    expect(sceneBody(3.4, 't', { ...size, yaw: 0, pitch: 0, zoom: 1 })).toBe(plain);
    expect(sceneBody(3.4, 't', { ...size, yaw: 0.8 })).not.toBe(plain);
    expect(sceneBody(3.4, 't', { ...size, zoom: 2 })).not.toBe(plain);
  });
  it('can be drawn between two steps, and the turn is kept at every step', () => {
    const size = { w: 300, h: 250, art: false, yaw: 0.5, pitch: -0.2 };
    for (const pos of [0, 0.5, 2.5, 6.7, 11]) expect(sceneBody(pos, 't', size)).toContain('<');
    expect(sceneBody(2.5, 't', size)).not.toBe(sceneBody(2.5, 't', { ...size, yaw: 0, pitch: 0 }));
  });
});

describe('the SVG viewer', () => {
  it('zooms about the pointer, and recenters at fit size', () => {
    const v = zoomAt({ x: 0, y: 0, zoom: 1 }, 2, 100, 50);
    expect(v).toEqual({ x: -100, y: -50, zoom: 2 });
    expect(zoomAt(v, 0.1, 0, 0)).toEqual({ x: 0, y: 0, zoom: 1 });
    expect(zoomAt({ x: 0, y: 0, zoom: 11 }, 3).zoom).toBe(12);
  });
  it('opens only SVG links', () => {
    expect(isSvgHref('./laser/x/sheet.svg')).toBe(true);
    expect(isSvgHref('./laser/x/part.SVG?v=2')).toBe(true);
    expect(isSvgHref('./laser/x/sheet.png')).toBe(false);
  });
});
