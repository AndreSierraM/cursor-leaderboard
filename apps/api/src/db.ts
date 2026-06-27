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
      joined_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      is_anonymous boolean not null default false
    );
  `);
  await pool.query(`
    alter table profiles
      add column if not exists joined_at timestamptz not null default now();
  `);
  await pool.query(`
    alter table profiles
      add column if not exists is_anonymous boolean not null default false;
  `);
}

export async function upsertProfile(
  s: ProfileStats,
  anonymous = false,
): Promise<void> {
  await pool.query(
    `insert into profiles
       (handle, display_name, avatar_url, tokens, agents,
        current_streak, longest_streak, longest_agent_seconds, top_models,
        is_anonymous, updated_at)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, now())
     on conflict (handle) do update set
       display_name=$2, avatar_url=$3, tokens=$4, agents=$5,
       current_streak=$6, longest_streak=$7, longest_agent_seconds=$8,
       top_models=$9, is_anonymous=$10, updated_at=now()`,
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
      anonymous,
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
            top_models, joined_at, updated_at, is_anonymous
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
    joinedAt: r.joined_at,
    updatedAt: r.updated_at,
    isAnonymous: r.is_anonymous,
  }));
}

export async function getProfileRanks(handle: string) {
  const clean = handle.trim().replace(/^@/, '');
  const { rows } = await pool.query(
    'select handle, is_anonymous from profiles where lower(handle) = lower($1)',
    [clean],
  );
  if (rows.length === 0) return null;

  const dbHandle = rows[0].handle;
  const ranks: Record<string, number> = {};
  for (const [key, col] of Object.entries(SORT_COLUMNS)) {
    const { rows: rankRows } = await pool.query(
      `select count(*)::int + 1 as rank
       from profiles
       where ${col} > (select ${col} from profiles where handle = $1)`,
      [dbHandle],
    );
    ranks[key] = rankRows[0].rank;
  }

  return {
    handle: dbHandle,
    isAnonymous: rows[0].is_anonymous,
    ranks,
  };
}

export async function allHandles(): Promise<string[]> {
  const { rows } = await pool.query('select handle from profiles');
  return rows.map((r) => r.handle);
}
