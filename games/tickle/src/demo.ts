// DEMO.REC: what plays on the title screen when nobody touches the keyboard: the start of the
// bot's own run through the classroom (tools/gendemo.ts writes RECORDED), as pairs of [ticks
// since the last key, PC scan code; +128 = released], ending with Esc.
import {recordedDemo} from '@lewismoten/gamemaker-sandbox-tools/kit/recordedDemo';

const RECORDED: number[] = [1, 77, 37, 205, 0, 44, 1, 172, 12, 45, 1, 173, 54, 77, 26, 205, 6, 18, 8, 146, 0, 77, 0, 205, 6, 44, 1, 172, 12, 45, 1, 173, 16, 77, 22, 205, 15, 77, 22, 205, 0, 44, 1, 172, 12, 45, 1, 173, 10, 77, 29, 205, 6, 18, 8, 146, 0, 77, 0, 205, 6, 77, 15, 205, 15, 77, 8, 205, 0, 44, 1, 172, 12, 45, 1, 173, 10, 77, 28, 205, 6, 18, 8, 146, 0, 77];

export function demoRecording():Uint8Array { return recordedDemo(RECORDED,30,4); }
