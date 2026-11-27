// A title recording that stops at the next room must not certify the stuck coin.
import { rejects } from 'node:assert/strict';
import { parseRecording, serializeRecording } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';
import { demoRecording } from '../src/demo';
import { checkRecording } from './checkRecording';

const keys = parseRecording(demoRecording());
// The thirteenth event holds Right through the door. Release it at the next event.
const cut = [...keys.slice(0, 13), { ...keys[13], key: 205 }, ...keys.slice(-2)];
await rejects(checkRecording(serializeRecording(cut)), /expected the stuck coin to pay/);
