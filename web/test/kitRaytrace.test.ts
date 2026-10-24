// games/kit/raytrace: shapes, placing, groups, shadows and the camera.
import { describe, expect, it } from 'vitest';
import { blocked, Box, Camera, Capsule, Cone, Group, nearest, norm, placed, Ring, rotY, Sphere, Tri, type Material } from '../../games/kit/raytrace';

const m: Material = () => ({ color: [1, 1, 1], kd: 1, ks: 0, shine: 1, mirror: 0 });
const down = norm([0, -1, 0]);

describe('kit raytracer', () => {
  it('finds each shape at the right distance from above', () => {
    const o: [number, number, number] = [0, 10, 0];
    expect(new Box([-1, 0, -1], [1, 2, 1], placed(), m).hit(o, down, 1e9)?.t).toBeCloseTo(8);
    expect(new Sphere(1, placed([0, 3, 0]), m).hit(o, down, 1e9)?.t).toBeCloseTo(6);
    expect(new Cone(0.5, 0.2, 0, 4, placed(), m).hit(o, down, 1e9)?.t).toBeCloseTo(6);
    expect(new Ring(0, 1, placed([0, 1, 0]), m).hit(o, down, 1e9)?.t).toBeCloseTo(9);
    expect(new Ring(0.5, 1, placed([0, 1, 0]), m).hit(o, down, 1e9)).toBeUndefined();
    expect(new Capsule([-1, 2, 0], [1, 2, 0], 0.5, placed(), m).hit(o, down, 1e9)?.t).toBeCloseTo(7.5);
    expect(new Tri([-1, 1, -1], [1, 1, -1], [0, 1, 1], placed(), m).hit(o, down, 1e9)?.t).toBeCloseTo(9);
  });

  it('places, rotates and scales shapes, and normals face the ray', () => {
    const b = new Box([0, 0, 0], [1, 1, 1], placed([5, 0, 0], rotY(Math.PI), 2), m);
    // rotated half a turn about y, the box runs from x 3 to 5 and z -2 to 0
    const h = b.hit([4, 10, -1], down, 1e9);
    expect(h?.t).toBeCloseTo(8);
    expect(h?.n[1]).toBeCloseTo(1);
    expect(b.hit([5.5, 10, -1], down, 1e9)).toBeUndefined();
  });

  it('a group gives its nearest part, and anything in the way blocks the light', () => {
    const near = new Sphere(0.5, placed([0, 5, 0]), m);
    const far = new Sphere(0.5, placed([0, 2, 0]), m);
    const g = new Group([far, near]);
    expect(nearest([g], [0, 10, 0], down)?.shape).toBe(near);
    expect(blocked([g], [0, 0, 0], [0, 1, 0])).toBe(true);
    expect(blocked([g], [3, 0, 0], [0, 1, 0])).toBe(false);
  });

  it('the camera projects what its rays point at', () => {
    const cam = new Camera([0, 1, -5], [0, 1, 0], 300);
    const p = cam.project([1, 2, 0])!;
    const d = cam.ray(p[0], p[1]);
    const t = 5 / d[2];
    expect(d[0] * t).toBeCloseTo(1);
    expect(1 + d[1] * t).toBeCloseTo(2);
  });
});
