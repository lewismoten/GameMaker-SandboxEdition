// Regression tests for clipping and empty palette entries when meshing a solid for a color print.
import { expect, it } from 'vitest';
import { colorBodies, type BodiesOptions, type Rgb } from '@lewismoten/gamemaker-sandbox-tools/mesh/colorBodies';
import { tetraMesh } from '@lewismoten/gamemaker-sandbox-tools/mesh/tetraMesh';

const red: Rgb = [255, 0, 0];
const blue: Rgb = [0, 0, 255];
const sphere = (x: number, y: number, z: number) => Math.hypot(x, y, z) - 3;
const box: BodiesOptions = { min: [-4, -4, -4], max: [4, 4, 4], cell: 1 };
const redSphere = tetraMesh(sphere, box);
redSphere.colors = Uint8Array.from(redSphere.indices, (_, i) => red[i % 3]);

it('reports a color body clipped by the base sampling box', () => {
  expect(colorBodies(redSphere, [red], sphere, box)).toHaveLength(1);
  expect(() => colorBodies(redSphere, [red], sphere, { ...box, min: [-1, -1, -1], max: [1, 1, 1] })).toThrow('the surface leaves the box');
});

it('reports clipping even when every surface vertex is outside the sampling grid', () => {
  const largeSphere = (x: number, y: number, z: number) => Math.hypot(x, y, z) - 6;
  const mesh = tetraMesh(largeSphere, { ...box, min: [-7, -7, -7], max: [7, 7, 7] });
  mesh.colors = Uint8Array.from(mesh.indices, (_, i) => red[i % 3]);
  expect(() => colorBodies(mesh, [red, blue], largeSphere, { ...box, min: [-1, -1, -1], max: [1, 1, 1] })).toThrow('the surface leaves the box');
});

it('leaves out an unused palette color and keeps the complete red body', () => {
  const base = colorBodies(redSphere, [red], sphere, box);
  expect(colorBodies(redSphere, [red, blue], sphere, box)).toEqual(base);
});

it('keeps the base mesh if growth clips red while making a small blue body visible', () => {
  const bounds: BodiesOptions = { min: [-3, -8, -8], max: [10, 8, 8], cell: 1 };
  // The blue sphere fits between grid points at cell size 1. The finer input mesh captures both colors.
  const field = (x: number, y: number, z: number) => Math.min(sphere(x, y, z), Math.hypot(x - 6.5, y - 0.5, z - 0.5) - 0.4);
  const mesh = tetraMesh(field, { ...bounds, cell: 0.5 });
  mesh.colors = new Uint8Array(mesh.indices.length);
  for (let i = 0; i < mesh.indices.length; i += 3) mesh.colors.set(mesh.positions[mesh.indices[i] * 3] > 4 ? blue : red, i);
  const base = colorBodies(mesh, [red, blue], field, bounds);
  expect(base.map((b) => b.color)).toEqual([red]);
  expect(colorBodies(mesh, [red, blue], field, { ...bounds, volume: 300 })).toEqual(base);
});
