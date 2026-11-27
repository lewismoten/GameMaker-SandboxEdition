// Runs inside the home page during the cross-engine smoke check.
export function homeOverflow(viewportWidth: number): number {
  return document.documentElement.scrollWidth - viewportWidth;
}
