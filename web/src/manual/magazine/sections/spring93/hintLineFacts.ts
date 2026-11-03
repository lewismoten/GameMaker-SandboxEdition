// Teddy's Hint Kennel as the magazine prints it. The desk's phone answers it (desk/room/phone/
// hintLine.ts, hintBill.ts); the magazine may not load desk code, so hintLineFacts.test.ts checks
// these against the desk's own number and rate.
export const HINT_LINE_NUMBER = '1-900-555-0144';
export const HINT_LINE_CENTS_PER_MINUTE = 199;
/** The rate as printed: "$1.99". */
export const HINT_LINE_RATE = `$${(HINT_LINE_CENTS_PER_MINUTE / 100).toFixed(2)}`;
