'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import StatsPanel from './StatsPanel';
import { metricValue, modelPillClass, sortRows, type Row } from './stats';
import { useT, type TKey } from './i18n';
import type { SortKey } from './types';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

const COLUMNS: { key: SortKey; tkey: TKey }[] = [
  { key: 'tokens', tkey: 'sort_tokens' },
  { key: 'agents', tkey: 'sort_agents' },
  { key: 'streak', tkey: 'sort_streak' },
  { key: 'longest_streak', tkey: 'sort_best' },
];

const TH_SORT: Record<SortKey, TKey> = {
  tokens: 'th_tokens',
  agents: 'th_agents',
  streak: 'th_streak',
  longest_streak: 'th_best',
};

function fmt(n: number): string {
  const units = ['', 'K', 'M', 'B', 'T'];
  let i = 0;
  let v = n;
  while (Math.abs(v) >= 1000 && i < units.length - 1) {
    v /= 1000;
    i++;
  }
  return i === 0 ? String(n) : `${v.toFixed(1)}${units[i]}`;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

export default function Page() {
  const { t } = useT();
  const [rows, setRows] = useState<Row[]>([]);
  const [sort, setSort] = useState<SortKey>('tokens');
  const [handle, setHandle] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAll = useCallback(async () => {
    const res = await fetch(`${API}/ranking`);
    if (!res.ok) throw new Error(t('err_load'));
    setRows(await res.json());
  }, [t]);

  useEffect(() => {
    setLoading(true);
    setError('');
    loadAll()
      .catch(() => setError(t('err_load')))
      .finally(() => setLoading(false));
  }, [loadAll, t]);

  const sortedRows = useMemo(() => sortRows(rows, sort), [rows, sort]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = await fetch(`${API}/handles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message ?? t('err_not_public'));
      }
      setHandle('');
      await loadAll();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('err_generic'));
    } finally {
      setBusy(false);
    }
  }

  const maxMetric =
    sortedRows.length > 0
      ? Math.max(...sortedRows.map((r) => metricValue(r, sort)), 1)
      : 1;

  return (
    <main className="container">
      <section className="hero">
        <p className="hero-eyebrow">
          <span className="hero-eyebrow-dot" />
          {t('hero_eyebrow')}
        </p>
        <h1 className="hero-title">{t('hero_title')}</h1>
        <p className="hero-subtitle">
          {t('hero_subtitle_1')}
          <a href="https://cursor.com" target="_blank" rel="noreferrer">
            cursor.com
          </a>
          {t('hero_subtitle_2')}
        </p>
      </section>

      <section className="join-card">
        <label className="join-label" htmlFor="handle-input">
          {t('join_label')}
        </label>
        <form className="join-form" onSubmit={add}>
          <div className="input-wrap">
            <span className="input-prefix">@</span>
            <input
              id="handle-input"
              className="join-input"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder={t('handle_placeholder')}
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <button
            type="submit"
            className={`btn btn-primary${busy ? ' btn-loading' : ''}`}
            disabled={busy || !handle.trim()}
          >
            {busy ? t('btn_adding') : t('btn_add')}
          </button>
        </form>
        {error && <p className="error-msg">{error}</p>}
        <p className="join-hint">
          {t('join_hint_1')}
          <code>cursor.com/@handle</code>
          {t('join_hint_2')}
        </p>
      </section>

      {!loading && <StatsPanel rows={rows} sort={sort} />}

      <section className="rankings-section">
        <div className="section-header">
          <h2 className="section-title">
            {t('section_rankings')}{' '}
            {!loading && rows.length > 0 && (
              <span className="section-count">({rows.length})</span>
            )}
          </h2>
          <div className="sort-group" role="group" aria-label={t('sort_label')}>
            {COLUMNS.map((c) => (
              <button
                key={c.key}
                type="button"
                className={`sort-btn${sort === c.key ? ' active' : ''}`}
                onClick={() => setSort(c.key)}
                aria-pressed={sort === c.key}
                aria-current={sort === c.key ? 'true' : undefined}
              >
                {t(c.tkey)}
              </button>
            ))}
          </div>
        </div>

        <div className="table-wrap">
          {loading ? (
            <div className="table-skeleton" aria-busy="true">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="skeleton-row" />
              ))}
            </div>
          ) : (
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>{t('th_user')}</th>
                  {(['tokens', 'agents', 'streak', 'longest_streak'] as const).map(
                    (key) => (
                      <th
                        key={key}
                        className={`num${sort === key ? ' active-sort' : ''}`}
                      >
                        {t(TH_SORT[key])}
                      </th>
                    ),
                  )}
                  <th>{t('th_model')}</th>
                </tr>
              </thead>
              <tbody>
                {sortedRows.map((r, i) => {
                  const rank = i + 1;
                  const isTop = rank <= 3;
                  const label = r.displayName ?? r.handle;
                  const sortVal = metricValue(r, sort);
                  const barPct = Math.max(2, (sortVal / maxMetric) * 100);
                  const model = r.topModels?.[0]?.name;

                  return (
                    <tr
                      key={r.handle}
                      className={isTop ? 'rank-top' : undefined}
                    >
                      <td className={`rank-cell${isTop ? ' top' : ''}`}>
                        {rank}
                      </td>
                      <td className="user-cell">
                        <a
                          href={`https://cursor.com/@${r.handle}`}
                          target="_blank"
                          rel="noreferrer"
                          className="user-link"
                        >
                          {r.avatarUrl ? (
                            <img
                              src={r.avatarUrl}
                              alt=""
                              className="avatar"
                              width={32}
                              height={32}
                            />
                          ) : (
                            <span className="avatar-fallback">
                              {initials(label)}
                            </span>
                          )}
                          <span>
                            <span className="user-name">{label}</span>
                            <span className="user-handle">@{r.handle}</span>
                          </span>
                        </a>
                      </td>
                  <td className={`num${sort === 'tokens' ? ' metric-cell' : ''}`}>
                    {sort === 'tokens' && (
                      <span className="metric-bar" aria-hidden>
                        <span
                          className="metric-bar-fill"
                          style={{ width: `${barPct}%` }}
                        />
                      </span>
                    )}
                    {fmt(r.tokens)}
                  </td>
                  <td className={`num${sort === 'agents' ? ' metric-cell' : ''}`}>
                    {sort === 'agents' && (
                      <span className="metric-bar" aria-hidden>
                        <span
                          className="metric-bar-fill"
                          style={{ width: `${barPct}%` }}
                        />
                      </span>
                    )}
                    {fmt(r.agents)}
                  </td>
                  <td className={`num${sort === 'streak' ? ' metric-cell' : ''}`}>
                    {sort === 'streak' && (
                      <span className="metric-bar" aria-hidden>
                        <span
                          className="metric-bar-fill"
                          style={{ width: `${barPct}%` }}
                        />
                      </span>
                    )}
                    {r.currentStreak}
                  </td>
                  <td className={`num${sort === 'longest_streak' ? ' metric-cell' : ''}`}>
                    {sort === 'longest_streak' && (
                      <span className="metric-bar" aria-hidden>
                        <span
                          className="metric-bar-fill"
                          style={{ width: `${barPct}%` }}
                        />
                      </span>
                    )}
                    {r.longestStreak}
                  </td>
                      <td className="model-cell">
                        {model ? (
                          <span
                            className={`model-pill model-pill-sm ${modelPillClass(model)}`}
                          >
                            {model}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  );
                })}
                {sortedRows.length === 0 && (
                  <tr className="empty-row">
                    <td colSpan={7}>{t('empty')}</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <div className="page-spacer" />
    </main>
  );
}
