// The touch audit must not pass an error page or treat 44px advice as the 24px requirement.
import { describe, expect, it } from 'vitest';
import { auditFailed } from './editorTouchAudit';

describe('editor touch verdict', () => {
  it('fails when the requested editor never rendered', () => {
    expect(auditFailed({ ready: false, overflowX: 0, under24: [], violations: [] })).toBe(true);
  });
  it('fails on overflow, a sub-24px target, or an axe violation', () => {
    const clean = { ready: true, overflowX: 0, under24: [], violations: [] };
    expect(auditFailed(clean)).toBe(false);
    expect(auditFailed({ ...clean, overflowX: 1 })).toBe(true);
    expect(auditFailed({ ...clean, under24: ['button 23x44'] })).toBe(true);
    expect(auditFailed({ ...clean, violations: [{ id: 'label' }] })).toBe(true);
  });
});
