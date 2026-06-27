import type { TKey } from './i18n';

export const API_ERROR_CODES = {
  invalid_handle: 'err_invalid_handle',
  profile_unavailable: 'err_profile_unavailable',
  cursor_unavailable: 'err_cursor_unavailable',
  server_error: 'err_server',
  network: 'err_network',
} as const satisfies Record<string, TKey>;

export type ApiErrorCode = keyof typeof API_ERROR_CODES;

type ApiErrorBody = {
  message?: string | { code?: string; message?: string };
  code?: string;
  statusCode?: number;
};

export function apiErrorCodeFromBody(body: ApiErrorBody): ApiErrorCode | null {
  const raw =
    body.code ??
    (typeof body.message === 'object' ? body.message?.code : body.message);
  if (typeof raw === 'string' && raw in API_ERROR_CODES) {
    return raw as ApiErrorCode;
  }
  return null;
}

export function apiErrorCodeFromStatus(status: number): ApiErrorCode | null {
  if (status >= 500) return 'server_error';
  return null;
}

export function resolveApiError(
  t: (k: TKey) => string,
  opts: {
    code?: ApiErrorCode | null;
    status?: number;
    fallback?: TKey;
  },
): string {
  const code =
    opts.code ??
    (opts.status != null ? apiErrorCodeFromStatus(opts.status) : null);
  if (code && code in API_ERROR_CODES) {
    return t(API_ERROR_CODES[code]);
  }
  return t(opts.fallback ?? 'err_generic');
}

export function isNetworkError(err: unknown): boolean {
  return (
    err instanceof TypeError ||
    (err instanceof Error &&
      /failed to fetch|load failed|networkerror/i.test(err.message))
  );
}
