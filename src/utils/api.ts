import { Alert } from 'react-native';

let API_BASE = 'http://localhost:8001';

export function setApiBase(url: string) {
  API_BASE = url;
}

export function getApiBase(): string {
  return API_BASE;
}

export interface ApiWatchlistItem {
  id: number;
  symbol: string;
  exchange: string;
  token: string | null;
  ltp: number | null;
  added_at: string;
  updated_at?: string;
  option_type?: string | null;
  strike_price?: string | null;
  expiry?: string | null;
}

let onTokenExpired: (() => void) | null = null;

export function setTokenExpiredHandler(handler: () => void) {
  onTokenExpired = handler;
}

async function rawFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw { status: res.status, detail: err.detail || `API error ${res.status}` };
  }
  return res.json();
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  try {
    return await rawFetch<T>(path, options);
  } catch (err: any) {
    if (err?.status !== 401) throw err;

    try {
      await rawFetch('/api/connect');
      return await rawFetch<T>(path, options);
    } catch {
      if (onTokenExpired) onTokenExpired();
      else Alert.alert('Token Expired', 'Session expired. Please login again.');
      throw new Error('Token expired');
    }
  }
}

export function fetchWatchlist(): Promise<ApiWatchlistItem[]> {
  return apiFetch<ApiWatchlistItem[]>('/watchlist');
}

export function addToWatchlist(
  symbol: string,
  exchange = 'NSE',
  token?: string
): Promise<{ success: boolean }> {
  return apiFetch('/watchlist', {
    method: 'POST',
    body: JSON.stringify({ symbol, exchange, token: token ?? null }),
  });
}

export function updateWatchlistItem(
  watchId: number,
  body: { symbol?: string; exchange?: string; token?: string }
): Promise<{ success: boolean }> {
  return apiFetch(`/watchlist/${watchId}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export function deleteWatchlistItem(
  watchId: number
): Promise<{ success: boolean }> {
  return apiFetch(`/watchlist/${watchId}`, {
    method: 'DELETE',
  });
}

export interface AuthStatus {
  logged_in: boolean;
  has_token: boolean;
  user_id: string | null;
}

export function login(
  userid: string,
  password: string,
  totp: string,
  clientId?: string,
  secretCode?: string,
  oauthUrl?: string
): Promise<{ success: boolean; userid: string; token: string }> {
  return rawFetch('/login', {
    method: 'POST',
    body: JSON.stringify({
      userid,
      password,
      totp,
      client_id: clientId || null,
      secret_code: secretCode || null,
      oauth_url: oauthUrl || null,
    }),
  });
}

export function logout(): Promise<{ success: boolean }> {
  return rawFetch('/logout', { method: 'POST' });
}

export function checkAuthStatus(): Promise<AuthStatus> {
  return rawFetch('/auth/status');
}
