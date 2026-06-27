'use client';

import { useT, type TKey } from './i18n';
import {
  aggregate,
  fmtCompact,
  metricValue,
  modelBreakdown,
  modelPillClass,
  topByMetric,
  type Row,
} from './stats';
import type { SortKey } from './types';

const METRIC_LABEL: Record<SortKey, TKey> = {
  tokens: 'sort_tokens',
  agents: 'sort_agents',
  streak: 'sort_streak',
  longest_streak: 'sort_best',
};

export default function StatsPanel({
  rows,
  sort,
}: {
  rows: Row[];
  sort: SortKey;
}) {
  const { t } = useT();
  if (rows.length === 0) return null;

  const stats = aggregate(rows);
  const top = topByMetric(rows, sort);
  const max = metricValue(top[0], sort) || 1;
  const models = modelBreakdown(rows);

  return (
    <section className="stats-section" aria-label={t('stats_title')}>
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">{t('stat_users')}</span>
          <span className="stat-value">{stats.users}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">{t('stat_tokens')}</span>
          <span className="stat-value">{fmtCompact(stats.tokens)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">{t('stat_agents')}</span>
          <span className="stat-value">{fmtCompact(stats.agents)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">{t('pulse_new')}</span>
          <span className="stat-value">+{stats.joinedLast7d}</span>
        </div>
      </div>

      <div className="insights-grid">
        <div className="insight-card">
          <h3 className="insight-title">
            {t('chart_title')} · {t(METRIC_LABEL[sort])}
          </h3>
          <ul className="bar-chart">
            {top.map((r) => {
              const v = metricValue(r, sort);
              const pct = Math.max(4, (v / max) * 100);
              return (
                <li key={r.handle} className="bar-row">
                  <span className="bar-label" title={`@${r.handle}`}>
                    {r.displayName ?? r.handle}
                  </span>
                  <div className="bar-track" aria-hidden>
                    <div className="bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="bar-value">{fmtCompact(v)}</span>
                </li>
              );
            })}
          </ul>
        </div>

        {models.length > 0 && (
          <div className="insight-card">
            <h3 className="insight-title">{t('models_title')}</h3>
            <ul className="model-pills">
              {models.map(([name, count]) => (
                <li key={name}>
                  <span className={`model-pill ${modelPillClass(name)}`}>
                    {name}
                    <span className="model-pill-count">{count}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
