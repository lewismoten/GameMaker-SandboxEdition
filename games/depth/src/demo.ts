// DEMO.REC: what plays on the title screen when nobody touches the keyboard, recorded from
// the bot rolling the first scene (pairs of [ticks since the last key, PC scan code; +128 =
// released]), ending with Esc. Re-record with tools/gendemo.ts.
import {recordedDemo} from '@lewismoten/gamemaker-sandbox-tools/kit/recordedDemo';

const RECORDED: number[] = [2, 77, 15, 205, 1, 77, 10, 205, 1, 77, 10, 205, 1, 80, 5, 208, 1, 77, 5, 205, 1, 80, 8, 57, 1, 185, 6, 208, 1, 57, 0, 77, 1, 185, 31, 205, 10, 77, 20, 205, 1, 72, 10, 200, 1, 77, 10, 205, 1, 77, 10, 205, 1, 80, 15, 208, 1, 75, 6, 72, 15, 200, 1, 75, 5, 203, 1, 77, 10, 205, 1, 77, 30, 205, 1, 80, 2, 57, 1, 185, 7, 57, 0, 208, 1, 185, 0, 80, 32, 208, 10, 80, 10, 208, 1, 75, 5, 203, 1, 80, 20, 208, 1, 77, 5, 205];

export function demoRecording():Uint8Array { return recordedDemo(RECORDED,25,2); }
