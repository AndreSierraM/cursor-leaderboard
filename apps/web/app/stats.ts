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
  joinedAt?: string;
  isAnonymous?: boolean;
};

export function isAnonymous(row: Row): boolean {
  return row.isAnonymous === true;
}

export function publicName(row: Row, anonymousLabel: string): string {
  if (isAnonymous(row)) return anonymousLabel;
  return row.displayName ?? row.handle;
}

export function normalizeHandle(handle: string): string {
  return handle.trim().toLowerCase().replace(/^@/, '');
}

export function findRank(
  rows: Row[],
  handle: string,
  sort: SortKey,
): number | null {
  const clean = normalizeHandle(handle);
  const sorted = sortRows(rows, sort);
  const idx = sorted.findIndex(
    (r) => normalizeHandle(r.handle) === clean,
  );
  return idx >= 0 ? idx + 1 : null;
}

export function findAllRanks(
  rows: Row[],
  handle: string,
): Partial<Record<SortKey, number>> {
  const sorts: SortKey[] = ['tokens', 'agents', 'streak', 'longest_streak'];
  const out: Partial<Record<SortKey, number>> = {};
  for (const s of sorts) {
    const rank = findRank(rows, handle, s);
    if (rank != null) out[s] = rank;
  }
  return out;
}

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
    return {
      users: 0,
      tokens: 0,
      agents: 0,
      avgStreak: 0,
      maxStreak: 0,
      joinedLast7d: 0,
    };
  }
  const tokens = rows.reduce((s, r) => s + r.tokens, 0);
  const agents = rows.reduce((s, r) => s + r.agents, 0);
  const streakSum = rows.reduce((s, r) => s + r.currentStreak, 0);
  const maxStreak = Math.max(...rows.map((r) => r.longestStreak));
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const joinedLast7d = rows.filter((r) => {
    if (!r.joinedAt) return false;
    return new Date(r.joinedAt).getTime() >= weekAgo;
  }).length;
  return {
    users: rows.length,
    tokens,
    agents,
    avgStreak: Math.round(streakSum / rows.length),
    maxStreak,
    joinedLast7d,
  };
}

export function recentJoiners(rows: Row[], limit = 5): Row[] {
  return [...rows]
    .filter((r) => r.joinedAt)
    .sort(
      (a, b) =>
        new Date(b.joinedAt!).getTime() - new Date(a.joinedAt!).getTime(),
    )
    .slice(0, limit);
}

export function fmtCompact(n: number): string {
  const units = ['', 'K', 'M', 'B', 'T'];
  let i = 0;
  let v = n;
  while (Math.abs(v) >= 1000 && i < units.length - 1) {
    v /= 1000;
    i++;
  }
  return i === 0 ? String(n) : `${v.toFixed(1)}${units[i]}`;
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
