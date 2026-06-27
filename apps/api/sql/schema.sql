-- Reference schema. The API auto-creates this on first request (see db.ts initSchema).
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
