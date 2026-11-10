# `desk/room/phone/`: the wall-phone line

Part of the [source map](../../../README.md).

Runs the wall phone, its keypad, simulated calls, captions and automated hint menu, sharing the modem line with the PC.

## Main modules

- [`phone.ts`](phone.ts): Manages handset state, dialing, speech cancellation, incoming calls and modem interruption.
- [`calls.ts`](calls.ts): Resolves dialed numbers and runs each simulated caller interaction.
- [`dialPad.ts`](dialPad.ts): Builds the keypad, status display, captions, memory buttons and hang-up control.
- [`captionPieces.ts`](captionPieces.ts): Splits captions at sentence boundaries to fit the display.
- [`sounds.ts`](sounds.ts): Synthesizes line tones, keypad tones, ringing and other call sounds.
- [`hintTree.ts`](hintTree.ts): Defines the hint-menu state and key transitions without audio or timers.
- [`hintLine.ts`](hintLine.ts): Runs the hint tree with speech, confirmation, timing and cancellation.
- [`hintBill.ts`](hintBill.ts): Tracks fictional whole-minute charges and their local storage limit.

## Loading

[`deskProps.ts`](../deskProps.ts) dynamically imports `phone.ts` when the handset is first used. The phone imports its call and keypad modules statically. `sounds.ts` is also imported statically by [`snowWindow.ts`](../snowWindow.ts), so it is not exclusive to the handset chunk.

## Tests

Colocated tests cover [`captionPieces`](captionPieces.test.ts), [`hintBill`](hintBill.test.ts), [`hintLine`](hintLine.test.ts) and [`hintTree`](hintTree.test.ts). [`phoneCalls.test.ts`](../../../../test/phoneCalls.test.ts) checks number routing; [`phoneLines.test.ts`](../../../../scripts/narrate/phoneLines.test.ts) checks recorded-line coverage.

Related areas: [room](../README.md), [phone voices](../../../audio/phone/README.md), [BBS](../../../retro/bbs/README.md).
