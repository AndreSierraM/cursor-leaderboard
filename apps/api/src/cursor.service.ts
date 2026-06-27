import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';

const CURSOR_ENDPOINT =
  'https://cursor.com/api/dashboard/get-public-profile-by-handle';

export interface TopModel {
  name: string;
  agentRequests: number;
}

/** Normalized, rankable profile derived from Cursor's public profile payload. */
export interface ProfileStats {
  handle: string;
  displayName: string | null;
  avatarUrl: string | null;
  tokens: number; // sum of tokensOverTime (matches Cursor's headline number)
  agents: number; // agentsLocal + agentsCloud
  currentStreak: number;
  longestStreak: number;
  longestAgentSeconds: number;
  topModels: TopModel[];
}

@Injectable()
export class CursorService {
  /** Fetch a public Cursor profile by handle and normalize it for ranking. */
  async fetchProfile(handle: string): Promise<ProfileStats> {
    const clean = handle.trim().replace(/^@/, '');
    if (!/^[a-zA-Z0-9_-]{1,40}$/.test(clean)) {
      throw new BadRequestException('Invalid handle');
    }

    const res = await fetch(CURSOR_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ handle: clean }),
    });

    if (!res.ok) {
      throw new BadRequestException(`Cursor responded ${res.status}`);
    }
    const data = (await res.json()) as any;
    if (data?.error || !data?.profile || !data?.activitySummary) {
      throw new NotFoundException('Profile not found or not public');
    }
    return parseProfile(clean, data);
  }
}

/** Pure transform — unit tested against a real payload fixture. */
export function parseProfile(handle: string, data: any): ProfileStats {
  const p = data.profile ?? {};
  const a = data.activitySummary ?? {};
  const tokens = (a.tokensOverTime ?? []).reduce(
    (sum: number, t: any) => sum + Number(t.tokens ?? 0),
    0,
  );
  return {
    handle,
    displayName: p.displayName ?? null,
    avatarUrl: p.avatarUrl ?? null,
    tokens,
    agents: Number(a.agentsLocal ?? 0) + Number(a.agentsCloud ?? 0),
    currentStreak: Number(a.currentStreak ?? 0),
    longestStreak: Number(a.longestStreak ?? 0),
    longestAgentSeconds: Number(a.longestAgentSeconds ?? 0),
    topModels: (a.topModels ?? []).map((m: any) => ({
      name: String(m.name),
      agentRequests: Number(m.agentRequests ?? 0),
    })),
  };
}
