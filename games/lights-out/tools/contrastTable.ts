// Prints the cave's contrast table (see contrast.ts).
//   cd web && npx vite-node ../games/lights-out/tools/contrastTable.ts
import { MIN_KIT, contrastTable } from './contrast';

for (const row of contrastTable())
  console.log(
    `shade ${row.shade}: floor edge ${row.path.toFixed(2)}, Kit ${(row.kit * 100).toFixed(0)}% of his colors at ${MIN_KIT}+, wall ${row.wall.toFixed(2)}`,
  );
