// Shared assertions for headless routes; each consumer owns its scene names, actions, and goals.
export function expectScene(bot: { sim: { scene: number }; log: readonly string[] }, scene: number, what: string): void {
  if (bot.sim.scene !== scene) throw new Error(`Expected ${what} (scene ${scene}), in scene ${bot.sim.scene}\n${bot.log.slice(-8).join('\n')}`);
}
