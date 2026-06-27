'use client';

import { useT, type TKey } from './i18n';

export default function ErrorBanner({
  title,
  hint,
  onRetry,
  retryLabel,
}: {
  title: string;
  hint?: string;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  const { t } = useT();
  return (
    <div className="error-banner" role="alert">
      <div className="error-banner-body">
        <p className="error-banner-title">{title}</p>
        {hint && <p className="error-banner-hint">{hint}</p>}
      </div>
      {onRetry && (
        <button type="button" className="btn btn-ghost error-banner-retry" onClick={onRetry}>
          {retryLabel ?? t('btn_retry')}
        </button>
      )}
    </div>
  );
}

export function errorHintKey(code: string | null | undefined): TKey | undefined {
  switch (code) {
    case 'profile_unavailable':
      return 'err_profile_unavailable_hint';
    case 'invalid_handle':
      return 'err_invalid_handle_hint';
    case 'network':
    case 'server_error':
      return 'err_network_hint';
    case 'cursor_unavailable':
      return 'err_cursor_unavailable_hint';
    default:
      return undefined;
  }
}
