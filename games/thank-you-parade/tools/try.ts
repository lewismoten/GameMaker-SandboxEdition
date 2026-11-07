// Scratch runner: plays the first N levels (BOT_LOG=1 prints every step).
//   cd web && BOT_LOG=1 npx vite-node ../games/thank-you-parade/tools/try.ts 1
import { play } from './play';

const n = Number(process.argv[2] ?? 1);
try {
  const { sim } = await play(1, n);
  console.log(`ok: ${n} levels, score ${sim.ci.score}, ticks ${sim.ticks}`);
} catch (e) {
  console.log(String(e instanceof Error ? e.message : e).slice(0, 900));
}
