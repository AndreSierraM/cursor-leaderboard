import { Pool } from 'pg';
import { ProfileStats } from './cursor.service';

// Single shared pool. On Vercel serverless, reuse across warm invocations.
const globalForPool = globalThis as unknown as { pool?: Pool };

export const pool =
  globalForPool.pool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 3,
  });

if (!globalForPool.pool) globalForPool.pool = pool;

export async function initSchema(): Promise<void> {
  await pool.query(`
    create table if not exists profiles (
      handle text primary key,
      display_name text,
      avatar_url text,
      tokens bigint not null default 0,
      agents int not null default 0,
      current_streak int not null default 0,
      longest_streak int not null default 0,
      longest_agent_seconds int not null default 0,
      top_models jsonb not null default '[]',
      updated_at timestamptz not null default now()
    );
  `);
}

export async function upsertProfile(s: ProfileStats): Promise<void> {
  await pool.query(
    `insert into profiles
       (handle, display_name, avatar_url, tokens, agents,
        current_streak, longest_streak, longest_agent_seconds, top_models, updated_at)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9, now())
     on conflict (handle) do update set
       display_name=$2, avatar_url=$3, tokens=$4, agents=$5,
       current_streak=$6, longest_streak=$7, longest_agent_seconds=$8,
       top_models=$9, updated_at=now()`,
    [
      s.handle,
      s.displayName,
      s.avatarUrl,
      s.tokens,
      s.agents,
      s.currentStreak,
      s.longestStreak,
      s.longestAgentSeconds,
      JSON.stringify(s.topModels),
    ],
  );
}

const SORT_COLUMNS: Record<string, string> = {
  tokens: 'tokens',
  agents: 'agents',
  streak: 'current_streak',
  longest_streak: 'longest_streak',
};

export async function listRanking(sort = 'tokens') {
  const col = SORT_COLUMNS[sort] ?? 'tokens';
  const { rows } = await pool.query(
    `select handle, display_name, avatar_url, tokens, agents,
            current_streak, longest_streak, longest_agent_seconds,
            top_models, updated_at
     from profiles order by ${col} desc, handle asc`,
  );
  return rows.map((r) => ({
    handle: r.handle,
    displayName: r.display_name,
    avatarUrl: r.avatar_url,
    tokens: Number(r.tokens),
    agents: r.agents,
    currentStreak: r.current_streak,
    longestStreak: r.longest_streak,
    longestAgentSeconds: r.longest_agent_seconds,
    topModels: r.top_models,
    updatedAt: r.updated_at,
  }));
}

export async function allHandles(): Promise<string[]> {
  const { rows } = await pool.query('select handle from profiles');
  return rows.map((r) => r.handle);
}
