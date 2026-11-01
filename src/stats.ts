import type { Funnel, MatchStats } from './types';

/** Fixed 40-49 … 90-100 buckets (matches below 40 are never stored); 100 folds into the top bucket. */
export function scoreBuckets(rows: MatchStats['scoreDistribution']): { label: string; count: number }[] {
  const counts = new Map<number, number>();
  for (const r of rows) {
    const b = Math.min(90, Number(r.bucket));
    counts.set(b, (counts.get(b) ?? 0) + Number(r.count));
  }
  return [40, 50, 60, 70, 80, 90].map((b) => ({ label: b === 90 ? '90–100' : `${b}–${b + 9}`, count: counts.get(b) ?? 0 }));
}

export type FunnelStep = {
  stage: string;
  count: number;
  /** % of the previous step that reached this one; null for the first step or when the previous is 0 */
  conversion: number | null;
};

const FUNNEL: [keyof Funnel['reached'], string][] = [
  ['SAVED', 'Saved'],
  ['APPLIED', 'Applied'],
  ['INTERVIEW', 'Interview'],
  ['OFFER', 'Offer'],
];

export function funnelSteps(f: Funnel | undefined): FunnelStep[] {
  return FUNNEL.map(([key, label], i) => {
    const count = f?.reached[key] ?? 0;
    const prev = i > 0 ? (f?.reached[FUNNEL[i - 1][0]] ?? 0) : 0;
    return { stage: label, count, conversion: i > 0 && prev > 0 ? Math.round((100 * count) / prev) : null };
  });
}

export function pretty(source: string): string {
  return source
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
