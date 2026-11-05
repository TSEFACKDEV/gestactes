/**
 * Client HTTP des pages design.
 * Propriétaire : GUEMOGNE GERALDINE ESTHER
 * TODO : maintenir l'alignement avec docs/api-contract.md.
 */

import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

import { setAccessToken } from "@/lib/api";
import { tokenStore } from "@/lib/tokenStore";

export const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "/api/v1",
  withCredentials: true,
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = tokenStore.getAccess();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  try {
    const { data } = await axios.post(
      `${api.defaults.baseURL}/auth/refresh`,
      {},
      { withCredentials: true, timeout: 15_000 },
    );
    const token = data.access_token as string;
    tokenStore.setAccess(token);
    setAccessToken(token);
    return token;
  } catch {
    tokenStore.clear();
    setAccessToken(null);
    return null;
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;
    const isAuthRoute = original?.url?.startsWith("/auth/");
    if (
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      !isAuthRoute
    ) {
      original._retry = true;
      refreshing ??= refreshAccessToken().finally(() => {
        refreshing = null;
      });
      const token = await refreshing;
      if (token) {
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      }
      window.dispatchEvent(new Event("gestactes:session-expiree"));
    }
    return Promise.reject(error);
  },
);

/** Message d'erreur lisible à partir d'une erreur Axios / FastAPI. */
export function messageErreur(
  err: unknown,
  defaut = "Une erreur est survenue. Réessayez.",
): string {
  if (axios.isAxiosError(err)) {
    if (!err.response) {
      return "Le serveur est injoignable. Vérifiez votre connexion.";
    }
    const payload = err.response.data as
      | {
          error?: { message?: string };
          detail?: string | { message?: string };
        }
      | undefined;
    if (payload?.error?.message) return payload.error.message;
    if (typeof payload?.detail === "string") return payload.detail;
    if (payload?.detail && typeof payload.detail === "object") {
      return payload.detail.message ?? defaut;
    }
    if (err.response.status === 429) {
      return "Trop de tentatives. Patientez quelques instants.";
    }
    if (err.response.status === 403) {
      return "Vous n'avez pas accès à cette ressource.";
    }
  }
  if (err instanceof Error && err.message) return err.message;
  return defaut;
}
