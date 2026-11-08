// Complement Vitest JSON with interruption/unhandled-error data that its JSON reporter omits.
import { writeFileSync } from 'node:fs';

export default class GateCompletionReporter {
  onInit(context) {
    const output = context.config.outputFile;
    this.file = `${typeof output === 'string' ? output : output.json}.completion.json`;
  }

  onTestRunEnd(_modules, errors, reason) {
    writeFileSync(this.file, JSON.stringify({ reason, unhandledErrors: errors.map((error) => ({ name: error.name, message: error.message })) }));
  }
}
