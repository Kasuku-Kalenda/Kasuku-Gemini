/**
 * services/apiClient.ts
 *
 * Client HTTP centralisé pour tous les appels vers l'API Kasuku.
 *
 * Fonctionnalités :
 *  • Base URL depuis VITE_API_URL (env Vite) ou fallback /api/v1
 *  • Injection automatique du token JWT (Authorization: Bearer)
 *  • Refresh automatique du token sur 401
 *  • Erreurs typées (ApiError)
 *  • Helpers get / post / put / patch / delete
 */

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api/v1';

const TOKEN_KEY   = 'kasuku_access_token';
const REFRESH_KEY = 'kasuku_refresh_token';

// ─── Token helpers ────────────────────────────────────────────────────────────

export const tokenStore = {
  getAccess:    ()  => localStorage.getItem(TOKEN_KEY),
  getRefresh:   ()  => localStorage.getItem(REFRESH_KEY),
  setTokens: (access: string, refresh?: string) => {
    localStorage.setItem(TOKEN_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    // Compat : effacer aussi les clés legacy (mock session)
    localStorage.removeItem('kasuku_session');
    sessionStorage.removeItem('kasuku_session');
  },
};

// ─── Erreur typée ─────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ─── Refresh ──────────────────────────────────────────────────────────────────

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  // Dédupliquer les appels parallèles
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = tokenStore.getRefresh();
    if (!refreshToken) throw new ApiError(401, 'Session expirée');

    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      tokenStore.clear();
      throw new ApiError(401, 'Session expirée — veuillez vous reconnecter');
    }

    const data = await res.json() as { accessToken: string; refreshToken?: string };
    tokenStore.setTokens(data.accessToken, data.refreshToken);
    return data.accessToken;
  })().finally(() => { refreshPromise = null; });

  return refreshPromise;
}

// ─── Fetch interne ────────────────────────────────────────────────────────────

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  isRetry = false,
): Promise<T> {
  const token = tokenStore.getAccess();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // Token expiré → refresh automatique + 1 retry
  if (res.status === 401 && !isRetry) {
    try {
      await refreshAccessToken();
      return request<T>(method, path, body, true);
    } catch {
      tokenStore.clear();
      window.dispatchEvent(new Event('kasuku:logout'));
      throw new ApiError(401, 'Session expirée — veuillez vous reconnecter');
    }
  }

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(
      res.status,
      (data as { error?: string; message?: string }).error
        ?? (data as { message?: string }).message
        ?? `Erreur ${res.status}`,
      data,
    );
  }

  return data as T;
}

// ─── Upload (multipart/form-data) ─────────────────────────────────────────────

export async function uploadFile(
  file: File,
  folder: 'events' | 'timelines' | 'moments' | 'modules' | 'avatars' | 'misc' = 'misc',
): Promise<{ url: string; filename: string; size: number; mimeType: string }> {
  const token = tokenStore.getAccess();
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${BASE_URL}/upload?folder=${folder}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new ApiError(res.status, (err as { error?: string }).error ?? 'Erreur upload', err);
  }

  return res.json();
}

// ─── API publique ─────────────────────────────────────────────────────────────

export const api = {
  get:    <T>(path: string)                        => request<T>('GET',    path),
  post:   <T>(path: string, body?: unknown)        => request<T>('POST',   path, body),
  put:    <T>(path: string, body?: unknown)        => request<T>('PUT',    path, body),
  patch:  <T>(path: string, body?: unknown)        => request<T>('PATCH',  path, body),
  delete: <T = void>(path: string)                 => request<T>('DELETE', path),
};
