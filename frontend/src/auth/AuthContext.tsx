import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import axios from "axios";
import { api, USE_MOCK } from "@/api/client";
import { authApi } from "@/api/auth";
import { tokenStore } from "@/lib/tokenStore";
import type { User } from "@/lib/roles";

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, remember: boolean) => Promise<User>;
  logout: () => void;
}

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  // Restaure la session au chargement grâce au jeton de rafraîchissement.
  useEffect(() => {
    (async () => {
      const refresh = tokenStore.getRefresh();
      if (!refresh) return setLoading(false);
      try {
        const data = USE_MOCK
          ? await authApi.refreshMock(refresh)
          : (await axios.post(`${api.defaults.baseURL}/auth/refresh`, { refresh_token: refresh })).data;
        tokenStore.setAccess(data.access_token);
        setUser(await authApi.me());
      } catch {
        tokenStore.clear();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Session expirée détectée par l'intercepteur Axios.
  useEffect(() => {
    window.addEventListener("gestactes:session-expiree", logout);
    return () => window.removeEventListener("gestactes:session-expiree", logout);
  }, [logout]);

  const login = useCallback(async (email: string, password: string, remember: boolean) => {
    const tokens = await authApi.login(email, password);
    tokenStore.setAccess(tokens.access_token);
    tokenStore.setRefresh(tokens.refresh_token, remember);
    const me = await authApi.me();
    if (!me.actif) {
      tokenStore.clear();
      throw new Error("Ce compte est désactivé. Contactez l'administrateur.");
    }
    setUser(me);
    return me;
  }, []);

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading, login, logout]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthState {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth doit être utilisé dans <AuthProvider>.");
  return c;
}
