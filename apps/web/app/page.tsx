'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import StatsPanel from './StatsPanel';
import { CommunityPulse, Podium, RecentJoiners, BuilderIdentity, RankCard } from './CommunitySection';
import ErrorBanner, { errorHintKey } from './ErrorBanner';
import {
  apiErrorCodeFromBody,
  apiErrorCodeFromStatus,
  isNetworkError,
  resolveApiError,
  type ApiErrorCode,
} from './api-errors';
import {
  findAllRanks,
  metricValue,
  modelPillClass,
  normalizeHandle,
  sortRows,
  fmtCompact,
  type Row,
} from './stats';
import { useT, type TKey } from './i18n';
import type { SortKey } from './types';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const LS_HANDLE = 'cl_handle';
const LS_ANON = 'cl_anonymous';

type RankResult = {
  found: boolean;
  ranks?: Partial<Record<SortKey, number>>;
  isAnonymous?: boolean;
};

type UiError = {
  message: string;
  code: ApiErrorCode | null;
};

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

async function errorFromResponse(
  res: Response,
  t: (k: TKey) => string,
  fallback: TKey,
): Promise<UiError> {
  const body = await res.json().catch(() => ({}));
  const code =
    apiErrorCodeFromBody(body) ?? apiErrorCodeFromStatus(res.status);
  return {
    code,
    message: resolveApiError(t, { code, status: res.status, fallback }),
  };
}

export default function Page() {
  const { t } = useT();
  const [rows, setRows] = useState<Row[]>([]);
  const [sort, setSort] = useState<SortKey>('tokens');
  const [handle, setHandle] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [myHandle, setMyHandle] = useState<string | null>(null);
  const [rankResult, setRankResult] = useState<RankResult | null>(null);
  const [rankBusy, setRankBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<UiError | null>(null);
  const [joinError, setJoinError] = useState<UiError | null>(null);

  const loadAll = useCallback(async () => {
    let res: Response;
    try {
      res = await fetch(`${API}/ranking`);
    } catch (err) {
      if (isNetworkError(err)) {
        throw { code: 'network' as ApiErrorCode, message: t('err_network') };
      }
      throw err;
    }
    if (!res.ok) {
      throw await errorFromResponse(res, t, 'err_load');
    }
    setRows(await res.json());
    setLoadError(null);
  }, [t]);

  const refreshRanking = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    loadAll()
      .catch((err: UiError | unknown) => {
        if (err && typeof err === 'object' && 'message' in err) {
          setLoadError(err as UiError);
        } else if (isNetworkError(err)) {
          setLoadError({ code: 'network', message: t('err_network') });
        } else {
          setLoadError({ code: null, message: t('err_load') });
        }
      })
      .finally(() => setLoading(false));
  }, [loadAll, t]);

  useEffect(() => {
    const saved = localStorage.getItem(LS_HANDLE);
    const savedAnon = localStorage.getItem(LS_ANON) === '1';
    if (saved) {
      setMyHandle(saved);
      setHandle(saved);
      setAnonymous(savedAnon);
    }
  }, []);

  useEffect(() => {
    refreshRanking();
  }, [refreshRanking]);

  useEffect(() => {
    if (!myHandle || rows.length === 0) return;
    const ranks = findAllRanks(rows, myHandle);
    if (Object.keys(ranks).length > 0) {
      setRankResult({
        found: true,
        ranks,
        isAnonymous: rows.find((r) => normalizeHandle(r.handle) === myHandle)
          ?.isAnonymous,
      });
    }
  }, [rows, myHandle]);

  const sortedRows = useMemo(() => sortRows(rows, sort), [rows, sort]);

  async function checkRank() {
    const clean = normalizeHandle(handle);
    if (!clean) return;
    setRankBusy(true);
    setJoinError(null);
    setRankResult(null);
    try {
      const local = findAllRanks(rows, clean);
      if (Object.keys(local).length > 0) {
        setRankResult({
          found: true,
          ranks: local,
          isAnonymous: rows.find((r) => normalizeHandle(r.handle) === clean)
            ?.isAnonymous,
        });
        return;
      }
      let res: Response;
      try {
        res = await fetch(`${API}/rank?handle=${encodeURIComponent(clean)}`);
      } catch (err) {
        if (isNetworkError(err)) {
          setJoinError({ code: 'network', message: t('err_network') });
          return;
        }
        throw err;
      }
      if (!res.ok) {
        setJoinError(await errorFromResponse(res, t, 'err_generic'));
        return;
      }
      const body = await res.json();
      if (!body.found) {
        setRankResult({ found: false });
        return;
      }
      setRankResult({
        found: true,
        ranks: body.ranks,
        isAnonymous: body.isAnonymous,
      });
    } catch {
      setJoinError({ code: null, message: t('err_generic') });
    } finally {
      setRankBusy(false);
    }
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setJoinError(null);
    setRankResult(null);
    setBusy(true);
    try {
      let res: Response;
      try {
        res = await fetch(`${API}/handles`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ handle, anonymous }),
        });
      } catch (err) {
        if (isNetworkError(err)) {
          setJoinError({ code: 'network', message: t('err_network') });
          return;
        }
        throw err;
      }
      if (!res.ok) {
        setJoinError(await errorFromResponse(res, t, 'err_profile_unavailable'));
        return;
      }
      const body = await res.json();
      const clean = normalizeHandle(handle);
      localStorage.setItem(LS_HANDLE, clean);
      localStorage.setItem(LS_ANON, anonymous ? '1' : '0');
      setMyHandle(clean);
      if (body.ranks) {
        setRankResult({ found: true, ranks: body.ranks, isAnonymous: anonymous });
      }
      setHandle('');
      await loadAll();
    } catch {
      setJoinError({ code: null, message: t('err_generic') });
    } finally {
      setBusy(false);
    }
  }

  const maxMetric =
    sortedRows.length > 0
      ? Math.max(...sortedRows.map((r) => metricValue(r, sort)), 1)
      : 1;

  const joinHintKey = joinError ? errorHintKey(joinError.code) : undefined;

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

      {loadError && (
        <ErrorBanner
          title={loadError.message}
          hint={errorHintKey(loadError.code) ? t(errorHintKey(loadError.code)!) : undefined}
          onRetry={refreshRanking}
        />
      )}

      <CommunityPulse rows={rows} loading={loading} />

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
        <div className="join-options">
          <label className="anon-toggle">
            <input
              type="checkbox"
              checked={anonymous}
              onChange={(e) => setAnonymous(e.target.checked)}
            />
            <span className="anon-toggle-ui" aria-hidden />
            <span className="anon-toggle-text">{t('anon_label')}</span>
          </label>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={rankBusy || !handle.trim()}
            onClick={checkRank}
          >
            {rankBusy ? t('btn_rank_checking') : t('btn_rank')}
          </button>
        </div>
        <p className="join-hint anon-hint">{t('anon_hint')}</p>
        {rankResult?.found && rankResult.ranks && (
          <RankCard
            ranks={rankResult.ranks}
            sort={sort}
            anonymous={rankResult.isAnonymous}
          />
        )}
        {rankResult?.found === false && (
          <div className="info-banner" role="status">
            <p className="info-banner-title">{t('rank_not_found')}</p>
            <p className="info-banner-hint">{t('rank_not_found_hint')}</p>
          </div>
        )}
        {joinError && (
          <ErrorBanner
            title={joinError.message}
            hint={joinHintKey ? t(joinHintKey) : undefined}
          />
        )}
        <p className="join-hint">
          {t('join_hint_1')}
          <code>cursor.com/@handle</code>
          {t('join_hint_2')}
        </p>
      </section>

      {!loading && !loadError && <StatsPanel rows={rows} sort={sort} />}

      {!loading && !loadError && sortedRows.length > 0 && (
        <>
          <Podium rows={sortedRows} sort={sort} />
          <RecentJoiners rows={rows} />
        </>
      )}

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
          ) : loadError ? (
            <div className="table-empty-error">
              <p>{loadError.message}</p>
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
                  const isYou =
                    myHandle != null &&
                    normalizeHandle(r.handle) === myHandle;
                  const sortVal = metricValue(r, sort);
                  const barPct = Math.max(2, (sortVal / maxMetric) * 100);
                  const model = r.topModels?.[0]?.name;

                  return (
                    <tr
                      key={r.handle}
                      className={
                        [isTop ? 'rank-top' : '', isYou ? 'row-you' : '']
                          .filter(Boolean)
                          .join(' ') || undefined
                      }
                    >
                      <td className={`rank-cell${isTop ? ' top' : ''}`}>
                        {rank}
                      </td>
                      <td className="user-cell">
                        <BuilderIdentity
                          row={r}
                          anonymousLabel={t('anon_name')}
                          isYou={isYou}
                          youLabel={t('rank_you')}
                        />
                      </td>
                      <td
                        className={`num${sort === 'tokens' ? ' metric-cell' : ''}`}
                      >
                        {sort === 'tokens' && (
                          <span className="metric-bar" aria-hidden>
                            <span
                              className="metric-bar-fill"
                              style={{ width: `${barPct}%` }}
                            />
                          </span>
                        )}
                        {fmtCompact(r.tokens)}
                      </td>
                      <td
                        className={`num${sort === 'agents' ? ' metric-cell' : ''}`}
                      >
                        {sort === 'agents' && (
                          <span className="metric-bar" aria-hidden>
                            <span
                              className="metric-bar-fill"
                              style={{ width: `${barPct}%` }}
                            />
                          </span>
                        )}
                        {fmtCompact(r.agents)}
                      </td>
                      <td
                        className={`num${sort === 'streak' ? ' metric-cell' : ''}`}
                      >
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
                      <td
                        className={`num${sort === 'longest_streak' ? ' metric-cell' : ''}`}
                      >
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
