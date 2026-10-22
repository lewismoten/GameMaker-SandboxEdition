// How light it is outside right now, by the visitor's own clock: a winter day like the
// one in 1992, sunrise about 7:15 and sunset about 4:55, with an hour of dusk either side.
const SUNRISE = 7.25;
const SUNSET = 16.9;
const TWILIGHT = 1;

/** 0 at night, 1 in daylight, in between at dawn and dusk. */
export function daylight(now = new Date()): number {
  const h = now.getHours() + now.getMinutes() / 60;
  const ramp = (x: number) => Math.max(0, Math.min(1, x));
  return Math.min(ramp((h - (SUNRISE - TWILIGHT / 2)) / TWILIGHT), ramp((SUNSET + TWILIGHT / 2 - h) / TWILIGHT));
}

/** Calls back now and whenever the light changes noticeably (checked each minute). */
export function watchDaylight(onChange: (light: number) => void): () => void {
  let last = -1;
  const check = () => {
    const d = Math.round(daylight() * 20) / 20;
    if (d !== last) onChange((last = d));
  };
  check();
  const id = setInterval(check, 60_000);
  return () => clearInterval(id);
}
