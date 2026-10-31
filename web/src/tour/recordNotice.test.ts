// A refused or unavailable screen share gives a notice instead of a silent "recording mode".
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TourRecorder } from './tourRecorder';
import { recordNoticeText } from './recordNotice';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('recording notice', () => {
  it('reports a declined share', async () => {
    vi.stubGlobal('MediaRecorder', class {});
    vi.stubGlobal('navigator', { mediaDevices: { getDisplayMedia: vi.fn().mockRejectedValue(new DOMException('no', 'NotAllowedError')) } });
    const r = await TourRecorder.ask();
    expect(r).toEqual({ reason: 'declined' });
    const text = recordNoticeText(r)!;
    expect(text).toBe('Recording didn’t start: screen sharing was declined. The tour will play without recording.');
  });
  it('reports an unsupported browser', async () => {
    vi.stubGlobal('navigator', { mediaDevices: {} });
    const r = await TourRecorder.ask();
    expect(r.reason).toBe('unsupported');
    expect(recordNoticeText(r)).toContain('cannot record');
  });
});
