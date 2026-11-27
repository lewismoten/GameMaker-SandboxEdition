// Decide whether the player survived the scripted monster encounter.
export function bumpPassed(before: number, least: number, after: number, deaths: number, touched: boolean, expectedLoss: number): boolean {
  return deaths === 0 && after > 0 && touched && before - least === expectedLoss;
}
