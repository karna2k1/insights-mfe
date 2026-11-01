/** Axios-compatible client injected by the shell. */
export interface HttpClient {
  get<T = unknown>(url: string, config?: { params?: Record<string, unknown> }): Promise<{ data: T }>;
}

export type Stage = 'SUGGESTED' | 'SAVED' | 'APPLIED' | 'INTERVIEW' | 'OFFER' | 'REJECTED';

/** core-api GET /stats/funnel */
export interface Funnel {
  reached: Record<Stage, number>;
  current: Record<Stage, number>;
}

/** job-ingest-service GET /stats/sources */
export interface SourceCount {
  source: string;
  total: number;
  lastWeek: number;
}

/** match-notify-service GET /stats/matches */
export interface MatchStats {
  scoreDistribution: { bucket: number; count: number }[];
  byStatus: { status: string; count: number }[];
  topSkillGaps: { skill: string; count: number }[];
  bySource: { source: string; count: number; avgScore: number }[];
}
