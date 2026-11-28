// Predicates shared by the twinkle route and recorded-demo checks.
export function hasChanged(samples: number[][]): boolean {
  const first = samples[0];
  return !!first && samples.slice(1).some((sample) => sample.some((value, i) => value !== first[i]));
}

export function replayFailure(result: { scenes: number[]; keysLeft: number; error?: unknown }): boolean {
  return result.error != null || result.scenes.slice(0, 2).join(' ') !== '2 3' || result.keysLeft !== 0;
}
