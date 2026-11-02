// Headless reference simulation for Node development and fixture verification.
export { Sim, type SimScene } from './kit/sceneSim';
export { GameSim, readDisk, diskSim, TICKS_PER_SECOND } from './kit/gameSim';
export { newCharInfo, type CharInfo } from '@lewismoten/gamemaker-sandbox-engine/engine/world';
export * from './kit/sceneInit';
export * from './kit/routeChecks';
export { type State as GameSimState } from './kit/gameSim';
