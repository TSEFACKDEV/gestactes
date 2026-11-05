/**
 * Contexte d'authentification unifié.
 * Propriétaire : TSEFACK CALVIN KLEIN (intégration).
 *
 * Le backend utilise un access token en mémoire et un refresh token HttpOnly.
 * Ce contexte expose à la fois l'API des pages historiques (`isLoading`,
 * `register`, `refreshUser`) et celle des pages design (`loading`, `updateUser`).
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { api, setAccessToken } from "@/lib/api";
import { tokenStore } from "@/lib/tokenStore";
import type { Role, User } from "@/lib/roles";

interface BackendUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: Role;
  is_active: boolean;
  created_at: string;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: BackendUser;
}

interface RegisterPayload {
  first_name?: string;
  last_name?: string;
  nom?: string;
  prenom?: string;
  email: string;
  password: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<User>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  refreshUser: () => Promise<void>;
}

const Ctx = createContext<AuthState | null>(null);

function mapUser(user: BackendUser): User {
  return {
    ...user,
    nom: user.last_name,
    prenom: user.first_name,
    actif: user.is_active,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(() => {
    setAccessToken(null);
    tokenStore.clear();
    setUser(null);
  }, []);

  const applySession = useCallback((accessToken: string, backendUser: BackendUser) => {
    setAccessToken(accessToken);
    tokenStore.setAccess(accessToken);
    setUser(mapUser(backendUser));
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.post<TokenResponse>("/auth/refresh");
        if (!cancelled) applySession(data.access_token, data.user);
      } catch {
        if (!cancelled) clearSession();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applySession, clearSession]);

  useEffect(() => {
    const onExpired = () => clearSession();
    window.addEventListener("gestactes:unauthorized", onExpired);
    window.addEventListener("gestactes:session-expiree", onExpired);
    return () => {
      window.removeEventListener("gestactes:unauthorized", onExpired);
      window.removeEventListener("gestactes:session-expiree", onExpired);
    };
  }, [clearSession]);

  const login = useCallback(
    async (email: string, password: string, _remember = false) => {
      const { data } = await api.post<TokenResponse>("/auth/login", {
        email,
        password,
      });
      applySession(data.access_token, data.user);
      return mapUser(data.user);
    },
    [applySession],
  );

  const register = useCallback(async (payload: RegisterPayload) => {
    const body = {
      first_name: payload.first_name ?? payload.prenom ?? "",
      last_name: payload.last_name ?? payload.nom ?? "",
      email: payload.email,
      password: payload.password,
    };
    const { data } = await api.post<BackendUser>("/auth/register", body);
    return mapUser(data);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const updateUser = useCallback((next: User) => setUser(next), []);

  const refreshUser = useCallback(async () => {
    const { data } = await api.get<BackendUser>("/auth/me");
    setUser(mapUser(data));
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      isLoading: loading,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
      updateUser,
      refreshUser,
    }),
    [user, loading, login, register, logout, updateUser, refreshUser],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthState {
  const context = useContext(Ctx);
  if (!context) {
    throw new Error("useAuth doit être utilisé dans <AuthProvider>.");
  }
  return context;
}
