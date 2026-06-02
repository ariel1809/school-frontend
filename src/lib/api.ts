import axios, { AxiosError, type AxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/auth';

const baseURL = import.meta.env.VITE_API_BASE_URL ?? '/api';

export const api = axios.create({ baseURL, withCredentials: false });

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshing: Promise<string | null> | null = null;

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      const { refreshToken, refresh, logout } = useAuthStore.getState();
      if (!refreshToken) {
        logout();
        return Promise.reject(error);
      }
      try {
        refreshing ??= refresh();
        const newToken = await refreshing;
        refreshing = null;
        if (newToken && original.headers) {
          original.headers.Authorization = `Bearer ${newToken}`;
          return api(original);
        }
      } catch (e) {
        refreshing = null;
        logout();
      }
    }
    return Promise.reject(error);
  }
);

export type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
};

export type ApiErrorBody = {
  success: false;
  code: string;
  message: string;
  path?: string;
  fieldErrors?: Array<{ field: string; message: string; rejectedValue: unknown }>;
};

export function extractError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const body = err.response?.data as ApiErrorBody | undefined;
    return body?.message ?? err.message;
  }
  if (err instanceof Error) return err.message;
  return 'Unknown error';
}

/**
 * Resolve a backend-returned file URL (e.g. `/api/v1/files/{id}/content`)
 * into something usable in `<img src>` / `<a href>` regardless of the deployment:
 * - dev (Vite proxy `/api` → gateway): pass through unchanged.
 * - prod (absolute `VITE_API_BASE_URL`): swap the `/api` prefix for the base URL.
 * - already-absolute URLs: pass through unchanged.
 */
export function resolveFileUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  const base = import.meta.env.VITE_API_BASE_URL;
  if (base && /^https?:\/\//i.test(base) && url.startsWith('/api/')) {
    return base.replace(/\/$/, '') + url.substring('/api'.length);
  }
  return url;
}