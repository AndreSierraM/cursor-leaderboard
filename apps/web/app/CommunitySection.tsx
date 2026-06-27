'use client';

import {
  aggregate,
  fmtCompact,
  isAnonymous,
  metricValue,
  publicName,
  recentJoiners,
  type Row,
} from './stats';
import { useT } from './i18n';
import type { SortKey } from './types';

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

function BuilderAvatar({
  row,
  size = 32,
  anonymousLabel,
}: {
  row: Row;
  size?: number;
  anonymousLabel: string;
}) {
  if (isAnonymous(row)) {
    return (
      <span
        className="avatar-fallback avatar-anon"
        style={{ width: size, height: size }}
        aria-hidden
      >
        ?
      </span>
    );
  }
  const label = publicName(row, anonymousLabel);
  if (row.avatarUrl) {
    return (
      <img
        src={row.avatarUrl}
        alt=""
        className="avatar"
        width={size}
        height={size}
      />
    );
  }
  return (
    <span
      className="avatar-fallback"
      style={{ width: size, height: size }}
      aria-hidden
    >
      {initials(label)}
    </span>
  );
}

export function BuilderIdentity({
  row,
  anonymousLabel,
  isYou,
  youLabel,
}: {
  row: Row;
  anonymousLabel: string;
  isYou?: boolean;
  youLabel?: string;
}) {
  const anon = isAnonymous(row);
  const label = publicName(row, anonymousLabel);
  const inner = (
    <>
      <BuilderAvatar row={row} anonymousLabel={anonymousLabel} />
      <span>
        <span className="user-name">
          {label}
          {isYou && youLabel && (
            <span className="you-badge">{youLabel}</span>
          )}
        </span>
        {!anon && <span className="user-handle">@{row.handle}</span>}
        {anon && <span className="user-handle user-handle-muted">{anonymousLabel}</span>}
      </span>
    </>
  );

  if (anon) {
    return <div className="user-link user-link-static">{inner}</div>;
  }

  return (
    <a
      href={`https://cursor.com/@${row.handle}`}
      target="_blank"
      rel="noreferrer"
      className="user-link"
    >
      {inner}
    </a>
  );
}

export function RankCard({
  ranks,
  sort,
  anonymous,
}: {
  ranks: Partial<Record<SortKey, number>>;
  sort: SortKey;
  anonymous?: boolean;
}) {
  const { t } = useT();
  const items: { key: SortKey; tkey: 'sort_tokens' | 'sort_agents' | 'sort_streak' | 'sort_best' }[] = [
    { key: 'tokens', tkey: 'sort_tokens' },
    { key: 'agents', tkey: 'sort_agents' },
    { key: 'streak', tkey: 'sort_streak' },
    { key: 'longest_streak', tkey: 'sort_best' },
  ];

  return (
    <div className="rank-card">
      <p className="rank-card-title">{t('rank_found')}</p>
      {anonymous && <p className="rank-card-note">{t('anon_active')}</p>}
      <ul className="rank-card-grid">
        {items.map(({ key, tkey }) =>
          ranks[key] != null ? (
            <li key={key} className={sort === key ? 'rank-card-active' : undefined}>
              <span className="rank-card-metric">{t(tkey)}</span>
              <span className="rank-card-pos">#{ranks[key]}</span>
            </li>
          ) : null,
        )}
      </ul>
    </div>
  );
}

export function CommunityPulse({
  rows,
  loading,
}: {
  rows: Row[];
  loading: boolean;
}) {
  const { t } = useT();
  const stats = aggregate(rows);

  const items = [
    { label: t('pulse_builders'), value: String(stats.users) },
    { label: t('pulse_tokens'), value: fmtCompact(stats.tokens) },
    { label: t('pulse_agents'), value: fmtCompact(stats.agents) },
    {
      label: t('pulse_new'),
      value: stats.joinedLast7d > 0 ? `+${stats.joinedLast7d}` : '0',
      highlight: stats.joinedLast7d > 0,
    },
  ];

  return (
    <section className="community-pulse" aria-label={t('pulse_title')}>
      <div className="pulse-grid">
        {items.map((item) => (
          <div
            key={item.label}
            className={`pulse-item${item.highlight ? ' pulse-highlight' : ''}${loading ? ' pulse-loading' : ''}`}
          >
            <span className="pulse-value">{loading ? '—' : item.value}</span>
            <span className="pulse-label">{item.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function Podium({
  rows,
  sort,
}: {
  rows: Row[];
  sort: SortKey;
}) {
  const { t } = useT();
  const top = rows.slice(0, 3);
  if (top.length === 0) return null;

  const order =
    top.length >= 3
      ? [top[1], top[0], top[2]]
      : top.length === 2
        ? [top[1], top[0]]
        : [top[0]];

  const ranks =
    top.length >= 3 ? [2, 1, 3] : top.length === 2 ? [2, 1] : [1];

  return (
    <section className="podium" aria-label={t('podium_title')}>
      <h2 className="podium-heading">{t('podium_title')}</h2>
      <div className={`podium-stage podium-${top.length}`}>
        {order.map((r, i) => {
          const rank = ranks[i];
          const label = publicName(r, t('anon_name'));
          const val = metricValue(r, sort);
          const anon = isAnonymous(r);
          const card = (
            <>
              <span className="podium-rank">{rank}</span>
              <BuilderAvatar row={r} size={rank === 1 ? 56 : 48} anonymousLabel={t('anon_name')} />
              <span className="podium-name">{label}</span>
              {!anon && <span className="podium-handle">@{r.handle}</span>}
              <span className="podium-stat">{fmtCompact(val)}</span>
            </>
          );

          return anon ? (
            <div key={r.handle} className={`podium-card rank-${rank}`}>
              {card}
            </div>
          ) : (
            <a
              key={r.handle}
              href={`https://cursor.com/@${r.handle}`}
              target="_blank"
              rel="noreferrer"
              className={`podium-card rank-${rank}`}
            >
              {card}
            </a>
          );
        })}
      </div>
    </section>
  );
}

export function RecentJoiners({ rows }: { rows: Row[] }) {
  const { t } = useT();
  const recent = recentJoiners(rows).filter((r) => !isAnonymous(r));
  if (recent.length === 0) return null;

  return (
    <section className="recent-joiners" aria-label={t('recent_title')}>
      <p className="recent-label">{t('recent_title')}</p>
      <ul className="recent-list">
        {recent.map((r) => {
          const label = r.displayName ?? r.handle;
          return (
            <li key={r.handle}>
              <a
                href={`https://cursor.com/@${r.handle}`}
                target="_blank"
                rel="noreferrer"
                className="recent-chip"
                title={`@${r.handle}`}
              >
                {r.avatarUrl ? (
                  <img src={r.avatarUrl} alt="" width={24} height={24} />
                ) : (
                  <span className="recent-avatar-fallback">{initials(label)}</span>
                )}
                <span>@{r.handle}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
