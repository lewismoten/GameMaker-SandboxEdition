// Named Starters are excluded from native downloads even though they belong to this project.
import { expect, it } from 'vitest';
import { checkNamedDownload } from './namedDownload';

it('explains download eligibility for a named Starter', () => {
  const entry = { id: 'example', gam: 'example.gam', kind: 'shareware', original: {}, series: 'starter' } as const;
  expect(() => checkNamedDownload(entry)).toThrow('"example" is unavailable for download.');
});
