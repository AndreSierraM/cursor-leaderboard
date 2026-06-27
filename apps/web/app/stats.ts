import type { SortKey } from './types';

export type Row = {
  handle: string;
  displayName: string | null;
  avatarUrl: string | null;
  tokens: number;
  agents: number;
  currentStreak: number;
  longestStreak: number;
  longestAgentSeconds: number;
  topModels: { name: string; agentRequests: number }[];
};

export function metricValue(row: Row, sort: SortKey): number {
  switch (sort) {
    case 'tokens':
      return row.tokens;
    case 'agents':
      return row.agents;
    case 'streak':
      return row.currentStreak;
    case 'longest_streak':
      return row.longestStreak;
    default: {
      const _exhaustive: never = sort;
      return _exhaustive;
    }
  }
}

export function aggregate(rows: Row[]) {
  if (rows.length === 0) {
    return { users: 0, tokens: 0, agents: 0, avgStreak: 0, maxStreak: 0 };
  }
  const tokens = rows.reduce((s, r) => s + r.tokens, 0);
  const agents = rows.reduce((s, r) => s + r.agents, 0);
  const streakSum = rows.reduce((s, r) => s + r.currentStreak, 0);
  const maxStreak = Math.max(...rows.map((r) => r.longestStreak));
  return {
    users: rows.length,
    tokens,
    agents,
    avgStreak: Math.round(streakSum / rows.length),
    maxStreak,
  };
}

export function topByMetric(rows: Row[], sort: SortKey, limit = 5) {
  return [...rows]
    .sort((a, b) => metricValue(b, sort) - metricValue(a, sort))
    .slice(0, limit);
}

export function modelBreakdown(rows: Row[]) {
  const counts = new Map<string, number>();
  for (const r of rows) {
    const name = r.topModels?.[0]?.name;
    if (!name) continue;
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
}

const PILL_CLASSES = [
  'pill-peach',
  'pill-mint',
  'pill-blue',
  'pill-lavender',
  'pill-gold',
] as const;

export function sortRows(rows: Row[], sort: SortKey): Row[] {
  return [...rows].sort((a, b) => {
    const diff = metricValue(b, sort) - metricValue(a, sort);
    return diff !== 0 ? diff : a.handle.localeCompare(b.handle);
  });
}

export function modelPillClass(name: string): (typeof PILL_CLASSES)[number] {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h + name.charCodeAt(i) * (i + 1)) % 997;
  return PILL_CLASSES[h % PILL_CLASSES.length];
}
