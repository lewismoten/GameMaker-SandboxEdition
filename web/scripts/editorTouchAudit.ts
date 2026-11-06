// Required audit failures; targets below the recommended 44px are advisory unless below 24px.
export function auditFailed(result: { ready: boolean; overflowX: number; under24: string[]; violations: unknown[] }): boolean {
  return !result.ready || result.overflowX > 0 || result.under24.length > 0 || result.violations.length > 0;
}
