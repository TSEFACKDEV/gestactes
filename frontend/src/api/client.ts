import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { tokenStore } from "@/lib/tokenStore";

export const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "/api",
  timeout: 10_000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const t = tokenStore.getAccess();
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refresh = tokenStore.getRefresh();
  if (!refresh) return null;
  try {
    const { data } = await axios.post(`${api.defaults.baseURL}/auth/refresh`, { refresh_token: refresh });
    tokenStore.setAccess(data.access_token);
    return data.access_token as string;
  } catch {
    tokenStore.clear();
    return null;
  }
}

// Sur 401 : une seule tentative de rafraîchissement, puis rejeu de la requête.
api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const isAuthRoute = original?.url?.startsWith("/auth/");
    if (error.response?.status === 401 && original && !original._retry && !isAuthRoute) {
      original._retry = true;
      refreshing ??= refreshAccessToken().finally(() => { refreshing = null; });
      const t = await refreshing;
      if (t) {
        original.headers.Authorization = `Bearer ${t}`;
        return api(original);
      }
      window.dispatchEvent(new Event("gestactes:session-expiree"));
    }
    return Promise.reject(error);
  },
);

/** Message d'erreur lisible à partir d'une erreur Axios / FastAPI. */
export function messageErreur(err: unknown, defaut = "Une erreur est survenue. Réessayez."): string {
  if (axios.isAxiosError(err)) {
    if (!err.response) return "Le serveur est injoignable. Vérifiez votre connexion.";
    const d = err.response.data?.detail;
    if (typeof d === "string") return d;
    if (err.response.status === 429) return "Trop de tentatives. Patientez quelques instants.";
    if (err.response.status === 403) return "Vous n'avez pas accès à cette ressource.";
  }
  if (err instanceof Error && err.message) return err.message;
  return defaut;
}
