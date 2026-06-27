import { parseProfile } from '../src/cursor.service';

// Shape mirrors the real get-public-profile-by-handle payload.
const payload = {
  profile: {
    handle: 'desierrandre',
    displayName: 'Andres Sierra',
    avatarUrl: 'https://example.com/a.png',
  },
  activitySummary: {
    agentsLocal: 1717,
    agentsCloud: 2,
    currentStreak: 41,
    longestStreak: 41,
    longestAgentSeconds: '8998', // string in real payload
    topModels: [{ name: 'Composer 2.5', agentRequests: 1084 }],
    tokensOverTime: [
      { date: '2026-05-29', tokens: '133627571' },
      { date: '2026-05-30', tokens: '57862628' },
    ],
  },
};

describe('parseProfile', () => {
  const s = parseProfile('desierrandre', payload);

  it('sums tokensOverTime as numbers', () => {
    expect(s.tokens).toBe(133627571 + 57862628);
  });

  it('totals agents from local + cloud', () => {
    expect(s.agents).toBe(1719);
  });

  it('coerces longestAgentSeconds string to number', () => {
    expect(s.longestAgentSeconds).toBe(8998);
  });

  it('carries streaks and top models', () => {
    expect(s.currentStreak).toBe(41);
    expect(s.topModels[0]).toEqual({ name: 'Composer 2.5', agentRequests: 1084 });
  });
});
