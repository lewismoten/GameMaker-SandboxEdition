// Retry one interrupted build, not a numeric failure; callers may exclude late signals.
export async function retrySignal(run, label, retryBefore = Infinity) {
  for (let attempt = 1; ; attempt++) {
    const began = Date.now();
    try {
      return await run();
    } catch (error) {
      const elapsed = Date.now() - began;
      if (attempt > 1 || !error.signal || elapsed > retryBefore) throw error;
      console.error(`Retrying ${label}: signal ${error.signal}, killed ${error.killed}, after ${(elapsed / 1000).toFixed(1)} s; attempt 2/2.`);
    }
  }
}
