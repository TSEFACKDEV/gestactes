/**
 * Contexte d'authentification.
 * Propriétaire : TSEFACK CALVIN KLEIN (contrat gelé).
 * TODO : tester la restauration de session et l'expiration.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

import { api, setAccessToken } from "@/lib/api";
import type { TokenResponse, User } from "@/types";

interface RegisterPayload {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await api.get<User>("/auth/me");
      setUser(data);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const { data } = await api.post<TokenResponse>("/auth/refresh");
        if (cancelled) return;
        setAccessToken(data.access_token);
        setUser(data.user);
      } catch {
        if (!cancelled) {
          setAccessToken(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function handleUnauthorized() {
      setAccessToken(null);
      setUser(null);
    }
    window.addEventListener("gestactes:unauthorized", handleUnauthorized);
    return () =>
      window.removeEventListener("gestactes:unauthorized", handleUnauthorized);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post<TokenResponse>("/auth/login", {
      email,
      password,
    });
    setAccessToken(data.access_token);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const { data } = await api.post<User>("/auth/register", payload);
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, isLoading, login, register, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth doit être utilisé dans un AuthProvider.");
  }
  return context;
}
