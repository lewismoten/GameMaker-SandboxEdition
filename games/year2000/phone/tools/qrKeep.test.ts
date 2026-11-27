// Check the standard board's layout with the module counts from its rendered plates.
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';
import manifest from '../kicad/qr_spots.json';

it.each([0, 4])('reserves both complete QR matrices with %i additional modules per side', (extraModules) => {
  const codes = Object.values(manifest.codes).map((code) => ({ ...code, modules: code.modules + extraModules }));
  const probe = `
import json, sys
from unittest.mock import Mock
sys.modules["cv2"] = Mock()
import silkart
sizes = json.load(sys.stdin)
silkart.qr_matrix = lambda url: [[True] * sizes[url]] * sizes[url]
from qr_layout import QR_KEEP
print(json.dumps([QR_KEEP[url] for url in sizes]))
`;
  const reservations = execFileSync('python3', ['-B', '-c', probe], {
    cwd: fileURLToPath(new URL('.', import.meta.url)),
    input: JSON.stringify(Object.fromEntries(codes.map(({ url, modules }) => [url, modules]))),
    encoding: 'utf8',
  });
  expect(JSON.parse(reservations)).toEqual(codes.map(({ x, y, modules, module_mm }) => [x, y, x + modules * module_mm, y + modules * module_mm]));
});
