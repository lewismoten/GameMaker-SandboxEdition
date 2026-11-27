// A previous Copy result must fail the next error-notice case.
import { expect, it } from 'vitest';
import { errorNoticeMessage } from './errorNoticeMessage';

it('rejects details left on the clipboard by the preceding case', () => {
  const previousDetails = new Error(errorNoticeMessage()).toString();
  expect(previousDetails).not.toContain(new Error(errorNoticeMessage()).toString());
});
