/**
 * Client HTTP partagé.
 * Propriétaire : TSEFACK CALVIN KLEIN (contrat gelé).
 *
 * L'access token reste en mémoire. Le refresh token est un cookie HttpOnly
 * géré par le navigateur. En cas de 401, on tente un refresh une seule fois.
 * TODO : maintenir l'alignement avec docs/api-contract.md et ajouter les tests.
 */

import axios, {
  AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";

import type { ApiErrorResponse, TokenResponse } from "@/types";
import { tokenStore } from "@/lib/tokenStore";

let accessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
  tokenStore.setAccess(token);
}

export function getAccessToken(): string | null {
  return accessToken;
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "/api/v1",
  withCredentials: true,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

function isAuthEndpoint(url?: string): boolean {
  if (!url) return false;
  return [
    "/auth/login",
    "/auth/refresh",
    "/auth/register",
    "/auth/forgot-password",
    "/auth/reset-password",
  ].some((endpoint) => url.includes(endpoint));
}

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = api
      .post<TokenResponse>("/auth/refresh")
      .then(({ data }) => {
        setAccessToken(data.access_token);
        return data.access_token;
      })
      .catch(() => {
        setAccessToken(null);
        tokenStore.clear();
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    if (
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      !isAuthEndpoint(original.url)
    ) {
      original._retry = true;
      const token = await refreshAccessToken();
      if (token) {
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      }
      window.dispatchEvent(new Event("gestactes:unauthorized"));
    }

    return Promise.reject(error);
  },
);

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    return (
      error.response?.data?.error?.message ??
      error.response?.data?.detail ??
      "Une erreur est survenue. Réessayez dans un instant."
    );
  }
  if (error instanceof Error) return error.message;
  return "Une erreur est survenue. Réessayez dans un instant.";
}

export function getApiErrorDetails(error: unknown): Record<string, string> {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    return error.response?.data?.error?.details ?? {};
  }
  return {};
}
