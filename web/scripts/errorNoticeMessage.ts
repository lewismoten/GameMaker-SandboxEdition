// Error text injected by each case of the error-notice check.
import { randomUUID } from 'node:crypto';

export function errorNoticeMessage(): string {
  return `test error on purpose ${randomUUID()}`;
}
