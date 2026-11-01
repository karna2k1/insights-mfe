import { describe, expect, it } from 'vitest';
import { funnelSteps, pretty, scoreBuckets } from './stats';

describe('scoreBuckets', () => {
  it('fills empty buckets and folds 100 into 90–100', () => {
    const b = scoreBuckets([
      { bucket: 50, count: 3 },
      { bucket: 90, count: 1 },
      { bucket: 100, count: 2 },
    ]);
    expect(b.map((x) => x.count)).toEqual([0, 3, 0, 0, 0, 3]);
    expect(b.at(-1)?.label).toBe('90–100');
  });
});

describe('funnelSteps', () => {
  it('computes step-to-step conversion', () => {
    const steps = funnelSteps({
      reached: { SUGGESTED: 9, SAVED: 20, APPLIED: 10, INTERVIEW: 3, OFFER: 0, REJECTED: 2 },
      current: { SUGGESTED: 0, SAVED: 0, APPLIED: 0, INTERVIEW: 0, OFFER: 0, REJECTED: 0 },
    });
    expect(steps.map((s) => s.conversion)).toEqual([null, 50, 30, 0]);
  });

  it('handles missing data', () => {
    expect(funnelSteps(undefined).every((s) => s.count === 0 && s.conversion === null)).toBe(true);
  });
});

describe('pretty', () => {
  it('humanises source ids', () => {
    expect(pretty('LINKEDIN_ALERT')).toBe('Linkedin Alert');
  });
});
