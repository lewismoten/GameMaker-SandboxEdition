// The control descriptions and bindings shipped with Stick Man Stars.
import { expect, it } from 'vitest';
import { handleJoystick } from '@lewismoten/gamemaker-sandbox-engine/engine/character';
import { SEQ } from '../../kit/starter/ids';
import { GameSim } from './sim';

it('jumps from idle with the stick centered and button 1 pressed', () => {
  const { w } = new GameSim();
  w.clock++;
  w.jstickOn = true;
  w.joystick = () => ({ pos: 0, buttons: 1 });
  expect(handleJoystick(w)).toBe(true);
  expect(w.chr.cseq).toBe(SEQ.jump);
});
