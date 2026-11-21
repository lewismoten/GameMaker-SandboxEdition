// Sand, wood and toy-plastic materials for the Sandbox logo scene.
import { grain, Material, mix, noise, scale, Surface, V } from '@lewismoten/gamemaker-sandbox-tools/kit/raytrace';

export const surface = (color: V, o: Partial<Surface> = {}): Surface => ({ color, kd: 0.9, ks: 0, shine: 10, mirror: 0, ...o });
export const plain =
  (color: V, o: Partial<Surface> = {}): Material =>
  () =>
    surface(color, o);

/** Dry sand, grainy, with soft ripples. */
export const sand: Material = (h) => {
  const [x, y, z] = h.p;
  const g = grain(x, y, z, 70) * 0.14 + grain(x, y, z, 23) * 0.08;
  const ripple = noise(x * 3.1, z * 3.1, 1.7) * 0.06;
  return surface(scale([0.96, 0.8, 0.52], 0.86 + g + ripple));
};

/** Pine boards, the grain running along each board. */
export const wood =
  (along: 0 | 2): Material =>
  (h) => {
    const p = h.p;
    const a = p[along];
    const across = along === 0 ? p[2] : p[0];
    const ring = Math.sin((across * 40 + p[1] * 25 + noise(a * 1.5, across * 6, p[1] * 6) * 3) * 1.2) * 0.5 + 0.5;
    const c = mix([0.78, 0.52, 0.27], [0.55, 0.32, 0.15], ring * 0.55 + grain(a, p[1], across, 30) * 0.15);
    return surface(c, { ks: 0.12, shine: 14 });
  };

/** Shiny toy plastic. */
export const plastic = (color: V): Material => plain(color, { kd: 0.85, ks: 0.75, shine: 36, mirror: 0.1 });

export const RED: V = [0.92, 0.08, 0.06];
export const BLUE: V = [0.1, 0.26, 0.95];
export const YELLOW: V = [1.0, 0.82, 0.05];
