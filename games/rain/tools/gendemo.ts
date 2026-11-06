// Records every lesson once (including the in-step rain mistake) for the title demo.
import { recordDemo } from '../../kit/demoRecord';
import { play } from './play';
const { sim } = await play();
const keys = sim.segments.flatMap((s) => s.keys);
recordDemo(keys, Infinity, new URL('../src/demo.ts', import.meta.url));
